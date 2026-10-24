import Link from "next/link";
import { SignOut } from "./sign-out";
import "@/app/content/student.css";

export function StudentShell({
  name,
  children,
  onboarding = false,
}: {
  name: string;
  children: React.ReactNode;
  onboarding?: boolean;
}) {
  return (
    <div className="student-app">
      <header className="student-header">
        <Link className="brand" href="/account">
          PrepPilot
        </Link>
        <nav aria-label="Student navigation">
          {!onboarding && (
            <>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/plans">Study plan</Link>
              <Link href="/content">Content library</Link>
              <Link href="/revisions">Revisions</Link>
              <Link href="/attempts">History</Link>
              <Link href="/onboarding?edit=1">Preferences</Link>
            </>
          )}
        </nav>
        <span className="student-name">{name}</span>
        <SignOut />
      </header>
      <main id="main-content" className="student-main">
        {children}
      </main>
      <footer className="student-footer">
        PrepPilot · Structured placement preparation · Study timezone:
        Asia/Kolkata
      </footer>
    </div>
  );
}
