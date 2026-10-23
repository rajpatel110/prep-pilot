import "server-only";
import { getAuth } from "./auth";
import { ensureProfile } from "./profile";
import { destination, type AccessProfile } from "./policy";
import { serverConfig } from "@/shared/server/config";
import { HttpError } from "@/shared/server/http";

export async function requireActor(headers: Headers) {
  const auth = await getAuth();
  const session = await auth.api.getSession({
    headers,
    query: { disableCookieCache: true },
  });
  if (!session) throw new HttpError(401, "UNAUTHENTICATED", "Please sign in.");
  const profile = await ensureProfile(session.user.id);
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
      profile as unknown as AccessProfile,
      session.user.emailVerified,
      serverConfig.EMAIL_MODE,
    ),
  };
}
export async function requireStudyActor(headers: Headers) {
  const actor = await requireActor(headers);
  if (serverConfig.EMAIL_MODE === "live" && !actor.session.user.emailVerified)
    throw new HttpError(
      403,
      "EMAIL_NOT_VERIFIED",
      "Verify your email before continuing.",
    );
  return actor;
}
export async function requireAdmin(headers: Headers) {
  const actor = await requireStudyActor(headers);
  if (actor.profile.role !== "admin")
    throw new HttpError(403, "FORBIDDEN", "Administrator access required.");
  return actor;
}
export function actorDto(actor: Awaited<ReturnType<typeof requireActor>>) {
  const { profile, session } = actor;
  return {
    userId: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: profile.role,
    emailVerified: session.user.emailVerified,
    preferences: profile.preferences,
    timezone: profile.timezone,
    activePlanId: profile.activePlanId?.toString() ?? null,
    planVersion: profile.planVersion,
    stateRevision: profile.stateRevision,
    capabilities: {
      studyAccess:
        serverConfig.EMAIL_MODE === "test" || session.user.emailVerified,
      verificationEmail: false,
      passwordRecovery: false,
      fileDownloads: false,
      adminUploads: false,
      emailMode: serverConfig.EMAIL_MODE,
    },
    nextAction:
      actor.destination === "/verify-email"
        ? "verify_email"
        : actor.destination === "/onboarding"
          ? "complete_preferences"
          : "open_dashboard",
    destination: actor.destination,
  };
}
