"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/shared/ui/api-client";
import {
  studyDate,
  type Preferences,
} from "@/modules/identity/preferences-schema";
import type { dashboard, readPlan, readPreview } from "../service";
type Dashboard = Awaited<ReturnType<typeof dashboard>>;
type Plan = NonNullable<Awaited<ReturnType<typeof readPlan>>["plan"]>;
type Preview = Awaited<ReturnType<typeof readPreview>>;
type Task = Plan["tasks"][number];
function errorText(error: unknown) {
  return error instanceof Error
    ? error.message
    : "The operation could not be confirmed. Refresh before trying another action.";
}
export function GeneratePlan({
  revision,
  kind = "initial",
}: {
  revision: number;
  kind?: "initial" | "reschedule" | "adapt" | "preferences";
}) {
  const router = useRouter();
  const guard = useRef(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function generate() {
    if (guard.current) return;
    guard.current = true;
    setBusy(true);
    setError("");
    try {
      const current = await apiRequest("/api/v1/plans/current");
      const result = await apiRequest("/api/v1/plan-previews", "POST", {
        kind:
          kind === "preferences"
            ? current.data.plan && current.data.plan.windowEnd >= studyDate()
              ? "reschedule"
              : "initial"
            : kind,
        expectedStateRevision: current.data.stateRevision ?? revision,
      });
      router.push(`/plan-previews/${result.data.id}`);
    } catch (error) {
      setError(errorText(error));
    } finally {
      guard.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="student-card">
      <p>
        Review before activating. Generating a proposal does not change your
        plan or complete work.
      </p>
      {error && (
        <p role="alert">
          {error} Refresh current state if it changed. An unconfirmed proposal
          never activates itself.
        </p>
      )}
      <button className="button" disabled={busy} onClick={generate}>
        {busy
          ? "Generating proposal…"
          : kind === "preferences"
            ? "Preview a plan with saved preferences"
            : kind === "initial"
              ? "Preview my study plan"
              : kind === "adapt"
                ? "Review suggested changes"
                : "Preview a replacement schedule"}
      </button>
      {error && (
        <button
          className="button button-outline"
          onClick={() => router.refresh()}
        >
          Refresh current state
        </button>
      )}
    </div>
  );
}
export function TaskActions({
  task,
  planId,
  revision,
  active = true,
}: {
  task: Task;
  planId: string;
  revision: number;
  active?: boolean;
}) {
  const router = useRouter();
  const guard = useRef(false);
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function change() {
    if (guard.current) return;
    guard.current = true;
    setBusy(true);
    setMessage("");
    try {
      await apiRequest(
        `/api/v1/plans/${planId}/tasks/${task.taskId}`,
        "PATCH",
        {
          status: task.status === "completed" ? "pending" : "completed",
          expectedStateRevision: revision,
        },
      );
      router.refresh();
    } catch (error) {
      setMessage(
        errorText(error) +
          " Refresh the plan to reconcile a possibly saved update; do not assume it failed.",
      );
    } finally {
      guard.current = false;
      setBusy(false);
    }
  }
  const destination = `/content/${task.contentId}?returnTo=${encodeURIComponent(`/plans/${planId}`)}${active ? `&planId=${planId}&taskId=${task.taskId}` : ""}${task.kind === "revision" ? "&kind=revision" : ""}`;
  if (!planId) return null;
  return (
    <div className="student-actions">
      {task.availability === "available" ? (
        <Link className="button button-outline" href={destination}>
          Open{" "}
          {task.kind === "revision" ? "revision" : task.contentSnapshot.type}
        </Link>
      ) : (
        <p>Material unavailable; no new completion is permitted.</p>
      )}
      {task.supersededRevision && (
        <p>
          This revision cycle has been superseded. Review a replacement
          schedule.
        </p>
      )}
      {active && (
        <button
          className="button"
          disabled={
            busy ||
            (task.availability !== "available" && task.status !== "completed")
          }
          onClick={change}
        >
          {busy
            ? "Saving task…"
            : task.status === "completed"
              ? "Undo completion"
              : task.contentSnapshot.type === "resource"
                ? "Mark as studied"
                : "Mark task completed"}
        </button>
      )}
      {message && (
        <div role="alert">
          <p>{message}</p>
          <button
            className="button button-outline"
            onClick={() => router.refresh()}
          >
            Refresh saved task state
          </button>
        </div>
      )}
    </div>
  );
}
export function TaskRows({
  tasks,
  planId,
  revision,
  active = true,
}: {
  tasks: Task[];
  planId: string;
  revision: number;
  active?: boolean;
}) {
  return (
    <div className="plan-tasks">
      {tasks.map((task) => (
        <article className="student-card" key={task.taskId}>
          <p className="eyebrow">
            {task.scheduledDate} · {task.contentSnapshot.subject.toUpperCase()}{" "}
            · {task.estimatedMinutes} min
          </p>
          <h3>{task.contentSnapshot.title}</h3>
          <p>
            {task.status} · {task.kind}
            {task.overdue ? " · Overdue" : ""}
          </p>
          <p>{task.reason}</p>
          <TaskActions
            task={task}
            planId={planId}
            revision={revision}
            active={active}
          />
        </article>
      ))}
    </div>
  );
}
export function PlanView({ plan }: { plan: Plan }) {
  return (
    <>
      <header className="student-card">
        <p className="eyebrow">
          {plan.status} · version {plan.version}
        </p>
        <h1>Your study plan</h1>
        <p>
          {plan.windowStart} – {plan.windowEnd} · Asia/Kolkata ·{" "}
          {plan.budgetSnapshot.dailyMinutes} min/day
        </p>
        <p>
          Recording outcomes and completing tasks are separate actions. Opening
          material records neither.
        </p>
        <Link href="/dashboard">Back to dashboard</Link>
        {plan.previousPlanId && (
          <Link href={`/plans/${plan.previousPlanId}`}>
            View previous plan version
          </Link>
        )}
      </header>
      {plan.status === "active" && (
        <GeneratePlan
          revision={plan.stateRevision}
          kind={
            plan.windowEnd <
            new Intl.DateTimeFormat("en-CA", {
              timeZone: "Asia/Kolkata",
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            }).format(new Date())
              ? "initial"
              : "reschedule"
          }
        />
      )}
      <TaskRows
        tasks={plan.tasks}
        planId={plan.id}
        revision={plan.stateRevision}
        active={plan.status === "active"}
      />
      {!plan.tasks.length && (
        <p className="student-notice">
          No eligible tasks fit this plan. Browse content or review preferences;
          no work has been fabricated.
        </p>
      )}
      <section className="student-card">
        <h2>Deferred work ({plan.deferred.length})</h2>
        {plan.deferred.map((task) => (
          <p key={task.taskId}>
            {task.contentId} · {task.estimatedMinutes} min ·{" "}
            {task.reasonCode.replaceAll("_", " ")}
          </p>
        ))}
      </section>
    </>
  );
}
export function PreviewView({ preview }: { preview: Preview }) {
  const router = useRouter(),
    guard = useRef(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [ack, setAck] = useState<string[]>([]);
  async function accept() {
    if (guard.current) return;
    guard.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await apiRequest(
        `/api/v1/plan-previews/${preview.id}/confirm`,
        "POST",
        { acknowledgedDeferredIds: ack },
      );
      await apiRequest("/api/v1/plans/current");
      router.push(`/plans/${result.data.plan.id}`);
      router.refresh();
    } catch (error) {
      setError(
        errorText(error) +
          " Retry this same preview after an uncertain response. Expired or stale proposals require regeneration.",
      );
    } finally {
      guard.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <header className="student-card">
        <p className="eyebrow">Review · not an active plan</p>
        <h1>
          {preview.kind === "adapt"
            ? "Review your suggested changes"
            : "Your proposed study plan"}
        </h1>
        <p>
          {preview.proposal.windowStart} – {preview.proposal.windowEnd} ·
          Asia/Kolkata
        </p>
        <p>
          Expires{" "}
          {new Date(preview.expiresAt).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
          })}
          . Preference, activity, catalog or date changes require a fresh
          proposal.
        </p>
        <p>
          PrepPilot editorial foundations, not an official company syllabus.
          Unused capacity means no eligible item fitted; it is not promised
          study coverage.
        </p>
      </header>
      {preview.adjustment && (
        <section className="student-card" aria-labelledby="adjustment-heading">
          <h2 id="adjustment-heading">Why review this plan?</h2>
          {preview.adjustment.summaries.map((summary, index) => (
            <p key={index}>{summary}</p>
          ))}
          {!preview.evidence.length && (
            <p>
              Insufficient evidence for a topic adjustment. Three non-revision
              practice attempts are needed; individual revision due dates still
              apply.
            </p>
          )}
          {!preview.adjustment.useful && (
            <p role="status">
              No useful adjustment is available. Keep your current plan; no
              schedule changes are required.
            </p>
          )}
          {!preview.adjustment.contentAvailable && (
            <p>
              Insufficient eligible content. No published material matches your
              current company selection and difficulty ceiling.
            </p>
          )}
          {preview.adjustment.limitations.map((message, index) => (
            <p key={index}>{message}</p>
          ))}
          <p>
            Completed work stays on its original dates. Attempts and previous
            plans remain in your history. Nothing changes until you accept.
          </p>
          <Link href="/attempts">Review recorded outcomes</Link>
          <h3>Current versus proposed work</h3>
          {preview.adjustment.changes.map((change) => (
            <p key={change.taskId}>
              {change.title}: {change.change} ·{" "}
              {change.fromDate ?? "Not scheduled"} →{" "}
              {change.toDate ?? "Deferred from this plan"}
            </p>
          ))}
        </section>
      )}
      <section className="student-card">
        <h2>Subject coverage</h2>
        <p>
          Editorial target: DSA 50%, aptitude 25%, CS fundamentals 25%. Discrete
          durations, revisions and shortages can change actual shares.
        </p>
        {(["dsa", "aptitude", "cs"] as const).map((subject) => {
          const selected = preview.proposal.tasks.filter(
            (task) => task.contentSnapshot.subject === subject,
          );
          return (
            <p key={subject}>
              {subject.toUpperCase()}: {selected.length} tasks ·{" "}
              {selected.reduce((sum, task) => sum + task.estimatedMinutes, 0)}{" "}
              estimated minutes
              {!selected.length
                ? " · No eligible work scheduled; coverage is not guaranteed."
                : ""}
            </p>
          );
        })}
      </section>
      <section className="student-card">
        <h2>Daily budget comparison</h2>
        {preview.dailyTotals.map((day) => (
          <p key={day.date}>
            {day.date}: {day.beforeMinutes} → {day.afterMinutes} planned min /{" "}
            {day.budgetMinutes} budget
          </p>
        ))}
        <p>
          {preview.diff.addedTaskIds.length} added ·{" "}
          {preview.diff.removedTaskIds.length} removed ·{" "}
          {preview.diff.moved.length} moved. Completed work is retained.
        </p>
      </section>
      <TaskRows
        tasks={preview.proposal.tasks}
        planId=""
        revision={preview.baseStateRevision}
        active={false}
      />
      {!preview.proposal.tasks.length && (
        <p className="student-notice">
          Insufficient eligible content: no scheduled tasks. You can browse
          reviewed content or adjust preferences instead of activating an empty
          proposal.
        </p>
      )}
      <section className="student-card">
        <h2>Deferred work ({preview.proposal.deferred.length})</h2>
        <p>
          These items are not counted as scheduled minutes. Acknowledge each
          deferral explicitly.
        </p>
        {preview.proposal.deferred.map((task) => (
          <label className="plan-deferral" key={task.taskId}>
            <input
              type="checkbox"
              checked={ack.includes(task.taskId)}
              disabled={busy}
              onChange={(event) =>
                setAck(
                  event.target.checked
                    ? [...ack, task.taskId]
                    : ack.filter((identity) => identity !== task.taskId),
                )
              }
            />
            {task.contentId} · {task.estimatedMinutes} min ·{" "}
            {task.reasonCode.replaceAll("_", " ")}
          </label>
        ))}
      </section>
      <section className="student-card">
        {error && <p role="alert">{error}</p>}
        {preview.state === "confirmed" ? (
          <Link className="button" href={`/plans/${preview.confirmedPlanId}`}>
            Open accepted plan
          </Link>
        ) : (
          <button
            className="button"
            disabled={
              busy ||
              ack.length !== preview.proposal.deferred.length ||
              preview.adjustment?.useful === false
            }
            onClick={accept}
          >
            {busy
              ? "Accepting plan…"
              : preview.kind === "adapt"
                ? "Accept updated plan"
                : "Accept this plan"}
          </button>
        )}
        <Link className="button button-outline" href="/dashboard">
          {preview.kind === "adapt"
            ? "Keep current plan"
            : "Return without accepting"}
        </Link>
      </section>
      {error && (
        <GeneratePlan
          revision={preview.baseStateRevision}
          kind={preview.kind as "initial" | "adapt" | "reschedule"}
        />
      )}
    </>
  );
}
export function DashboardView({
  data,
  plan,
  preferences,
}: {
  data: Dashboard;
  plan: Plan | null;
  preferences?: Preferences | undefined;
}) {
  const remaining = data.todayTasks
    .filter((task) => task.status === "pending")
    .reduce((sum, task) => sum + task.estimatedMinutes, 0);
  const completedToday = data.todayTasks.filter(
    (task) => task.status === "completed",
  ).length;
  const nextTask = data.todayTasks.find(
    (task) => task.status === "pending" && task.availability === "available",
  );
  const nextDestination =
    nextTask && plan
      ? `/content/${nextTask.contentId}?returnTo=%2Fdashboard&planId=${plan.id}&taskId=${nextTask.taskId}${nextTask.kind === "revision" ? "&kind=revision" : ""}`
      : null;
  return (
    <div className="student-stack dashboard-workspace">
      <header className="dashboard-heading">
        <p className="eyebrow">
          Your preparation · {data.studyDate} · Asia/Kolkata
        </p>
        <h1>
          {plan
            ? "A clearer next step, today."
            : "Let’s turn your goals into a study plan."}
        </h1>
        <p>
          {plan
            ? `${remaining} estimated minutes remaining today. This is scheduled effort, not measured study time.`
            : "Review a suggested plan based on your preferences, available time and starting point."}
        </p>
        <div className="student-actions dashboard-next-action">
          {nextDestination && (
            <Link className="button" href={nextDestination}>
              {nextTask?.kind === "revision"
                ? "Continue revision"
                : nextTask?.contentSnapshot.type === "resource"
                  ? "Continue reading"
                  : "Continue practice"}
            </Link>
          )}
          <Link className="button button-outline" href="/content">
            Browse content
          </Link>
          {plan && <Link href={`/plans/${plan.id}`}>View study plan</Link>}
        </div>
      </header>
      <div className="dashboard-layout">
        <div className="student-stack">
          {!plan && preferences && (
            <section
              className="student-card"
              aria-labelledby="saved-preferences-heading"
            >
              <div className="dashboard-section-heading">
                <h2 id="saved-preferences-heading">Your saved preferences</h2>
                <Link href="/account?view=settings">Edit preferences</Link>
              </div>
              <dl className="dashboard-preferences">
                <div>
                  <dt>Preparing for</dt>
                  <dd>
                    {preferences.companies
                      .map((company) =>
                        company === "ltm" ? "LTM" : "Cognizant",
                      )
                      .join(" + ")}
                  </dd>
                </div>
                <div>
                  <dt>Daily budget</dt>
                  <dd>{preferences.dailyMinutes} min/day</dd>
                </div>
                <div>
                  <dt>Target date</dt>
                  <dd>{preferences.deadline}</dd>
                </div>
              </dl>
              <p className="student-muted">
                Starting self-assessment: DSA {preferences.skills.dsa}/5 ·
                Aptitude {preferences.skills.aptitude}/5 · CS{" "}
                {preferences.skills.cs}/5. These are preferences, not measured
                mastery.
              </p>
            </section>
          )}
          {plan &&
            plan.windowEnd >= data.studyDate &&
            data.suggestions.length > 0 && (
              <section
                className="student-card"
                aria-labelledby="recommendations-heading"
              >
                <p className="eyebrow">Based on your recorded activity</p>
                <h2 id="recommendations-heading">Plan review</h2>
                {data.suggestions.length ? (
                  <>
                    {data.suggestions.map((suggestion) => (
                      <p key={suggestion.key}>{suggestion.summary}</p>
                    ))}
                    <p>
                      A review may find no useful change if easier content,
                      prerequisites or daily capacity are unavailable. Your
                      active plan is unchanged.
                    </p>
                    <GeneratePlan revision={data.stateRevision} kind="adapt" />
                  </>
                ) : (
                  <p>
                    No adjustment needed from the available evidence. Topic
                    suggestions require three practice attempts with at least
                    two help/not-solved outcomes. Individual revision due dates
                    still apply.
                  </p>
                )}
              </section>
            )}
          {!plan ? (
            <GeneratePlan revision={data.stateRevision} />
          ) : (
            <>
              <section
                className="dashboard-agenda"
                aria-labelledby="today-heading"
              >
                <div className="dashboard-section-heading">
                  <h2 id="today-heading">Today’s agenda</h2>
                  <span>
                    {completedToday} / {data.todayTasks.length} completed
                  </span>
                </div>
                {data.todayTasks.length > 0 && (
                  <progress
                    className="dashboard-progress"
                    value={completedToday}
                    max={data.todayTasks.length}
                    aria-label="Today's scheduled task completion"
                  >
                    {completedToday} of {data.todayTasks.length}
                  </progress>
                )}
                {!data.todayTasks.length ? (
                  <p className="student-notice">
                    No tasks today. Browse content or review upcoming days.
                  </p>
                ) : remaining === 0 ? (
                  <p className="student-notice">
                    Today’s tasks are completed. Your saved history remains
                    available.
                  </p>
                ) : null}
                <TaskRows
                  tasks={data.todayTasks}
                  planId={plan.id}
                  revision={data.stateRevision}
                />
              </section>
              <GeneratePlan
                revision={data.stateRevision}
                kind={
                  plan.windowEnd < data.studyDate ? "initial" : "reschedule"
                }
              />
              {data.overdue.count > 0 && (
                <section className="student-card">
                  <h2>{data.overdue.count} overdue tasks</h2>
                  <p>
                    Nothing was silently moved. Review a replacement schedule.
                  </p>
                </section>
              )}
              <section>
                <h2>Upcoming work</h2>
                {!data.upcomingTasks.length && (
                  <p className="student-notice">
                    No upcoming tasks are scheduled. You can still browse
                    published content.
                  </p>
                )}
                <TaskRows
                  tasks={data.upcomingTasks}
                  planId={plan.id}
                  revision={data.stateRevision}
                />
              </section>
            </>
          )}
        </div>
        <aside
          className="student-stack dashboard-sidebar"
          aria-label="Preparation overview"
        >
          <section
            className="student-card"
            aria-labelledby="dashboard-progress-heading"
          >
            <p className="eyebrow">Your recorded activity</p>
            <h2 id="dashboard-progress-heading">Preparation progress</h2>
            <dl className="dashboard-statistics">
              <div>
                <dt>Distinct questions attempted</dt>
                <dd>{data.progress.distinctAttempted}</dd>
              </div>
              <div>
                <dt>Currently solved independently</dt>
                <dd>{data.progress.currentlySolved}</dd>
              </div>
              <div>
                <dt>Active-plan tasks completed</dt>
                <dd>
                  {plan
                    ? `${data.progress.planCompleted} / ${data.progress.planTotal}`
                    : "No active plan"}
                </dd>
              </div>
            </dl>
            <p className="student-muted">
              Latest self-reported outcomes, not an ability or placement score.
              Saving an outcome does not complete a plan task.
            </p>
            <Link className="dashboard-text-link" href="/progress">
              View detailed progress
            </Link>
          </section>
          <section className="student-card">
            <h2>Due revisions</h2>
            <p>
              {data.revisions.dueCount} due, including{" "}
              {data.revisions.unavailableDueCount} unavailable. Cycles already
              in today’s agenda are not listed again.
            </p>
            {data.revisions.items.map((cycle) => (
              <p key={cycle.id}>
                {cycle.availability === "available" ? (
                  <Link
                    href={`/content/${cycle.contentId}?kind=revision&returnTo=%2Fdashboard`}
                  >
                    {cycle.title}
                  </Link>
                ) : (
                  <span>{cycle.title} · unavailable</span>
                )}
              </p>
            ))}
            <Link className="dashboard-text-link" href="/revisions">
              Open revision queue
            </Link>
          </section>
          <section className="student-card dashboard-library-prompt">
            <h2>Find your next practice</h2>
            <p>
              Explore published questions and resources across DSA, aptitude and
              CS fundamentals. Your filters and reading position are kept when
              you return.
            </p>
            <Link className="dashboard-text-link" href="/content">
              Open content library
            </Link>
          </section>
          {!plan && (
            <section className="student-card">
              <h2>How PrepPilot works</h2>
              <ol className="dashboard-guide">
                <li>Review your proposed schedule.</li>
                <li>Accept it only when it fits.</li>
                <li>Practice, then record your outcome.</li>
              </ol>
              <p>Nothing is accepted or completed automatically.</p>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
