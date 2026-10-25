import "server-only";
import type { ClientSession, Connection } from "mongoose";
import { ObjectId } from "mongodb";
import { profileModel } from "./model";
import { lockAdminProfile } from "./mutation-guard";
import type { requireOwner } from "./service";
import { HttpError } from "@/shared/server/http";

export function administrationProfile(
  connection: Connection,
  userId: string,
  session?: ClientSession,
) {
  return profileModel(connection)
    .findOne({ userId })
    .select({ userId: 1, role: 1, lifecycle: 1, stateRevision: 1 })
    .session(session ?? null)
    .lean();
}
export function administrationProfiles(
  connection: Connection,
  after: string | null,
  limit: number,
) {
  return profileModel(connection)
    .find({
      role: { $in: ["admin", "owner"] },
      ...(after ? { _id: { $gt: new ObjectId(after) } } : {}),
    })
    .select({ userId: 1 })
    .sort({ _id: 1 })
    .limit(limit)
    .lean();
}
export async function guardOwnerAdministration(
  connection: Connection,
  session: ClientSession,
  actor: Awaited<ReturnType<typeof requireOwner>>,
) {
  const profile = await administrationProfile(
    connection,
    actor.session.user.id,
    session,
  );
  if (!profile || profile.role !== "owner" || profile.lifecycle !== "active")
    throw new HttpError(403, "FORBIDDEN", "Owner authorization changed.");
  await lockAdminProfile(connection, session, actor);
}
export async function updateAdministratorRole(
  connection: Connection,
  session: ClientSession,
  actorUserId: string,
  targetUserId: string,
  expectedRole: "student" | "admin",
  role: "student" | "admin",
  stateRevision: number,
) {
  if (!session.inTransaction())
    throw new Error("Role changes require the owner transaction.");
  const owner = await administrationProfile(connection, actorUserId, session);
  if (!owner || owner.role !== "owner" || owner.lifecycle !== "active")
    throw new HttpError(403, "FORBIDDEN", "Owner authorization changed.");
  if (targetUserId === actorUserId)
    throw new HttpError(
      403,
      "OWNER_PROTECTED",
      "Ownership cannot be changed here.",
    );
  return profileModel(connection).updateOne(
    {
      userId: targetUserId,
      role: expectedRole,
      lifecycle: "active",
      stateRevision,
    },
    { $set: { role }, $inc: { stateRevision: 1 } },
    { session, runValidators: true },
  );
}
