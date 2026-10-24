"use client";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { catalogTopics, type CatalogSubject } from "@/config/catalog";
import type { listStudentContent } from "../reads";
import { mergeContent } from "../student-navigation";

type ContentPage = Awaited<ReturnType<typeof listStudentContent>>;
export function contentLabel(value: string) {
  return value.replaceAll("_", " ");
}
export function reviewDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
      }).format(new Date(value))
    : "Not reviewed";
}
export function StudentLibrary({
  initial,
  initialError,
  query,
  userId,
}: {
  initial: ContentPage | null;
  initialError: {
    message: string;
    code: string;
    fields?: Readonly<Record<string, readonly string[]>> | undefined;
  } | null;
  query: string;
  userId: string;
}) {
  const params = new URLSearchParams(query);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [page, setPage] = useState(initial);
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState(params.get("subject") ?? "");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const controller = useRef<AbortController | null>(null);
  const busy = useRef(false);
  const pages = useRef(1);
  const alive = useRef(true);
  const storageKey = `preppilot:browse:${userId}:${query}`;
  const back = `/content${query ? `?${query}` : ""}`;
  const active = [...params.keys()].some(
    (key) => !["limit", "cursor"].includes(key),
  );
  useEffect(() => {
    alive.current = true;
    const abort = new AbortController();
    controller.current = abort;
    async function restore() {
      let target = 1;
      let scroll = 0;
      try {
        const stored = JSON.parse(sessionStorage.getItem(storageKey) ?? "null");
        target = Math.min(20, Math.max(1, Number(stored?.pages) || 1));
        scroll = Math.max(0, Number(stored?.scroll) || 0);
      } catch {}
      if (!initial || target === 1) {
        if (scroll) requestAnimationFrame(() => window.scrollTo(0, scroll));
        return;
      }
      busy.current = true;
      setLoading(true);
      let result = initial;
      try {
        for (
          let number = 1;
          number < target && result.meta.page.nextCursor;
          number++
        ) {
          const next = new URLSearchParams(query);
          next.set("cursor", result.meta.page.nextCursor);
          const response = await fetch(`/api/v1/content?${next}`, {
            cache: "no-store",
            signal: abort.signal,
          });
          const value = await response.json();
          if (!response.ok)
            throw new Error(
              value.error?.message ?? "Unable to restore more content.",
            );
          if (abort.signal.aborted) return;
          result = { ...value, data: mergeContent(result.data, value.data) };
          pages.current++;
          setPage(result);
        }
        requestAnimationFrame(() => window.scrollTo(0, scroll));
      } catch (cause) {
        if (!abort.signal.aborted)
          setError({
            code: "RESTORE_FAILED",
            message:
              cause instanceof Error
                ? cause.message
                : "Unable to restore more items. Loaded content is retained.",
          });
      } finally {
        if (!abort.signal.aborted) {
          busy.current = false;
          setLoading(false);
        }
      }
    }
    void restore();
    return () => {
      alive.current = false;
      abort.abort();
      controller.current?.abort();
    };
  }, [initial, query, storageKey]);
  function remember() {
    try {
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({ pages: pages.current, scroll: window.scrollY }),
      );
    } catch {}
  }
  async function more() {
    if (busy.current || !page?.meta.page.nextCursor) return;
    busy.current = true;
    setLoading(true);
    setError(null);
    const abort = new AbortController();
    controller.current = abort;
    try {
      const next = new URLSearchParams(query);
      next.set("cursor", page.meta.page.nextCursor);
      const response = await fetch(`/api/v1/content?${next}`, {
        cache: "no-store",
        signal: abort.signal,
      });
      const value = await response.json();
      if (!response.ok) {
        if (!abort.signal.aborted)
          setError({
            message:
              value.error?.message ??
              "Unable to load more. Loaded items are retained.",
            code: value.error?.code ?? "REQUEST_FAILED",
          });
        return;
      }
      if (!abort.signal.aborted && alive.current) {
        setPage({ ...value, data: mergeContent(page.data, value.data) });
        pages.current++;
        remember();
      }
    } catch {
      if (!abort.signal.aborted && alive.current)
        setError({
          message:
            "Connection failed. Loaded items are retained; retry when ready.",
          code: "CONNECTION_FAILED",
        });
    } finally {
      if (!abort.signal.aborted && alive.current) {
        busy.current = false;
        setLoading(false);
      }
    }
  }
  function apply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    controller.current?.abort();
    const next = new URLSearchParams();
    new FormData(event.currentTarget).forEach((value, key) => {
      if (String(value).trim()) next.set(key, String(value).trim());
    });
    startTransition(() =>
      router.push(`/content${next.size ? `?${next}` : ""}`, { scroll: false }),
    );
    setFiltersOpen(false);
  }
  return (
    <>
      <section className="student-library-heading">
        <p className="eyebrow">Content library · DSA, aptitude & CS</p>
        <h1>Find your next practice.</h1>
        <p className="student-lead">
          Explore reviewed questions and resources for your placement
          preparation.
        </p>
      </section>
      <p className="student-notice">
        Browse published material independently or open your dashboard to review
        a study plan. Reading or opening links does not record completion.
      </p>
      <details
        className="student-filters student-card"
        open={filtersOpen}
        onToggle={(event) => setFiltersOpen(event.currentTarget.open)}
      >
        <summary>Search and filters{active ? " · active filters" : ""}</summary>
        <form onSubmit={apply} aria-busy={pending}>
          <label className="student-label">
            Search
            <input
              type="search"
              name="q"
              maxLength={100}
              defaultValue={params.get("q") ?? ""}
              placeholder="Search titles, topics and tags"
            />
          </label>
          <div className="student-filter-grid">
            <label className="student-label">
              Subject
              <select
                name="subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
              >
                <option value="">All subjects</option>
                <option value="dsa">DSA</option>
                <option value="aptitude">Aptitude</option>
                <option value="cs">CS fundamentals</option>
              </select>
            </label>
            <label className="student-label">
              Topic
              <select
                key={subject}
                name="topic"
                defaultValue={
                  params.get("subject") === subject
                    ? (params.get("topic") ?? "")
                    : ""
                }
              >
                <option value="">All topics</option>
                {(subject && subject in catalogTopics
                  ? catalogTopics[subject as CatalogSubject]
                  : Object.values(catalogTopics).flat()
                ).map((topic) => (
                  <option value={topic} key={topic}>
                    {contentLabel(topic)}
                  </option>
                ))}
              </select>
            </label>
            <label className="student-label">
              Company coverage
              <select name="company" defaultValue={params.get("company") ?? ""}>
                <option value="">All companies & foundations</option>
                <option value="cognizant">Cognizant + foundations</option>
                <option value="ltm">LTM + foundations</option>
              </select>
            </label>
            <label className="student-label">
              Difficulty
              <select
                name="difficulty"
                defaultValue={params.get("difficulty") ?? ""}
              >
                <option value="">All difficulties</option>
                {["easy", "medium", "hard"].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="student-actions">
            <button className="button" disabled={pending}>
              Apply filters
            </button>
            <Link className="button button-outline" href="/content">
              Clear filters
            </Link>
          </div>
        </form>
      </details>
      {active && (
        <p className="student-filter-context">
          Active:{" "}
          {[...params.entries()]
            .filter(([key]) => !["limit", "cursor"].includes(key))
            .map(([key, value]) => `${key}: ${contentLabel(value)}`)
            .join(" · ")}
        </p>
      )}
      <p className="student-muted">
        Company filters include shared foundations. Verified and
        student-reported associations describe their sources, not official
        hiring guarantees.
      </p>
      {pending && (
        <div className="student-skeleton" role="status">
          Loading filtered content…
        </div>
      )}
      {error && (
        <div className="student-notice" role="alert">
          <p>{error.message}</p>
          {error.fields && (
            <ul>
              {Object.entries(error.fields).map(([field, messages]) => (
                <li key={field}>
                  {field}: {messages.join(" ")}
                </li>
              ))}
            </ul>
          )}
          {error.code === "UNAUTHENTICATED" ||
          error.code === "ACCESS_UNAVAILABLE" ? (
            <Link href={`/login?returnTo=${encodeURIComponent(back)}`}>
              Sign in to continue
            </Link>
          ) : error.code === "EMAIL_NOT_VERIFIED" ? (
            <Link href="/verify-email">Check verification status</Link>
          ) : error.code === "INVALID_CURSOR" ? (
            <a
              href={back}
              onClick={() => {
                try {
                  sessionStorage.removeItem(storageKey);
                } catch {}
              }}
            >
              Refresh from the first page
            </a>
          ) : (
            <button
              className="button button-outline"
              disabled={loading || pending}
              onClick={() =>
                page?.meta.page.nextCursor ? void more() : router.refresh()
              }
            >
              Retry loading
            </button>
          )}
        </div>
      )}
      {page?.data.length === 0 && (
        <div className="student-empty">
          <h2>
            {active ? "No matching content" : "The published library is empty"}
          </h2>
          <p>
            {active
              ? "Try fewer filters or a different search."
              : "Reviewed materials will appear here after an admin publishes them. No sample content is substituted."}
          </p>
          {active && (
            <Link className="button" href="/content">
              Clear filters
            </Link>
          )}
        </div>
      )}
      <div className="student-results" aria-busy={loading || pending}>
        {page?.data.map((item) => (
          <article className="student-content-row" key={item.id}>
            <div>
              <p className="student-item-meta">
                {item.type} · {item.subject.toUpperCase()} ·{" "}
                {contentLabel(item.topic)} · {item.difficulty} ·{" "}
                {item.estimatedMinutes} min
              </p>
              <h2>
                <Link
                  href={`/content/${item.id}?returnTo=${encodeURIComponent(back)}`}
                  onClick={remember}
                >
                  {item.title}
                </Link>
              </h2>
              <p className="student-provenance">
                {item.companies.length
                  ? item.companies
                      .map(
                        (company) =>
                          `${company.companyId === "ltm" ? "LTM" : "Cognizant"} · ${contentLabel(company.association)}`,
                      )
                      .join(" / ")
                  : "Shared foundation"}
              </p>
              <p className="student-muted">
                Reviewed {reviewDate(item.reviewedAt)}
              </p>
            </div>
            <Link
              className="button button-outline"
              href={`/content/${item.id}?returnTo=${encodeURIComponent(back)}`}
              onClick={remember}
            >
              {item.type === "question" ? "Open question" : "Read resource"}
            </Link>
          </article>
        ))}
      </div>
      {page?.meta.page.hasMore && (
        <div className="student-load-more">
          <button
            className="button button-outline"
            disabled={loading || pending}
            onClick={() => void more()}
          >
            {loading ? "Loading more content…" : "Load more content"}
          </button>
        </div>
      )}
      {!page?.meta.page.hasMore && !!page?.data.length && (
        <p className="student-muted">End of the current results.</p>
      )}
    </>
  );
}
