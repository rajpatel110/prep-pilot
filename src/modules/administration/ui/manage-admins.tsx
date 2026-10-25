"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest, ApiRequestError } from "@/shared/ui/api-client";
import { accountEmail, type ManagedAccount } from "../schemas";

type Selection = {
  account: ManagedAccount;
  role: "student" | "admin";
  operationId: string;
};
const base = "/api/v1/admin/administrators";
export function ManageAdmins() {
  const [items, setItems] = useState<ManagedAccount[]>([]),
    [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true),
    [listError, setListError] = useState("");
  const [email, setEmail] = useState(""),
    [found, setFound] = useState<ManagedAccount | null>(null);
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [denied, setDenied] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null),
    [password, setPassword] = useState("");
  const [reason, setReason] = useState(""),
    [confirmedUntil, setConfirmedUntil] = useState(0),
    [needsPassword, setNeedsPassword] = useState(true);
  const [dialogError, setDialogError] = useState(""),
    [uncertain, setUncertain] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null),
    trigger = useRef<HTMLElement | null>(null);
  const describe = useCallback((error: unknown) => {
    if (error instanceof ApiRequestError) {
      if (
        error.code === "UNAUTHENTICATED" ||
        error.code === "FORBIDDEN" ||
        error.code === "ACCOUNT_UNAVAILABLE"
      )
        setDenied(true);
      return error.message;
    }
    return "The request could not be confirmed. Check the current state before trying again.";
  }, []);
  const load = useCallback(
    async (next?: string) => {
      setLoading(true);
      setListError("");
      try {
        const result = await apiRequest(
          `${base}?limit=20${next ? `&cursor=${encodeURIComponent(next)}` : ""}`,
        );
        setItems((previous) =>
          next ? [...previous, ...result.data] : result.data,
        );
        setCursor(result.meta.page.nextCursor);
      } catch (error) {
        setListError(describe(error));
      } finally {
        setLoading(false);
      }
    },
    [describe],
  );
  useEffect(() => {
    let active = true;
    void apiRequest(`${base}?limit=20`)
      .then((result) => {
        if (active) {
          setItems(result.data);
          setCursor(result.meta.page.nextCursor);
        }
      })
      .catch((error) => {
        if (active) setListError(describe(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [describe]);
  useEffect(() => {
    if (!selection) return;
    dialog.current?.showModal();
    dialog.current?.querySelector("button")?.focus();
  }, [selection]);
  useEffect(() => {
    if (!confirmedUntil) return;
    const timer = setTimeout(
      () => {
        setConfirmedUntil(0);
        setNeedsPassword(true);
      },
      Math.max(0, confirmedUntil - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [confirmedUntil]);
  function close() {
    if (busy) return;
    dialog.current?.close();
    setSelection(null);
    setPassword("");
    setDialogError("");
    setReason("");
    trigger.current?.focus();
  }
  function choose(account: ManagedAccount, role: "student" | "admin") {
    trigger.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setSelection({ account, role, operationId: crypto.randomUUID() });
    setNeedsPassword(confirmedUntil === 0);
    setDialogError("");
    setUncertain(false);
    setReason("");
  }
  async function find() {
    const parsed = accountEmail.safeParse(email);
    if (!parsed.success) {
      setFound(null);
      setMessage("Enter a valid exact account email.");
      return;
    }
    setBusy(true);
    setMessage("");
    setFound(null);
    try {
      setFound(
        (await apiRequest(`${base}/lookup`, "POST", { email: parsed.data }))
          .data,
      );
    } catch (error) {
      setMessage(describe(error));
    } finally {
      setBusy(false);
    }
  }
  async function reauthenticate() {
    setBusy(true);
    setDialogError("");
    try {
      const result = await apiRequest(`${base}/reauthenticate`, "POST", {
        password,
      });
      setConfirmedUntil(Date.parse(result.data.expiresAt));
      setNeedsPassword(false);
    } catch (error) {
      setDialogError(describe(error));
    } finally {
      setPassword("");
      setBusy(false);
    }
  }
  async function change() {
    if (!selection || uncertain) return;
    if (selection.account.role === "owner") return;
    setBusy(true);
    setDialogError("");
    try {
      const result = await apiRequest(
        `${base}/${encodeURIComponent(selection.account.userId)}/role`,
        "PATCH",
        {
          role: selection.role,
          expectedRole: selection.account.role,
          expectedStateRevision: selection.account.stateRevision,
          operationId: selection.operationId,
          reason,
        },
      );
      setFound(result.data.account);
      setMessage(
        "Access change confirmed by the server. Authored content and study history are preserved.",
      );
      dialog.current?.close();
      setSelection(null);
      setReason("");
      trigger.current?.focus();
      await load();
    } catch (error) {
      if (
        error instanceof ApiRequestError &&
        error.code === "REAUTHENTICATION_REQUIRED"
      )
        setNeedsPassword(true);
      if (
        error instanceof ApiRequestError &&
        (error.uncertain ||
          ["STATE_CONFLICT", "EMAIL_NOT_VERIFIED"].includes(error.code))
      )
        setUncertain(true);
      setDialogError(describe(error));
    } finally {
      setBusy(false);
    }
  }
  async function reconcile() {
    if (!selection) return;
    setBusy(true);
    try {
      const current = (
        await apiRequest(
          `${base}/${encodeURIComponent(selection.account.userId)}`,
        )
      ).data as ManagedAccount;
      setFound(current);
      setMessage(
        `Current confirmed role: ${current.role}; revision ${current.stateRevision}. Review this account and start a new confirmation if a further change is needed. The previous response was uncertain; it has not been resubmitted.`,
      );
      dialog.current?.close();
      setSelection(null);
      setReason("");
      trigger.current?.focus();
      await load();
    } catch (error) {
      setDialogError(describe(error));
    } finally {
      setBusy(false);
    }
  }
  const accountSummary = (account: ManagedAccount) => (
    <>
      <strong>{account.name || "Unnamed account"}</strong>
      <span className="admin-email">{account.email}</span>
      <span>
        {account.role} ·{" "}
        {account.emailVerified ? "Email verified" : "Email not verified"} ·{" "}
        {account.lifecycle}
      </span>
    </>
  );
  return (
    <div className="admin-management">
      <p className="eyebrow">Access governance · Owner only</p>
      <p>
        Choose who can manage PrepPilot’s content and files. All roles use the
        same email/password sign-in.
      </p>
      {denied && (
        <p role="alert">
          Owner access is no longer available. Sign in again or return to your
          account. No further changes can be submitted.
        </p>
      )}
      {message && (
        <p role="status" className="admin-feedback">
          {message}
        </p>
      )}
      <section aria-labelledby="current-administrators">
        <h2 id="current-administrators">Current administrators</h2>
        <p>
          Ownership cannot be changed here. Removing admin access returns an
          account to student access without deleting its history.
        </p>
        {loading && <p role="status">Loading administrators…</p>}
        {listError && <p role="alert">{listError}</p>}
        {!loading && !items.length && !listError && (
          <p>No administrator profiles found.</p>
        )}
        <ul className="admin-account-list">
          {items.map((account) => (
            <li key={account.userId}>
              <div className="admin-account-summary">
                {accountSummary(account)}
              </div>
              {account.role === "owner" ? (
                <span className="admin-owner-badge">
                  Owner protected · Ownership cannot be changed here
                </span>
              ) : (
                <button
                  className="button"
                  disabled={busy || denied || account.lifecycle !== "active"}
                  onClick={() => choose(account, "student")}
                >
                  Remove admin access for {account.name || account.email}
                </button>
              )}
            </li>
          ))}
        </ul>
        <div className="editor-actions">
          <button
            className="button"
            disabled={busy || denied || loading}
            onClick={() => void load()}
          >
            Refresh administrators
          </button>
          {cursor && (
            <button
              className="button"
              disabled={busy || denied || loading}
              onClick={() => void load(cursor)}
            >
              Load more administrators
            </button>
          )}
        </div>
      </section>
      <section aria-labelledby="add-administrator">
        <h2 id="add-administrator">Add an administrator</h2>
        <p>
          Find an existing account by its exact email. The account must verify
          its own email before promotion, including in demo mode. General-user
          email delivery is not yet available.
        </p>
        <form
          className="admin-lookup"
          onSubmit={(event) => {
            event.preventDefault();
            void find();
          }}
        >
          <label>
            Account email
            <input
              type="email"
              autoComplete="off"
              required
              maxLength={254}
              value={email}
              disabled={busy || denied}
              onChange={(event) => {
                setEmail(event.target.value);
                setFound(null);
                setMessage("");
              }}
            />
          </label>
          <button className="button button-primary" disabled={busy || denied}>
            {busy ? "Working…" : "Find account"}
          </button>
        </form>
        {found && (
          <div className="admin-lookup-result">
            <div className="admin-account-summary">{accountSummary(found)}</div>
            {found.eligible ? (
              <>
                <p>Eligible account found</p>
                <button
                  className="button button-primary"
                  disabled={busy || denied}
                  onClick={() => choose(found, "admin")}
                >
                  Grant admin access
                </button>
              </>
            ) : (
              <p>
                {found.role === "owner"
                  ? "Owner protected. Ownership cannot be changed here."
                  : found.role === "admin"
                    ? "This account already has admin access."
                    : found.lifecycle !== "active"
                      ? "This account is inactive and cannot be promoted."
                      : "This account must verify its own email before promotion."}
              </p>
            )}
          </div>
        )}
      </section>
      {selection && (
        <dialog
          ref={dialog}
          className="library-dialog"
          aria-labelledby="admin-change-title"
          aria-describedby="admin-change-target"
          onCancel={(event) => {
            event.preventDefault();
            close();
          }}
        >
          <h2 id="admin-change-title">
            {needsPassword
              ? "Confirm your current password"
              : selection.role === "admin"
                ? "Grant admin access?"
                : "Remove admin access?"}
          </h2>
          <div id="admin-change-target" className="admin-account-summary">
            {accountSummary(selection.account)}
          </div>
          <p>
            {selection.role === "admin"
              ? "This account will be able to manage content and files."
              : "This account will return to student access. Saved content, plans and practice history remain intact."}
          </p>
          {dialogError && <p role="alert">{dialogError}</p>}
          <button className="button" disabled={busy} onClick={close}>
            {uncertain ? "Close without retrying" : "Cancel"}
          </button>
          {uncertain ? (
            <button
              className="button"
              disabled={busy || denied}
              onClick={() => void reconcile()}
            >
              Check current account before continuing
            </button>
          ) : needsPassword ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void reauthenticate();
              }}
            >
              <label>
                Current password
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  maxLength={128}
                  value={password}
                  disabled={busy || denied}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>
              <p>
                Confirmation is valid for five minutes in this session only. You
                must still explicitly confirm the access change afterward.
              </p>
              <button
                className="button button-primary"
                disabled={busy || denied}
              >
                {busy ? "Confirming…" : "Confirm password"}
              </button>
            </form>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void change();
              }}
            >
              <label>
                Reason for access change
                <textarea
                  required
                  maxLength={500}
                  value={reason}
                  disabled={busy || denied}
                  onChange={(event) => setReason(event.target.value)}
                />
              </label>
              <button
                className="button button-primary"
                disabled={busy || denied || !reason.trim()}
              >
                {busy
                  ? "Changing access…"
                  : selection.role === "admin"
                    ? "Confirm grant admin access"
                    : "Confirm remove admin access"}
              </button>
            </form>
          )}
        </dialog>
      )}
    </div>
  );
}
