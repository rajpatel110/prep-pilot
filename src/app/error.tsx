"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main-content" className="auth-card">
      <h1>Temporarily unavailable</h1>
      <p className="section-copy">
        Account access could not be completed. Please try again shortly.
      </p>
      <button className="button" onClick={reset}>
        Try again
      </button>
      <Link href="/"> Back to home</Link>
    </main>
  );
}
