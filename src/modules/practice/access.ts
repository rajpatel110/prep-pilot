import "server-only";
import { requireStudyActor } from "@/modules/identity/service";
import { profileModel } from "@/modules/identity/model";
import { HttpError } from "@/shared/server/http";
import type { Connection, ClientSession } from "mongoose";

export async function requirePracticeActor(headers: Headers) {
  const actor = await requireStudyActor(headers);
  if (actor.profile.role !== "student")
    throw new HttpError(403, "FORBIDDEN", "Student study access is required.");
  return actor;
}
export async function lockStudyProfile(
  connection: Connection,
  session: ClientSession,
  userId: string,
  allocateAttempt: boolean,
  expected?: number,
) {
  const model = profileModel(connection);
  const profile = await model.findOne({ userId }).session(session).lean();
  if (!profile || profile.lifecycle !== "active")
    throw new HttpError(
      403,
      "ACCOUNT_UNAVAILABLE",
      "This account is unavailable.",
    );
  if (profile.role !== "student")
    throw new HttpError(403, "FORBIDDEN", "Student study access is required.");
  if (expected !== undefined && profile.stateRevision !== expected)
    throw new HttpError(
      409,
      "STATE_CONFLICT",
      "Study state changed. Refetch before continuing.",
    );
  if (
    !Number.isSafeInteger(profile.stateRevision) ||
    profile.stateRevision < 0 ||
    profile.stateRevision >= Number.MAX_SAFE_INTEGER ||
    !Number.isSafeInteger(profile.attemptSequence) ||
    profile.attemptSequence < 0 ||
    (allocateAttempt && profile.attemptSequence >= Number.MAX_SAFE_INTEGER)
  )
    throw new HttpError(
      409,
      "STATE_CONFLICT",
      "Study counters cannot advance.",
    );
  const updated = await model
    .findOneAndUpdate(
      {
        _id: profile._id,
        lifecycle: "active",
        role: "student",
        stateRevision: profile.stateRevision,
        attemptSequence: profile.attemptSequence,
      },
      {
        $inc: {
          stateRevision: 1,
          ...(allocateAttempt ? { attemptSequence: 1 } : {}),
        },
      },
      { session, returnDocument: "after", runValidators: true },
    )
    .lean();
  if (!updated)
    throw new HttpError(
      409,
      "STATE_CONFLICT",
      "Study state changed. Retry the same submission.",
    );
  return updated;
}
