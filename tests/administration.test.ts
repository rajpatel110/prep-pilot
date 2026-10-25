import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import {
  lookupInput,
  passwordInput,
  roleInput,
} from "../src/modules/administration/schemas";
import { destination } from "../src/modules/identity/policy";
import { studentReturn } from "../src/modules/identity/student-routing";

test("owner governance inputs normalize exact email and reject privileged, bulk or unsupported transitions", () => {
  assert.equal(
    lookupInput.parse({ email: " Owner@Example.com " }).email,
    "owner@example.com",
  );
  assert.equal(
    lookupInput.safeParse({ email: "a@example.com", role: "owner" }).success,
    false,
  );
  const input = {
    role: "admin",
    expectedRole: "student",
    expectedStateRevision: 0,
    operationId: randomUUID(),
    reason: " Editorial helper ",
  };
  assert.equal(roleInput.parse(input).reason, "Editorial helper");
  for (const extra of [
    { role: "owner" },
    { expectedRole: "owner" },
    { role: "student" },
    { userIds: ["a", "b"] },
    { emailVerified: true },
    { expectedStateRevision: Number.MAX_SAFE_INTEGER },
    { reason: " " },
  ])
    assert.equal(roleInput.safeParse({ ...input, ...extra }).success, false);
  assert.equal(
    passwordInput.parse({ password: " secret " }).password,
    " secret ",
  );
  assert.equal(
    passwordInput.safeParse({ password: "secret", confirmed: true }).success,
    false,
  );
});
test("shared login routes owner to admin and cannot accept arbitrary return origins", () => {
  assert.equal(
    destination(
      { role: "owner", lifecycle: "active", preferences: null },
      true,
      "test",
    ),
    "/admin",
  );
  assert.equal(
    destination(
      { role: "owner", lifecycle: "active", preferences: null },
      false,
      "live",
    ),
    "/verify-email",
  );
  for (const path of [
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "/admin/administrators",
    "/content#token=secret",
  ])
    assert.equal(studentReturn(path), null);
});
