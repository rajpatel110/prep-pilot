import Link from "next/link";
import type { progress } from "../service";
export function ProgressView({
  data,
}: {
  data: Awaited<ReturnType<typeof progress>>;
}) {
  const plan = data.activePlan;
  return (
    <div className="student-stack">
      <p className="student-muted">
        Summary as of {data.asOf} · Study date {data.studyDate} ·{" "}
        {data.timezone}
      </p>
      <div className="progress-metrics">
        <section className="student-card">
          <h2>Total submissions</h2>
          <strong className="progress-number">{data.submissions}</strong>
          <p>
            All recorded history: {data.practiceSubmissions} practice +{" "}
            {data.revisionSubmissions} recall submissions. Repeated attempts
            count here.
          </p>
        </section>
        <section className="student-card">
          <h2>Distinct questions attempted</h2>
          <strong className="progress-number">{data.distinctAttempted}</strong>
          <p>
            {data.currentlySolved} currently solved: latest recorded outcome is
            independent. A later unsuccessful recall can reduce this count.
          </p>
        </section>
        <section className="student-card">
          <h2>Active-plan completion</h2>
          {plan ? (
            <>
              <strong className="progress-number">
                {plan.completed} / {plan.total}
              </strong>
              <p>
                {plan.completionPercent === null
                  ? "No scheduled tasks; percentage not applicable."
                  : `${plan.completionPercent}% of scheduled tasks completed.`}
              </p>
              <p>
                {plan.windowStart}–{plan.windowEnd} · {plan.readingCompleted}{" "}
                completed resource tasks (not question attempts).
              </p>
              <Link href={`/plans/${plan.id}`}>View current plan</Link>
            </>
          ) : (
            <p>No active plan. Lifetime question activity is still shown.</p>
          )}
          <p>
            {data.historicalPlanVersions} historical plan versions excluded from
            completion totals.
          </p>
        </section>
      </div>
      <section className="student-card">
        <h2>Revisions due</h2>
        <p>
          {data.revisions.due} due on or before {data.studyDate}, including{" "}
          {data.revisions.unavailable} with unavailable content. Unavailable
          content cannot be practiced; historical outcomes remain.
        </p>
        <Link href="/revisions">Review revision queue</Link>
      </section>
      <section className="student-card">
        <h2>Subject and topic breakdown</h2>
        <p>
          Questions: all history, grouped by each question’s latest saved
          classification. Resources: completed tasks in the active plan only.
          Outcomes are self-reported.
        </p>
        {!data.topics.length && (
          <p>
            No recorded question activity or completed active-plan reading tasks
            yet. <Link href="/content">Browse published content</Link>.
          </p>
        )}
        {data.topics.map((topic) => (
          <article
            className="progress-topic"
            key={`${topic.subject}:${topic.topic}`}
          >
            <h3>
              {topic.subject.toUpperCase()} · {topic.topic.replaceAll("_", " ")}
            </h3>
            <p>
              {topic.currentlySolved} independent / {topic.distinctAttempted}{" "}
              distinct attempted · {topic.neededHelp} needed help ·{" "}
              {topic.failed} unsuccessful · {topic.readingCompleted} resource
              tasks completed
            </p>
            {topic.distinctAttempted > 0 && (
              <progress
                aria-label={`${topic.topic}: latest independent outcomes among distinct attempted questions`}
                value={topic.currentlySolved}
                max={topic.distinctAttempted}
              />
            )}
          </article>
        ))}
      </section>
      <p className="student-notice">
        No readiness score, accuracy, streak or measured study-time claim is
        calculated. Starting self-assessments are preferences, not evidence of
        completed practice.
      </p>
    </div>
  );
}
