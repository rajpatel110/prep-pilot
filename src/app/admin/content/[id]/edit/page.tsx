import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { pageActor } from "@/modules/identity/page-access";
import { requireAdmin } from "@/modules/identity/service";
import { getAdminContent } from "@/modules/catalog/reads";
import { HttpError } from "@/shared/server/http";
import { Workspace } from "@/shared/ui/workspace";
import { ContentEditor } from "@/modules/catalog/ui/content-editor";
import { serverConfig } from "@/shared/server/config";
import "../../library.css";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export default async function EditContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await pageActor("/admin");
  const requestHeaders = await headers();
  const actor = await requireAdmin(requestHeaders);
  const { id } = await params;
  let item;
  try {
    item = await getAdminContent(requestHeaders, id);
  } catch (error) {
    if (error instanceof HttpError && [404, 422].includes(error.status))
      notFound();
    throw error;
  }
  return (
    <Workspace name={actor.session.user.name} title="Edit content" wide>
      <ContentEditor
        key={id}
        initial={item}
        filesEnabled={serverConfig.FILES_ENABLED}
      />
    </Workspace>
  );
}
