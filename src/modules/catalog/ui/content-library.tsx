"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { catalogTopics } from "@/config/catalog";
import type { AdminContentSummary } from "../dto";
import type { AdminContentPage } from "../reads";
import { ContentDetail } from "./content-detail";

export function label(value: string) {
  return value.replaceAll("_", " ");
}
export function date(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeZone: "Asia/Kolkata",
      }).format(new Date(value))
    : "Not reviewed";
}

function Metadata({ item }: { item: AdminContentSummary }) {
  return (
    <>
      <span>
        {item.type} · {item.estimatedMinutes} min · revision {item.revision}
      </span>
      <span>
        {item.companies.length
          ? item.companies
              .map(
                (company) =>
                  `${company.companyId === "ltm" ? "LTM" : "Cognizant"} · ${label(company.association)}`,
              )
              .join(" / ")
          : "Shared foundation"}
      </span>
    </>
  );
}

export function ContentLibrary({
  initial,
  initialError,
}: {
  initial: AdminContentPage | null;
  initialError: string | null;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [page, setPage] = useState(initial);
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [subject, setSubject] = useState(params.get("subject") ?? "");
  const moreController = useRef<AbortController | null>(null);
  const moreBusy = useRef(false);
  const selectedButton = useRef<HTMLButtonElement | null>(null);
  const activeFilters = [...params.keys()].some(
    (key) => !["limit", "cursor"].includes(key),
  );
  useEffect(() => () => moreController.current?.abort(), []);

  function navigate(next: URLSearchParams) {
    moreController.current?.abort();
    moreBusy.current = false;
    setLoading(false);
    next.delete("cursor");
    if (next.toString() === params.toString()) {
      setPage(initial);
      setError(initialError);
      return;
    }
    startTransition(() =>
      router.push(`/admin/content${next.size ? `?${next}` : ""}`, {
        scroll: false,
      }),
    );
  }
  async function loadMore(restart = false) {
    if (moreBusy.current || (!restart && !page?.meta.page.nextCursor)) return;
    moreBusy.current = true;
    const controller = new AbortController();
    moreController.current = controller;
    setLoading(true);
    setError(null);
    try {
      const next = new URLSearchParams(params.toString());
      next.delete("cursor");
      if (!restart) next.set("cursor", page!.meta.page.nextCursor!);
      const response = await fetch(`/api/v1/admin/content?${next}`, {
        cache: "no-store",
        signal: controller.signal,
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          `${result.error?.message ?? "Content could not be loaded."} (${result.error?.code ?? response.status})`,
        );
      if (!controller.signal.aborted)
        setPage(
          restart
            ? result
            : {
                ...result,
                data: [
                  ...page!.data,
                  ...result.data.filter(
                    (item: AdminContentSummary) =>
                      !page!.data.some((old) => old.id === item.id),
                  ),
                ],
              },
        );
    } catch (cause) {
      if (!controller.signal.aborted)
        setError(cause instanceof Error ? cause.message : "Please try again.");
    } finally {
      moreBusy.current = false;
      if (!controller.signal.aborted) setLoading(false);
    }
  }
  function inspect(id: string, button: HTMLButtonElement) {
    selectedButton.current = button;
    setSelected(id);
  }
  return (
    <section className="library" aria-label="Saved content">
      <nav className="library-tabs" aria-label="Content status">
        {["", "draft", "published", "archived"].map((status) => (
          <button
            key={status}
            type="button"
            aria-current={
              (params.get("status") ?? "") === status ? "page" : undefined
            }
            onClick={() => {
              const next = new URLSearchParams(params.toString());
              if (status) next.set("status", status);
              else next.delete("status");
              navigate(next);
            }}
          >
            {status || "All"}
          </button>
        ))}
      </nav>
      <form
        className="library-filters"
        onSubmit={(event) => {
          event.preventDefault();
          const next = new URLSearchParams();
          for (const [key, value] of new FormData(event.currentTarget))
            if (typeof value === "string" && value.trim())
              next.set(key, value.trim());
          if (params.has("status")) next.set("status", params.get("status")!);
          if (params.has("limit")) next.set("limit", params.get("limit")!);
          navigate(next);
        }}
      >
        <label className="library-search">
          Keyword search
          <input
            type="search"
            name="q"
            maxLength={100}
            defaultValue={params.get("q") ?? ""}
            placeholder="Search title, topic or tags"
          />
        </label>
        <label>
          Subject
          <select
            name="subject"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
          >
            <option value="">All subjects</option>
            {Object.keys(catalogTopics).map((value) => (
              <option key={value} value={value}>
                {value.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
        <label>
          Topic
          <select
            key={subject}
            name="topic"
            defaultValue={params.get("topic") ?? ""}
          >
            <option value="">All topics</option>
            {(subject && subject in catalogTopics
              ? catalogTopics[subject as keyof typeof catalogTopics]
              : Object.values(catalogTopics).flat()
            ).map((value) => (
              <option key={value} value={value}>
                {label(value)}
              </option>
            ))}
          </select>
        </label>
        <label>
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
        <label>
          Company
          <select name="company" defaultValue={params.get("company") ?? ""}>
            <option value="">All companies</option>
            <option value="cognizant">Cognizant</option>
            <option value="ltm">LTM</option>
          </select>
        </label>
        <div className="library-filter-actions">
          <button
            className="button button-primary"
            type="submit"
            disabled={pending}
          >
            Apply filters
          </button>
          <button
            type="button"
            className="button button-outline"
            onClick={() => navigate(new URLSearchParams())}
          >
            Clear filters
          </button>
        </div>
      </form>
      <p className="library-help">
        Company filters include shared foundation content. Keyword search
        matches words in title, topic and tags, not answers. Results are ordered
        by ID, not relevance.
      </p>
      {error && (
        <div role="alert" className="library-message">
          <p>{error}</p>
          <button
            className="button button-outline"
            disabled={loading}
            onClick={() => {
              if (params.has("cursor"))
                navigate(new URLSearchParams(params.toString()));
              else void loadMore(true);
            }}
          >
            Refresh from first page
          </button>
        </div>
      )}
      {pending ? (
        <p role="status" className="library-message">
          Loading selected content…
        </p>
      ) : (
        <div aria-busy={loading}>
          {page && page.data.length === 0 && (
            <div className="library-empty">
              <h2>
                {activeFilters
                  ? "No matching content"
                  : "Your content library is empty"}
              </h2>
              <p>
                {activeFilters
                  ? "Try a different keyword or clear the filters."
                  : "No saved content yet. Choose Create draft to add your first item."}
              </p>
            </div>
          )}
          {!!page?.data.length && (
            <>
              <table className="library-table">
                <caption className="sr-only">
                  Saved content, ordered by ID ascending
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Title & type</th>
                    <th scope="col">Subject & topic</th>
                    <th scope="col">Difficulty</th>
                    <th scope="col">Status</th>
                    <th scope="col">Updated (IST)</th>
                  </tr>
                </thead>
                <tbody>
                  {page.data.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <button
                          className="library-title"
                          onClick={(event) =>
                            inspect(item.id, event.currentTarget)
                          }
                        >
                          {item.title}
                        </button>
                        <div className="library-metadata">
                          <Metadata item={item} />
                        </div>
                      </td>
                      <td>
                        {item.subject.toUpperCase()}
                        <br />
                        {label(item.topic)}
                      </td>
                      <td className="library-capitalize">{item.difficulty}</td>
                      <td>
                        <span
                          className={`library-status status-${item.status}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td>{date(item.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <ul className="library-mobile">
                {page.data.map((item) => (
                  <li key={item.id}>
                    <span className={`library-status status-${item.status}`}>
                      {item.status}
                    </span>
                    <button
                      className="library-title"
                      onClick={(event) => inspect(item.id, event.currentTarget)}
                    >
                      {item.title}
                    </button>
                    <p>
                      {item.subject.toUpperCase()} · {label(item.topic)} ·{" "}
                      {item.difficulty}
                    </p>
                    <div className="library-metadata">
                      <Metadata item={item} />
                      <span>Updated {date(item.updatedAt)} (IST)</span>
                    </div>
                  </li>
                ))}
              </ul>
              <footer className="library-footer">
                <p role="status">{page.data.length} loaded · ID ascending</p>
                {page.meta.page.hasMore && (
                  <button
                    className="button button-outline"
                    disabled={loading}
                    onClick={() => void loadMore()}
                  >
                    {loading ? "Loading more…" : "Load more content"}
                  </button>
                )}
              </footer>
            </>
          )}
        </div>
      )}
      {selected && (
        <ContentDetail
          id={selected}
          onChanged={() => {
            setSelected(null);
            selectedButton.current?.focus();
            void loadMore(true);
            router.refresh();
          }}
          onClose={() => {
            setSelected(null);
            selectedButton.current?.focus();
          }}
        />
      )}
    </section>
  );
}
