import Link from "next/link";
import { PageContainer } from "@/shared/ui/page-container";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageContainer>
      <header className="header-row">
        <Link href="/" className="brand">
          PrepPilot
        </Link>
        <Link href="/">← Back to home</Link>
      </header>
      <main id="main-content" className="auth-layout">
        <aside className="auth-intro">
          <p className="eyebrow">A little more prepared, every day</p>
          <h2>A clearer next step awaits.</h2>
          <p className="hero-copy">
            A focused space for your study plan, practice outcomes and
            revisions.
          </p>
          <div className="plan-note">
            Your preparation, at your pace. Review suggested changes before they
            become part of your plan.
          </div>
        </aside>
        <section className="card auth-card">{children}</section>
      </main>
    </PageContainer>
  );
}
