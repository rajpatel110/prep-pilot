import "server-only";
import { Types, type Connection, type ClientSession } from "mongoose";
import { revisionModel } from "./model";
import { revisionSchedule } from "./rules";
import type { AttemptInput } from "@/modules/practice/schemas";
import { HttpError } from "@/shared/server/http";
export async function recordRevision(
  connection: Connection,
  session: ClientSession,
  input: AttemptInput,
  userId: string,
  attemptId: Types.ObjectId,
  sequence: number,
  now: Date,
  newRevisionId: Types.ObjectId,
) {
  if (!session.inTransaction())
    throw new Error("Revision writes require the attempt transaction.");
  const model = revisionModel(connection);
  const existing = await model
    .findOne({ userId, contentId: input.contentId })
    .session(session)
    .lean();
  if (input.kind === "revision" && !existing)
    throw new HttpError(
      422,
      "REVISION_NOT_FOUND",
      "No owned revision exists for this question.",
    );
  const schedule = revisionSchedule(input, now);
  const values = {
    lastAttemptId: attemptId,
    lastAttemptSequence: sequence,
    dueDate: schedule.dueDate,
    intervalDays: schedule.intervalDays,
    reason: schedule.reason,
    timezone: "Asia/Kolkata" as const,
  };
  if (existing) {
    if (existing.lastAttemptSequence >= sequence)
      throw new HttpError(
        409,
        "STATE_CONFLICT",
        "A newer revision cycle already exists.",
      );
    const result = await model.updateOne(
      {
        _id: existing._id,
        userId,
        lastAttemptSequence: existing.lastAttemptSequence,
      },
      { $set: values },
      { session, runValidators: true },
    );
    if (result.matchedCount !== 1)
      throw new HttpError(409, "STATE_CONFLICT", "The revision cycle changed.");
  } else
    await model.create(
      [
        {
          _id: newRevisionId,
          userId,
          contentId: input.contentId,
          ...values,
          createdAt: now,
          updatedAt: now,
        },
      ],
      { session },
    );
  return { id: existing?._id ?? newRevisionId, ...schedule };
}
