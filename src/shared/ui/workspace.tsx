import Link from "next/link";
import { PageContainer } from "./page-container";
import { SignOut } from "./sign-out";
import { ThemeToggle } from "./theme-toggle";
export function Workspace({
  name,
  title,
  children,
  wide = false,
}: {
  name: string;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <PageContainer>
      <header className="header-row">
        <Link className="brand" href="/">
          PrepPilot
        </Link>
        <div className="header-controls">
          <ThemeToggle />
          <SignOut />
        </div>
      </header>
      <main id="main-content" className="section">
        <p className="eyebrow">Signed in as {name}</p>
        <h1>{title}</h1>
        <div
          className={
            wide ? "workspace-library" : "card auth-card workspace-copy"
          }
        >
          {children}
        </div>
      </main>
    </PageContainer>
  );
}
