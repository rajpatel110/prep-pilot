import "server-only";
import { getDomainConnection } from "@/shared/server/db";
import { serverConfig } from "@/shared/server/config";
import { HttpError } from "@/shared/server/http";
import { requirePracticeActor } from "./access";
import { attemptModel } from "./model";
import { requirePracticeSetup } from "./setup";
import { parseStudyInput } from "./schemas";
import { attemptQuery, queryValues } from "./query";
import { inspectStudyCursor, issueStudyCursor } from "./cursor";
import { studyError } from "./errors";
export async function listAttempts(headers: Headers, params: URLSearchParams) {
  try {
    const actor = await requirePracticeActor(headers);
    const query = parseStudyInput(attemptQuery, queryValues(params));
    const { cursor, ...filters } = query;
    const binding = JSON.stringify({
      endpoint: "attempts",
      userId: actor.session.user.id,
      ...filters,
    });
    const after = cursor
      ? inspectStudyCursor(cursor, binding, serverConfig.BETTER_AUTH_SECRET!)
      : null;
    if (cursor && (!after || !("sequence" in after)))
      throw new HttpError(
        400,
        "INVALID_CURSOR",
        "Restart attempt history from the first page.",
      );
    const connection = await getDomainConnection();
    await requirePracticeSetup(connection);
    const filter: Record<string, unknown> = { userId: actor.session.user.id };
    for (const field of ["contentId", "subject", "topic", "kind"] as const)
      if (query[field]) filter[field] = query[field];
    if (after && "sequence" in after)
      filter.attemptSequence = { $lt: after.sequence };
    const records = await attemptModel(connection)
      .find(filter)
      .sort({ attemptSequence: -1 })
      .limit(query.limit + 1)
      .maxTimeMS(5000)
      .lean();
    const hasMore = records.length > query.limit;
    const data = records.slice(0, query.limit).map((record) => ({
      id: String(record._id),
      submissionId: record.submissionId,
      contentId: String(record.contentId),
      contentSnapshot: {
        title: record.contentSnapshot.title,
        subject: record.contentSnapshot.subject,
        topic: record.contentSnapshot.topic,
        type: record.contentSnapshot.type,
        contentRevision: record.contentSnapshot.contentRevision,
      },
      subject: record.subject,
      topic: record.topic,
      kind: record.kind,
      outcome: record.outcome,
      perceivedDifficulty: record.perceivedDifficulty ?? null,
      attemptSequence: record.attemptSequence,
      createdAt: record.createdAt.toISOString(),
    }));
    return {
      data,
      meta: {
        page: {
          limit: query.limit,
          hasMore,
          nextCursor: hasMore
            ? issueStudyCursor(
                { sequence: data.at(-1)!.attemptSequence },
                binding,
                serverConfig.BETTER_AUTH_SECRET!,
              )
            : null,
        },
      },
    };
  } catch (error) {
    throw studyError(error);
  }
}
