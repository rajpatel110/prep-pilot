import "server-only";
import type { Connection, ClientSession, Types } from "mongoose";
import { HttpError } from "@/shared/server/http";
import { profileModel } from "./model";

export async function activatePlanPointer(
  connection: Connection,
  session: ClientSession,
  input: {
    userId: string;
    expectedStateRevision: number;
    expectedPlanVersion: number;
    previousPlanId: Types.ObjectId | null;
    nextPlanId: Types.ObjectId;
  },
) {
  if (!session.inTransaction())
    throw new Error("Plan activation requires the study transaction.");
  const result = await profileModel(connection).updateOne(
    {
      userId: input.userId,
      lifecycle: "active",
      role: "student",
      stateRevision: input.expectedStateRevision,
      planVersion: input.expectedPlanVersion,
      activePlanId: input.previousPlanId,
    },
    { $set: { activePlanId: input.nextPlanId }, $inc: { planVersion: 1 } },
    { session, runValidators: true },
  );
  if (result.matchedCount !== 1)
    throw new HttpError(409, "STALE_PREVIEW", "The active plan changed.");
}
