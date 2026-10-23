import "server-only";
import type { Connection } from "mongoose";
import { ObjectId } from "mongodb";
import { profileModel } from "./model";
import { appendAudit } from "@/modules/administration/audit";

export async function provisionAdministrator(
  connection: Connection,
  userId: string,
  emailMode: "test" | "live",
  requestId: string,
) {
  if (!userId || userId.length > 200)
    throw new Error("An exact existing identity is required.");
  const model = profileModel(connection);
  return connection.transaction(
    async (session) => {
      const user = await connection.db!.collection("user").findOne(
        {
          $or: [
            { id: userId },
            ...(/^[a-f0-9]{24}$/.test(userId)
              ? [{ _id: new ObjectId(userId) }]
              : []),
          ],
        },
        { session },
      );
      if (!user || (emailMode === "live" && user.emailVerified !== true))
        throw new Error("No eligible existing identity.");
      const profile = await model
        .findOne({ userId, lifecycle: "active" })
        .session(session)
        .lean();
      if (
        !profile ||
        !Number.isSafeInteger(profile.stateRevision) ||
        profile.stateRevision! < 0 ||
        profile.stateRevision! >= Number.MAX_SAFE_INTEGER
      )
        throw new Error("An eligible active profile is required.");
      if (profile.role === "admin") return "unchanged";
      if (profile.role !== "student") throw new Error("Invalid profile role.");
      const updated = await model
        .findOneAndUpdate(
          {
            _id: profile._id,
            lifecycle: "active",
            role: "student",
            stateRevision: profile.stateRevision,
          },
          { $set: { role: "admin" }, $inc: { stateRevision: 1 } },
          { session, runValidators: true, returnDocument: "after" },
        )
        .lean();
      if (!updated) throw new Error("Profile changed; retry provisioning.");
      await appendAudit(connection, session, {
        actorUserId: "operator",
        action: "provision_admin",
        entityType: "profile",
        entityId: userId,
        priorRevision: profile.stateRevision!,
        newRevision: updated.stateRevision!,
        changedFields: ["role"],
        requestId,
      });
      return "promoted";
    },
    {
      readConcern: { level: "snapshot" },
      writeConcern: { w: "majority" },
      readPreference: "primary",
    },
  );
}
