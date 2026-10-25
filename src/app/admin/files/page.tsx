import { headers } from "next/headers";
import Link from "next/link";
import { requireAdmin } from "@/modules/identity/service";
import { pageActor } from "@/modules/identity/page-access";
import { serverConfig } from "@/shared/server/config";
import { Workspace } from "@/shared/ui/workspace";
import { FileManager } from "@/modules/files/ui/file-manager";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export default async function FilesPage() {
  await pageActor("/admin");
  const actor = await requireAdmin(await headers());
  return (
    <Workspace name={actor.session.user.name} title="File management" wide>
      <Link href="/admin/content">Content library</Link>
      <FileManager enabled={serverConfig.FILES_ENABLED} />
    </Workspace>
  );
}
