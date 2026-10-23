"use client";

import { useRef } from "react";

export function MobileMenu() {
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
        <a href="/login" onClick={closeMenu}>
          Sign in
        </a>
        <a href="/signup" onClick={closeMenu}>
          Get started
        </a>
      </nav>
    </details>
  );
}
