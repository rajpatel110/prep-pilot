import { headers } from "next/headers";
import Link from "next/link";
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
        Administrator access confirmed. Inspect saved drafts, published material
        and archived content in the library. Create, edit, preview and publish
        reviewed material. File transfers remain disabled unless explicitly
        configured.
      </p>
      <Link className="button button-primary" href="/admin/content">
        Open content library
      </Link>
      <Link className="button" href="/admin/files">
        Manage attachments
      </Link>
      {actor.profile.role === "owner" && (
        <Link className="button" href="/admin/administrators">
          Manage admins
        </Link>
      )}
    </Workspace>
  );
}
