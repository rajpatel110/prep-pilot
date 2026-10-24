import "server-only";
import type { ClientSession, Connection } from "mongoose";
import { revisionModel } from "./model";
import { publishedAvailabilityLookup } from "@/modules/catalog/study-access";

export async function revisionProgress(
  connection: Connection,
  session: ClientSession,
  userId: string,
  date: string,
) {
  const [result] = await revisionModel(connection)
    .aggregate<{ due: number; unavailable: number }>([
      { $match: { userId, dueDate: { $lte: date } } },
      publishedAvailabilityLookup("contentId"),
      {
        $group: {
          _id: null,
          due: { $sum: 1 },
          unavailable: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    { $arrayElemAt: ["$availability.status", 0] },
                    "published",
                  ],
                },
                0,
                1,
              ],
            },
          },
        },
      },
      { $project: { _id: 0, due: 1, unavailable: 1 } },
    ])
    .session(session)
    .option({ maxTimeMS: 5000 });
  return result ?? { due: 0, unavailable: 0 };
}
