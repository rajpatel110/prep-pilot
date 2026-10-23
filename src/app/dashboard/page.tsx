import { pageActor } from "@/modules/identity/page-access";
import { Workspace } from "@/shared/ui/workspace";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export default async function DashboardPage() {
  const actor = await pageActor("/dashboard");
  return (
    <Workspace
      name={actor.session.user.name}
      title="Your preparation workspace"
    >
      <p>
        Your protected student workspace is ready. The study dashboard will be
        added after preferences, content and planning are implemented.
      </p>
    </Workspace>
  );
}
