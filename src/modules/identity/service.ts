import "server-only";
import { getAuth } from "./auth";
import { ensureProfile } from "./profile";
import { createAccessGuards } from "./guards";
import { serverConfig } from "@/shared/server/config";
import { preferencesSchema } from "./preferences-schema";

export const { requireActor, requireStudyActor, requireAdmin } =
  createAccessGuards({
    async getSession(headers: Headers) {
      const auth = await getAuth();
      return auth.api.getSession({
        headers,
        query: { disableCookieCache: true },
      });
    },
    getProfile: ensureProfile,
    emailMode: serverConfig.EMAIL_MODE,
  });
export function actorDto(actor: Awaited<ReturnType<typeof requireActor>>) {
  const { profile, session } = actor;
  return {
    userId: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: profile.role,
    emailVerified: session.user.emailVerified,
    preferences:
      profile.preferences == null
        ? null
        : preferencesSchema.parse(profile.preferences),
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
export type MeDto = ReturnType<typeof actorDto>;
