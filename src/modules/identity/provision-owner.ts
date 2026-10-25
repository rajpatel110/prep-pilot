import "server-only";
import type { Connection } from "mongoose";
import { profileModel } from "./model";
import { administrationIdentity } from "./admin-identities";
import {
  accountEmail,
  identityId,
  revision,
} from "@/modules/administration/schemas";
import { appendAudit } from "@/modules/administration/audit";
import { HttpError } from "@/shared/server/http";

export async function previewOwner(
  connection: Connection,
  userId: string,
  email: string,
) {
  identityId.parse(userId);
  const expectedEmail = accountEmail.parse(email);
  const user = await administrationIdentity(connection, { userId });
  const profile = await profileModel(connection).findOne({ userId }).lean();
  if (!user || user.email !== expectedEmail || !profile)
    throw new Error(
      "Exact existing email and immutable identity must match a profile.",
    );
  const existingOwner = await profileModel(connection)
    .findOne({ role: "owner" })
    .select({ userId: 1 })
    .lean();
  return {
    ...user,
    role: profile.role,
    lifecycle: profile.lifecycle,
    stateRevision: profile.stateRevision,
    ownerExists: !!existingOwner,
    selectedIsOwner: existingOwner?.userId === userId,
  };
}
export async function provisionOwner(
  connection: Connection,
  userId: string,
  email: string,
  expectedRevision: number,
  requestId: string,
  audit: typeof appendAudit = appendAudit,
) {
  revision.parse(expectedRevision);
  const indexes = await connection
    .db!.collection("profiles")
    .listIndexes()
    .toArray();
  const applied = await connection
    .db!.collection<{ _id: string; state: string }>("schemaMigrations")
    .findOne({ _id: "006_owner_administration", state: "applied" });
  if (
    !applied ||
    !indexes.some(
      (index) =>
        index.name === "profiles_one_owner" &&
        index.unique &&
        index.partialFilterExpression?.role === "owner" &&
        JSON.stringify(index.key) === JSON.stringify({ role: 1 }),
    )
  )
    throw new Error(
      "Apply additive migration 006 explicitly before owner provisioning.",
    );
  try {
    return await connection.transaction(
      async (session) => {
        const user = await administrationIdentity(
          connection,
          { userId: identityId.parse(userId) },
          session,
        );
        if (
          !user ||
          user.email !== accountEmail.parse(email) ||
          !user.emailVerified
        )
          throw new Error(
            "An exact verified identity is required in every email mode.",
          );
        const model = profileModel(connection);
        const profile = await model
          .findOne({ userId, lifecycle: "active" })
          .session(session)
          .lean();
        const owner = await model
          .findOne({ role: "owner" })
          .session(session)
          .lean();
        if (owner) {
          if (owner.userId === userId) return "unchanged";
          throw new HttpError(
            409,
            "OWNER_EXISTS",
            "An owner already exists. Ownership transfer requires a separate operator procedure.",
          );
        }
        if (
          !profile ||
          profile.stateRevision !== expectedRevision ||
          !["student", "admin"].includes(profile.role)
        )
          throw new HttpError(
            409,
            "STATE_CONFLICT",
            "Preview the active account again before provisioning.",
          );
        const result = await model.updateOne(
          {
            _id: profile._id,
            role: profile.role,
            lifecycle: "active",
            stateRevision: expectedRevision,
          },
          { $set: { role: "owner" }, $inc: { stateRevision: 1 } },
          { session, runValidators: true },
        );
        if (result.modifiedCount !== 1)
          throw new HttpError(
            409,
            "STATE_CONFLICT",
            "Preview the account again.",
          );
        await audit(connection, session, {
          actorUserId: "operator",
          action: "provision_owner",
          entityType: "profile",
          entityId: userId,
          priorRevision: expectedRevision,
          newRevision: expectedRevision + 1,
          changedFields: ["role"],
          previousRole: profile.role,
          newRole: "owner",
          reason: "Explicit operator owner provisioning",
          requestId,
        });
        return "promoted";
      },
      {
        readConcern: { level: "snapshot" },
        writeConcern: { w: "majority" },
        readPreference: "primary",
        maxCommitTimeMS: 10000,
      },
    );
  } catch (error) {
    if ((error as { code?: number }).code === 11000)
      throw new HttpError(
        409,
        "OWNER_EXISTS",
        "Concurrent owner provisioning was rejected. Preview current ownership.",
      );
    throw error;
  }
}
