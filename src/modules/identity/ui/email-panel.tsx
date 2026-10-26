"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { emailAvailability } from "@/modules/notifications/policy";
import { SignOut } from "@/shared/ui/sign-out";
import { watchEmailLink } from "./email-link";

export function EmailPanel({
  mode,
  availability,
  user,
}: {
  mode: "verification" | "forgot" | "reset";
  availability: ReturnType<typeof emailAvailability>;
  user?: { email: string; verified: boolean; canRequest: boolean } | undefined;
}) {
  const linkRevision = useRef(0);
  const [token, setToken] = useState("");
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [verified, setVerified] = useState(false);
  const [confirmationBlocked, setConfirmationBlocked] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    let active = true;
    const unsubscribe = watchEmailLink(window, (value) => {
      linkRevision.current += 1;
      setToken(value);
      setDone(false);
      setConfirmationBlocked(false);
      setMessage("");
      setError("");
      setPassword("");
      setConfirmation("");
    });
    queueMicrotask(() => {
      if (active) setReady(true);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);
  const enabled = availability.passwordRecovery;
  async function perform(
    operation: string,
    body: object,
    authenticated = false,
  ) {
    if (busy) return;
    const revision = linkRevision.current;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      async function send() {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (authenticated) {
          const response = await fetch("/api/v1/security/csrf", {
            cache: "no-store",
          });
          if (!response.ok) throw new Error("session");
          headers["X-CSRF-Token"] = (await response.json()).data.token;
        }
        return fetch(`/api/v1/identity/${operation}`, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });
      }
      let response = await send();
      let result = await response.json();
      if (revision !== linkRevision.current) return;
      if (authenticated && result.error?.code === "CSRF_TOKEN_EXPIRED") {
        response = await send();
        result = await response.json();
        if (revision !== linkRevision.current) return;
      }
      if (!response.ok) {
        if (response.status === 429) {
          setCooldown(
            Math.min(
              3600,
              Math.max(1, Number(response.headers.get("Retry-After")) || 60),
            ),
          );
          setError("Too many requests. Wait before trying again.");
        } else if (result.error?.code === "TOKEN_INVALID_OR_EXPIRED") {
          setConfirmationBlocked(true);
          setError(
            "This link is invalid, expired or already used. Check whether the action succeeded by signing in, or request a new link.",
          );
        } else if (response.status === 503) {
          if (operation.endsWith("/confirm")) setConfirmationBlocked(true);
          setError(
            operation.endsWith("/confirm")
              ? "Confirmation could not be completed. Check your account by signing in before requesting a new link. Do not repeatedly submit this token."
              : "Email delivery is unavailable for this account or environment. Your entries are preserved.",
          );
        } else if (response.status === 401) {
          setError("Sign in again before requesting a verification link.");
        } else
          setError(
            "Check your entries and try again. Passwords must have 12–128 characters.",
          );
        return;
      }
      if (operation.endsWith("/confirm")) {
        if (mode === "verification") setVerified(true);
        setDone(true);
        setToken("");
        setPassword("");
        setConfirmation("");
        setMessage(
          mode === "reset"
            ? "Password reset confirmed. Previous sessions have been revoked. Sign in with your new password."
            : "Email verification confirmed. Sign in to continue.",
        );
      } else if (result.data.status === "already_verified") {
        setVerified(true);
        setDone(true);
        setMessage("Your email is already verified.");
      } else {
        setCooldown(60);
        setMessage(
          mode === "forgot"
            ? "If an eligible account exists, a reset request has been accepted. Check its inbox and spam folder. Acceptance does not confirm email delivery."
            : "Verification request accepted. Check your inbox and spam folder. Acceptance does not confirm email delivery.",
        );
      }
    } catch {
      if (revision !== linkRevision.current) return;
      if (operation.endsWith("/confirm")) setConfirmationBlocked(true);
      setError(
        "Connection lost. Your entries are preserved. If you confirmed a link, first try signing in or checking your account: it may already have succeeded.",
      );
    } finally {
      setBusy(false);
    }
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === "reset" && confirmationBlocked) return;
    if (mode === "forgot")
      void perform("password-reset/request", {
        email: email.trim().toLowerCase(),
      });
    else if (password !== confirmation)
      setError("The passwords do not match. Your entries are preserved.");
    else
      void perform("password-reset/confirm", { token, newPassword: password });
  }
  return (
    <div className="auth-form" aria-busy={busy}>
      <p className="eyebrow">Account security</p>
      <h1>
        {mode === "verification"
          ? "Verify your email"
          : mode === "forgot"
            ? "Forgot your password?"
            : "Choose a new password"}
      </h1>
      <p className="section-copy">
        {mode === "verification"
          ? "Opening this page does not verify your email. Confirm explicitly using the button below. Verification links expire in 60 minutes."
          : mode === "forgot"
            ? "Request a secure link to reset your password. Reset links expire in 30 minutes."
            : "Use 12–128 characters. Spaces are preserved. Resetting signs out all your existing sessions."}
      </p>
      {availability.deliveryMode === "owner_test" && (
        <p className="plan-note" role="status">
          Local owner-inbox testing only. General-user email delivery is not
          available. Messages are never redirected to another address.
        </p>
      )}
      {!enabled && (
        <p className="plan-note" role="status">
          Email delivery is unavailable.{" "}
          {availability.emailMode === "live"
            ? "Verification remains required before study access."
            : "General demo accounts remain unverified."}{" "}
          Verification and password recovery cannot be completed here until
          delivery is configured.
        </p>
      )}
      {availability.deliveryMode === "restricted" && (
        <p className="plan-note" role="status">
          Delivery is limited to approved test inboxes. Messages are never
          redirected. Request acceptance does not confirm inbox delivery.
        </p>
      )}
      {mode === "verification" && user && (
        <p>
          {user.email} —{" "}
          {user.verified || verified ? "Email verified" : "Email not verified"}
        </p>
      )}
      {message && (
        <p role="status" className="plan-note">
          {message}
        </p>
      )}
      <p className="auth-error" role="alert">
        {error}
      </p>
      {cooldown > 0 && (
        <p className="small-note">
          You can request again in {cooldown} seconds.
        </p>
      )}
      {!done && mode === "verification" && (
        <>
          {token && (
            <button
              type="button"
              className="button"
              disabled={!enabled || busy || confirmationBlocked}
              onClick={() => void perform("verification/confirm", { token })}
            >
              {busy ? "Confirming…" : "Confirm email verification"}
            </button>
          )}
          {!token && ready && !user && (
            <p>
              Sign in to request a verification link, or open the complete link
              from your email.
            </p>
          )}
          {user && !user.verified && (
            <button
              type="button"
              className="button"
              disabled={!user.canRequest || busy || cooldown > 0}
              onClick={() => void perform("verification/request", {}, true)}
            >
              {busy ? "Requesting…" : "Send a new verification link"}
            </button>
          )}
          {user && !user.canRequest && !user.verified && enabled && (
            <p className="small-note">
              This account is not eligible for email delivery in the current
              environment.
            </p>
          )}
        </>
      )}
      {!done && mode !== "verification" && (
        <form className="auth-form" onSubmit={submit}>
          {mode === "forgot" ? (
            <label htmlFor="recovery-email">
              Email address
              <input
                id="recovery-email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
          ) : (
            <>
              {ready && !token && (
                <p role="status">
                  Open the complete reset link from your email. No token was
                  found on this page.
                </p>
              )}
              <label htmlFor="new-password">
                New password
                <input
                  id="new-password"
                  type={visible ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={12}
                  maxLength={128}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>
              <label htmlFor="confirm-password">
                Confirm new password
                <input
                  id="confirm-password"
                  type={visible ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={12}
                  maxLength={128}
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                />
              </label>
              <button
                type="button"
                aria-pressed={visible}
                onClick={() => setVisible(!visible)}
              >
                {visible ? "Hide passwords" : "Show passwords"}
              </button>
            </>
          )}
          <button
            className="button"
            type="submit"
            disabled={
              !enabled ||
              busy ||
              cooldown > 0 ||
              (mode === "reset" && (!token || confirmationBlocked))
            }
          >
            {busy
              ? "Please wait…"
              : mode === "forgot"
                ? "Request reset link"
                : "Confirm password reset"}
          </button>
        </form>
      )}
      <p>
        <Link href="/login">Back to sign in</Link>
        {mode !== "forgot" && (
          <>
            {" "}
            · <Link href="/forgot-password">Request a password reset link</Link>
          </>
        )}
      </p>
      {user && (
        <>
          <Link href="/account">Check account status</Link>
          <SignOut />
        </>
      )}
    </div>
  );
}
