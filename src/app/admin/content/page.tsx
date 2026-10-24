import { headers } from "next/headers";
import Link from "next/link";
import { pageActor } from "@/modules/identity/page-access";
import { requireAdmin } from "@/modules/identity/service";
import {
  listAdminContent,
  type AdminContentPage,
} from "@/modules/catalog/reads";
import { HttpError } from "@/shared/server/http";
import { Workspace } from "@/shared/ui/workspace";
import { ContentLibrary } from "@/modules/catalog/ui/content-library";
import "./library.css";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ContentLibraryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await pageActor("/admin");
  const requestHeaders = await headers();
  const actor = await requireAdmin(requestHeaders);
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    for (const item of Array.isArray(value)
      ? value
      : value === undefined
        ? []
        : [value])
      params.append(key, item);
  }
  let initial: AdminContentPage | null = null;
  let error: string | null = null;
  try {
    initial = await listAdminContent(requestHeaders, params);
  } catch (cause) {
    error =
      cause instanceof HttpError
        ? `${cause.message} ${Object.values(cause.fields ?? {})
            .flat()
            .join(" ")} (${cause.code})`
        : "Content could not be loaded. Please try again.";
  }
  return (
    <Workspace name={actor.session.user.name} title="Content library" wide>
      <nav aria-label="Admin workspace" className="library-nav">
        <Link href="/admin">Administration</Link>
        <span aria-current="page">Content library</span>
        <Link className="button" href="/admin/content/new">
          Create draft
        </Link>
      </nav>
      <p className="library-intro">
        Inspect the material students prepare with. Company labels retain their
        saved provenance.
      </p>
      <p className="library-notice">
        Create drafts, inspect and preview saved content, then publish reviewed
        material. Archive and reopen preserve history. Uploads remain
        unavailable.
      </p>
      <ContentLibrary
        key={params.toString()}
        initial={initial}
        initialError={error}
      />
    </Workspace>
  );
}
