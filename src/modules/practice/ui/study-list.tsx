"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { listAttempts } from "../reads";
import type { listRevisions } from "@/modules/revisions/reads";
type Attempt = Awaited<ReturnType<typeof listAttempts>>["data"][number];
type Revision = Awaited<ReturnType<typeof listRevisions>>["data"][number];
type StudyPage = {
  data: (Attempt | Revision)[];
  meta: {
    page: { limit: number; hasMore: boolean; nextCursor: string | null };
  };
};
const outcome = {
  independent: "Solved independently",
  needed_help: "Solved with help",
  failed: "Not solved yet",
};
export function StudyList({
  initial,
  initialError,
  endpoint,
  query,
}: {
  initial: StudyPage | null;
  initialError: string | null;
  endpoint: "attempts" | "revisions";
  query: string;
}) {
  const router = useRouter();
  const [page, setPage] = useState(initial),
    [message, setMessage] = useState(initialError),
    [busy, setBusy] = useState(false);
  const loading = useRef(false),
    controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const back = `/${endpoint}${query ? `?${query}` : ""}`;
  async function more() {
    if (loading.current || !page?.meta.page.nextCursor) return;
    loading.current = true;
    setBusy(true);
    setMessage(null);
    const abort = new AbortController();
    controller.current = abort;
    try {
      const params = new URLSearchParams(query);
      params.set("cursor", page.meta.page.nextCursor);
      const response = await fetch(`/api/v1/${endpoint}?${params}`, {
        cache: "no-store",
        signal: abort.signal,
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.error?.message ?? "Unable to load more study records.",
        );
      if (!abort.signal.aborted)
        setPage({
          ...result,
          data: [
            ...page.data,
            ...result.data.filter(
              (item: { id: string }) =>
                !page.data.some((existing) => existing.id === item.id),
            ),
          ],
        });
    } catch (error) {
      if (!abort.signal.aborted)
        setMessage(
          error instanceof Error
            ? error.message
            : "Connection failed. Loaded records are retained.",
        );
    } finally {
      if (!abort.signal.aborted) {
        loading.current = false;
        setBusy(false);
      }
    }
  }
  return (
    <>
      <div className="student-actions">
        <Link href="/content">Content library</Link>
        {endpoint === "revisions" ? (
          <Link
            href={
              new URLSearchParams(query).get("dueOnly") === "false"
                ? "/revisions"
                : "/revisions?dueOnly=false"
            }
          >
            {new URLSearchParams(query).get("dueOnly") === "false"
              ? "Show due revisions only"
              : "Include upcoming revisions"}
          </Link>
        ) : (
          <>
            <Link href="/attempts">All history</Link>
            <Link href="/attempts?kind=practice">Practice only</Link>
            <Link href="/attempts?kind=revision">Revision recalls only</Link>
          </>
        )}
        <button
          className="button button-outline"
          onClick={() => router.refresh()}
        >
          Refresh current records
        </button>
      </div>
      {message && (
        <div className="student-notice" role="alert">
          <p>{message}</p>
          <p>
            Loaded records, if any, are retained. Sign in again if your session
            expired.
          </p>
          <Link href={`/login?returnTo=${encodeURIComponent(back)}`}>
            Sign in
          </Link>
          <button
            className="button button-outline"
            disabled={busy}
            onClick={() =>
              page?.meta.page.nextCursor ? void more() : router.refresh()
            }
          >
            Retry reading
          </button>
        </div>
      )}
      {page?.data.length === 0 && (
        <section className="student-empty">
          <h2>
            {endpoint === "attempts"
              ? "No recorded attempts"
              : "No revisions in this view"}
          </h2>
          <p>
            {endpoint === "attempts"
              ? "Record an outcome on a published question to begin your immutable history."
              : "A saved question outcome schedules a revision. No study plan is required to use this queue."}
          </p>
        </section>
      )}
      <div className="student-results" aria-busy={busy}>
        {page?.data.map((item) => {
          const revision = "dueDate" in item;
          const contentId = item.contentId;
          const target = `/content/${contentId}?returnTo=${encodeURIComponent(back)}${revision && item.availability === "available" ? "&kind=revision" : ""}`;
          return (
            <article className="student-content-row" key={item.id}>
              <div>
                <h2>
                  <Link href={target}>
                    {revision ? item.title : item.contentSnapshot.title}
                  </Link>
                </h2>
                {revision ? (
                  <>
                    <p>
                      Due {item.dueDate} · {item.intervalDays}-day interval ·
                      Asia/Kolkata
                    </p>
                    <p className="student-muted">
                      {item.reason.replaceAll("_", " ")} ·{" "}
                      {item.outsidePlan === null
                        ? "No active plan"
                        : item.outsidePlan
                          ? "Outside current plan"
                          : "Within current plan window"}
                    </p>
                    {item.availability === "unavailable" && (
                      <p className="student-error">
                        Unavailable content: no new revision outcome can be
                        recorded.
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p>
                      {outcome[item.outcome]} · {item.kind} · Attempt sequence{" "}
                      {item.attemptSequence}
                    </p>
                    <p className="student-muted">
                      {new Intl.DateTimeFormat("en-IN", {
                        timeZone: "Asia/Kolkata",
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(item.createdAt))}{" "}
                      · {item.perceivedDifficulty ?? "difficulty not rated"}
                    </p>
                  </>
                )}
              </div>
              <Link className="button button-outline" href={target}>
                {revision
                  ? item.availability === "available"
                    ? "Open revision"
                    : "View saved reference"
                  : "Open question reference"}
              </Link>
            </article>
          );
        })}
      </div>
      {page?.meta.page.hasMore && (
        <div className="student-load-more">
          <button
            className="button"
            disabled={busy}
            onClick={() => void more()}
          >
            {busy ? "Loading…" : "Load more records"}
          </button>
        </div>
      )}
    </>
  );
}
