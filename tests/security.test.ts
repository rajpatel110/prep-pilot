import { test } from "node:test";
import assert from "node:assert/strict";
import { issueCsrf, inspectCsrf } from "../src/modules/identity/csrf-token";
import { requireCsrf, checkCsrf } from "../src/shared/server/csrf";
import { serverConfig } from "../src/shared/server/config";
import { failure, HttpError } from "../src/shared/server/http";

test("CSRF distinguishes signed expiration from invalid signatures and session bindings", () => {
  const now = Date.now();
  const secret = serverConfig.CSRF_SECRET ?? "test-only-secret";
  const expired = issueCsrf("session", secret, now - 1800001).token;
  const valid = issueCsrf("session", secret, now).token;
  assert.equal(inspectCsrf(valid, "session", secret, now), "valid");
  assert.equal(inspectCsrf(expired, "session", secret, now), "expired");
  assert.equal(inspectCsrf(expired, "other-session", secret, now), "invalid");
  assert.equal(inspectCsrf(`${expired}x`, "session", secret, now), "invalid");
  assert.equal(
    inspectCsrf(expired.replace(/^\d+/, "1"), "session", secret, now),
    "invalid",
  );
  assert.equal(
    inspectCsrf(
      issueCsrf("session", secret, now + 1000).token,
      "session",
      secret,
      now,
    ),
    "invalid",
  );
  function request(token?: string, origin = serverConfig.APP_URL) {
    return new Request(`${serverConfig.APP_URL}/api/v1/example`, {
      method: "POST",
      headers: { origin, ...(token ? { "x-csrf-token": token } : {}) },
    });
  }
  const protection = { origin: serverConfig.APP_URL, secret };
  assert.doesNotThrow(() =>
    checkCsrf(request(valid), "session", protection, now),
  );
  assert.throws(() => checkCsrf(request(expired), "session", protection, now), {
    code: "CSRF_TOKEN_EXPIRED",
  });
  for (const token of [undefined, `${expired}x`, expired.replace(/^\d+/, "1")])
    assert.throws(() => checkCsrf(request(token), "session", protection, now), {
      code: "CSRF_INVALID",
    });
  assert.throws(
    () => checkCsrf(request(expired), "other-session", protection, now),
    { code: "CSRF_INVALID" },
  );
  assert.throws(
    () =>
      checkCsrf(
        request(expired, "https://untrusted.example"),
        "session",
        protection,
        now,
      ),
    { code: "CSRF_INVALID" },
  );
});

test("application errors preserve safe fields and matching request IDs without leaking unknown errors", async () => {
  const fields = {
    title: ["Enter a title."],
    assetIds: ["Attachments are not available yet."],
  };
  const response = failure(
    new HttpError(
      422,
      "VALIDATION_ERROR",
      "Check the highlighted fields.",
      fields,
    ),
  );
  const payload = await response.json();
  assert.equal(response.status, 422);
  assert.deepEqual(payload.error.fields, fields);
  assert.equal(payload.requestId, response.headers.get("x-request-id"));
  assert.equal(response.headers.get("cache-control"), "no-store");
  const unavailable = failure(new Error("secret database connection string"));
  assert.equal(unavailable.status, 503);
  assert.ok(
    !JSON.stringify(await unavailable.json()).includes("secret database"),
  );
  const forbidden = await failure(
    new HttpError(403, "FORBIDDEN", "Not allowed."),
  ).json();
  assert.equal("fields" in forbidden.error, false);
  assert.equal(
    failure(new HttpError(429, "RATE_LIMITED", "Try later.")).headers.get(
      "retry-after",
    ),
    "900",
  );
});

test("CSRF Origin protection rejects missing and cross-origin requests with documented code", () => {
  for (const origin of [undefined, "https://untrusted.example"]) {
    const request = new Request(`${serverConfig.APP_URL}/api/v1/example`, {
      method: "POST",
      headers: origin ? { origin } : {},
    });
    assert.throws(() => requireCsrf(request, "session"), {
      code: "CSRF_INVALID",
      status: 403,
    });
  }
});
