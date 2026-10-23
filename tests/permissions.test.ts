import { test } from "node:test";
import assert from "node:assert/strict";
import { createAccessGuards } from "../src/modules/identity/guards";
import type { AccessProfile } from "../src/modules/identity/policy";
import { HttpError } from "../src/shared/server/http";

test("direct guards deny anonymous actors without provisioning a profile", async () => {
  const guards = createAccessGuards({
    getSession: async () => null,
    getProfile: async (): Promise<AccessProfile> => {
      throw new Error("Unexpected profile lookup");
    },
    emailMode: "test",
  });
  for (const guard of Object.values(guards))
    await assert.rejects(
      guard(new Headers()),
      (error: unknown) =>
        error instanceof HttpError &&
        error.status === 401 &&
        error.code === "UNAUTHENTICATED",
    );
});

for (const emailMode of ["test", "live"] as const) {
  test(`direct guards consult current student/admin/downgraded/deleting state in ${emailMode} mode`, async () => {
    let profile: AccessProfile | null = {
      role: "student",
      lifecycle: "active",
      preferences: null,
    };
    let verified = false;
    let lookups = 0;
    const guards = createAccessGuards({
      getSession: async () => ({
        user: { id: "trusted-user", emailVerified: verified },
      }),
      getProfile: async (userId) => {
        assert.equal(userId, "trusted-user");
        lookups++;
        return profile;
      },
      emailMode,
    });
    const headers = new Headers({ "x-role": "admin", "x-user-id": "forged" });
    assert.equal((await guards.requireActor(headers)).profile.role, "student");
    if (emailMode === "live") {
      for (const guard of [guards.requireStudyActor, guards.requireAdmin])
        await assert.rejects(guard(headers), { code: "EMAIL_NOT_VERIFIED" });
      profile.role = "admin";
      await assert.rejects(guards.requireAdmin(headers), {
        code: "EMAIL_NOT_VERIFIED",
      });
      assert.equal(
        (await guards.requireActor(headers)).destination,
        "/verify-email",
      );
    } else {
      await guards.requireStudyActor(headers);
      await assert.rejects(guards.requireAdmin(headers), { code: "FORBIDDEN" });
    }
    verified = true;
    profile.role = "student";
    await guards.requireStudyActor(headers);
    await assert.rejects(guards.requireAdmin(headers), { code: "FORBIDDEN" });
    profile.role = "admin";
    assert.equal((await guards.requireAdmin(headers)).destination, "/admin");
    profile = { ...profile, role: "student" };
    await assert.rejects(guards.requireAdmin(headers), { code: "FORBIDDEN" });
    await guards.requireStudyActor(headers);
    profile.lifecycle = "deleting";
    for (const guard of Object.values(guards))
      await assert.rejects(guard(headers), { code: "ACCOUNT_UNAVAILABLE" });
    profile = null;
    await assert.rejects(guards.requireActor(headers), {
      code: "ACCOUNT_UNAVAILABLE",
    });
    assert.ok(lookups >= 10);
  });
}
