import { Suspense } from "react";
import { headers } from "next/headers";
import Link from "next/link";
import { studentPageActor } from "@/modules/identity/page-access";
import { progress } from "@/modules/planning/service";
import { listAttempts } from "@/modules/practice/reads";
import { StudyList } from "@/modules/practice/ui/study-list";
import { StudentShell } from "@/shared/ui/student-shell";
import { ProgressView } from "@/modules/planning/ui/progress-view";
import { ProgressSkeleton } from "@/modules/planning/ui/progress-skeleton";
import { RefreshStudy } from "@/shared/ui/refresh-study";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function Summary({ requestHeaders }: { requestHeaders: Headers }) {
  let data = null;
  try {
    data = await progress(requestHeaders);
  } catch {}
  if (!data)
    return (
      <section className="student-card" role="alert">
        <h2>Summary unavailable</h2>
        <p>We could not load your totals. Missing data is not zero activity.</p>
        <RefreshStudy label="Retry summary" />
      </section>
    );
  return <ProgressView data={data} />;
}
async function RecentHistory({ requestHeaders }: { requestHeaders: Headers }) {
  let history = null;
  let error = null;
  try {
    history = await listAttempts(
      requestHeaders,
      new URLSearchParams({ limit: "5" }),
    );
  } catch {
    error =
      "Recent history is temporarily unavailable. Your recorded attempts have not been changed.";
  }
  return (
    <StudyList
      key={JSON.stringify(history ?? error)}
      endpoint="attempts"
      query="limit=5"
      initial={history}
      initialError={error}
    />
  );
}
export default async function ProgressPage() {
  const actor = await studentPageActor("/progress");
  const requestHeaders = await headers();
  return (
    <StudentShell name={actor.session.user.name}>
      <p className="eyebrow">Your recorded preparation · Times shown in IST</p>
      <h1>Your progress</h1>
      <p className="student-lead">
        Practice and recall outcomes are self-reported, not graded correctness
        or measured mastery.
      </p>
      <RefreshStudy />
      <Suspense fallback={<ProgressSkeleton />}>
        <Summary requestHeaders={requestHeaders} />
      </Suspense>
      <section aria-label="Recent practice history">
        <h2>Recent recorded attempts</h2>
        <p>Recent history is loaded separately from your summary.</p>
        <Suspense
          fallback={<p role="status">Loading recent practice history…</p>}
        >
          <RecentHistory requestHeaders={requestHeaders} />
        </Suspense>
        <Link href="/attempts">View and filter full history</Link>
      </section>
    </StudentShell>
  );
}
