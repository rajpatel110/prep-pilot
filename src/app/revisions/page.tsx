import { headers } from "next/headers";
import { studentPageActor } from "@/modules/identity/page-access";
import { listRevisions } from "@/modules/revisions/reads";
import { catalogParams } from "@/modules/catalog/student-navigation";
import { StudyList } from "@/modules/practice/ui/study-list";
import { StudentShell } from "@/shared/ui/student-shell";
import { HttpError } from "@/shared/server/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export default async function RevisionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = catalogParams(await searchParams);
  const query = params.toString();
  const actor = await studentPageActor(`/revisions${query ? `?${query}` : ""}`);
  let initial = null,
    error = null;
  try {
    initial = await listRevisions(await headers(), params);
  } catch (cause) {
    error =
      cause instanceof HttpError
        ? cause.message
        : "Revisions are temporarily unavailable.";
  }
  return (
    <StudentShell name={actor.session.user.name}>
      <p className="eyebrow">Revision queue · Asia/Kolkata</p>
      <h1>
        {params.get("dueOnly") === "false"
          ? "Your revision cycles"
          : "Due revisions"}
      </h1>
      <p className="student-lead">
        Open a question and record a revision recall outcome. This reschedules
        its current cycle without erasing previous practice. No plan is needed,
        and no plan task is automatically completed.
      </p>
      <StudyList
        key={`${query}:${JSON.stringify(initial ?? error)}`}
        endpoint="revisions"
        query={query}
        initial={initial}
        initialError={error}
      />
    </StudentShell>
  );
}
