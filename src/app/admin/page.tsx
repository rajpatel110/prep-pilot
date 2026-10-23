import { headers } from "next/headers";
import { requireAdmin } from "@/modules/identity/service";
import { pageActor } from "@/modules/identity/page-access";
import { Workspace } from "@/shared/ui/workspace";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export default async function AdminPage() {
  await pageActor("/admin");
  const actor = await requireAdmin(await headers());
  return (
    <Workspace name={actor.session.user.name} title="Administration">
      <p>
        Administrator access confirmed. Content management and file operations
        will arrive in a later milestone.
      </p>
    </Workspace>
  );
}
