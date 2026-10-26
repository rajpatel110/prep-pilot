import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { migrateDatabase } from "../scripts/database-migrations";

async function main() {
  const database = `pp_brevo_test_${randomBytes(6).toString("hex")}`;
  const origin = "http://127.0.0.1:3122";
  Object.assign(process.env, {
    AUTH_ENABLED: "true",
    APP_URL: origin,
    MONGODB_DB_NAME: database,
    EMAIL_PROVIDER: "brevo",
    EMAIL_MODE: "live",
    EMAIL_DELIVERY_MODE: "restricted",
    EMAIL_TEST_RECIPIENTS:
      "first@example.com,second@example.com,owner@example.com",
    BREVO_API_KEY: "mock-only",
    BREVO_SENDER_EMAIL: "first@example.com",
    BREVO_SENDER_NAME: "PrepPilot",
    BREVO_SENDER_VERIFIED: "true",
    BETTER_AUTH_SECRET: randomBytes(32).toString("hex"),
    CSRF_SECRET: randomBytes(32).toString("hex"),
    RATE_LIMIT_SECRET: randomBytes(32).toString("hex"),
  });
  const { serverConfig } = await import("../src/shared/server/config");
  const { getAuthClient, getDomainConnection } =
    await import("../src/shared/server/db");
  const { createEmailDispatcher } =
    await import("../src/modules/notifications/service");
  const { brevoTransport } =
    await import("../src/modules/notifications/transport");
  const { buildAuth } = await import("../src/modules/identity/auth");
  const { createAccessGuards } = await import("../src/modules/identity/guards");
  const { ensureProfile } = await import("../src/modules/identity/profile");
  const { createIdentityEmailHttp } =
    await import("../src/modules/identity/email-http");
  const { rateLimit } = await import("../src/shared/server/rate-limit");
  const { savePreferences } =
    await import("../src/modules/identity/preferences");
  const contentRoute = await import("../src/app/api/v1/content/route");
  const client = await getAuthClient();
  const db = client.db(database);
  const jobs: (() => Promise<void>)[] = [];
  const sent: { to: { email: string }[]; textContent: string }[] = [];
  const dispatcher = createEmailDispatcher(client, database, serverConfig, {
    schedule: (job) => jobs.push(job),
    transport: brevoTransport(
      "mock-only",
      { email: "first@example.com", name: "PrepPilot" },
      async (_url, init) => {
        sent.push(JSON.parse(String(init?.body)));
        return Response.json({ messageId: "mock-accepted" }, { status: 201 });
      },
    ),
  });
  const auth = buildAuth(client, serverConfig, dispatcher);
  const guards = createAccessGuards({
    getSession: (headers) => auth.api.getSession({ headers }),
    getProfile: ensureProfile,
    emailMode: "live",
  });
  const handler = createIdentityEmailHttp({
    config: serverConfig,
    auth: async () => auth,
    actor: guards.requireActor,
    client: async () => client,
    limit: rateLimit,
  });
  const password = randomBytes(24).toString("base64url");
  try {
    await migrateDatabase(db);
    for (const email of [
      "first@example.com",
      "second@example.com",
      "owner@example.com",
    ]) {
      const response = await auth.handler(
        new Request(`${origin}/api/auth/sign-up/email`, {
          method: "POST",
          headers: { origin, "content-type": "application/json" },
          body: JSON.stringify({ email, name: "Disposable", password }),
        }),
      );
      assert.equal(response.status, 200);
      const headers = new Headers({
        cookie: response.headers
          .getSetCookie()
          .map((entry) => entry.split(";")[0])
          .join("; "),
      });
      const actor = await guards.requireActor(headers);
      assert.equal(actor.session.user.emailVerified, false);
      assert.equal(actor.destination, "/verify-email");
      await assert.rejects(savePreferences(headers, {}), {
        code: "EMAIL_NOT_VERIFIED",
      });
      const contentResponse = await contentRoute.GET(
        new Request(`${origin}/api/v1/content`, { headers }),
      );
      assert.equal(contentResponse.status, 403);
      assert.equal(
        (await contentResponse.json()).error.code,
        "EMAIL_NOT_VERIFIED",
      );
      await assert.rejects(guards.requireStudyActor(headers), {
        code: "EMAIL_NOT_VERIFIED",
      });
      await assert.rejects(guards.requireAdmin(headers), {
        code: "EMAIL_NOT_VERIFIED",
      });
      while (jobs.length) await jobs.shift()!();
      const message = sent.at(-1)!;
      assert.equal(message.to[0]?.email, email);
      const link = message.textContent
        .split("\n")
        .find((line) => line.startsWith(origin))!;
      const token = new URLSearchParams(new URL(link).hash.slice(1)).get(
        "token",
      );
      assert.ok(token);
      assert.equal(
        (await auth.api.getSession({ headers }))?.user.emailVerified,
        false,
      );
      const confirm = () =>
        handler(
          new Request(`${origin}/api/v1/identity/verification/confirm`, {
            method: "POST",
            headers: { origin, "content-type": "application/json" },
            body: JSON.stringify({ token }),
          }),
        );
      assert.equal((await confirm()).status, 200);
      assert.equal((await confirm()).status, 400);
      await guards.requireStudyActor(headers);
      if (email === "owner@example.com") {
        await db
          .collection("profiles")
          .updateOne(
            { userId: actor.session.user.id },
            { $set: { role: "owner" } },
          );
        assert.equal(
          (await guards.requireOwner(headers)).profile.role,
          "owner",
        );
      }
    }
    assert.equal(sent.length, 3);
    console.log(
      "PASS Brevo mocked live signup sends to intended inboxes; passive link, explicit confirmation/reuse, unverified routing/guards and verified disposable owner access.",
    );
  } finally {
    if (/^pp_brevo_test_[a-f0-9]{12}$/.test(database)) await db.dropDatabase();
    await (await getDomainConnection()).close();
    await client.close();
    console.log("Disposable Brevo database removed and connections closed.");
  }
}
void main().catch(() => {
  console.error("Brevo integration failed; no credentials or tokens logged.");
  process.exitCode = 1;
});
