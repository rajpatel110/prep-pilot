import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { randomBytes } from "node:crypto";
import { MongoClient } from "mongodb";
import { migrateDatabase } from "../scripts/database-migrations";

let stage = "configuration";
async function main() {
  const database = `pp_brevo_http_${randomBytes(6).toString("hex")}`;
  const origin = "http://127.0.0.1:3123";
  const client = await new MongoClient(process.env.MONGODB_URI!, {
    maxPoolSize: 2,
    serverSelectionTimeoutMS: 10000,
  }).connect();
  const db = client.db(database);
  let server: ChildProcess | undefined;
  let token: string | null = null;
  let cookie = "";
  async function request(path: string, body?: object) {
    const response = await fetch(`${origin}${path}`, {
      method: body ? "POST" : "GET",
      redirect: "manual",
      headers: { origin, "content-type": "application/json", cookie },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(20000),
    });
    const cookies = response.headers.getSetCookie();
    if (cookies.length)
      cookie = cookies.map((entry) => entry.split(";")[0]).join("; ");
    return response;
  }
  async function assertVerificationRedirect(response: Response) {
    if (response.status === 307) {
      assert.equal(response.headers.get("location"), "/verify-email");
    } else {
      assert.equal(response.status, 200);
      assert.match(
        await response.text(),
        /<meta[^>]+http-equiv="refresh"[^>]+content="1;url=\/verify-email"/,
      );
    }
  }
  try {
    stage = "migration";
    await migrateDatabase(db);
    stage = "server startup";
    server = spawn(
      process.execPath,
      [
        "--import",
        "tsx",
        "--import",
        "./tests/brevo-http-preload.ts",
        "node_modules/next/dist/bin/next",
        "start",
        "--hostname",
        "127.0.0.1",
        "--port",
        "3123",
      ],
      {
        env: {
          ...process.env,
          NODE_OPTIONS: "",
          NODE_ENV: "production",
          APP_URL: origin,
          AUTH_ENABLED: "true",
          MONGODB_DB_NAME: database,
          EMAIL_MODE: "live",
          EMAIL_PROVIDER: "brevo",
          EMAIL_DELIVERY_MODE: "restricted",
          EMAIL_TEST_RECIPIENTS: "http-fixture@example.com",
          BREVO_API_KEY: "mock-http-only",
          BREVO_SENDER_EMAIL: "sender@example.com",
          BREVO_SENDER_NAME: "PrepPilot",
          BREVO_SENDER_VERIFIED: "true",
          BETTER_AUTH_SECRET: randomBytes(32).toString("hex"),
          CSRF_SECRET: randomBytes(32).toString("hex"),
          RATE_LIMIT_SECRET: randomBytes(32).toString("hex"),
          FILES_ENABLED: "false",
        },
        stdio: ["ignore", "ignore", "ignore", "ipc"],
      },
    );
    server.on(
      "message",
      (message: { brevoFixture?: boolean; text?: string }) => {
        if (!message.brevoFixture || typeof message.text !== "string") return;
        const link = message.text
          .split("\n")
          .find((line) => line.startsWith(`${origin}/verify-email#`));
        if (link)
          token = new URLSearchParams(new URL(link).hash.slice(1)).get("token");
      },
    );
    for (let attempt = 0; attempt < 60; attempt++) {
      try {
        if (
          (
            await fetch(`${origin}/api/health`, {
              signal: AbortSignal.timeout(1000),
            })
          ).ok &&
          (
            await fetch(`${origin}/api/auth/get-session`, {
              signal: AbortSignal.timeout(12000),
            })
          ).ok
        )
          break;
      } catch {}
      if (attempt === 59 || server.exitCode !== null)
        throw new Error("Fixture server unavailable");
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    stage = "signup";
    const signup = await request("/api/auth/sign-up/email", {
      email: "http-fixture@example.com",
      name: "Disposable HTTP",
      password: randomBytes(24).toString("base64url"),
    });
    if (!signup.ok) {
      const result = await signup.json();
      console.error(
        JSON.stringify({
          stage,
          code: [
            "AUTH_DISABLED",
            "SERVICE_UNAVAILABLE",
            "CSRF_INVALID",
            "RATE_LIMITED",
          ].includes(result?.error?.code)
            ? result.error.code
            : "UNKNOWN",
          rateBuckets: await db.collection("rateBuckets").countDocuments({}),
        }),
      );
    }
    assert.equal(signup.status, 200);
    const initial = (await (await request("/api/v1/me")).json()).data;
    assert.equal(initial.emailVerified, false);
    assert.equal(initial.destination, "/verify-email");
    stage = "unverified pages";
    for (const path of [
      "/dashboard",
      "/content",
      "/plans",
      "/progress",
      "/account?view=settings",
      "/admin",
    ]) {
      const response = await request(path);
      await assertVerificationRedirect(response);
    }
    stage = "unverified APIs";
    for (const path of [
      "/api/v1/content",
      "/api/v1/progress",
      "/api/v1/admin/content",
    ])
      assert.equal((await request(path)).status, 403);
    stage = "passive verification";
    const page = await request("/verify-email");
    assert.equal(page.status, 200);
    assert.match(await page.text(), /Opening this page does not verify/);
    assert.equal((await request("/forgot-password")).status, 200);
    for (let attempt = 0; !token && attempt < 40; attempt++)
      await new Promise((resolve) => setTimeout(resolve, 250));
    stage = "mock receipt";
    assert.ok(token);
    assert.equal(
      (await (await request("/api/v1/me")).json()).data.emailVerified,
      false,
    );
    stage = "owner confirmation";
    await db
      .collection("profiles")
      .updateOne({ userId: initial.userId }, { $set: { role: "owner" } });
    await assertVerificationRedirect(await request("/admin"));
    assert.equal(
      (await request("/api/v1/identity/verification/confirm", { token }))
        .status,
      200,
    );
    assert.equal(
      (await request("/api/v1/identity/verification/confirm", { token }))
        .status,
      400,
    );
    const verified = (await (await request("/api/v1/me")).json()).data;
    assert.equal(verified.emailVerified, true);
    assert.equal(verified.role, "owner");
    assert.equal((await request("/admin")).status, 200);
    assert.equal((await request("/admin/administrators")).status, 200);
    console.log(
      "PASS compiled Brevo signup, mocked delivery, unverified page/API gates, passive verification page, explicit confirmation/reuse and verified disposable owner routing.",
    );
  } finally {
    if (server && server.exitCode === null) {
      const stopped = new Promise<void>((resolve) =>
        server!.once("exit", () => resolve()),
      );
      server.kill();
      await stopped;
    }
    if (/^pp_brevo_http_[a-f0-9]{12}$/.test(database)) await db.dropDatabase();
    await client.close();
    console.log("Disposable HTTP database removed; owned test server stopped.");
  }
}
void main().catch((error: unknown) => {
  console.error(
    JSON.stringify({
      stage,
      code: "BREVO_HTTP_TEST_FAILED",
      actual:
        error instanceof Error &&
        "actual" in error &&
        typeof error.actual === "number"
          ? error.actual
          : undefined,
      expected:
        error instanceof Error &&
        "expected" in error &&
        typeof error.expected === "number"
          ? error.expected
          : undefined,
    }),
  );
  process.exitCode = 1;
});
