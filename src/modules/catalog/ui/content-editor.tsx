"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { UnsavedGuard } from "./unsaved-guard";
import { useRouter } from "next/navigation";
import { catalogTopics } from "@/config/catalog";
import type { AdminContentDetail } from "../dto";
import { draftInputSchema, draftPatchSchema } from "../schemas";
import {
  editorValues,
  editorPayload,
  editorPatch,
  rebaseEditor,
  localDate,
  type EditorValues,
} from "../editor-values";
import { ContentPreview } from "./content-preview";
import { LifecycleControls } from "./lifecycle-controls";
import { catalogRequest, CatalogRequestError } from "./catalog-client";

export function ContentEditor({
  initial,
}: {
  initial: AdminContentDetail | null;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initial);
  const [baseline, setBaseline] = useState(() => editorValues(initial));
  const [values, setValues] = useState(() => editorValues(initial));
  const [fields, setFields] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [remote, setRemote] = useState<AdminContentDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [preview, setPreview] = useState(false);
  const submitting = useRef(false);
  const attemptedSlug = useRef("");
  const dirty = JSON.stringify(values) !== JSON.stringify(baseline);
  const archived = saved?.status === "archived";
  function change<Key extends keyof EditorValues>(
    key: Key,
    value: EditorValues[Key],
  ) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }
  function accept(item: AdminContentDetail) {
    setSaved(item);
    const next = editorValues(item);
    setBaseline(next);
    setValues(next);
    setBlocked(false);
    setRemote(null);
    setNotFound(false);
    setFields({});
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (submitting.current || blocked || archived) return;
    const payload: Record<string, unknown> = saved
      ? editorPatch(values, baseline, saved.revision)
      : { ...editorPayload(values) };
    if (!saved)
      for (const key of ["prompt", "body", "explanation", "externalUrl"])
        if (payload[key] === null) delete payload[key];
    const parsed = (saved ? draftPatchSchema : draftInputSchema).safeParse(
      payload,
    );
    if (!parsed.success) {
      const errors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "_form");
        errors[key] = [issue.message];
      }
      setFields(errors);
      setMessage("Check the listed fields. Your input is preserved.");
      return;
    }
    submitting.current = true;
    setBusy(true);
    setFields({});
    setMessage("");
    attemptedSlug.current = values.slug;
    try {
      const response = await catalogRequest(
        saved ? `/api/v1/admin/content/${saved.id}` : "/api/v1/admin/content",
        saved ? "PATCH" : "POST",
        payload,
      );
      accept(response.data);
      setMessage("Saved successfully.");
      if (!saved) {
        router.replace(`/admin/content/${response.data.id}/edit`);
      } else router.refresh();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Unable to save.");
      if (cause instanceof CatalogRequestError) {
        setFields(cause.fields);
        if (
          cause.uncertain ||
          cause.code === "CONTENT_CONFLICT" ||
          cause.code === "INVALID_CONTENT_STATE"
        ) {
          setBlocked(true);
          setRemote(null);
          setNotFound(false);
        }
      }
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  async function reconcile() {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setNotFound(false);
    setMessage("");
    try {
      let id = saved?.id;
      if (!id) {
        let cursor: string | null = null;
        let complete = false;
        for (let page = 0; page < 100; page++) {
          const params = new URLSearchParams({ limit: "50" });
          if (cursor) params.set("cursor", cursor);
          const result = await catalogRequest(
            `/api/v1/admin/content?${params}`,
          );
          const found = result.data.find(
            (item: { slug: string; id: string }) =>
              item.slug === attemptedSlug.current,
          );
          if (found) {
            id = found.id;
            break;
          }
          cursor = result.meta.page.nextCursor;
          if (!cursor) {
            complete = true;
            break;
          }
        }
        if (!id) {
          if (!complete)
            throw new Error(
              "Reconciliation is too large. Inspect the Content Library before retrying.",
            );
          setNotFound(true);
          setMessage(
            "No record with the attempted slug was found. Review the library before explicitly retrying; a create is not generally idempotent.",
          );
          return;
        }
      }
      const response = await catalogRequest(`/api/v1/admin/content/${id}`);
      setRemote(response.data);
      setMessage(
        "Current saved record loaded for comparison. Your local input is unchanged; choose explicitly how to continue.",
      );
    } catch (cause) {
      setMessage(
        cause instanceof Error
          ? cause.message
          : "Reconciliation failed. Your input is preserved.",
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  function inputError(name: string) {
    return fields[name]?.length ? (
      <p className="auth-error" id={`error-${name}`}>
        {fields[name]!.join(" ")}
      </p>
    ) : null;
  }
  const inputProps = (name: string) => ({
    "aria-invalid": !!fields[name],
    "aria-describedby": fields[name] ? `error-${name}` : undefined,
  });
  const textField = (
    name:
      | "title"
      | "slug"
      | "source"
      | "attribution"
      | "prompt"
      | "body"
      | "explanation"
      | "externalUrl",
    title: string,
    maximum: number,
    multiline = false,
  ) => (
    <label key={name}>
      {title}
      {multiline ? (
        <textarea
          value={values[name]}
          maxLength={maximum}
          rows={name === "attribution" ? 3 : 8}
          onChange={(event) => change(name, event.target.value)}
          {...inputProps(name)}
        />
      ) : (
        <input
          value={values[name]}
          maxLength={maximum}
          required={["title", "slug", "source"].includes(name)}
          type={name === "externalUrl" ? "url" : "text"}
          disabled={
            name === "slug" &&
            !!(
              saved?.publishedAt ||
              saved?.archivedAt ||
              saved?.status === "published"
            )
          }
          onChange={(event) => change(name, event.target.value)}
          {...inputProps(name)}
        />
      )}{" "}
      {inputError(name)}
    </label>
  );
  return (
    <div className="content-editor">
      <UnsavedGuard dirty={dirty} />
      <nav className="library-nav" aria-label="Editor navigation">
        <Link href="/admin/content">Content library</Link>
        {saved && (
          <Link
            href={`/admin/content/${saved.id}/preview`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Saved admin preview (new tab)
          </Link>
        )}
      </nav>
      <p className="library-notice">
        {saved ? `${saved.status} · revision ${saved.revision}` : "New draft"} ·{" "}
        {dirty ? "Unsaved changes" : "No unsaved changes"}. Text and HTTPS links
        only; attachments are unavailable.
        {saved?.status === "published"
          ? " Saved edits become visible to students immediately and must remain publication-ready."
          : ""}
      </p>
      {message && (
        <p role="status" className="editor-message">
          {message}
        </p>
      )}
      {!!Object.keys(fields).length && (
        <div role="alert">
          <h2>Check these fields</h2>
          <ul>
            {Object.entries(fields).map(([key, messages]) => (
              <li key={key}>
                {key}: {messages.join(" ")}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="editor-actions">
        <button
          className="button"
          type="button"
          onClick={() => setPreview((value) => !value)}
        >
          {preview ? "Back to editor" : "Preview local content"}
        </button>
        {saved && (
          <LifecycleControls
            key={`${saved.id}:${saved.revision}`}
            item={saved}
            disabled={dirty || busy || blocked}
            onSaved={(item) => {
              accept(item);
              setMessage("Lifecycle action confirmed.");
              router.refresh();
            }}
          />
        )}
        {saved && (
          <button
            className="button"
            type="button"
            disabled={busy}
            onClick={() => void reconcile()}
          >
            Load saved record to compare
          </button>
        )}
      </div>
      {dirty && saved && (
        <p>Save or discard changes before a publication action.</p>
      )}
      {(blocked || remote) && (
        <section
          className="editor-reconciliation"
          aria-label="Save reconciliation"
        >
          <h2>Reconcile before saving again</h2>
          <p>No automatic retry or revision overwrite has been performed.</p>
          <button
            className="button"
            disabled={busy}
            onClick={() => void reconcile()}
          >
            Read current saved state
          </button>
          {remote && (
            <>
              <p>
                Saved: {remote.title} · {remote.status} · revision{" "}
                {remote.revision}
              </p>
              <details>
                <summary>Compare current saved fields</summary>
                <pre>{JSON.stringify(remote, null, 2)}</pre>
              </details>
              <div className="editor-actions">
                <button
                  className="button"
                  onClick={() => {
                    if (
                      !dirty ||
                      window.confirm(
                        "Discard local input and use the saved record?",
                      )
                    ) {
                      if (!saved)
                        router.replace(`/admin/content/${remote.id}/edit`);
                      accept(remote);
                      setMessage("Loaded saved content.");
                    }
                  }}
                >
                  Use saved version (discard local)
                </button>
                {saved && remote.status !== "archived" && (
                  <button
                    className="button"
                    onClick={() => {
                      const next = rebaseEditor(
                        values,
                        baseline,
                        editorValues(remote),
                      );
                      setSaved(remote);
                      setBaseline(editorValues(remote));
                      setValues(next);
                      setBlocked(false);
                      setRemote(null);
                      setMessage(
                        "Local changed fields rebased explicitly. Review all fields before saving; no write has occurred.",
                      );
                    }}
                  >
                    Rebase my changed fields onto revision {remote.revision}
                  </button>
                )}
              </div>
            </>
          )}
          {notFound && (
            <button
              className="button"
              onClick={() => {
                setBlocked(false);
                setNotFound(false);
                setMessage(
                  "Retry unlocked by your choice. Review the intended slug and values before saving.",
                );
              }}
            >
              I reviewed the library; allow an explicit retry
            </button>
          )}
        </section>
      )}
      {preview ? (
        <ContentPreview
          local
          content={{
            ...values,
            estimatedMinutes: Number(values.estimatedMinutes),
            status: saved?.status ?? "draft",
            revision: saved?.revision,
          }}
        />
      ) : (
        <form onSubmit={save}>
          <fieldset disabled={busy || archived}>
            <legend>Content metadata</legend>
            <div className="editor-grid">
              {textField("title", "Title", 160)}
              {textField("slug", "Slug (fixed after first publication)", 120)}
              <label>
                Subject
                <select
                  value={values.subject}
                  onChange={(event) => {
                    const subject = event.target
                      .value as EditorValues["subject"];
                    setValues((previous) => ({
                      ...previous,
                      subject,
                      topic: catalogTopics[subject][0],
                    }));
                  }}
                >
                  {Object.keys(catalogTopics).map((subject) => (
                    <option key={subject} value={subject}>
                      {subject.toUpperCase()}
                    </option>
                  ))}
                </select>
                {inputError("subject")}
              </label>
              <label>
                Topic
                <select
                  value={values.topic}
                  onChange={(event) => change("topic", event.target.value)}
                >
                  {catalogTopics[values.subject].map((topic) => (
                    <option key={topic} value={topic}>
                      {topic.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
                {inputError("topic")}
              </label>
              <label>
                Content type
                <select
                  value={values.type}
                  onChange={(event) =>
                    change("type", event.target.value as EditorValues["type"])
                  }
                >
                  <option value="question">Question</option>
                  <option value="resource">Resource</option>
                </select>
                {inputError("type")}
              </label>
              <label>
                Difficulty
                <select
                  value={values.difficulty}
                  onChange={(event) =>
                    change(
                      "difficulty",
                      event.target.value as EditorValues["difficulty"],
                    )
                  }
                >
                  {["easy", "medium", "hard"].map((difficulty) => (
                    <option key={difficulty}>{difficulty}</option>
                  ))}
                </select>
                {inputError("difficulty")}
              </label>
              <label>
                Estimated minutes
                <input
                  type="number"
                  min={15}
                  max={60}
                  step={1}
                  required
                  value={values.estimatedMinutes}
                  onChange={(event) =>
                    change("estimatedMinutes", event.target.value)
                  }
                  {...inputProps("estimatedMinutes")}
                />
                {inputError("estimatedMinutes")}
              </label>
              <label>
                Tags (comma separated)
                <input
                  value={values.tags}
                  onChange={(event) => change("tags", event.target.value)}
                />
                {inputError("tags")}
              </label>
              <div>
                <label>
                  Review time (your local timezone)
                  <input
                    type="datetime-local"
                    value={values.reviewedAt}
                    onChange={(event) =>
                      change("reviewedAt", event.target.value)
                    }
                    {...inputProps("reviewedAt")}
                  />
                  {inputError("reviewedAt")}
                </label>
                <button
                  className="button"
                  type="button"
                  onClick={() =>
                    change("reviewedAt", localDate(new Date().toISOString()))
                  }
                >
                  Mark reviewed now
                </button>
              </div>
              {textField("source", "Source / provenance", 2048)}
              {textField("externalUrl", "External HTTPS URL", 2048)}
              {textField("attribution", "Attribution notes", 2000, true)}
            </div>
          </fieldset>
          <fieldset disabled={busy || archived}>
            <legend>Learning content (Markdown, no HTML)</legend>
            {textField("prompt", "Question prompt", 12000, true)}
            {textField("body", "Resource body", 12000, true)}
            {textField(
              "explanation",
              "Explanation (revealed on request)",
              12000,
              true,
            )}
          </fieldset>
          <fieldset disabled={busy || archived}>
            <legend>Optional company provenance</legend>
            <p>
              No associations means shared foundation content. Review dates use
              your local timezone and are sent as UTC.
            </p>
            {(["cognizant", "ltm"] as const).map((companyId) => {
              const company = values.companies.find(
                (entry) => entry.companyId === companyId,
              );
              return (
                <div key={companyId} className="editor-company">
                  <label className="editor-checkbox">
                    <input
                      type="checkbox"
                      checked={!!company}
                      onChange={(event) =>
                        change(
                          "companies",
                          event.target.checked
                            ? [
                                ...values.companies,
                                {
                                  companyId,
                                  association: "student_reported",
                                  source: "",
                                  reviewedAt: "",
                                },
                              ]
                            : values.companies.filter(
                                (entry) => entry.companyId !== companyId,
                              ),
                        )
                      }
                    />
                    {companyId === "ltm" ? "LTM" : "Cognizant"}
                  </label>
                  {company && (
                    <div className="editor-grid">
                      <label>
                        Association
                        <select
                          value={company.association}
                          onChange={(event) =>
                            change(
                              "companies",
                              values.companies.map((entry) =>
                                entry.companyId === companyId
                                  ? {
                                      ...entry,
                                      association: event.target
                                        .value as typeof entry.association,
                                    }
                                  : entry,
                              ),
                            )
                          }
                        >
                          <option value="student_reported">
                            Student reported
                          </option>
                          <option value="verified">Verified</option>
                        </select>
                      </label>
                      <label>
                        Company source
                        <input
                          required
                          maxLength={2048}
                          value={company.source}
                          onChange={(event) =>
                            change(
                              "companies",
                              values.companies.map((entry) =>
                                entry.companyId === companyId
                                  ? { ...entry, source: event.target.value }
                                  : entry,
                              ),
                            )
                          }
                        />
                      </label>
                      <label>
                        Company review time
                        <input
                          required
                          type="datetime-local"
                          value={company.reviewedAt}
                          onChange={(event) =>
                            change(
                              "companies",
                              values.companies.map((entry) =>
                                entry.companyId === companyId
                                  ? { ...entry, reviewedAt: event.target.value }
                                  : entry,
                              ),
                            )
                          }
                        />
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
            {inputError("companies")}
          </fieldset>
          <div className="editor-actions">
            <button
              className="button"
              type="submit"
              disabled={busy || blocked || archived}
            >
              {busy ? "Please wait…" : saved ? "Save changes" : "Save draft"}
            </button>
            <button
              className="button"
              type="button"
              disabled={busy}
              onClick={() => {
                if (!dirty || window.confirm("Discard unsaved changes?")) {
                  setValues(baseline);
                  setFields({});
                }
              }}
            >
              Discard local changes
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
