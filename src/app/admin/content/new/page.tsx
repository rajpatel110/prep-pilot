import { headers } from "next/headers";
import { pageActor } from "@/modules/identity/page-access";
import { requireAdmin } from "@/modules/identity/service";
import { Workspace } from "@/shared/ui/workspace";
import { ContentEditor } from "@/modules/catalog/ui/content-editor";
import { serverConfig } from "@/shared/server/config";
import "../library.css";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export default async function NewContentPage() {
  await pageActor("/admin");
  const actor = await requireAdmin(await headers());
  return (
    <Workspace name={actor.session.user.name} title="Create content" wide>
      <ContentEditor initial={null} filesEnabled={serverConfig.FILES_ENABLED} />
    </Workspace>
  );
}
