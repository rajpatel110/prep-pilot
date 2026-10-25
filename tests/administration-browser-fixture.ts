import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { MongoClient, ObjectId } from "mongodb";
import mongoose from "mongoose";
import { writeFileSync, unlinkSync } from "node:fs";
import { resolve, basename } from "node:path";
import { migrateDatabase } from "../scripts/database-migrations";
import { provisionOwner } from "../src/modules/identity/provision-owner";

let stage = "configuration";
async function main() {
  const layoutOnly = process.argv.includes("--layout-only");
  assert.ok(process.env.MONGODB_URI, "Explicit test connection required");
  const database = `pp_owner_ui_${randomBytes(6).toString("hex")}`;
  const origin = "http://127.0.0.1:3141";
  const client = await new MongoClient(process.env.MONGODB_URI, {
    maxPoolSize: 3,
    serverSelectionTimeoutMS: 10000,
  }).connect();
  const db = client.db(database);
  let connection: mongoose.Connection | undefined,
    server: ChildProcess | undefined;
  let ownerCookies: string[] = [],
    helperCookies: string[] = [];
  const password = randomBytes(24).toString("base64url");
  const credentialFile = process.env.OWNER_BROWSER_CREDENTIAL_FILE;
  let credentialWritten = false;
  let finish = () => {};
  const bridge = createServer((request, response) => {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("Referrer-Policy", "no-referrer");
    if (request.url === "/finish" && request.method === "POST") {
      response.end("Fixture cleanup requested");
      finish();
      return;
    }
    if (request.url === "/owner" || request.url === "/helper") {
      response.writeHead(302, {
        "Set-Cookie": request.url === "/owner" ? ownerCookies : helperCookies,
        Location: `${origin}/admin`,
      });
      response.end();
      return;
    }
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    response.end(
      `<h1>Disposable owner browser fixture</h1><p>Generated accounts only. No real email, files or catalog changes.</p><a href="/owner">Open owner session</a><p><a href="/helper">Open helper session</a></p><label>Disposable fixture password<input aria-label="Disposable fixture password" type="password" readonly value="${password}" autocomplete="off"></label><p>The masked generated credential is only for fixture password confirmation. Never print it or paste it into chat or logs.</p>`,
    );
  });
  const cookieHeader = (cookies: string[]) =>
    cookies.map((value) => value.split(";")[0]).join("; ");
  async function expectDestination(response: Response, destination: string) {
    if (response.status === 307) {
      assert.equal(response.headers.get("location"), destination);
      return;
    }
    assert.equal(
      response.status,
      200,
      "Expected redirect or streamed redirect",
    );
    const html = await response.text();
    const refresh = html.match(
      /http-equiv="refresh"\s+content="[01];url=([^"]+)"/i,
    );
    assert.equal(
      refresh?.[1],
      destination,
      "Expected explicit Next streamed redirect destination",
    );
  }
  async function request(
    cookies: string[],
    path: string,
    body?: unknown,
    method = body === undefined ? "GET" : "POST",
    protection = true,
  ) {
    let token = "";
    if (body !== undefined && protection) {
      const response = await fetch(`${origin}/api/v1/security/csrf`, {
        headers: { cookie: cookieHeader(cookies) },
      });
      assert.equal(response.status, 200, "Fixture CSRF access");
      token = (await response.json()).data.token;
    }
    return fetch(`${origin}${path}`, {
      method,
      redirect: "manual",
      headers: {
        cookie: cookieHeader(cookies),
        origin,
        "content-type": "application/json",
        ...(token ? { "x-csrf-token": token } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  }
  async function signup(name: string, email: string, verified = true) {
    const response = await request(
      [],
      "/api/auth/sign-up/email",
      { name, email, password },
      "POST",
      false,
    );
    assert.equal(response.status, 200, "Fixture signup");
    const cookies = response.headers.getSetCookie();
    const me = await request(cookies, "/api/v1/me");
    assert.equal(me.status, 200);
    const userId = (await me.json()).data.userId as string;
    if (verified)
      await db
        .collection("user")
        .updateOne(
          { _id: new ObjectId(userId) },
          { $set: { emailVerified: true } },
        );
    return { cookies, userId, email };
  }
  try {
    if (credentialFile) {
      assert.equal(basename(credentialFile), "owner-browser-input.json");
      assert.equal(resolve(credentialFile), credentialFile);
      writeFileSync(credentialFile, JSON.stringify({ database, password }), {
        flag: "wx",
        mode: 0o600,
      });
      credentialWritten = true;
    }
    stage = "isolated migration";
    await migrateDatabase(db);
    connection = await mongoose
      .createConnection(process.env.MONGODB_URI, {
        dbName: database,
        autoIndex: false,
        autoCreate: false,
        maxPoolSize: 1,
      })
      .asPromise();
    stage = "production server start";
    server = spawn(
      process.execPath,
      [
        "node_modules/next/dist/bin/next",
        "start",
        "--hostname",
        "127.0.0.1",
        "--port",
        "3141",
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
          BETTER_AUTH_SECRET: randomBytes(32).toString("hex"),
          CSRF_SECRET: randomBytes(32).toString("hex"),
          RATE_LIMIT_SECRET: randomBytes(32).toString("hex"),
        },
        stdio: "ignore",
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
    stage = "disposable identities and supported owner provisioning";
    const owner = await signup("Fixture Owner", "owner-browser@example.com"),
      helper = await signup("Fixture Helper", "helper-browser@example.com"),
      admin = await signup(
        "Existing Fixture Admin",
        "admin-browser@example.com",
      ),
      unverified = await signup(
        "Unverified Fixture",
        "unverified-browser@example.com",
        false,
      );
    helperCookies = helper.cookies;
    await provisionOwner(
      connection,
      owner.userId,
      owner.email,
      0,
      randomUUID(),
    );
    const signin = await request(
      [],
      "/api/auth/sign-in/email",
      { email: owner.email, password },
      "POST",
      false,
    );
    assert.equal(signin.status, 200);
    ownerCookies = signin.headers.getSetCookie();
    const account = await request(ownerCookies, "/account");
    await expectDestination(account, "/admin");
    if (!layoutOnly) {
      stage = "compiled owner HTTP permissions and validation";
      const base = "/api/v1/admin/administrators";
      assert.equal((await request([], base)).status, 401);
      assert.equal((await request(helperCookies, base)).status, 403);
      assert.equal((await request(ownerCookies, base)).status, 200);
      assert.equal(
        (
          await request(
            ownerCookies,
            `${base}/lookup`,
            { email: helper.email },
            "POST",
            false,
          )
        ).status,
        403,
      );
      assert.equal(
        (
          await request(ownerCookies, `${base}/lookup`, {
            email: helper.email,
            role: "owner",
          })
        ).status,
        422,
      );
      assert.equal(
        (
          await request(ownerCookies, `${base}/lookup`, {
            email: "missing-browser@example.com",
          })
        ).status,
        404,
      );
      assert.equal(
        (
          await request(ownerCookies, `${base}/reauthenticate`, {
            password: "wrong-disposable-password",
          })
        ).status,
        403,
      );
      assert.equal(
        (await request(ownerCookies, `${base}/reauthenticate`, { password }))
          .status,
        200,
      );
      const mutation = (expectedStateRevision = 0) => ({
        expectedRole: "student",
        role: "admin",
        expectedStateRevision,
        operationId: randomUUID(),
        reason: "Disposable compiled browser fixture",
      });
      assert.equal(
        (
          await request(
            ownerCookies,
            `${base}/${unverified.userId}/role`,
            mutation(),
            "PATCH",
          )
        ).status,
        409,
      );
      assert.equal(
        (
          await request(
            ownerCookies,
            `${base}/${helper.userId}/role`,
            mutation(99),
            "PATCH",
          )
        ).status,
        409,
      );
      assert.equal(
        (
          await request(
            ownerCookies,
            `${base}/${admin.userId}/role`,
            mutation(),
            "PATCH",
          )
        ).status,
        200,
      );
      assert.equal((await request(admin.cookies, base)).status, 403);
      await expectDestination(
        await request(admin.cookies, "/account"),
        "/admin",
      );
      assert.equal(
        (await request(ownerCookies, "/api/v1/admin/content")).status,
        200,
      );
      assert.equal(
        (await request(ownerCookies, "/api/v1/admin/files")).status,
        200,
      );
      const helperDenied = await request(
        helperCookies,
        "/admin/administrators",
      );
      assert.equal(helperDenied.status, 200);
      assert.ok((await helperDenied.text()).includes("Owner access required"));
      await db.collection("adminReauth").deleteMany({});
      console.log(
        "PASS compiled owner HTTP: shared login/routing, owner inheritance, anonymous/student/admin denial, lookup, strict fields, CSRF, password confirmation, unverified/stale rejection and supported role mutation.",
      );
    }
    await new Promise<void>((resolve) =>
      bridge.listen(3142, "127.0.0.1", resolve),
    );
    console.log(
      "BROWSER READY http://127.0.0.1:3142/ — disposable accounts, production artifact, no provider calls. Automatic cleanup in 20 minutes.",
    );
    stage = "browser checkpoint";
    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, 1200000);
      finish = () => {
        clearTimeout(timer);
        resolve();
      };
    });
    stage = "post-browser committed state and old-session denial";
    const target = await db
      .collection("profiles")
      .findOne({ userId: helper.userId });
    assert.equal(target?.role, "student");
    assert.equal(target?.stateRevision, layoutOnly ? 0 : 2);
    assert.equal(
      await db.collection("adminAudit").countDocuments({
        entityId: helper.userId,
        action: { $in: ["grant_admin", "remove_admin"] },
      }),
      layoutOnly ? 0 : 2,
    );
    assert.equal(
      (await request(helperCookies, "/api/v1/admin/content")).status,
      403,
    );
    assert.equal(
      (await request(helperCookies, "/api/v1/admin/files")).status,
      403,
    );
    await expectDestination(
      await request(helperCookies, "/account"),
      "/onboarding",
    );
    assert.equal(await db.collection("contentItems").countDocuments(), 0);
    console.log(
      layoutOnly
        ? "PASS layout-only checkpoint: helper role/revision unchanged, no helper role audits or catalog records created."
        : "PASS post-browser: helper promotion/removal committed exactly once each; original helper session denied admin APIs and routes to onboarding. No catalog records created.",
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
    await connection?.close();
    assert.ok(/^pp_owner_ui_[a-f0-9]{12}$/.test(database));
    try {
      await db.dropDatabase();
    } finally {
      await client.close();
      if (credentialWritten) unlinkSync(credentialFile!);
    }
    console.log(
      "Disposable owner-browser database removed; owned test server stopped.",
    );
  }
}
main().catch((error) => {
  console.error(
    JSON.stringify({
      stage,
      type: error instanceof Error ? error.name : "Unknown",
      location:
        error instanceof Error
          ? error.stack?.match(
              /administration-browser-fixture\.ts:\d+:\d+/,
            )?.[0]
          : undefined,
    }),
  );
  process.exitCode = 1;
});
