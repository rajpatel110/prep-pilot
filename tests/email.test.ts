import assert from "node:assert/strict";
import { test } from "node:test";
import { getServerEnv } from "../src/shared/server/env";
import {
  emailAllowed,
  emailAvailability,
} from "../src/modules/notifications/policy";
import { emailSchemas } from "../src/modules/identity/email-schema";
import {
  resendTransport,
  DeliveryError,
  type EmailMessage,
} from "../src/modules/notifications/transport";

const source = {
  AUTH_ENABLED: "true",
  MONGODB_URI: "mongodb://localhost:27017",
  MONGODB_DB_NAME: "email_unit_test",
  BETTER_AUTH_SECRET: "a".repeat(32),
  CSRF_SECRET: "b".repeat(32),
  RATE_LIMIT_SECRET: "c".repeat(32),
  RESEND_API_KEY: "mock-only",
  RESEND_FROM_EMAIL: "PrepPilot <onboarding@resend.dev>",
  EMAIL_TEST_RECIPIENT: "owner@example.com",
};
test("email delivery is separately opt-in, never changes general demo access", () => {
  const config = getServerEnv(source);
  assert.equal(config.EMAIL_MODE, "test");
  assert.equal(config.EMAIL_DELIVERY_MODE, "disabled");
  assert.equal(emailAvailability(config).passwordRecovery, false);
  assert.equal(emailAllowed(config, "owner@example.com"), false);
  const owner = getServerEnv({ ...source, EMAIL_DELIVERY_MODE: "owner_test" });
  assert.equal(emailAllowed(owner, "OWNER@example.com"), true);
  assert.equal(emailAllowed(owner, "student@example.com"), false);
  assert.equal(emailAvailability(owner).passwordRecovery, true);
});
test("owner mode requires exact recipient, authentication, loopback and demo mode", () => {
  for (const change of [
    { EMAIL_TEST_RECIPIENT: "" },
    { AUTH_ENABLED: "false" },
    { APP_URL: "https://app.example.com" },
    { EMAIL_MODE: "live" },
    { RESEND_API_KEY: "" },
    { RESEND_FROM_EMAIL: "Bad <sender@example.com" },
  ])
    assert.throws(() =>
      getServerEnv({ ...source, EMAIL_DELIVERY_MODE: "owner_test", ...change }),
    );
});
test("live delivery requires explicit non-testing verified sender, HTTPS and live access mode", () => {
  const live = {
    ...source,
    EMAIL_DELIVERY_MODE: "live",
    EMAIL_MODE: "live",
    APP_URL: "https://app.example.com",
    RESEND_FROM_EMAIL: "PrepPilot <hello@example.com>",
    RESEND_SENDER_VERIFIED: "true",
  };
  assert.equal(emailAllowed(getServerEnv(live), "student@example.com"), true);
  for (const change of [
    { RESEND_SENDER_VERIFIED: "false" },
    { RESEND_FROM_EMAIL: source.RESEND_FROM_EMAIL },
    { RESEND_FROM_EMAIL: "sender@testing.resend.dev" },
    { APP_URL: "http://app.example.com" },
    { EMAIL_MODE: "test" },
  ])
    assert.throws(() => getServerEnv({ ...live, ...change }));
  assert.equal(
    emailAvailability(getServerEnv({ ...source, EMAIL_MODE: "live" }))
      .passwordRecovery,
    false,
  );
});
test("strict email contracts reject redirects, actors, token overflow and short passwords", () => {
  assert.equal(
    emailSchemas["verification/request"].safeParse({
      email: "other@example.com",
    }).success,
    false,
  );
  assert.equal(
    emailSchemas["verification/confirm"].safeParse({ token: "x".repeat(8193) })
      .success,
    false,
  );
  assert.equal(
    emailSchemas["password-reset/request"].safeParse({
      email: "a@example.com",
      redirectTo: "https://evil.example",
    }).success,
    false,
  );
  assert.equal(
    emailSchemas["password-reset/confirm"].safeParse({
      token: "x",
      newPassword: "short",
    }).success,
    false,
  );
  assert.equal(
    emailSchemas["password-reset/request"].parse({
      email: " OWNER@Example.com ",
    }).email,
    "owner@example.com",
  );
  assert.equal(
    emailSchemas["password-reset/confirm"].parse({
      token: "x",
      newPassword: "  twelve spaces preserved  ",
    }).newPassword,
    "  twelve spaces preserved  ",
  );
});
const message: EmailMessage = {
  to: "owner@example.com",
  from: "PrepPilot <onboarding@resend.dev>",
  subject: "Test",
  text: "mock body",
  idempotencyKey: "a".repeat(64),
};
test("transport uses fixed provider endpoint, exact recipient and idempotency header", async () => {
  const transport = resendTransport("mock-only", async (url, options) => {
    assert.equal(url, "https://api.resend.com/emails");
    assert.equal(
      new Headers(options?.headers).get("Idempotency-Key"),
      message.idempotencyKey,
    );
    assert.deepEqual(JSON.parse(String(options?.body)).to, [message.to]);
    assert.ok(options?.signal);
    return Response.json({ id: "mock-provider-id" });
  });
  assert.deepEqual(await transport(message), {
    providerId: "mock-provider-id",
  });
});
test("transport rejects safely without leaking provider errors and classifies retryability", async () => {
  await assert.rejects(
    resendTransport("mock-only", async () => {
      const error = new Error("private details");
      error.name = "TimeoutError";
      throw error;
    })(message),
    (error) =>
      error instanceof DeliveryError &&
      error.code === "PROVIDER_TIMEOUT" &&
      error.retryable,
  );
  await assert.rejects(
    resendTransport("mock-only", async () => Response.json({ id: "" }))(
      message,
    ),
    (error) => error instanceof DeliveryError && error.retryable,
  );
  for (const [status, retryable] of [
    [403, false],
    [429, true],
    [409, true],
    [500, true],
  ] as const) {
    await assert.rejects(
      resendTransport("mock-only", async () =>
        Response.json({ message: "private provider details" }, { status }),
      )(message),
      (error) =>
        error instanceof DeliveryError &&
        error.retryable === retryable &&
        !error.message.includes("private"),
    );
  }
  await assert.rejects(
    resendTransport("mock-only", async () => {
      throw new Error("secret network details");
    })(message),
    (error) =>
      error instanceof DeliveryError && error.code === "PROVIDER_UNAVAILABLE",
  );
  await assert.rejects(
    resendTransport("mock-only", async () => Response.json({}))(message),
    (error) => error instanceof DeliveryError && error.retryable,
  );
});
