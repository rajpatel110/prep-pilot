import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { MongoClient, ObjectId } from "mongodb";
import { provisionIndexes } from "../scripts/database-indexes";
import { issueCsrf } from "../src/modules/identity/csrf-token";

async function main() {
  const dbName = `prep_pilot_auth_test_${randomBytes(6).toString("hex")}`;
  const origin = "http://127.0.0.1:3101";
  const client = new MongoClient(process.env.MONGODB_URI!, {
    maxPoolSize: 2,
    serverSelectionTimeoutMS: 10000,
  });
  await client.connect();
  const db = client.db(dbName);
  await provisionIndexes(db);
  const server = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      ...(process.argv.includes("--dev") ? ["dev", "--webpack"] : ["start"]),
      "--hostname",
      "127.0.0.1",
      "--port",
      "3101",
    ],
    {
      env: {
        ...process.env,
        APP_URL: origin,
        MONGODB_DB_NAME: dbName,
        AUTH_ENABLED: "true",
        EMAIL_MODE: "test",
      },
      stdio: "ignore",
    },
  );
  let cookie = "";
  const email = `student-${randomUUID()}@example.com`;
  const password = randomBytes(24).toString("base64url");
  async function request(
    path: string,
    body?: unknown,
    extra: Record<string, string> = {},
  ) {
    const response = await fetch(`${origin}${path}`, {
      method: body === undefined ? "GET" : "POST",
      redirect: "manual",
      headers: {
        origin,
        "Content-Type": "application/json",
        ...(cookie ? { cookie } : {}),
        ...extra,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const cookies = response.headers.getSetCookie();
    if (cookies.length)
      cookie = cookies.map((value) => value.split(";")[0]).join("; ");
    return response;
  }
  try {
    for (let attempt = 0; attempt < 60; attempt++) {
      try {
        if ((await fetch(`${origin}/api/health`)).ok) break;
      } catch {}
      if (attempt === 59) throw new Error("Test server did not start");
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    const homepage = await fetch(`${origin}/`);
    assert.equal(homepage.status, 200);
    assert.ok((await homepage.text()).includes("PrepPilot"));
    const health = await fetch(`${origin}/api/health`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { data: { status: "ok" } });
    assert.equal(health.headers.get("cache-control"), "no-store");
    assert.ok(health.headers.get("x-request-id"));
    assert.equal((await request("/api/v1/me")).status, 401);
    assert.equal((await request("/admin")).status, 307);
    assert.equal(
      (
        await request("/api/auth/sign-up/email", {
          name: "Test student",
          email,
          password,
          role: "admin",
        })
      ).status,
      422,
    );
    assert.equal(
      (
        await request(
          "/api/auth/sign-up/email",
          { name: "Test student", email, password },
          { origin: "https://untrusted.example" },
        )
      ).status,
      403,
    );
    const signup = await request("/api/auth/sign-up/email", {
      name: "Test student",
      email,
      password,
    });
    assert.equal(signup.status, 200, "Signup should succeed");
    assert.ok(cookie.includes("session_token"), "Session cookie issued");
    const sessionCookie = cookie;
    const me = await (await request("/api/v1/me")).json();
    assert.equal(me.data.role, "student");
    assert.equal(me.data.preferences, null);
    assert.equal(me.data.emailVerified, false);
    assert.equal(me.data.destination, "/onboarding");
    assert.equal(me.data.capabilities.passwordRecovery, false);
    const userId = me.data.userId;
    assert.equal(
      (await request("/api/v1/me")).status,
      200,
      "Reload preserves session",
    );
    assert.equal(
      (await request("/admin")).headers.get("location"),
      "/onboarding",
    );
    await Promise.all(Array.from({ length: 5 }, () => request("/api/v1/me")));
    assert.equal(await db.collection("profiles").countDocuments({ userId }), 1);
    const csrf = await (await request("/api/v1/security/csrf")).json();
    assert.ok(csrf.data.token);
    const missingCsrf = await request(
      "/api/v1/identity/verification/request",
      {},
    );
    assert.equal(missingCsrf.status, 403);
    const missingError = await missingCsrf.json();
    assert.equal(missingError.error.code, "CSRF_INVALID");
    assert.equal(
      missingError.requestId,
      missingCsrf.headers.get("x-request-id"),
    );
    const sessionRecord = await db
      .collection("session")
      .findOne({ userId: new ObjectId(userId) });
    assert.ok(sessionRecord);
    const expiredCsrf = issueCsrf(
      sessionRecord._id.toString(),
      process.env.CSRF_SECRET!,
      Date.now() - 1800001,
    ).token;
    for (const [token, code] of [
      [expiredCsrf, "CSRF_TOKEN_EXPIRED"],
      [`${expiredCsrf}x`, "CSRF_INVALID"],
    ]) {
      const response = await request(
        "/api/v1/identity/verification/request",
        {},
        { "x-csrf-token": token! },
      );
      assert.equal(response.status, 403);
      assert.equal((await response.json()).error.code, code);
    }
    const crossOrigin = await request(
      "/api/v1/identity/verification/request",
      {},
      { "x-csrf-token": csrf.data.token, origin: "https://untrusted.example" },
    );
    assert.equal(crossOrigin.status, 403);
    assert.equal((await crossOrigin.json()).error.code, "CSRF_INVALID");
    assert.equal(
      (
        await request(
          "/api/v1/identity/verification/request",
          {},
          { "x-csrf-token": csrf.data.token },
        )
      ).status,
      503,
    );
    assert.equal((await request("/api/auth/verify-email")).status, 404);
    const recovery = await request("/api/v1/identity/password-reset/request", {
      email,
    });
    assert.equal(recovery.status, 503);
    assert.equal((await recovery.json()).error.code, "EMAIL_DISABLED");
    await db
      .collection("profiles")
      .updateOne({ userId }, { $set: { role: "admin" } });
    assert.equal(
      (await (await request("/api/v1/me")).json()).data.destination,
      "/admin",
    );
    assert.equal(
      (await request("/admin")).status,
      200,
      "Admin bypasses student preferences",
    );
    await db
      .collection("profiles")
      .updateOne({ userId }, { $set: { role: "student" } });
    assert.equal(
      (await request("/admin")).headers.get("location"),
      "/onboarding",
      "Role downgrade applies immediately",
    );
    await db
      .collection("profiles")
      .updateOne({ userId }, { $set: { lifecycle: "deleting" } });
    assert.equal((await request("/api/v1/me")).status, 403);
    await db
      .collection("profiles")
      .updateOne({ userId }, { $set: { lifecycle: "active" } });
    assert.equal((await request("/api/auth/sign-out", {})).status, 200);
    cookie = sessionCookie;
    assert.equal(
      (await request("/api/v1/me")).status,
      401,
      "Revoked cookie no longer works",
    );
    cookie = "";
    assert.equal(
      (await request("/api/auth/sign-in/email", { email, password: "wrong" }))
        .status,
      401,
    );
    assert.equal(
      (
        await request("/api/auth/sign-in/email", {
          email,
          password,
          rememberMe: true,
        })
      ).status,
      200,
    );
    await db
      .collection("session")
      .updateMany(
        { userId: new ObjectId(userId) },
        { $set: { expiresAt: new Date(0) } },
      );
    assert.equal(
      (await request("/api/v1/me")).status,
      401,
      "Expired session is rejected even before TTL cleanup",
    );
    cookie = "";
    assert.notEqual(
      (
        await request("/api/auth/sign-up/email", {
          name: "Duplicate",
          email,
          password,
        })
      ).status,
      200,
    );
    assert.equal(await db.collection("user").countDocuments({ email }), 1);
    for (let attempt = 0; attempt < 10; attempt++)
      await request("/api/auth/sign-in/email", {
        email: "rate-test@example.com",
        password: "wrong",
      });
    assert.equal(
      (
        await request("/api/auth/sign-in/email", {
          email: "rate-test@example.com",
          password: "wrong",
        })
      ).status,
      429,
    );
    console.log(
      "PASS: signup, duplicate protection, input/origin validation, persistent/revoked sessions, student/admin isolation, profile concurrency, CSRF, email-disabled mode and durable rate limits.",
    );
  } finally {
    server.kill();
    await new Promise<void>((resolve) => {
      if (server.exitCode !== null) resolve();
      else {
        server.once("exit", () => resolve());
        setTimeout(resolve, 5000);
      }
    });
    assert.ok(/^prep_pilot_auth_test_[a-f0-9]{12}$/.test(dbName));
    await db.dropDatabase();
    await client.close();
  }
}
main().catch((error) => {
  console.error(
    error instanceof assert.AssertionError
      ? `Integration assertion failed: ${error.message}`
      : "Integration check failed; inspect test setup and service availability.",
  );
  process.exitCode = 1;
});
