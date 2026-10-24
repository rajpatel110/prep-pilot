import "server-only";
import { Types, type Connection, type ClientSession } from "mongoose";
import { attemptModel } from "./model";
import { getDomainConnection } from "@/shared/server/db";

export async function planningAttempts(
  connection: Connection,
  session: ClientSession,
  userId: string,
) {
  return await attemptModel(connection)
    .find({ userId })
    .select(
      "contentId contentSnapshot outcome subject topic kind attemptSequence",
    )
    .sort({ attemptSequence: -1 })
    .session(session)
    .lean();
}

export async function findAttemptContentSnapshot(
  userId: string,
  contentId: string,
): Promise<unknown> {
  const connection = await getDomainConnection();
  const attempt = await connection.db!.collection("attempts").findOne(
    { userId, contentId: new Types.ObjectId(contentId) },
    {
      projection: { contentSnapshot: 1 },
      sort: { attemptSequence: -1, _id: -1 },
      maxTimeMS: 5000,
    },
  );
  return attempt?.contentSnapshot ?? null;
}

export async function attemptSnapshotsByIds(
  connection: Connection,
  session: ClientSession,
  userId: string,
  ids: Types.ObjectId[],
) {
  const records = await attemptModel(connection)
    .find({ _id: { $in: ids }, userId })
    .select("contentSnapshot contentId attemptSequence")
    .session(session)
    .lean();
  return new Map(records.map((record) => [String(record._id), record]));
}
