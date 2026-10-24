import "server-only";
import { createHash } from "node:crypto";
import { Types } from "mongoose";
import { getDomainConnection } from "@/shared/server/db";
import { rateLimit } from "@/shared/server/rate-limit";
import { HttpError } from "@/shared/server/http";
import {
  attemptableContent,
  lockStudyCatalog,
  requireStudyCatalog,
} from "@/modules/catalog/study-access";
import { recordRevision } from "@/modules/revisions/record";
import { attemptInput, parseStudyInput, type AttemptInput } from "./schemas";
import { attemptModel } from "./model";
import { requirePracticeActor, lockStudyProfile } from "./access";
import { requirePracticeSetup } from "./setup";
import { studyError, studyTransaction } from "./errors";

export function attemptHash(input: AttemptInput) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        version: 1,
        contentId: input.contentId,
        kind: input.kind,
        outcome: input.outcome,
        perceivedDifficulty: input.perceivedDifficulty ?? null,
      }),
    )
    .digest("hex");
}
type Attempt = NonNullable<
  Awaited<ReturnType<ReturnType<typeof attemptModel>["findOne"]>>
>;
function resultDto(document: Attempt) {
  return {
    attemptId: String(document._id),
    submissionId: document.submissionId,
    contentId: String(document.contentId),
    attemptSequence: document.attemptSequence,
    createdAt: document.createdAt.toISOString(),
    revision: {
      id: String(document.resultSnapshot.revisionId),
      dueDate: document.resultSnapshot.dueDate,
      intervalDays: document.resultSnapshot.intervalDays,
    },
    stateRevision: document.resultSnapshot.resultingStateRevision,
  };
}
export async function submitAttempt(headers: Headers, input: unknown) {
  try {
    const actor = await requirePracticeActor(headers);
    const values = parseStudyInput(attemptInput, input);
    await rateLimit("attempts", actor.session.user.id, 60, 60);
    const connection = await getDomainConnection();
    await requirePracticeSetup(connection);
    await requireStudyCatalog(connection);
    const model = attemptModel(connection);
    const hash = attemptHash(values);
    const userId = actor.session.user.id;
    function replay(document: Attempt) {
      if (document.requestHash !== hash)
        throw new HttpError(
          409,
          "IDEMPOTENCY_CONFLICT",
          "This submission identifier was used with different input. Do not retry a changed payload.",
        );
      return { data: resultDto(document), meta: { replayed: true } };
    }
    const previous = await model.findOne({
      userId,
      submissionId: values.submissionId,
    });
    if (previous) return replay(previous);
    const attemptId = new Types.ObjectId();
    const revisionId = new Types.ObjectId();
    const now = new Date();
    try {
      return await connection.transaction(async (session) => {
        const existing = await model
          .findOne({ userId, submissionId: values.submissionId })
          .session(session);
        if (existing) return replay(existing);
        await lockStudyCatalog(connection, session);
        const profile = await lockStudyProfile(
          connection,
          session,
          userId,
          true,
        );
        const snapshot = await attemptableContent(
          connection,
          session,
          values.contentId,
        );
        const revision = await recordRevision(
          connection,
          session,
          values,
          userId,
          attemptId,
          profile.attemptSequence,
          now,
          revisionId,
        );
        const document = new model({
          _id: attemptId,
          ...values,
          userId,
          requestHash: hash,
          contentSnapshot: snapshot,
          subject: snapshot.subject,
          topic: snapshot.topic,
          attemptSequence: profile.attemptSequence,
          resultSnapshot: {
            revisionId: revision.id,
            dueDate: revision.dueDate,
            intervalDays: revision.intervalDays,
            resultingStateRevision: profile.stateRevision,
            attemptDate: revision.attemptDate,
          },
          createdAt: now,
          updatedAt: now,
        });
        await document.save({ session });
        return { data: resultDto(document), meta: { replayed: false } };
      }, studyTransaction);
    } catch (error) {
      const winner = await model.findOne({
        userId,
        submissionId: values.submissionId,
      });
      if (winner) return replay(winner);
      throw error;
    }
  } catch (error) {
    throw studyError(error);
  }
}
