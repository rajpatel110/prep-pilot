import { headers } from "next/headers";
import { studentPageActor } from "@/modules/identity/page-access";
import { listAttempts } from "@/modules/practice/reads";
import { catalogParams } from "@/modules/catalog/student-navigation";
import { StudyList } from "@/modules/practice/ui/study-list";
import { StudentShell } from "@/shared/ui/student-shell";
import { HttpError } from "@/shared/server/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export default async function AttemptsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = catalogParams(await searchParams);
  const query = params.toString();
  const actor = await studentPageActor(`/attempts${query ? `?${query}` : ""}`);
  let initial = null,
    error = null;
  try {
    initial = await listAttempts(await headers(), params);
  } catch (cause) {
    error =
      cause instanceof HttpError
        ? cause.message
        : "Practice history is temporarily unavailable.";
  }
  return (
    <StudentShell name={actor.session.user.name}>
      <p className="eyebrow">Immutable practice history</p>
      <h1>Your recorded attempts</h1>
      <p className="student-lead">
        Every deliberate submission is retained. A safe retry returns the
        original receipt, not a duplicate attempt. Reading alone never appears
        here.
      </p>
      <StudyList
        key={`${query}:${JSON.stringify(initial ?? error)}`}
        endpoint="attempts"
        query={query}
        initial={initial}
        initialError={error}
      />
    </StudentShell>
  );
}
