"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function AuthForm({
  mode,
  enabled,
  emailMode,
}: {
  mode: "login" | "signup";
  enabled: boolean;
  emailMode: "test" | "live";
}) {
  const [visible, setVisible] = useState(false);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const signup = mode === "signup";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    const values = new FormData(event.currentTarget);
    const body = {
      email: String(values.get("email")),
      password: String(values.get("password")),
      ...(signup
        ? { name: String(values.get("name")) }
        : { rememberMe: values.get("remember") === "on" }),
    };
    try {
      const response = await fetch(
        `/api/auth/${signup ? "sign-up" : "sign-in"}/email`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (!response.ok) {
        setMessage(
          response.status === 429
            ? "Too many attempts. Please try again later."
            : response.status === 422
              ? "Check your details. Use a valid email and a password of 12–128 characters for signup."
              : response.status >= 500
                ? "Account access is temporarily unavailable. Please try again."
                : signup
                  ? "Unable to create this account. If you already have an account, sign in."
                  : "Email or password is incorrect.",
        );
        return;
      }
      router.replace("/account");
      router.refresh();
    } catch {
      setMessage(
        "Unable to connect. Your details are still here; please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="auth-form" aria-busy={busy}>
      {!enabled && (
        <p role="status" className="plan-note">
          Account access needs local configuration. Please complete the
          authentication setup first.
        </p>
      )}
      {signup && (
        <label htmlFor="name">
          Your name
          <input
            id="name"
            name="name"
            autoComplete="name"
            required
            maxLength={100}
          />
        </label>
      )}
      <label htmlFor="email">
        Email address
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
        />
      </label>
      <div className="password-field">
        <label htmlFor="password">Password</label>
        <span className="password-control">
          <input
            id="password"
            name="password"
            type={visible ? "text" : "password"}
            autoComplete={signup ? "new-password" : "current-password"}
            required
            minLength={signup ? 12 : 1}
            maxLength={128}
            aria-describedby={signup ? "password-hint" : undefined}
          />
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
          >
            {visible ? "Hide" : "Show"}
          </button>
        </span>
      </div>
      {signup && (
        <p id="password-hint" className="small-note">
          Use 12–128 characters. Spaces are preserved.
        </p>
      )}
      {!signup && (
        <div className="between">
          <label className="remember">
            <input type="checkbox" name="remember" defaultChecked />
            Keep me signed in
          </label>
          <Link href="/forgot-password">Forgot password?</Link>
        </div>
      )}
      <p role="alert" className="auth-error">
        {message}
      </p>
      <button disabled={busy || !enabled} className="button" type="submit">
        {busy ? "Please wait…" : signup ? "Create account" : "Sign in"}
      </button>
      <p className="small-note">
        {signup ? "Already have an account?" : "New to PrepPilot?"}{" "}
        <Link href={signup ? "/login" : "/signup"}>
          {signup ? "Sign in" : "Create an account"}
        </Link>
      </p>
      <p className="small-note">
        {emailMode === "test"
          ? "Demo email mode: verification and password recovery are currently unavailable."
          : "Email verification is required for study access. Delivery and password recovery are not configured yet."}
      </p>
    </form>
  );
}
