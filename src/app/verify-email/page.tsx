import { headers } from "next/headers";
import { requireActor } from "@/modules/identity/service";
import { EmailPanel } from "@/modules/identity/ui/email-panel";
import {
  emailAllowed,
  emailAvailability,
} from "@/modules/notifications/policy";
import { AuthFrame } from "@/shared/ui/auth-frame";
import { serverConfig } from "@/shared/server/config";
import { HttpError } from "@/shared/server/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export default async function VerificationPage() {
  let user;
  if (serverConfig.AUTH_ENABLED) {
    try {
      const actor = await requireActor(await headers());
      user = {
        email: actor.session.user.email,
        verified: actor.session.user.emailVerified,
        canRequest: emailAllowed(serverConfig, actor.session.user.email),
      };
    } catch (error) {
      if (!(error instanceof HttpError && [401, 403].includes(error.status)))
        throw error;
    }
  }
  return (
    <AuthFrame>
      <EmailPanel
        mode="verification"
        availability={emailAvailability(serverConfig)}
        user={user}
      />
    </AuthFrame>
  );
}
