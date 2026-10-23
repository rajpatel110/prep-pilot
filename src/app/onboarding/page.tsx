import { pageActor } from "@/modules/identity/page-access";
import { Workspace } from "@/shared/ui/workspace";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export default async function OnboardingPage() {
  const actor = await pageActor("/onboarding");
  return (
    <Workspace
      name={actor.session.user.name}
      title="Your next step: set your goals."
    >
      <p>
        Your student account and session are working. Preparation preferences
        have not been set.
      </p>
      <p>
        The complete goals form and study planner are coming in a later
        milestone. No preferences or study progress have been fabricated.
      </p>
      <p className="small-note">
        Demo mode: your email is unverified. Verification and recovery email are
        unavailable.
      </p>
    </Workspace>
  );
}
