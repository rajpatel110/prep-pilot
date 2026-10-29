import "server-only";
import type { ClientSession, Connection } from "mongoose";
import { administrationIdentity } from "./admin-identities";
import { profileModel } from "./model";
import { HttpError } from "@/shared/server/http";

export async function requireImportOperator(
  connection: Connection,
  operator: { userId: string; email: string },
  session?: ClientSession,
) {
  const identity = await administrationIdentity(
    connection,
    { userId: operator.userId },
    session,
  );
  const query = profileModel(connection).findOne({ userId: operator.userId });
  if (session) query.session(session);
  const profile = await query.lean();
  if (
    !identity ||
    identity.email !== operator.email ||
    !identity.emailVerified ||
    !profile ||
    profile.lifecycle !== "active" ||
    (profile.role !== "admin" && profile.role !== "owner")
  )
    throw new HttpError(
      403,
      "FORBIDDEN",
      "An exact, verified, active administrator is required.",
    );
}
