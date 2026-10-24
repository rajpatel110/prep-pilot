import "server-only";
import { Types } from "mongoose";
import { getDomainConnection } from "@/shared/server/db";
import { serverConfig } from "@/shared/server/config";
import { HttpError } from "@/shared/server/http";
import { studyDate } from "@/modules/identity/preferences-schema";
import { profileModel } from "@/modules/identity/model";
import { activeStudyWindow } from "@/modules/planning/study-window";
import { studyAvailability } from "@/modules/catalog/study-access";
import { attemptSnapshotsByIds } from "@/modules/practice/history-read";
import { requirePracticeActor } from "@/modules/practice/access";
import { requirePracticeSetup } from "@/modules/practice/setup";
import { studyError, studyTransaction } from "@/modules/practice/errors";
import { parseStudyInput } from "@/modules/practice/schemas";
import { revisionQuery, queryValues } from "@/modules/practice/query";
import {
  inspectStudyCursor,
  issueStudyCursor,
} from "@/modules/practice/cursor";
import { revisionModel } from "./model";
export async function listRevisions(headers: Headers, params: URLSearchParams) {
  try {
    const actor = await requirePracticeActor(headers);
    const userId = actor.session.user.id;
    const query = parseStudyInput(revisionQuery, queryValues(params));
    const today = studyDate();
    const binding = JSON.stringify({
      endpoint: "revisions",
      userId,
      dueOnly: query.dueOnly,
      limit: query.limit,
      today,
    });
    const after = query.cursor
      ? inspectStudyCursor(
          query.cursor,
          binding,
          serverConfig.BETTER_AUTH_SECRET!,
        )
      : null;
    if (query.cursor && (!after || !("date" in after)))
      throw new HttpError(
        400,
        "INVALID_CURSOR",
        "Restart revisions from the first page.",
      );
    const connection = await getDomainConnection();
    await requirePracticeSetup(connection);
    return await connection.transaction(async (session) => {
      const profile = await profileModel(connection)
        .findOne({ userId, lifecycle: "active", role: "student" })
        .session(session)
        .lean();
      if (!profile)
        throw new HttpError(
          403,
          "ACCOUNT_UNAVAILABLE",
          "Study access changed.",
        );
      const window = await activeStudyWindow(
        connection,
        session,
        userId,
        profile.activePlanId,
      );
      const filter: Record<string, unknown> = { userId };
      if (query.dueOnly === "true") filter.dueDate = { $lte: today };
      if (after && "date" in after)
        filter.$or = [
          { dueDate: { $gt: after.date } },
          { dueDate: after.date, _id: { $gt: new Types.ObjectId(after.id) } },
        ];
      const records = await revisionModel(connection)
        .find(filter)
        .sort({ dueDate: 1, _id: 1 })
        .limit(query.limit + 1)
        .session(session)
        .lean();
      const selected = records.slice(0, query.limit);
      const snapshots = await attemptSnapshotsByIds(
        connection,
        session,
        userId,
        selected.map((record) => record.lastAttemptId),
      );
      const availability = await studyAvailability(
        connection,
        session,
        selected.map((record) => String(record.contentId)),
      );
      const data = selected.map((record) => {
        const attempt = snapshots.get(String(record.lastAttemptId));
        if (
          !attempt ||
          String(attempt.contentId) !== String(record.contentId) ||
          attempt.attemptSequence !== record.lastAttemptSequence
        )
          throw new HttpError(
            500,
            "INTERNAL_ERROR",
            "A revision history reference needs repair.",
          );
        return {
          id: String(record._id),
          contentId: String(record.contentId),
          lastAttemptId: String(record.lastAttemptId),
          lastAttemptSequence: record.lastAttemptSequence,
          dueDate: record.dueDate,
          intervalDays: record.intervalDays,
          reason: record.reason,
          timezone: record.timezone,
          availability: availability.get(String(record.contentId))
            ? ("available" as const)
            : ("unavailable" as const),
          title: attempt.contentSnapshot.title,
          outsidePlan: window ? record.dueDate > window.windowEnd : null,
        };
      });
      const hasMore = records.length > query.limit;
      return {
        data,
        meta: {
          page: {
            limit: query.limit,
            hasMore,
            nextCursor: hasMore
              ? issueStudyCursor(
                  { date: data.at(-1)!.dueDate, id: data.at(-1)!.id },
                  binding,
                  serverConfig.BETTER_AUTH_SECRET!,
                )
              : null,
          },
        },
      };
    }, studyTransaction);
  } catch (error) {
    throw studyError(error);
  }
}
