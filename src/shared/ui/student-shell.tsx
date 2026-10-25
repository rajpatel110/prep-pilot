import Link from "next/link";
import { SignOut } from "./sign-out";
import { StudentNavigation } from "./student-navigation";
import { ThemeToggle } from "./theme-toggle";
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
        {!onboarding && <StudentNavigation />}
        <span className="student-name">{name}</span>
        <div className="header-controls">
          <ThemeToggle />
          <SignOut />
        </div>
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
