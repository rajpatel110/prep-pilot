import Link from "next/link";
import { headers } from "next/headers";
import { studentPageActor } from "@/modules/identity/page-access";
import { StudentShell } from "@/shared/ui/student-shell";
import { readPreview } from "@/modules/planning/service";
import { PreviewView } from "@/modules/planning/ui/workspace";
import { HttpError } from "@/shared/server/http";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const actor = await studentPageActor(`/plan-previews/${id}`);
  let preview: Awaited<ReturnType<typeof readPreview>> | undefined;
  let message = "";
  try {
    preview = await readPreview(await headers(), id);
  } catch (error) {
    message =
      error instanceof HttpError
        ? error.message
        : "The proposal could not be loaded. No plan was activated by opening this page.";
  }
  if (preview)
    return (
      <StudentShell name={actor.session.user.name}>
        <PreviewView preview={preview} />
      </StudentShell>
    );
  return (
    <StudentShell name={actor.session.user.name}>
      <section className="student-card">
        <h1>Preview unavailable</h1>
        <p role="alert">{message}</p>
        <Link className="button" href="/dashboard">
          Return to dashboard to generate a fresh preview
        </Link>
        <Link href={`/plan-previews/${id}`}>Retry loading</Link>
      </section>
    </StudentShell>
  );
}
