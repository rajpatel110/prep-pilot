"use client";
import { useEffect, useRef, useState } from "react";
import type { AdminContentDetail } from "../dto";
import type { LifecycleAction } from "../publication";
import { catalogRequest, CatalogRequestError } from "./catalog-client";

export function LifecycleControls({
  item,
  onSaved,
  disabled = false,
}: {
  item: AdminContentDetail;
  onSaved: (item: AdminContentDetail) => void;
  disabled?: boolean;
}) {
  const [action, setAction] = useState<LifecycleAction | null>(null);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const submitting = useRef(false);
  useEffect(() => {
    if (action) dialog.current?.showModal();
  }, [action]);
  function close() {
    if (busy) return;
    dialog.current?.close();
    setAction(null);
    trigger.current?.focus();
  }
  const available: LifecycleAction =
    item.status === "draft"
      ? "publish"
      : item.status === "published"
        ? "archive"
        : "reopen";
  async function confirm() {
    if (!action || submitting.current || blocked) return;
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await catalogRequest(
        `/api/v1/admin/content/${item.id}/${action}`,
        "POST",
        {
          expectedRevision: item.revision,
          ...(action === "archive" ? { reason } : {}),
        },
      );
      onSaved(result.data);
      dialog.current?.close();
      setAction(null);
      trigger.current?.focus();
    } catch (cause) {
      setError(
        cause instanceof CatalogRequestError
          ? `${cause.message} ${Object.values(cause.fields).flat().join(" ")}`
          : cause instanceof Error
            ? cause.message
            : "Action failed.",
      );
      if (
        cause instanceof CatalogRequestError &&
        (cause.uncertain ||
          cause.code === "CONTENT_CONFLICT" ||
          cause.code === "INVALID_CONTENT_STATE")
      )
        setBlocked(true);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="lifecycle-controls">
      <button
        className="button"
        disabled={disabled}
        onClick={(event) => {
          trigger.current = event.currentTarget;
          setError("");
          setReason("");
          setAction(available);
        }}
      >
        {available === "publish"
          ? "Publish"
          : available === "archive"
            ? "Archive"
            : "Reopen as draft"}
      </button>
      {action && (
        <dialog
          ref={dialog}
          className="library-dialog"
          aria-labelledby="lifecycle-title"
          onCancel={(event) => {
            event.preventDefault();
            close();
          }}
        >
          <h2 id="lifecycle-title">Confirm {action}</h2>
          <p>
            {item.title} · saved revision {item.revision}
          </p>
          <p>
            {action === "publish"
              ? "Publish reviewed content for student reads. All publication requirements must pass."
              : action === "archive"
                ? "Remove this content from new discovery. Existing references and snapshots will be retained."
                : "Return this archived item to draft for review. It remains unavailable to students and its slug stays fixed."}
          </p>
          {action === "archive" && (
            <label>
              Archive reason
              <textarea
                value={reason}
                maxLength={500}
                required
                onChange={(event) => setReason(event.target.value)}
              />
            </label>
          )}
          {error && (
            <p role="alert" className="auth-error">
              {error}
            </p>
          )}
          {blocked && (
            <p>
              The outcome or revision changed. Close this dialog and
              reload/reconcile the saved record before another action. No
              automatic retry was performed.
            </p>
          )}
          <div className="editor-actions">
            <button
              className="button"
              autoFocus
              disabled={busy}
              onClick={close}
            >
              Cancel
            </button>
            <button
              className="button"
              disabled={
                busy || blocked || (action === "archive" && !reason.trim())
              }
              onClick={() => void confirm()}
            >
              {busy ? "Please wait…" : `Confirm ${action}`}
            </button>
          </div>
        </dialog>
      )}
    </div>
  );
}
