"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, ApiRequestError } from "@/shared/ui/api-client";
import type { AttemptInput } from "../schemas";
import { prepareSubmission, restoreSubmission } from "../submission";
const labels = {
  independent: "Solved independently",
  needed_help: "Solved with help",
  failed: "Not solved yet",
} as const;
type Receipt = {
  attemptId: string;
  submissionId: string;
  attemptSequence: number;
  createdAt: string;
  revision: { id: string; dueDate: string; intervalDays: number };
  stateRevision: number;
};
export function OutcomeForm({
  contentId,
  userId,
  kind = "practice",
}: {
  contentId: string;
  userId: string;
  kind?: "practice" | "revision";
}) {
  const router = useRouter();
  const [mode, setMode] = useState(kind);
  const [outcome, setOutcome] = useState<AttemptInput["outcome"] | "">("");
  const [difficulty, setDifficulty] = useState<
    NonNullable<AttemptInput["perceivedDifficulty"]> | ""
  >("");
  const [pending, setPending] = useState<AttemptInput | null>(null);
  const pendingRef = useRef<AttemptInput | null>(null);
  const [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [message, setMessage] = useState(""),
    [code, setCode] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null),
    [replayed, setReplayed] = useState(false);
  const [latest, setLatest] = useState<number | null>(null);
  const [storageWarning, setStorageWarning] = useState(false),
    [corrupt, setCorrupt] = useState(false);
  const key = `preppilot:pending-attempt:${userId}:${contentId}`;
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const saved = sessionStorage.getItem(key);
        if (saved) {
          const restored = restoreSubmission(saved, contentId);
          if (restored) {
            pendingRef.current = restored;
            setPending(restored);
            setMode(restored.kind);
            setOutcome(restored.outcome);
            setDifficulty(restored.perceivedDifficulty ?? "");
            setMessage(
              "An unfinished submission was restored. Retry explicitly with its original identifier.",
            );
          } else setCorrupt(true);
        }
      } catch {
        setStorageWarning(true);
      }
      setReady(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [key, contentId]);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busyRef.current || receipt || corrupt) return;
    if (!outcome) {
      setMessage("Choose an outcome before saving.");
      return;
    }
    const input = prepareSubmission(
      pendingRef.current,
      {
        contentId,
        kind: mode,
        outcome,
        ...(difficulty ? { perceivedDifficulty: difficulty } : {}),
      },
      () => crypto.randomUUID(),
    );
    pendingRef.current = input;
    setPending(input);
    try {
      sessionStorage.setItem(key, JSON.stringify(input));
    } catch {
      setStorageWarning(true);
    }
    busyRef.current = true;
    setBusy(true);
    setMessage("");
    setCode("");
    try {
      const result = await apiRequest("/api/v1/attempts", "POST", input);
      setReceipt(result.data);
      setReplayed(result.meta.replayed);
      setPending(null);
      pendingRef.current = null;
      try {
        sessionStorage.removeItem(key);
      } catch {
        setStorageWarning(true);
      }
      setMessage(
        result.meta.replayed
          ? "Original saved receipt recovered. No duplicate attempt was created. Check refreshed history and revisions for the latest state."
          : "Outcome recorded. No plan task was automatically completed.",
      );
      try {
        const history = await apiRequest(
          `/api/v1/attempts?contentId=${contentId}&limit=1`,
        );
        setLatest(history.data[0]?.attemptSequence ?? null);
        await apiRequest("/api/v1/revisions?dueOnly=false");
        await apiRequest("/api/v1/plans/current");
        await apiRequest("/api/v1/dashboard");
      } catch {
        setMessage(
          "The outcome is saved, but refreshing study views failed. Refresh history, revisions or the dashboard; do not resubmit this saved attempt.",
        );
      }
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Save could not be confirmed. Retry the same submission.",
      );
      if (error instanceof ApiRequestError) setCode(error.code);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  function startNew() {
    try {
      sessionStorage.removeItem(key);
    } catch {
      setStorageWarning(true);
    }
    pendingRef.current = null;
    setPending(null);
    setReceipt(null);
    setLatest(null);
    setOutcome("");
    setDifficulty("");
    setMode("practice");
    setMessage("");
    setCode("");
  }
  if (!ready)
    return (
      <section className="student-card">
        <p role="status">Preparing a safe practice submission…</p>
      </section>
    );
  return (
    <section
      className="student-card outcome-panel"
      aria-label="Record practice outcome"
    >
      <p className="eyebrow">
        {mode === "revision" ? "Revision recall" : "Practice outcome"}
      </p>
      <h2>How did this attempt go?</h2>
      <p>
        Your own assessment, not automated grading. Opening a question or
        website does not submit an outcome.
      </p>
      {storageWarning && (
        <p className="student-notice">
          Tab storage is unavailable. Keep this page open after an uncertain
          save to retain its identifier.
        </p>
      )}
      {receipt && latest !== null && (
        <p className="student-muted">
          Latest stored attempt sequence for this question: {latest}.
        </p>
      )}
      {corrupt ? (
        <div role="alert">
          <p>
            Saved submission data is invalid. Review history before explicitly
            discarding this local data.
          </p>
          <Link href="/attempts">Review history</Link>
          <button
            className="button"
            onClick={() => {
              startNew();
              setCorrupt(false);
            }}
          >
            Discard invalid local data
          </button>
        </div>
      ) : (
        <>
          {message && (
            <div className="student-notice" role={receipt ? "status" : "alert"}>
              {message}
              {!receipt && (
                <p>
                  <Link
                    href={`/login?returnTo=${encodeURIComponent(`/content/${contentId}?kind=${mode}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Sign in again in a new tab if needed
                  </Link>
                </p>
              )}
            </div>
          )}
          {code === "IDEMPOTENCY_CONFLICT" && (
            <div className="student-notice">
              <p>
                Stop retrying this identifier with changed input. Review saved
                history before starting a deliberate later attempt.
              </p>
              <Link href={`/attempts?contentId=${contentId}`}>
                Review history
              </Link>
              <button
                className="button button-outline"
                type="button"
                onClick={startNew}
              >
                Discard conflicting local input and start later
              </button>
            </div>
          )}
          {receipt ? (
            <div className="practice-confirmation">
              <h3>
                {replayed ? "Original saved receipt" : "Saved confirmation"}
              </h3>
              <p>
                Attempt sequence {receipt.attemptSequence} ·{" "}
                {outcome && labels[outcome]}
              </p>
              <p>
                {replayed
                  ? "Revision date in the original receipt"
                  : "Next revision date"}
                : <strong>{receipt.revision.dueDate}</strong> · Asia/Kolkata ·{" "}
                {receipt.revision.intervalDays} calendar days.
              </p>
              <p>
                Later attempts may have changed the current cycle; this receipt
                does not overwrite newer state.
              </p>
              <div className="student-actions">
                <Link href="/revisions?dueOnly=false">
                  View current revisions
                </Link>
                <Link href={`/attempts?contentId=${contentId}`}>
                  View saved history
                </Link>
                <button className="button button-outline" onClick={startNew}>
                  Start a later practice attempt
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} aria-busy={busy}>
              <fieldset
                disabled={busy || !!pending}
                className="student-options"
              >
                <legend>Your outcome</legend>
                {(
                  Object.entries(labels) as [AttemptInput["outcome"], string][]
                ).map(([value, label]) => (
                  <label className="practice-option" key={value}>
                    <input
                      type="radio"
                      name="outcome"
                      checked={outcome === value}
                      onChange={() => setOutcome(value)}
                    />{" "}
                    <span>{label}</span>
                  </label>
                ))}
                <label className="student-label">
                  Perceived difficulty (optional)
                  <select
                    value={difficulty}
                    onChange={(event) =>
                      setDifficulty(event.target.value as typeof difficulty)
                    }
                  >
                    <option value="">Not rated</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </label>
              </fieldset>
              {pending && (
                <p className="student-muted">
                  Submission identity retained: {pending.submissionId}.
                  Selection is frozen for safe retries.
                </p>
              )}
              <div className="student-actions">
                <button
                  className="button"
                  disabled={busy || code === "IDEMPOTENCY_CONFLICT"}
                  type="submit"
                >
                  {busy
                    ? "Saving outcome…"
                    : pending
                      ? "Retry same submission"
                      : mode === "revision"
                        ? "Save revision outcome"
                        : "Save outcome"}
                </button>
                {[
                  "VALIDATION_ERROR",
                  "CONTENT_NOT_ATTEMPTABLE",
                  "REVISION_NOT_FOUND",
                ].includes(code) && (
                  <button
                    className="button button-outline"
                    type="button"
                    onClick={startNew}
                  >
                    Correct rejected input
                  </button>
                )}
              </div>
            </form>
          )}
        </>
      )}
    </section>
  );
}
