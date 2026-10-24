import { headers } from "next/headers";
import Link from "next/link";
import { studentPageActor } from "@/modules/identity/page-access";
import { progress } from "@/modules/planning/service";
import { listAttempts } from "@/modules/practice/reads";
import { StudyList } from "@/modules/practice/ui/study-list";
import { StudentShell } from "@/shared/ui/student-shell";
import { ProgressView } from "@/modules/planning/ui/progress-view";
import { RefreshStudy } from "@/shared/ui/refresh-study";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export default async function ProgressPage() {
  const actor = await studentPageActor("/progress");
  let summary = null,
    history = null,
    summaryError = false,
    historyError = null;
  try {
    summary = await progress(await headers());
  } catch {
    summaryError = true;
  }
  try {
    history = await listAttempts(
      await headers(),
      new URLSearchParams({ limit: "5" }),
    );
  } catch {
    historyError =
      "Recent history is temporarily unavailable. Your recorded attempts have not been changed.";
  }
  return (
    <StudentShell name={actor.session.user.name}>
      <p className="eyebrow">Your recorded preparation</p>
      <h1>Your progress</h1>
      <p className="student-lead">
        Practice and recall outcomes are self-reported, not graded correctness
        or measured mastery.
      </p>
      <RefreshStudy />
      {summaryError || !summary ? (
        <section className="student-card" role="alert">
          <h2>Summary unavailable</h2>
          <p>
            We could not load your totals. Missing data is not zero activity.
          </p>
          <RefreshStudy label="Retry summary" />
        </section>
      ) : (
        <ProgressView data={summary} />
      )}
      <section aria-label="Recent practice history">
        <h2>Recent recorded attempts</h2>
        <p>
          This separately loaded history may have a later read time than the
          summary. Older and unavailable content retains its saved title and
          classification.
        </p>
        <StudyList
          key={JSON.stringify(history ?? historyError)}
          endpoint="attempts"
          query="limit=5"
          initial={history}
          initialError={historyError}
        />
        <Link href="/attempts">View and filter full history</Link>
      </section>
    </StudentShell>
  );
}
