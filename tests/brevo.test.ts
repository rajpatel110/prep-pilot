import assert from "node:assert/strict";
import { test } from "node:test";
import {
  brevoTransport,
  DeliveryError,
} from "../src/modules/notifications/transport";
import { getServerEnv } from "../src/shared/server/env";
import { emailAllowed } from "../src/modules/notifications/policy";

const source = {
  AUTH_ENABLED: "true",
  MONGODB_URI: "mongodb://localhost:27017",
  MONGODB_DB_NAME: "brevo_unit_test",
  BETTER_AUTH_SECRET: "a".repeat(32),
  CSRF_SECRET: "b".repeat(32),
  RATE_LIMIT_SECRET: "c".repeat(32),
  EMAIL_PROVIDER: "brevo",
  EMAIL_DELIVERY_MODE: "restricted",
  EMAIL_MODE: "test",
  EMAIL_TEST_RECIPIENTS: "sender@example.com,other@example.com",
  BREVO_API_KEY: "mock-only",
  BREVO_SENDER_EMAIL: "sender@example.com",
  BREVO_SENDER_NAME: "PrepPilot",
  BREVO_SENDER_VERIFIED: "true",
};
const message = {
  to: "other@example.com",
  from: "ignored",
  subject: "Verification",
  text: "private mock body",
  idempotencyKey: "a".repeat(64),
};
test("Brevo config separates sender attestation, recipient restriction and access policy", () => {
  const config = getServerEnv(source);
  assert.equal(emailAllowed(config, "OTHER@example.com"), true);
  assert.equal(emailAllowed(config, "third@example.com"), false);
  assert.equal(
    getServerEnv({ ...source, EMAIL_MODE: "live" }).EMAIL_MODE,
    "live",
  );
  for (const change of [
    { BREVO_API_KEY: "" },
    { BREVO_SENDER_VERIFIED: "false", RESEND_SENDER_VERIFIED: "true" },
    { BREVO_SENDER_NAME: "bad\nname" },
    { EMAIL_TEST_RECIPIENTS: "" },
    { EMAIL_PROVIDER: "unknown" },
    { APP_URL: "http://public.example" },
  ])
    assert.throws(() => getServerEnv({ ...source, ...change }));
  assert.throws(() => getServerEnv({ ...source, EMAIL_DELIVERY_MODE: "live" }));
  const live = getServerEnv({
    ...source,
    APP_URL: "https://app.example.com",
    EMAIL_DELIVERY_MODE: "live",
    EMAIL_MODE: "live",
    BREVO_SENDER_EMAIL: "sender@gmail.com",
  });
  assert.equal(emailAllowed(live, "third@example.com"), true);
  assert.equal(
    emailAllowed(
      getServerEnv({ ...source, EMAIL_DELIVERY_MODE: "disabled" }),
      message.to,
    ),
    false,
  );
});
test("Brevo sends only intended recipient, text and stable UUID idempotency, without contacts", async () => {
  const keys: string[] = [];
  const transport = brevoTransport(
    "mock-only",
    { email: "sender@example.com", name: "PrepPilot" },
    async (url, init) => {
      assert.equal(url, "https://api.brevo.com/v3/smtp/email");
      assert.equal(new Headers(init?.headers).get("api-key"), "mock-only");
      assert.ok(init?.signal);
      const body = JSON.parse(String(init?.body));
      assert.deepEqual(body.to, [{ email: message.to }]);
      assert.equal(body.textContent, message.text);
      assert.deepEqual(Object.keys(body).sort(), [
        "headers",
        "sender",
        "subject",
        "textContent",
        "to",
      ]);
      assert.match(
        body.headers.idempotencyKey,
        /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-a[a-f0-9]{3}-[a-f0-9]{12}$/,
      );
      keys.push(body.headers.idempotencyKey);
      return Response.json({ messageId: "mock-accepted" }, { status: 201 });
    },
  );
  assert.deepEqual(await transport(message), { providerId: "mock-accepted" });
  await transport(message);
  assert.equal(keys[0], keys[1]);
});
test("Brevo rejection, quota, ambiguous acceptance and timeout stay safe and bounded", async () => {
  for (const [status, retryable] of [
    [400, false],
    [401, false],
    [403, false],
    [429, false],
    [500, true],
  ] as const)
    await assert.rejects(
      brevoTransport(
        "mock",
        { email: "sender@example.com", name: "PrepPilot" },
        async () =>
          Response.json(
            { message: "secret recipient", code: "duplicate_parameter" },
            { status },
          ),
      )(message),
      (error) =>
        error instanceof DeliveryError &&
        error.retryable === retryable &&
        !error.message.includes("secret"),
    );
  for (const send of [
    async () => Response.json({}),
    async () => {
      throw new DOMException("private", "TimeoutError");
    },
  ])
    await assert.rejects(
      brevoTransport(
        "mock",
        { email: "sender@example.com", name: "PrepPilot" },
        send,
      )(message),
      (error) =>
        error instanceof DeliveryError &&
        !error.retryable &&
        !error.message.includes("private"),
    );
});
