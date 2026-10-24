import "server-only";
import type { Connection, ClientSession } from "mongoose";
import { revisionModel } from "./model";
export async function planningCycles(
  connection: Connection,
  session: ClientSession,
  userId: string,
) {
  const records = await revisionModel(connection)
    .find({ userId })
    .sort({ dueDate: 1, _id: 1 })
    .session(session)
    .lean();
  return records.map((record) => ({
    id: String(record._id),
    contentId: String(record.contentId),
    lastAttemptId: String(record.lastAttemptId),
    lastAttemptSequence: record.lastAttemptSequence,
    dueDate: record.dueDate,
    intervalDays: record.intervalDays,
    reason: record.reason,
    timezone: record.timezone,
  }));
}
