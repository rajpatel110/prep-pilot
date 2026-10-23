import Link from "next/link";
import { PageContainer } from "./page-container";
import { SignOut } from "./sign-out";
export function Workspace({
  name,
  title,
  children,
}: {
  name: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <PageContainer>
      <header className="header-row">
        <Link className="brand" href="/">
          PrepPilot
        </Link>
        <SignOut />
      </header>
      <main id="main-content" className="section">
        <p className="eyebrow">Signed in as {name}</p>
        <h1>{title}</h1>
        <div className="card auth-card workspace-copy">{children}</div>
      </main>
    </PageContainer>
  );
}
