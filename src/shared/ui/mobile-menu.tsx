"use client";

import { useRef } from "react";
import Link from "next/link";

export function MobileMenu({
  signedIn = false,
}: {
  signedIn?: boolean | null;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const summaryRef = useRef<HTMLElement>(null);

  function closeMenu() {
    if (detailsRef.current) detailsRef.current.open = false;
  }

  return (
    <details
      ref={detailsRef}
      className="mobile-menu"
      onKeyDown={(event) => {
        if (event.key === "Escape" && detailsRef.current?.open) {
          event.preventDefault();
          closeMenu();
          summaryRef.current?.focus();
        }
      }}
    >
      <summary ref={summaryRef}>Menu ☰</summary>
      <nav aria-label="Mobile navigation">
        <a href="#how-it-works" onClick={closeMenu}>
          How it works
        </a>
        <a href="#subjects" onClick={closeMenu}>
          Subjects
        </a>
        <a href="#faq" onClick={closeMenu}>
          FAQ
        </a>
        <Link href="/#about" onClick={closeMenu}>
          About
        </Link>
        <a
          href={signedIn === false ? "/login" : "/account"}
          onClick={closeMenu}
        >
          {signedIn === false
            ? "Sign in"
            : signedIn === true
              ? "My account"
              : "Open app"}
        </a>
        {signedIn === false && (
          <a href="/signup" onClick={closeMenu}>
            Get started
          </a>
        )}
      </nav>
    </details>
  );
}
