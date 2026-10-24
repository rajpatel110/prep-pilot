import "server-only";
import { Types } from "mongoose";
import { getDomainConnection } from "@/shared/server/db";

export async function findPlanContentSnapshot(
  userId: string,
  contentId: string,
): Promise<unknown> {
  const connection = await getDomainConnection();
  const plan = await connection.db!.collection("plans").findOne(
    { userId, "tasks.contentId": new Types.ObjectId(contentId) },
    {
      projection: {
        tasks: { $elemMatch: { contentId: new Types.ObjectId(contentId) } },
      },
      sort: { version: -1, _id: -1 },
      maxTimeMS: 5000,
    },
  );
  return plan?.tasks?.[0]?.contentSnapshot ?? null;
}
