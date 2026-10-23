import { test } from "node:test";
import assert from "node:assert/strict";
import { destination } from "../src/modules/identity/policy";
import { issueCsrf, validCsrf } from "../src/modules/identity/csrf-token";
import { signupSchema, loginSchema } from "../src/modules/identity/schemas";
import { getServerEnv } from "../src/shared/server/env";

test("server-derived destination prioritises verification and bypasses student preferences for admins", () => {
  const profile = {
    role: "student",
    lifecycle: "active",
    preferences: null,
  } as const;
  assert.equal(destination(profile, false, "test"), "/onboarding");
  assert.equal(destination(profile, false, "live"), "/verify-email");
  assert.equal(
    destination({ ...profile, role: "admin" }, true, "live"),
    "/admin",
  );
  assert.equal(
    destination({ ...profile, preferences: {} }, true, "test"),
    "/dashboard",
  );
  assert.equal(
    destination({ ...profile, lifecycle: "deleting" }, true, "test"),
    "/login",
  );
});
test("CSRF tokens are bound to session, secret, expiry and unchanged payload", () => {
  const secret = "test-secret";
  const now = 1000000;
  const token = issueCsrf("session-a", secret, now).token;
  assert.equal(validCsrf(token, "session-a", secret, now), true);
  assert.equal(validCsrf(token, "session-b", secret, now), false);
  assert.equal(validCsrf(token, "session-a", "other", now), false);
  assert.equal(validCsrf(token, "session-a", secret, now + 1800000), false);
  assert.equal(validCsrf(`${token}x`, "session-a", secret, now), false);
  assert.equal(validCsrf("malformed", "session-a", secret, now), false);
});
test("signup rejects privileged fields, normalises email and preserves passwords", () => {
  const input = {
    name: "Student",
    email: " Person@Example.com ",
    password: "  a password with spaces  ",
  };
  const result = signupSchema.parse(input);
  assert.equal(result.email, "person@example.com");
  assert.equal(result.password, input.password);
  assert.equal(
    signupSchema.safeParse({ ...input, role: "admin" }).success,
    false,
  );
  assert.equal(
    signupSchema.safeParse({ ...input, emailVerified: true }).success,
    false,
  );
  assert.equal(
    signupSchema.safeParse({ ...input, password: "short" }).success,
    false,
  );
  assert.equal(
    loginSchema.safeParse({ email: input.email, password: "wrong" }).success,
    true,
  );
});
test("credential-free builds are allowed but enabled authentication fails closed", () => {
  assert.equal(getServerEnv({}).AUTH_ENABLED, false);
  assert.equal(
    getServerEnv({ APP_URL: "http://localhost:3000/" }).APP_URL,
    "http://localhost:3000",
  );
  assert.throws(() => getServerEnv({ AUTH_ENABLED: "true" }));
  assert.throws(() => getServerEnv({ APP_URL: "https://example.com/path" }));
});
