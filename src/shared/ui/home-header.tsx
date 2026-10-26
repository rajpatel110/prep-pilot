"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MobileMenu } from "./mobile-menu";
import { PageContainer } from "./page-container";
import { ThemeToggle } from "./theme-toggle";

export function HomeHeader() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    let controller: AbortController | undefined;
    async function refresh() {
      controller?.abort();
      const current = new AbortController();
      controller = current;
      try {
        const response = await fetch("/api/v1/me", {
          cache: "no-store",
          credentials: "same-origin",
          signal: current.signal,
        });
        if (!current.signal.aborted)
          setSignedIn(
            response.ok ? true : response.status === 401 ? false : null,
          );
      } catch {
        if (!current.signal.aborted) setSignedIn(null);
      }
    }
    void refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    return () => {
      controller?.abort();
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
    };
  }, []);
  const accountHref = signedIn === false ? "/login" : "/account";
  return (
    <header className="site-header">
      <PageContainer>
        <div className="header-row">
          <Link href="/" aria-label="PrepPilot home" className="brand">
            <span aria-hidden="true" className="brand-mark">
              ↗
            </span>
            PrepPilot
          </Link>
          <nav aria-label="Main navigation" className="desktop-nav">
            <a href="#how-it-works">How it works</a>
            <a href="#subjects">Subjects</a>
            <a href="#faq">FAQ</a>
            <Link href="/#about">About</Link>
            <a href={accountHref}>
              {signedIn === false
                ? "Sign in"
                : signedIn === true
                  ? "My account"
                  : "Open app"}
            </a>
          </nav>
          <div className="header-controls">
            <ThemeToggle />
            <MobileMenu signedIn={signedIn} />
          </div>
          <a
            href={signedIn === false ? "/signup" : "/account"}
            className="button button-small desktop-action"
          >
            {signedIn === false
              ? "Get started ↗"
              : signedIn === true
                ? "Continue ↗"
                : "Open app ↗"}
          </a>
        </div>
      </PageContainer>
    </header>
  );
}
