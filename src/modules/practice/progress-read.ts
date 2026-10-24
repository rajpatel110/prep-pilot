import "server-only";
import type { ClientSession, Connection } from "mongoose";
import { attemptModel } from "./model";

export type OutcomeCounts = {
  subject: string;
  topic: string;
  distinctAttempted: number;
  currentlySolved: number;
  neededHelp: number;
  failed: number;
};
export async function practiceProgress(
  connection: Connection,
  session: ClientSession,
  userId: string,
) {
  const [result] = await attemptModel(connection)
    .aggregate<{
      totals: { submissions: number; practice: number; revision: number }[];
      topics: OutcomeCounts[];
    }>([
      { $match: { userId } },
      { $sort: { attemptSequence: -1 } },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                submissions: { $sum: 1 },
                practice: {
                  $sum: { $cond: [{ $eq: ["$kind", "practice"] }, 1, 0] },
                },
                revision: {
                  $sum: { $cond: [{ $eq: ["$kind", "revision"] }, 1, 0] },
                },
              },
            },
            { $project: { _id: 0 } },
          ],
          topics: [
            {
              $group: {
                _id: "$contentId",
                subject: { $first: "$subject" },
                topic: { $first: "$topic" },
                outcome: { $first: "$outcome" },
              },
            },
            {
              $group: {
                _id: { subject: "$subject", topic: "$topic" },
                distinctAttempted: { $sum: 1 },
                currentlySolved: {
                  $sum: { $cond: [{ $eq: ["$outcome", "independent"] }, 1, 0] },
                },
                neededHelp: {
                  $sum: { $cond: [{ $eq: ["$outcome", "needed_help"] }, 1, 0] },
                },
                failed: {
                  $sum: { $cond: [{ $eq: ["$outcome", "failed"] }, 1, 0] },
                },
              },
            },
            {
              $project: {
                _id: 0,
                subject: "$_id.subject",
                topic: "$_id.topic",
                distinctAttempted: 1,
                currentlySolved: 1,
                neededHelp: 1,
                failed: 1,
              },
            },
            { $sort: { subject: 1, topic: 1 } },
          ],
        },
      },
    ])
    .session(session)
    .option({ maxTimeMS: 5000, allowDiskUse: false });
  return {
    ...(result?.totals[0] ?? { submissions: 0, practice: 0, revision: 0 }),
    topics: result?.topics ?? [],
  };
}
