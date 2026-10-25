import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createServer } from "node:http";
import { MongoClient } from "mongodb";
import { migrateDatabase } from "../scripts/database-migrations";
import { minimumDeadline } from "../src/modules/identity/preferences-schema";

let stage = "configuration";
async function main() {
  assert.ok(process.env.MONGODB_URI);
  const database = `pp_student_ui_${randomBytes(6).toString("hex")}`;
  assert.match(database, /^pp_student_ui_[a-f0-9]{12}$/);
  const origin = "http://127.0.0.1:3151";
  const client = await new MongoClient(process.env.MONGODB_URI, {
    maxPoolSize: 2,
    serverSelectionTimeoutMS: 10000,
  }).connect();
  const db = client.db(database);
  let server: ChildProcess | undefined;
  let serverReady = false;
  let studentCookies: string[] = [];
  let finish = () => {};
  const bridge = createServer((request, response) => {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("Referrer-Policy", "no-referrer");
    if (request.url === "/finish" && request.method === "POST") {
      response.end("Stopping disposable fixture");
      finish();
      return;
    }
    if (request.url === "/student") {
      response.writeHead(302, {
        "Set-Cookie": studentCookies,
        Location: `${origin}/dashboard`,
      });
      response.end();
      return;
    }
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    response.end(
      '<h1>Disposable student UI fixture</h1><a href="/student">Open student dashboard</a>',
    );
  });
  const cookieHeader = (cookies: string[]) =>
    cookies.map((entry) => entry.split(";")[0]).join("; ");
  async function request(
    cookies: string[],
    path: string,
    body?: unknown,
    method = body === undefined ? "GET" : "POST",
    protect = true,
  ) {
    let token = "";
    if (body !== undefined && protect) {
      const protection = await fetch(`${origin}/api/v1/security/csrf`, {
        headers: { cookie: cookieHeader(cookies) },
      });
      assert.equal(protection.status, 200);
      token = (await protection.json()).data.token;
    }
    return fetch(`${origin}${path}`, {
      method,
      redirect: "manual",
      signal: AbortSignal.timeout(30000),
      headers: {
        origin,
        cookie: cookieHeader(cookies),
        "content-type": "application/json",
        ...(token ? { "x-csrf-token": token } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  }
  async function signup(email: string) {
    const result = await request(
      [],
      "/api/auth/sign-up/email",
      {
        name: "Disposable UI student",
        email,
        password: randomBytes(24).toString("base64url"),
      },
      "POST",
      false,
    );
    assert.equal(result.status, 200);
    const cookies = result.headers.getSetCookie();
    const me = await request(cookies, "/api/v1/me");
    assert.equal(me.status, 200);
    return { cookies, userId: (await me.json()).data.userId as string };
  }
  try {
    stage = "isolated migration";
    await migrateDatabase(db);
    stage = "production server";
    const portProbe = createServer();
    await new Promise<void>((resolve, reject) => {
      portProbe.once("error", reject);
      portProbe.listen(3151, "127.0.0.1", () =>
        portProbe.close(() => resolve()),
      );
    });
    server = spawn(
      process.execPath,
      [
        "node_modules/next/dist/bin/next",
        "start",
        "--hostname",
        "127.0.0.1",
        "--port",
        "3151",
      ],
      {
        env: {
          ...process.env,
          NODE_OPTIONS: "",
          NODE_ENV: "production",
          APP_URL: origin,
          MONGODB_DB_NAME: database,
          AUTH_ENABLED: "true",
          EMAIL_MODE: "test",
          EMAIL_DELIVERY_MODE: "disabled",
          EMAIL_TEST_RECIPIENT: "",
          RESEND_API_KEY: "",
          FILES_ENABLED: "false",
          HOSTED_DATABASE_CONFIRMATION: "",
          BETTER_AUTH_SECRET: randomBytes(32).toString("hex"),
          CSRF_SECRET: randomBytes(32).toString("hex"),
          RATE_LIMIT_SECRET: randomBytes(32).toString("hex"),
        },
        stdio: ["ignore", "pipe", "ignore"],
      },
    );
    server.stdout?.on("data", (chunk: Buffer) => {
      if (chunk.toString().includes("Ready")) serverReady = true;
    });
    for (let attempt = 0; attempt < 60; attempt++) {
      try {
        if (serverReady && (await fetch(`${origin}/api/health`)).ok) break;
      } catch {}
      assert.ok(
        attempt < 59 && server.exitCode === null,
        "Fixture server unavailable",
      );
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    stage = "disposable identities and material";
    const admin = await signup("ui-author@example.invalid");
    await db
      .collection("profiles")
      .updateOne({ userId: admin.userId }, { $set: { role: "admin" } });
    for (const [slug, title, type, topic] of [
      ["ui-array-scan", "Fixture array scan", "question", "arrays"],
      ["ui-string-scan", "Fixture string scan", "question", "strings"],
      ["ui-array-reading", "Fixture array reading", "resource", "arrays"],
    ]) {
      const created = await request(admin.cookies, "/api/v1/admin/content", {
        slug,
        title,
        type,
        subject: "dsa",
        topic,
        difficulty: "easy",
        estimatedMinutes: 15,
        source: "Explicit disposable UI fixture",
        attribution: "Original test material, not real catalog content",
        reviewedAt: new Date().toISOString(),
        companies: [],
        tags: ["fixture"],
        assetIds: [],
        ...(type === "question"
          ? {
              prompt:
                "Scan the sequence [2, 4, 6] and return the total. Explain your loop and test the empty sequence.",
              explanation:
                "The total is 12. Start at zero and add each element. An empty sequence totals zero.",
            }
          : {
              body: "# Reading a sequence\n\nRead each value once and maintain a running total. Trace [2, 4, 6] and explain why the empty sequence totals zero.",
            }),
      });
      assert.equal(created.status, 201, "Disposable content creation");
      const item = (await created.json()).data;
      assert.equal(
        (
          await request(
            admin.cookies,
            `/api/v1/admin/content/${item.id}/publish`,
            { expectedRevision: item.revision },
          )
        ).status,
        200,
      );
    }
    const student = await signup("ui-reader@example.invalid");
    studentCookies = student.cookies;
    assert.equal(
      (
        await request(
          studentCookies,
          "/api/v1/me/preferences",
          {
            expectedStateRevision: 0,
            companies: ["ltm"],
            dailyMinutes: 60,
            deadline: minimumDeadline(),
            skills: { dsa: 2, aptitude: 2, cs: 2 },
          },
          "PATCH",
        )
      ).status,
      200,
    );
    await new Promise<void>((resolve) =>
      bridge.listen(3152, "127.0.0.1", resolve),
    );
    console.log(
      "BROWSER READY http://127.0.0.1:3152/student — disposable student, three fixture materials, no shared-database writes, email/files disabled. Cleanup after 20 minutes or POST /finish on 3152.",
    );
    stage = "browser verification";
    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, 1200000);
      finish = () => {
        clearTimeout(timer);
        resolve();
      };
    });
    console.log(
      JSON.stringify({
        disposableAttempts: await db.collection("attempts").countDocuments({}),
        disposablePlans: await db.collection("plans").countDocuments({}),
      }),
    );
  } finally {
    bridge.close();
    if (server && server.exitCode === null) {
      server.kill();
      await new Promise<void>((resolve) => {
        server!.once("exit", () => resolve());
        setTimeout(resolve, 5000).unref();
      });
    }
    try {
      assert.match(database, /^pp_student_ui_[a-f0-9]{12}$/);
      await db.dropDatabase();
    } finally {
      await client.close();
    }
    console.log(
      "Disposable student database removed and owned fixture server stopped.",
    );
  }
}
main().catch((error) => {
  console.error(
    JSON.stringify({
      stage,
      type: error instanceof Error ? error.name : "Unknown",
    }),
  );
  process.exitCode = 1;
});
