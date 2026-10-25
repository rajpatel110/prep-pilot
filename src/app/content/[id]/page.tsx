import Link from "next/link";
import { headers } from "next/headers";
import { studentPageActor } from "@/modules/identity/page-access";
import { getStudentContent } from "@/modules/catalog/reads";
import { studyReturn } from "@/modules/catalog/student-navigation";
import { OutcomeForm } from "@/modules/practice/ui/outcome-form";
import { AttachmentLink } from "@/modules/files/ui/attachments";
import { serverConfig } from "@/shared/server/config";
import {
  SafeMarkdown,
  safePreviewUrl,
} from "@/modules/catalog/ui/safe-markdown";
import { StudentShell } from "@/shared/ui/student-shell";
import { HttpError } from "@/shared/server/http";
import { readPlan } from "@/modules/planning/service";
import { TaskActions } from "@/modules/planning/ui/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const label = (value: string) => value.replaceAll("_", " ");
const date = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeZone: "Asia/Kolkata",
      }).format(new Date(value))
    : "Not reviewed";

export default async function ContentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const search = await searchParams;
  const back = studyReturn(search.returnTo);
  const backLabel = back.startsWith("/revisions")
    ? "Back to revisions"
    : back.startsWith("/attempts")
      ? "Back to history"
      : back.startsWith("/plans")
        ? "Back to study plan"
        : back === "/dashboard"
          ? "Back to dashboard"
          : "Back to content library";
  let kind: "revision" | "practice" =
    search.kind === "revision" ? "revision" : "practice";
  const contextQuery =
    typeof search.planId === "string" && typeof search.taskId === "string"
      ? `&planId=${encodeURIComponent(search.planId)}&taskId=${encodeURIComponent(search.taskId)}`
      : "";
  const target = `/content/${id}?returnTo=${encodeURIComponent(back)}${kind === "revision" ? "&kind=revision" : ""}${contextQuery}`;
  const actor = await studentPageActor(target);
  let content;
  let taskContext: Awaited<ReturnType<typeof readPlan>> | null = null;
  let currentTask:
    | NonNullable<Awaited<ReturnType<typeof readPlan>>["plan"]>["tasks"][number]
    | undefined;
  try {
    if (search.planId !== undefined || search.taskId !== undefined) {
      if (
        typeof search.planId !== "string" ||
        typeof search.taskId !== "string"
      )
        throw new HttpError(
          422,
          "VALIDATION_ERROR",
          "Both plan and task identifiers are required.",
        );
      taskContext = await readPlan(await headers(), search.planId);
      currentTask = taskContext.plan?.tasks.find(
        (task) => task.taskId === search.taskId && task.contentId === id,
      );
      if (!currentTask)
        throw new HttpError(
          404,
          "RESOURCE_NOT_FOUND",
          "The owned task reference was not found.",
        );
      if (taskContext.plan?.status !== "active")
        throw new HttpError(
          409,
          "PLAN_NOT_ACTIVE",
          "This task belongs to a historical plan. Open the current plan.",
        );
      kind = currentTask.kind === "revision" ? "revision" : "practice";
    }
    content = await getStudentContent(await headers(), id);
  } catch (error) {
    const known = error instanceof HttpError;
    return (
      <StudentShell name={actor.session.user.name}>
        <Link className="student-back" href={back}>
          {backLabel}
        </Link>
        <section className="student-card">
          <h1>
            {known && error.status === 404
              ? "Content not found"
              : "Content could not be loaded"}
          </h1>
          <p role="alert">
            {known
              ? error.message
              : "The service is temporarily unavailable. Your browsing filters are preserved."}
          </p>
          {known && error.status === 401 ? (
            <Link href={`/login?returnTo=${encodeURIComponent(target)}`}>
              Sign in again
            </Link>
          ) : known && error.code === "EMAIL_NOT_VERIFIED" ? (
            <Link href="/verify-email">Check verification status</Link>
          ) : (
            <Link className="button button-outline" href={target}>
              Retry reading
            </Link>
          )}
        </section>
      </StudentShell>
    );
  }
  if (content.availability === "unavailable")
    return (
      <StudentShell name={actor.session.user.name}>
        <Link className="student-back" href={back}>
          {backLabel}
        </Link>
        <section className="student-card">
          <p className="eyebrow">Saved historical reference</p>
          <h1>{content.snapshot.title}</h1>
          <p>
            {content.snapshot.subject.toUpperCase()} ·{" "}
            {label(content.snapshot.topic)} · {content.snapshot.type}
          </p>
          <h2>This material is no longer available</h2>
          <p>
            Availability: {label(content.reason)}. Only your saved reference is
            shown. The original question, resource body and explanation are not
            accessible.
          </p>
          <p>
            Viewing this historical reference records no new outcome or
            completion.
          </p>
          <Link className="button" href={back}>
            Browse published content
          </Link>
        </section>
      </StudentShell>
    );
  const external = safePreviewUrl(content.externalUrl ?? "");
  return (
    <StudentShell name={actor.session.user.name}>
      <Link className="student-back" href={back}>
        {backLabel}
      </Link>
      <header className="student-detail-heading student-card">
        <p className="eyebrow">
          {content.type} · {content.subject.toUpperCase()} ·{" "}
          {label(content.topic)}
        </p>
        <h1>{content.title}</h1>
        <p>
          {content.difficulty} · {content.estimatedMinutes} min · Reviewed{" "}
          {date(content.reviewedAt)}
        </p>
      </header>
      <div className="student-reading-layout">
        <article className="student-card student-reading">
          {content.prompt && (
            <section>
              <h2>Question</h2>
              <SafeMarkdown text={content.prompt} />
            </section>
          )}
          {content.body && (
            <section>
              <h2>
                {content.type === "resource"
                  ? "Study material"
                  : "Supporting material"}
              </h2>
              <SafeMarkdown text={content.body} />
            </section>
          )}
          {external && (
            <section className="student-notice">
              <h2>
                {content.type === "question"
                  ? "External practice"
                  : "External resource"}
              </h2>
              <p>
                Continue on <strong>{new URL(external).hostname}</strong>. This
                opens a separate website and does not record completion or a
                practice outcome.
              </p>
              <a
                className="button"
                href={external}
                target="_blank"
                rel="noopener noreferrer"
              >
                {content.type === "question"
                  ? "Open practice website"
                  : "Open resource website"}{" "}
                (new tab)
              </a>
              <p className="student-external-url">Destination: {external}</p>
            </section>
          )}
          {!!content.attachments.length && (
            <section>
              <h2>Attachments</h2>
              {content.attachments.map((asset) => (
                <AttachmentLink
                  key={asset.id}
                  asset={asset}
                  contentId={id}
                  enabled={serverConfig.FILES_ENABLED}
                />
              ))}
            </section>
          )}
          {content.explanation && (
            <details className="student-explanation">
              <summary>Reveal explanation and hints</summary>
              <SafeMarkdown text={content.explanation} />
            </details>
          )}
          <p className="student-notice">
            Opening links does not record outcomes or complete tasks. Resource
            completion requires an owned active-plan task; independently browsed
            resources have no completion control.
          </p>
          {content.type === "question" && (
            <OutcomeForm
              key={`${actor.session.user.id}:${id}:${kind}`}
              contentId={id}
              userId={actor.session.user.id}
              kind={kind}
            />
          )}
          {currentTask && taskContext?.plan && (
            <section className="student-card">
              <h2>Plan task completion</h2>
              <p>
                {currentTask.status}. Saving an outcome does not complete this
                task.
              </p>
              <TaskActions
                task={currentTask}
                planId={taskContext.plan.id}
                revision={taskContext.stateRevision}
              />
            </section>
          )}
        </article>
        <aside className="student-card student-reading-meta">
          <h2>About this material</h2>
          <dl>
            <dt>Source</dt>
            <dd>{content.source}</dd>
            <dt>Attribution</dt>
            <dd>{content.attribution || "No additional attribution notes"}</dd>
            <dt>Reviewed</dt>
            <dd>{date(content.reviewedAt)} · Asia/Kolkata</dd>
            <dt>Tags</dt>
            <dd>
              {content.tags.length ? content.tags.join(" · ") : "No tags"}
            </dd>
          </dl>
          <h3>Company coverage</h3>
          {content.companies.length ? (
            content.companies.map((company) => (
              <div key={company.companyId} className="student-provenance-block">
                <strong>
                  {company.companyId === "ltm" ? "LTM" : "Cognizant"} ·{" "}
                  {label(company.association)}
                </strong>
                <p>{company.source}</p>
                <p>Reviewed {date(company.reviewedAt)}</p>
              </div>
            ))
          ) : (
            <p>Shared foundation content.</p>
          )}
          <p>
            Company associations preserve provenance, not guarantees of current
            hiring requirements.
          </p>
        </aside>
      </div>
    </StudentShell>
  );
}
