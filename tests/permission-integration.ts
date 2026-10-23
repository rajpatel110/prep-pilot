import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { getAuth } from "../src/modules/identity/auth";
import {
  requireActor,
  requireStudyActor,
  requireAdmin,
  actorDto,
} from "../src/modules/identity/service";
import { getAuthClient, getDomainConnection } from "../src/shared/server/db";
import { serverConfig } from "../src/shared/server/config";

async function main() {
  if (!serverConfig.MONGODB_DB_NAME?.startsWith("prep_pilot_step1_test_"))
    throw new Error("Disposable test target required.");
  const client = await getAuthClient();
  const connection = await getDomainConnection();
  const db = client.db(serverConfig.MONGODB_DB_NAME);
  try {
    for (const guard of [requireActor, requireStudyActor, requireAdmin])
      await assert.rejects(guard(new Headers()), { code: "UNAUTHENTICATED" });
    const auth = await getAuth();
    const signup = await auth.api.signUpEmail({
      body: {
        name: "Disposable permission actor",
        email: `permissions-${randomUUID()}@example.com`,
        password: randomBytes(24).toString("base64url"),
      },
      headers: new Headers({ origin: serverConfig.APP_URL }),
      asResponse: true,
    });
    assert.equal(signup.status, 200);
    const cookie = signup.headers
      .getSetCookie()
      .map((value) => value.split(";")[0])
      .join("; ");
    assert.ok(cookie);
    const headers = new Headers({
      cookie,
      "x-role": "admin",
      "x-user-id": "forged",
    });
    const actor = await requireActor(headers);
    const userId = actor.session.user.id;
    assert.equal(actor.profile.role, "student");
    assert.equal(actorDto(actor).capabilities.verificationEmail, false);
    assert.equal(actorDto(actor).capabilities.passwordRecovery, false);
    if (serverConfig.EMAIL_MODE === "live") {
      await assert.rejects(requireStudyActor(headers), {
        code: "EMAIL_NOT_VERIFIED",
      });
      await assert.rejects(requireAdmin(headers), {
        code: "EMAIL_NOT_VERIFIED",
      });
      await db
        .collection("profiles")
        .updateOne({ userId }, { $set: { role: "admin" } });
      await assert.rejects(requireAdmin(headers), {
        code: "EMAIL_NOT_VERIFIED",
      });
      await db
        .collection("user")
        .updateOne(
          { email: actor.session.user.email },
          { $set: { emailVerified: true } },
        );
    } else {
      await requireStudyActor(headers);
      await assert.rejects(requireAdmin(headers), { code: "FORBIDDEN" });
    }
    await db
      .collection("profiles")
      .updateOne({ userId }, { $set: { role: "student" } });
    await requireStudyActor(headers);
    await assert.rejects(requireAdmin(headers), { code: "FORBIDDEN" });
    await db
      .collection("profiles")
      .updateOne({ userId }, { $set: { role: "admin" } });
    await requireAdmin(headers);
    await db
      .collection("profiles")
      .updateOne({ userId }, { $set: { role: "student" } });
    await assert.rejects(requireAdmin(headers), { code: "FORBIDDEN" });
    await db
      .collection("profiles")
      .updateOne(
        { userId },
        { $set: { role: "admin", lifecycle: "deleting" } },
      );
    for (const guard of [requireActor, requireStudyActor, requireAdmin])
      await assert.rejects(guard(headers), { code: "ACCOUNT_UNAVAILABLE" });
    console.log(
      `PASS: canonical direct permission guards in ${serverConfig.EMAIL_MODE} mode.`,
    );
  } finally {
    await connection.close();
    await client.close();
  }
}

main().catch(() => {
  console.error(
    "Direct permission integration failed; no credentials or session values are logged.",
  );
  process.exitCode = 1;
});
