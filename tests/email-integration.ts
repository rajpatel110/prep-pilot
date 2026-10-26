import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { MongoClient, ObjectId } from "mongodb";
import { migrateDatabase } from "../scripts/database-migrations";
import { issueCsrf } from "../src/modules/identity/csrf-token";
import type { EmailMessage } from "../src/modules/notifications/transport";

let stage = "configuration";
async function main() {
  if (!process.env.MONGODB_URI)
    throw new Error("Test database configuration missing");
  const database = `prep_pilot_email_test_${randomBytes(6).toString("hex")}`;
  const origin = "http://127.0.0.1:3117";
  const owner = "email-owner-fixture@example.com";
  Object.assign(process.env, {
    AUTH_ENABLED: "true",
    APP_URL: origin,
    MONGODB_DB_NAME: database,
    EMAIL_MODE: "test",
    EMAIL_PROVIDER: "resend",
    EMAIL_DELIVERY_MODE: "owner_test",
    EMAIL_TEST_RECIPIENT: owner,
    RESEND_API_KEY: "mock-only",
    RESEND_FROM_EMAIL: "PrepPilot <onboarding@resend.dev>",
    RESEND_SENDER_VERIFIED: "false",
    BETTER_AUTH_SECRET: randomBytes(32).toString("hex"),
    CSRF_SECRET: randomBytes(32).toString("hex"),
    RATE_LIMIT_SECRET: randomBytes(32).toString("hex"),
  });
  const { getServerEnv } = await import("../src/shared/server/env");
  const config = getServerEnv();
  const { createEmailDispatcher, emailDigest } =
    await import("../src/modules/notifications/service");
  const { DeliveryError } =
    await import("../src/modules/notifications/transport");
  const { buildAuth } = await import("../src/modules/identity/auth");
  const { createIdentityEmailHttp, emailClientSubject } =
    await import("../src/modules/identity/email-http");
  const { createAccessGuards } = await import("../src/modules/identity/guards");
  const { ensureProfile } = await import("../src/modules/identity/profile");
  const { rateLimit } = await import("../src/shared/server/rate-limit");
  const { getDomainConnection, getAuthClient } =
    await import("../src/shared/server/db");
  const client = await new MongoClient(process.env.MONGODB_URI!, {
    maxPoolSize: 4,
    serverSelectionTimeoutMS: 10000,
  }).connect();
  const db = client.db(database);
  const jobs: (() => Promise<void>)[] = [],
    messages: EmailMessage[] = [];
  let failures = 0,
    permanent = false;
  let lastIssuedToken = "";
  const dispatcher = createEmailDispatcher(client, database, config, {
    schedule: (work) => jobs.push(work),
    pause: async () => {},
    transport: async (message) => {
      messages.push(message);
      if (failures-- > 0)
        throw new DeliveryError(
          permanent ? "PROVIDER_REJECTED" : "PROVIDER_TIMEOUT",
          !permanent,
        );
      return { providerId: "mock-accepted" };
    },
  });
  const auth = buildAuth(client, config, {
    ...dispatcher,
    queue: async (...args) => {
      lastIssuedToken = args[2];
      try {
        await dispatcher.queue(...args);
      } catch (error) {
        console.error(
          JSON.stringify({
            code:
              typeof (error as { code?: unknown }).code === "number"
                ? (error as { code: number }).code
                : "ISSUANCE_FAILURE",
            type: error instanceof Error ? error.name : "UnknownError",
          }),
        );
        throw error;
      }
    },
  });
  const guards = createAccessGuards({
    getSession: (headers) => auth.api.getSession({ headers }),
    getProfile: ensureProfile,
    emailMode: "test",
  });
  const dependencies = {
    config,
    auth: async () => auth,
    actor: guards.requireActor,
    client: async () => client,
    limit: rateLimit,
  };
  const handler = createIdentityEmailHttp(dependencies);
  const password = randomBytes(24).toString("base64url");
  let cookie = "",
    userId = "",
    csrf = "";
  async function request(
    operation: string,
    body: unknown = {},
    headers: Record<string, string> = {},
  ) {
    return handler(
      new Request(`${origin}/api/v1/identity/${operation}`, {
        method: "POST",
        headers: {
          origin,
          "content-type": "application/json",
          ...(cookie ? { cookie } : {}),
          ...headers,
        },
        body: JSON.stringify(body),
      }),
    );
  }
  async function signup(email: string) {
    const response = await auth.api.signUpEmail({
      body: { email, name: "Disposable email fixture", password },
      asResponse: true,
    });
    assert.equal(response.status, 200);
    return response.headers
      .getSetCookie()
      .map((value) => value.split(";")[0])
      .join("; ");
  }
  async function flush() {
    while (jobs.length) await jobs.shift()!();
  }
  async function clearRates() {
    await db.collection("rateBuckets").deleteMany({});
  }
  function tokenOf(message: EmailMessage | undefined) {
    assert.ok(message);
    const link = message.text
      .split("\n")
      .find((line) => line.startsWith(origin));
    assert.ok(link);
    const url = new URL(link);
    assert.equal(url.origin, origin);
    assert.equal(url.search, "");
    const token = new URLSearchParams(url.hash.slice(1)).get("token");
    assert.ok(token);
    return token;
  }
  async function issueReset() {
    await clearRates();
    const response = await request("password-reset/request", { email: owner });
    assert.equal(response.status, 202);
    await flush();
    return tokenOf(messages.at(-1));
  }
  async function competingReset(token: string, newPassword: string) {
    const children = Array.from({ length: 2 }, () =>
      spawn(
        process.execPath,
        [
          "--conditions=react-server",
          "--import",
          "tsx",
          "tests/email-consumer.ts",
        ],
        {
          env: { ...process.env },
          stdio: ["ignore", "ignore", "ignore", "ipc"],
        },
      ),
    );
    const timers = children.map((child) =>
      setTimeout(() => child.kill(), 60000),
    );
    let ready = 0;
    const results = children.map(
      (child) =>
        new Promise<number>((resolve, reject) => {
          let status: number | undefined;
          child.on(
            "message",
            (message: {
              ready?: boolean;
              status?: number;
              failed?: boolean;
            }) => {
              if (message.ready && ++ready === children.length)
                for (const consumer of children)
                  consumer.send({ token, newPassword });
              if (message.status) status = message.status;
              if (message.failed) child.kill();
            },
          );
          child.once("error", reject);
          child.once("exit", (code) =>
            code === 0 && status
              ? resolve(status)
              : reject(new Error("Isolated consumer failed")),
          );
        }),
    );
    try {
      return await Promise.all(results);
    } finally {
      timers.forEach(clearTimeout);
      for (const child of children) if (child.exitCode === null) child.kill();
    }
  }
  try {
    stage = "migration and disposable signup";
    await migrateDatabase(db);
    const singleton = await db.collection("catalogState").findOne({});
    await migrateDatabase(db);
    assert.deepEqual(
      await db.collection("catalogState").findOne({}),
      singleton,
    );
    cookie = await signup(owner);
    const initial = await auth.api.getSession({
      headers: new Headers({ cookie }),
    });
    assert.ok(initial);
    userId = initial.user.id;
    csrf = issueCsrf(initial.session.id, config.CSRF_SECRET!).token;
    assert.equal(initial.user.emailVerified, false);
    assert.equal(messages.length, 0);
    assert.equal(jobs.length, 0);

    stage = "origin, CSRF, schema, mode and bypass guards";
    assert.equal((await request("verification/request")).status, 403);
    assert.equal(
      (
        await request(
          "verification/request",
          {},
          { "x-csrf-token": `${csrf}bad` },
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await request(
          "verification/request",
          {},
          { origin: "https://evil.example", "x-csrf-token": csrf },
        )
      ).status,
      403,
    );
    const expired = issueCsrf(
      initial.session.id,
      config.CSRF_SECRET!,
      Date.now() - 1800001,
    ).token;
    assert.equal(
      (
        await (
          await request("verification/request", {}, { "x-csrf-token": expired })
        ).json()
      ).error.code,
      "CSRF_TOKEN_EXPIRED",
    );
    assert.equal(
      (
        await request(
          "verification/request",
          { userId },
          { "x-csrf-token": csrf },
        )
      ).status,
      422,
    );
    const invalidFields = await request("password-reset/confirm", {
      token: "x",
      newPassword: "short",
    });
    assert.equal(invalidFields.status, 422);
    assert.ok((await invalidFields.json()).error.fields.newPassword);
    const savedCookie = cookie;
    cookie = "";
    assert.equal((await request("verification/request")).status, 401);
    cookie = savedCookie;
    const disabled = createIdentityEmailHttp({
      ...dependencies,
      config: { ...config, EMAIL_DELIVERY_MODE: "disabled" },
    });
    for (const email of [owner, "missing@example.com"])
      assert.equal(
        (
          await disabled(
            new Request(`${origin}/api/v1/identity/password-reset/request`, {
              method: "POST",
              headers: { origin, "content-type": "application/json" },
              body: JSON.stringify({ email }),
            }),
          )
        ).status,
        503,
      );
    assert.equal(
      emailClientSubject(
        new Request(origin, {
          headers: {
            "x-forwarded-for": "8.8.8.8",
            "x-vercel-forwarded-for": "8.8.8.8",
          },
        }),
      ),
      "untrusted-or-local",
    );
    const nativeRoute = await import("../src/app/api/auth/[...all]/route");
    for (const path of [
      "verify-email",
      "reset-password",
      "request-password-reset",
      "send-verification-email",
      "reset-password/fake",
    ]) {
      assert.equal(
        (await nativeRoute.GET(new Request(`${origin}/api/auth/${path}`)))
          .status,
        404,
      );
      assert.equal(
        (
          await nativeRoute.POST(
            new Request(`${origin}/api/auth/${path}`, {
              method: "POST",
              headers: { origin, "content-type": "application/json" },
              body: "{}",
            }),
          )
        ).status,
        404,
      );
    }
    assert.equal(
      (
        await handler(
          new Request(`${origin}/api/v1/identity/verification/confirm`),
        )
      ).status,
      404,
    );

    stage = "passive link, delivery idempotency, verification race/reuse";
    console.log(
      "PASS disposable signup, input/origin/CSRF/mode guards and native-route blocking.",
    );
    assert.equal(
      (await request("verification/request", {}, { "x-csrf-token": csrf }))
        .status,
      202,
    );
    assert.equal(messages.length, 0);
    assert.equal(
      (await db.collection("emailDeliveries").findOne({ type: "verification" }))
        ?.state,
      "pending",
    );
    failures = 2;
    await dispatcher.queue(
      "verification",
      { id: userId, email: owner },
      lastIssuedToken,
    );
    await dispatcher.queue(
      "verification",
      { id: userId, email: owner },
      lastIssuedToken,
    );
    await Promise.all(jobs.splice(0).map((work) => work()));
    assert.equal(messages.length, 3);
    assert.equal(
      new Set(messages.map((message) => message.idempotencyKey)).size,
      1,
    );
    assert.deepEqual(messages[0], messages[2]);
    assert.equal(
      (await db.collection("emailDeliveries").findOne({ type: "verification" }))
        ?.attempts,
      3,
    );
    const verificationToken = tokenOf(messages.at(-1));
    const payload = JSON.parse(
      Buffer.from(verificationToken.split(".")[1]!, "base64url").toString(),
    );
    assert.equal(payload.exp - payload.iat, 3600);
    assert.equal(
      (await auth.api.getSession({ headers: new Headers({ cookie }) }))?.user
        .emailVerified,
      false,
    );
    const verifies = await Promise.all([
      request("verification/confirm", { token: verificationToken }),
      request("verification/confirm", { token: verificationToken }),
    ]);
    assert.deepEqual(
      verifies.map((response) => response.status).sort(),
      [200, 400],
    );
    assert.equal(
      (await request("verification/confirm", { token: verificationToken }))
        .status,
      400,
    );
    assert.equal(
      (await auth.api.getSession({ headers: new Headers({ cookie }) }))?.user
        .emailVerified,
      true,
    );
    assert.equal(
      (await request("verification/request", {}, { "x-csrf-token": csrf }))
        .status,
      200,
    );
    assert.equal(
      (await db.collection("verificationClaims").findOne({ userId }))
        ?.claimedAt instanceof Date,
      true,
    );

    stage =
      "verification dependency failure spends claim and resend creates a fresh link";
    await db
      .collection("user")
      .updateOne(
        { _id: new ObjectId(userId) },
        { $set: { emailVerified: false } },
      );
    await new Promise((resolve) => setTimeout(resolve, 1100));
    assert.equal(
      (await request("verification/request", {}, { "x-csrf-token": csrf }))
        .status,
      202,
    );
    await flush();
    const failedVerificationToken = tokenOf(messages.at(-1));
    const unavailable = createIdentityEmailHttp({
      ...dependencies,
      auth: async () => ({
        ...auth,
        api: {
          ...auth.api,
          verifyEmail: Object.assign(async () => {
            throw new Error("simulated dependency failure");
          }, auth.api.verifyEmail),
        },
      }),
    });
    assert.equal(
      (
        await unavailable(
          new Request(`${origin}/api/v1/identity/verification/confirm`, {
            method: "POST",
            headers: { origin, "content-type": "application/json" },
            body: JSON.stringify({ token: failedVerificationToken }),
          }),
        )
      ).status,
      503,
    );
    assert.ok(
      (
        await db.collection("verificationClaims").findOne({
          tokenDigest: emailDigest("verification", failedVerificationToken),
        })
      )?.claimedAt,
    );
    assert.equal(
      (
        await request("verification/confirm", {
          token: failedVerificationToken,
        })
      ).status,
      400,
    );
    assert.equal(
      (await auth.api.getSession({ headers: new Headers({ cookie }) }))?.user
        .emailVerified,
      false,
    );
    await new Promise((resolve) => setTimeout(resolve, 1100));
    assert.equal(
      (await request("verification/request", {}, { "x-csrf-token": csrf }))
        .status,
      202,
    );
    await flush();
    const freshVerificationToken = tokenOf(messages.at(-1));
    assert.notEqual(freshVerificationToken, failedVerificationToken);
    assert.equal(
      (await request("verification/confirm", { token: freshVerificationToken }))
        .status,
      200,
    );

    stage = "reset request privacy and recipient isolation";
    console.log(
      "PASS deferred provider delivery, stable retry identity and concurrent verification single-use.",
    );
    await clearRates();
    const known = await request("password-reset/request", { email: owner });
    const unknown = await request("password-reset/request", {
      email: "absent@example.com",
    });
    assert.equal(known.status, 202);
    assert.equal(unknown.status, 202);
    assert.deepEqual(await known.json(), await unknown.json());
    await signup("other-fixture@example.com");
    const pendingBefore = jobs.length;
    assert.equal(
      (
        await request("password-reset/request", {
          email: "other-fixture@example.com",
        })
      ).status,
      202,
    );
    assert.equal(jobs.length, pendingBefore);
    await flush();
    assert.ok(messages.every((message) => message.to === owner));
    const records = await db.collection("emailDeliveries").find({}).toArray();
    const serialized = JSON.stringify(records);
    assert.ok(!serialized.includes(owner));
    assert.ok(!serialized.includes(verificationToken));
    assert.ok(!serialized.includes("#token="));

    stage = "expiry and malformed-token handling";
    let resetToken = await issueReset();
    const storedReset = await db
      .collection("verification")
      .findOne({ identifier: `reset-password:${resetToken}` });
    assert.ok(storedReset);
    assert.ok(
      Math.abs(storedReset.expiresAt.getTime() - Date.now() - 1800000) < 10000,
    );
    await db
      .collection("verification")
      .updateOne(
        { _id: storedReset._id },
        { $set: { expiresAt: new Date(Date.now() - 1000) } },
      );
    assert.equal(
      (
        await request("password-reset/confirm", {
          token: resetToken,
          newPassword: password,
        })
      ).status,
      400,
    );
    for (const token of ["invalid", `${verificationToken}tampered`])
      assert.equal(
        (await request("verification/confirm", { token })).status,
        400,
      );
    const claim = await db.collection("verificationClaims").findOne({ userId });
    assert.ok(claim);
    await db
      .collection("verificationClaims")
      .updateOne(
        { _id: claim._id },
        { $set: { claimedAt: null, expiresAt: new Date(Date.now() - 1000) } },
      );
    assert.equal(
      (await request("verification/confirm", { token: verificationToken }))
        .status,
      400,
    );

    stage =
      "provider rejection is asynchronous and reset response stays generic";
    failures = 1;
    permanent = true;
    resetToken = await issueReset();
    const failed = await db
      .collection("emailDeliveries")
      .findOne({ operationKey: emailDigest("reset", resetToken) });
    assert.equal(failed?.state, "failed");
    assert.equal(failed?.attempts, 1);
    assert.equal(failed?.errorCode, "PROVIDER_REJECTED");
    permanent = false;
    failures = 3;
    resetToken = await issueReset();
    const exhausted = await db
      .collection("emailDeliveries")
      .findOne({ operationKey: emailDigest("reset", resetToken) });
    assert.equal(exhausted?.state, "failed");
    assert.equal(exhausted?.attempts, 3);
    assert.equal(exhausted?.errorCode, "PROVIDER_TIMEOUT");

    stage = "password-reset transaction rollback";
    resetToken = await issueReset();
    const newPassword = randomBytes(24).toString("base64url");
    await db.command({
      collMod: "account",
      validator: { $expr: { $eq: [1, 0] } },
      validationLevel: "strict",
      validationAction: "error",
    });
    assert.equal(
      (
        await request("password-reset/confirm", {
          token: resetToken,
          newPassword,
        })
      ).status,
      503,
    );
    assert.ok(
      await db
        .collection("verification")
        .findOne({ identifier: `reset-password:${resetToken}` }),
    );
    assert.ok(await auth.api.getSession({ headers: new Headers({ cookie }) }));
    await db.command({
      collMod: "account",
      validator: {},
      validationLevel: "strict",
      validationAction: "error",
    });

    stage = "concurrent reset single-use and complete session revocation";
    const secondLogin = await auth.api.signInEmail({
      body: { email: owner, password },
      asResponse: true,
    });
    assert.equal(secondLogin.status, 200);
    const secondCookie = secondLogin.headers
      .getSetCookie()
      .map((value) => value.split(";")[0])
      .join("; ");
    const resets = await competingReset(resetToken, newPassword);
    assert.deepEqual(resets.sort(), [200, 400]);
    assert.equal(
      (
        await request("password-reset/confirm", {
          token: resetToken,
          newPassword,
        })
      ).status,
      400,
    );
    assert.equal(
      await auth.api.getSession({ headers: new Headers({ cookie }) }),
      null,
    );
    assert.equal(
      await auth.api.getSession({
        headers: new Headers({ cookie: secondCookie }),
      }),
      null,
    );
    assert.equal(
      await db
        .collection("session")
        .countDocuments({ userId: new ObjectId(userId) }),
      0,
    );
    assert.equal(
      (
        await auth.api.signInEmail({
          body: { email: owner, password },
          asResponse: true,
        })
      ).status,
      401,
    );
    assert.equal(
      (
        await auth.api.signInEmail({
          body: { email: owner, password: newPassword },
          asResponse: true,
        })
      ).status,
      200,
    );

    stage = "durable send and consume rate limits";
    await clearRates();
    for (let count = 0; count < 3; count++)
      assert.equal(
        (
          await request("password-reset/request", {
            email: "absent-rate@example.com",
          })
        ).status,
        202,
      );
    const limited = await request("password-reset/request", {
      email: "absent-rate@example.com",
    });
    assert.equal(limited.status, 429);
    assert.ok(Number(limited.headers.get("Retry-After")) > 0);
    assert.ok(Number(limited.headers.get("Retry-After")) <= 3600);
    await clearRates();
    for (let count = 0; count < 10; count++)
      assert.equal(
        (
          await request(
            "password-reset/request",
            { email: `absent-${count}@example.com` },
            { "x-forwarded-for": `1.2.3.${count}` },
          )
        ).status,
        202,
      );
    assert.equal(
      (
        await request("password-reset/request", {
          email: "absent-extra@example.com",
        })
      ).status,
      429,
    );
    await clearRates();
    for (let count = 0; count < 10; count++)
      assert.equal(
        (await request("verification/confirm", { token: "invalid" })).status,
        400,
      );
    assert.equal(
      (await request("verification/confirm", { token: "invalid" })).status,
      429,
    );
    console.log(
      "PASS email integration: isolated migrations; guarded requests; passive links; expiry/reuse/concurrency; generic reset acknowledgements; provider retries/rejection; atomic reset rollback and session revocation; durable limits. Mock transport only.",
    );
  } finally {
    if (database.startsWith("prep_pilot_email_test_")) await db.dropDatabase();
    await client.close();
    await (await getDomainConnection()).close();
    await (await getAuthClient()).close();
    console.log("Disposable email database removed; test connections closed.");
  }
}
void main().catch((error: unknown) => {
  if (error instanceof Error) {
    const details = error as Error & {
      actual?: unknown;
      expected?: unknown;
      code?: string;
    };
    console.error(
      JSON.stringify({
        type: error.name,
        location: error.stack?.match(/email-integration\.ts:\d+:\d+/)?.[0],
        actual:
          typeof details.actual === "number" ||
          typeof details.actual === "boolean"
            ? details.actual
            : undefined,
        expected:
          typeof details.expected === "number" ||
          typeof details.expected === "boolean"
            ? details.expected
            : undefined,
      }),
    );
  }
  console.error(
    `Email integration failed during ${stage}. No credentials or tokens printed.`,
  );
  process.exitCode = 1;
});
