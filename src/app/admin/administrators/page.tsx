import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { requireOwner } from "@/modules/identity/service";
import { pageActor } from "@/modules/identity/page-access";
import { Workspace } from "@/shared/ui/workspace";
import { ManageAdmins } from "@/modules/administration/ui/manage-admins";
import { HttpError } from "@/shared/server/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export default async function AdministratorsPage() {
  const actor = await pageActor();
  if (actor.destination === "/verify-email") redirect("/verify-email");
  try {
    await requireOwner(await headers());
  } catch (error) {
    if (!(error instanceof HttpError)) throw error;
    return (
      <Workspace name={actor.session.user.name} title="Owner access required">
        <p>
          You don’t have access to administrator management. Only the owner can
          change admin access.
        </p>
        <Link className="button" href="/account">
          Return to your account
        </Link>
      </Workspace>
    );
  }
  return (
    <Workspace name={actor.session.user.name} title="Manage admins" wide>
      <nav aria-label="Admin workspace" className="owner-workspace-nav">
        <Link href="/admin">Administration</Link>
        <Link href="/admin/content">Content library</Link>
        <Link href="/admin/files">Files</Link>
        <span aria-current="page">Manage admins · Owner</span>
      </nav>
      <ManageAdmins />
    </Workspace>
  );
}
