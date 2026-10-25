"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const destinations = [
  ["/dashboard", "Dashboard"],
  ["/content", "Content library"],
  ["/plans", "Study plan"],
  ["/revisions", "Revisions"],
  ["/attempts", "Practice history"],
  ["/progress", "Progress"],
  ["/account?view=settings", "Settings"],
] as const;

export function StudentNavigation() {
  const pathname = usePathname();
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (menu.current) menu.current.open = false;
  }, [pathname]);
  function links() {
    return destinations.map(([href, label]) => {
      const path = href.split("?")[0]!;
      const active =
        pathname === path ||
        (path === "/plans" && pathname.startsWith("/plan-previews/")) ||
        pathname.startsWith(`${path}/`);
      return (
        <Link key={href} href={href} aria-current={active ? "page" : undefined}>
          {label}
        </Link>
      );
    });
  }
  return (
    <>
      <nav className="student-desktop-nav" aria-label="Student navigation">
        {links()}
      </nav>
      <details
        className="student-mobile-nav"
        ref={menu}
        onKeyDown={(event) => {
          if (event.key === "Escape" && menu.current?.open) {
            event.preventDefault();
            menu.current.open = false;
            menu.current.querySelector("summary")?.focus();
          }
        }}
      >
        <summary>Study navigation</summary>
        <nav aria-label="Student navigation">{links()}</nav>
      </details>
    </>
  );
}
