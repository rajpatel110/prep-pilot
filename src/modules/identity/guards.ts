import "server-only";
import { destination, type AccessProfile } from "./policy";
import { HttpError } from "@/shared/server/http";

export function createAccessGuards<
  Session extends { user: { id: string; emailVerified: boolean } },
  Profile extends Omit<AccessProfile, "preferences"> & {
    preferences?: unknown;
  },
>(dependencies: {
  getSession: (headers: Headers) => Promise<Session | null>;
  getProfile: (userId: string) => Promise<Profile | null>;
  emailMode: "test" | "live";
}) {
  async function requireActor(headers: Headers) {
    const session = await dependencies.getSession(headers);
    if (!session)
      throw new HttpError(401, "UNAUTHENTICATED", "Please sign in.");
    const profile = await dependencies.getProfile(session.user.id);
    if (!profile || profile.lifecycle !== "active")
      throw new HttpError(
        403,
        "ACCOUNT_UNAVAILABLE",
        "This account is unavailable.",
      );
    return {
      session,
      profile,
      destination: destination(
        { ...profile, preferences: profile.preferences ?? null },
        session.user.emailVerified,
        dependencies.emailMode,
      ),
    };
  }
  async function requireStudyActor(headers: Headers) {
    const actor = await requireActor(headers);
    if (dependencies.emailMode === "live" && !actor.session.user.emailVerified)
      throw new HttpError(
        403,
        "EMAIL_NOT_VERIFIED",
        "Verify your email before continuing.",
      );
    return actor;
  }
  async function requireAdmin(headers: Headers) {
    const actor = await requireStudyActor(headers);
    if (actor.profile.role !== "admin" && actor.profile.role !== "owner")
      throw new HttpError(403, "FORBIDDEN", "Administrator access required.");
    return actor;
  }
  async function requireOwner(headers: Headers) {
    const actor = await requireStudyActor(headers);
    if (actor.profile.role !== "owner")
      throw new HttpError(403, "FORBIDDEN", "Owner access required.");
    return actor;
  }
  return { requireActor, requireStudyActor, requireAdmin, requireOwner };
}
