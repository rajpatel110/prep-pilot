import { pageActor } from "@/modules/identity/page-access";
import { Workspace } from "@/shared/ui/workspace";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export default async function VerificationPage() {
  const actor = await pageActor("/verify-email");
  return (
    <Workspace name={actor.session.user.name} title="Verify your email">
      <p>
        Email verification is required before protected study access. Delivery
        is not configured yet. Your access requirement remains in place; please
        contact the application owner.
      </p>
    </Workspace>
  );
}
