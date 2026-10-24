import "server-only";
import type { Connection, ClientSession } from "mongoose";
import { revisionModel } from "./model";
export async function currentRevisionSequence(
  connection: Connection,
  session: ClientSession,
  userId: string,
  contentId: string,
) {
  return (
    (
      await revisionModel(connection)
        .findOne({ userId, contentId })
        .select("lastAttemptSequence")
        .session(session)
        .lean()
    )?.lastAttemptSequence ?? null
  );
}
