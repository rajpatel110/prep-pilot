import "server-only";
import type { Connection, ClientSession } from "mongoose";
import { Types } from "mongoose";
import { HttpError } from "@/shared/server/http";
import { z } from "zod";
export async function activeStudyWindow(
  connection: Connection,
  session: ClientSession,
  userId: string,
  activePlanId: Types.ObjectId | null | undefined,
) {
  if (!activePlanId) return null;
  const plan = await connection
    .db!.collection("plans")
    .findOne(
      { _id: activePlanId, userId },
      { session, projection: { windowEnd: 1 } },
    );
  if (!plan || !z.iso.date().safeParse(plan.windowEnd).success)
    throw new HttpError(
      500,
      "INTERNAL_ERROR",
      "The active study plan reference needs repair.",
    );
  return { windowEnd: plan.windowEnd as string };
}
