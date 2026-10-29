import "server-only";
import type { ClientSession, Connection } from "mongoose";
import { profileModel } from "./model";
import type { requireAdmin } from "./service";
import { HttpError } from "@/shared/server/http";

export async function lockAdminProfile(
  connection: Connection,
  session: ClientSession,
  actor: Awaited<ReturnType<typeof requireAdmin>>,
) {
  return lockAdminUser(connection, session, actor.session.user.id);
}

export async function lockAdminUser(
  connection: Connection,
  session: ClientSession,
  userId: string,
) {
  if (!session.inTransaction())
    throw new Error("An admin mutation requires a domain transaction.");
  const model = profileModel(connection);
  const profile = await model.findOne({ userId }).session(session).lean();
  if (!profile || profile.lifecycle !== "active")
    throw new HttpError(
      403,
      "ACCOUNT_UNAVAILABLE",
      "This account is unavailable.",
    );
  if (profile.role !== "admin" && profile.role !== "owner")
    throw new HttpError(403, "FORBIDDEN", "Administrator access required.");
  if (
    !Number.isSafeInteger(profile.stateRevision) ||
    profile.stateRevision < 0 ||
    profile.stateRevision >= Number.MAX_SAFE_INTEGER
  )
    throw new HttpError(
      409,
      "STATE_CONFLICT",
      "The account revision cannot advance.",
    );
  const result = await model.updateOne(
    {
      _id: profile._id,
      lifecycle: "active",
      role: profile.role,
      stateRevision: profile.stateRevision,
    },
    { $inc: { stateRevision: 1 } },
    { session, runValidators: true },
  );
  if (result.matchedCount !== 1)
    throw new HttpError(403, "FORBIDDEN", "Administrator access changed.");
}
