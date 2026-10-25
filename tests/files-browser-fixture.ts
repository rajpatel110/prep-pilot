import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createServer } from "node:http";
import { MongoClient } from "mongodb";
import { migrateDatabase } from "../scripts/database-migrations";
import {
  minimumDeadline,
  preferencesSchema,
} from "../src/modules/identity/preferences-schema";

async function main() {
  assert.ok(process.env.MONGODB_URI, "Explicit connection required");
  const database = `pp_files_ui_${randomBytes(6).toString("hex")}`;
  const origin = "http://127.0.0.1:3134";
  const client = await new MongoClient(process.env.MONGODB_URI, {
    maxPoolSize: 3,
    serverSelectionTimeoutMS: 10000,
  }).connect();
  const db = client.db(database);
  let server: ChildProcess | undefined;
  let adminCookies: string[] = [],
    studentCookies: string[] = [];
  let finish = () => {};
  const bridge = createServer((request, response) => {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("Referrer-Policy", "no-referrer");
    if (request.url === "/finish" && request.method === "POST") {
      response.end("Fixture cleanup requested");
      finish();
      return;
    }
    const admin = request.url === "/admin";
    if (admin || request.url === "/student") {
      response.writeHead(302, {
        "Set-Cookie": admin ? adminCookies : studentCookies,
        Location: `${origin}${admin ? "/admin/files" : "/content"}`,
      });
      response.end();
      return;
    }
    response.setHeader("Content-Type", "text/html");
    response.end(
      '<h1>Disposable file browser fixture</h1><a href="/admin">Admin files</a><p><a href="/student">Student catalog</a></p>',
    );
  });
  try {
    await migrateDatabase(db);
    server = spawn(
      process.execPath,
      [
        "--import",
        "tsx",
        "--import",
        "./tests/files-browser-preload.ts",
        "node_modules/next/dist/bin/next",
        "start",
        "--hostname",
        "127.0.0.1",
        "--port",
        "3134",
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
          FILES_ENABLED: "true",
          R2_ACCOUNT_ID: "0".repeat(32),
          R2_BUCKET: "mock-browser-only",
          R2_ACCESS_KEY_ID: "mock-browser-only",
          R2_SECRET_ACCESS_KEY: "mock-browser-only",
          BETTER_AUTH_SECRET: randomBytes(32).toString("hex"),
          CSRF_SECRET: randomBytes(32).toString("hex"),
          RATE_LIMIT_SECRET: randomBytes(32).toString("hex"),
        },
        stdio: ["ignore", "ignore", "ignore", "ipc"],
      },
    );
    for (let attempt = 0; attempt < 60; attempt++) {
      try {
        if ((await fetch(`${origin}/api/health`)).ok) break;
      } catch {}
      assert.ok(
        attempt < 59 && server.exitCode === null,
        "Fixture server unavailable",
      );
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    async function signup(email: string) {
      const response = await fetch(`${origin}/api/auth/sign-up/email`, {
        method: "POST",
        headers: { origin, "content-type": "application/json" },
        body: JSON.stringify({
          name: "Disposable files browser",
          email,
          password: randomBytes(24).toString("base64url"),
        }),
      });
      assert.equal(response.status, 200);
      const cookies = response.headers.getSetCookie();
      const me = await fetch(`${origin}/api/v1/me`, {
        headers: {
          cookie: cookies.map((value) => value.split(";")[0]).join("; "),
        },
      });
      assert.equal(me.status, 200);
      return { cookies, userId: (await me.json()).data.userId as string };
    }
    const admin = await signup("files-ui-admin@example.com"),
      student = await signup("files-ui-student@example.com");
    adminCookies = admin.cookies;
    studentCookies = student.cookies;
    const profileCollection = (await db.listCollections().toArray()).find(
      (entry) => entry.name === "profiles",
    );
    assert.ok(profileCollection, "Expected profile collection");
    const result = await db
      .collection("profiles")
      .updateOne({ userId: admin.userId }, { $set: { role: "admin" } });
    assert.equal(result.modifiedCount, 1);
    const preferences = preferencesSchema.parse({
      companies: ["cognizant"],
      deadline: minimumDeadline(),
      dailyMinutes: 90,
      skills: { dsa: 1, aptitude: 1, cs: 1 },
    });
    const prepared = await db
      .collection("profiles")
      .updateOne(
        { userId: student.userId, role: "student" },
        { $set: { preferences }, $inc: { stateRevision: 1 } },
      );
    assert.equal(prepared.matchedCount, 1);
    await new Promise<void>((resolve) =>
      bridge.listen(3136, "127.0.0.1", resolve),
    );
    console.log(
      "BROWSER READY http://127.0.0.1:3136/ — disposable production app, loopback mock storage only.",
    );
    await new Promise<void>((resolve) => {
      const timer = setTimeout(
        resolve,
        process.argv.includes("--smoke") ? 1000 : 900000,
      );
      finish = () => {
        clearTimeout(timer);
        resolve();
      };
    });
    console.log(
      JSON.stringify({
        assetStates: await db
          .collection("fileAssets")
          .aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }])
          .toArray(),
        contentCount: await db.collection("contentItems").countDocuments(),
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
    assert.ok(/^pp_files_ui_[a-f0-9]{12}$/.test(database));
    await db.dropDatabase();
    await client.close();
    console.log(
      "Disposable file browser database removed; owned test server stopped.",
    );
  }
}
main().catch(() => {
  console.error(
    "File browser fixture failed; inspect safe assertions locally.",
  );
  process.exitCode = 1;
});
