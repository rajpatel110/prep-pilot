import Link from "next/link";
import { appConfig } from "@/config/app";
import { PageContainer } from "@/shared/ui/page-container";

const subjects = [
  {
    number: "01",
    title: "DSA",
    description: "Build problem-solving confidence through curated practice.",
  },
  {
    number: "02",
    title: "Aptitude",
    description: "Develop the reasoning skills that support your next step.",
  },
  {
    number: "03",
    title: "CS fundamentals",
    description:
      "Connect the essentials of databases, operating systems, networks and OOP.",
  },
];

export default function Home() {
  return (
    <PageContainer>
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line py-7">
        <Link href="/" className="text-xl font-bold tracking-tight text-forest">
          {appConfig.name}
          <span aria-hidden="true">.</span>
        </Link>
        <span className="rounded-full border border-line px-3 py-1 text-xs font-semibold tracking-wide text-muted">
          Foundation preview
        </span>
      </header>
      <main id="main-content" className="py-16 sm:py-24">
        <section aria-labelledby="intro-title" className="max-w-3xl">
          <p className="mb-6 text-xs font-bold uppercase tracking-[0.2em] text-forest">
            Small steps. Clear direction.
          </p>
          <h1
            id="intro-title"
            className="text-5xl leading-[1.08] font-semibold tracking-tight sm:text-7xl"
          >
            Prepare with purpose.
            <br />
            <span className="text-forest">Progress with a plan.</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-muted">
            A focused space for placement preparation, bringing DSA, aptitude
            and CS fundamentals into one manageable study journey.
          </p>
          <a
            href="#foundation-status"
            className="mt-8 inline-flex items-center gap-3 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-white hover:bg-charcoal"
          >
            Explore the foundation <span aria-hidden="true">↗</span>
          </a>
        </section>
        <section
          aria-label="Preparation subjects"
          className="mt-16 grid gap-5 sm:mt-20 md:grid-cols-3"
        >
          {subjects.map((subject) => (
            <article
              key={subject.number}
              className="rounded-2xl border border-line bg-white/50 p-7"
            >
              <p
                aria-hidden="true"
                className="mb-8 text-xs font-bold tracking-widest text-forest"
              >
                {subject.number} /
              </p>
              <h2 className="text-xl font-semibold">{subject.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                {subject.description}
              </p>
            </article>
          ))}
        </section>
        <section
          id="foundation-status"
          aria-labelledby="status-title"
          className="mt-12 scroll-mt-8 border-t border-line pt-8 sm:flex sm:justify-between sm:gap-10"
        >
          <h2 id="status-title" className="text-lg font-semibold text-forest">
            The foundation is ready.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted sm:mt-0">
            This preview establishes PrepPilot’s visual foundation. Accounts,
            saved study plans and practice tracking are coming in later
            milestones. No student data is collected here.
          </p>
        </section>
      </main>
      <footer className="flex flex-wrap justify-between gap-3 border-t border-line py-6 text-xs text-muted">
        <p>{appConfig.name} · A little more prepared, every day.</p>
        <p>Study timezone: {appConfig.studyTimezone}</p>
      </footer>
    </PageContainer>
  );
}
