import Link from "next/link";
import { MobileMenu } from "@/shared/ui/mobile-menu";
import { PageContainer } from "@/shared/ui/page-container";

const steps = [
  [
    "Set your goals",
    "Choose your target companies, deadline and daily study time.",
    "30 minutes to 4 hours a day",
  ],
  [
    "Practise with a plan",
    "Work through a balanced mix of DSA, aptitude and CS fundamentals.",
    "One manageable daily routine",
  ],
  [
    "Review and adjust",
    "Record how practice went and review suggested revisions or schedule changes.",
    "You approve every plan change",
  ],
];
const subjects = [
  [
    "</>",
    "DSA",
    "Build problem-solving confidence with curated questions and external practice links.",
    ["Arrays", "Strings", "Searching and sorting"],
  ],
  [
    "∑",
    "Aptitude",
    "Practise quantitative, logical and verbal reasoning with reviewed material.",
    ["Percentages", "Logical reasoning", "Verbal ability"],
  ],
  [
    "◇",
    "CS fundamentals",
    "Review core concepts and test your understanding with recall questions.",
    ["DBMS", "Operating systems", "Networking", "OOP"],
  ],
] as const;
const questions = [
  [
    "Do I solve coding questions inside PrepPilot?",
    "PrepPilot will link to external coding platforms. Return to record whether you solved independently, needed help or could not solve.",
  ],
  [
    "Can I choose how much time I study each day?",
    "The planned workflow supports 30 minutes to 4 hours daily, in 15-minute steps. Practice and scheduled revisions share that budget.",
  ],
  [
    "What happens if I miss a day?",
    "PrepPilot will propose a revised schedule, showing work that cannot fit. You review changes and explicitly approve or defer work.",
  ],
  [
    "Will my plan change automatically?",
    "No. Suggestions show the reason, before-and-after tasks and time totals. Your saved schedule changes only after confirmation.",
  ],
  [
    "Which areas and companies does it cover?",
    "Initial coverage is planned for DSA, aptitude and CS fundamentals, with Cognizant and LTM preferences alongside shared foundations. These are not partnerships or hiring guarantees.",
  ],
];
function Brand() {
  return (
    <Link href="/" aria-label="PrepPilot home" className="brand">
      <span aria-hidden="true" className="brand-mark">
        ↗
      </span>
      PrepPilot
    </Link>
  );
}
export default function Home() {
  return (
    <>
      <header className="site-header">
        <PageContainer>
          <div className="header-row">
            <Brand />
            <nav aria-label="Main navigation" className="desktop-nav">
              <a href="#how-it-works">How it works</a>
              <a href="#subjects">Subjects</a>
              <a href="#faq">FAQ</a>
            </nav>
            <a
              href="#availability"
              className="button button-small desktop-action"
            >
              Get started ↗
            </a>
            <MobileMenu />
          </div>
        </PageContainer>
      </header>
      <main id="main-content">
        <section className="hero section-border">
          <PageContainer>
            <div className="hero-grid">
              <div>
                <p className="eyebrow pill">
                  Placement preparation, with direction
                </p>
                <h1>
                  Placement prep.
                  <br />A clearer next step.
                </h1>
                <p className="hero-copy">
                  Build a study plan for DSA, aptitude and CS fundamentals
                  around your goals and available time. Track your practice and
                  review suggested changes as you go.
                </p>
                <div className="actions">
                  <a className="button" href="#availability">
                    Create my study plan <span aria-hidden="true">↗</span>
                  </a>
                  <a className="button button-secondary" href="#sample-plan">
                    See a sample plan
                  </a>
                </div>
                <p className="small-note">
                  Homepage preview · Accounts and saved plans are coming.
                </p>
                <p className="subject-line">DSA · Aptitude · CS fundamentals</p>
              </div>
              <article
                className="card plan-card"
                id="sample-plan"
                aria-labelledby="plan-title"
              >
                <div className="between">
                  <span className="tag">Sample plan</span>
                  <span className="small-note">Illustrative example</span>
                </div>
                <h2 id="plan-title">Today’s plan</h2>
                <p className="small-note">90 minutes planned</p>
                <ul className="task-list">
                  {[
                    ["Arrays practice", "DSA", "Completed"],
                    ["Quantitative aptitude", "Aptitude", "Pending"],
                    ["DBMS revision", "CS fundamentals", "Pending"],
                  ].map(([title, subject, status]) => (
                    <li
                      className={`task ${status === "Completed" ? "completed" : ""}`}
                      key={title}
                    >
                      <span aria-hidden="true" className="task-icon">
                        {status === "Completed" ? "✓" : "◷"}
                      </span>
                      <div className="task-copy">
                        <p>{title}</p>
                        <span>{subject} · 30 min</span>
                      </div>
                      <span className="status">{status}</span>
                    </li>
                  ))}
                </ul>
                <div className="between progress-caption">
                  <span>1 of 3 tasks completed</span>
                  <span>33%</span>
                </div>
                <progress aria-label="Sample plan completion" value={1} max={3}>
                  1 of 3 tasks completed
                </progress>
                <p className="plan-note">
                  A clear next task, with time set aside for revision.
                </p>
              </article>
            </div>
          </PageContainer>
        </section>
        <section className="section section-border" id="how-it-works">
          <PageContainer>
            <div className="section-intro">
              <p className="eyebrow">A structured path</p>
              <h2>From a goal to a manageable daily plan.</h2>
              <p>
                Choose your direction, follow your plan and review what needs to
                change.
              </p>
            </div>
            <div className="three-grid">
              {steps.map(([title, text, note], index) => (
                <article className="card feature-card" key={title}>
                  <span className="step-number">{index + 1}</span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                  <p className="card-footnote">{note}</p>
                </article>
              ))}
            </div>
          </PageContainer>
        </section>
        <section className="section section-border" id="subjects">
          <PageContainer>
            <div className="section-intro">
              <p className="eyebrow">Three subject pillars</p>
              <h2>Three areas. One organised plan.</h2>
            </div>
            <div className="three-grid">
              {subjects.map(([icon, title, text, topics]) => (
                <article className="card feature-card" key={title}>
                  <span className="subject-icon" aria-hidden="true">
                    {icon}
                  </span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                  <ul
                    className="topic-list"
                    aria-label={`${title} example topics`}
                  >
                    {topics.map((topic) => (
                      <li key={topic}>{topic}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
            <div className="coverage-note">
              <p>
                Initial preparation coverage: Cognizant and LTM, alongside
                shared fundamentals.
              </p>
              <p className="small-note">
                Company preferences guide preparation, without implying
                partnerships or hiring guarantees.
              </p>
            </div>
          </PageContainer>
        </section>
        <section className="section section-border">
          <PageContainer>
            <div className="progress-grid">
              <div>
                <p className="eyebrow">Practice with perspective</p>
                <h2>
                  See your progress.
                  <br />
                  Understand your next step.
                </h2>
                <p className="section-copy">
                  Your recorded practice helps identify what to revisit. Review
                  the reason and proposed changes before updating your plan.
                </p>
                <p className="eyebrow metrics-label">
                  Illustrative dashboard · Sample data
                </p>
                <div className="metrics">
                  {[
                    ["24", "Completed tasks"],
                    ["18", "Recorded outcomes"],
                    ["3", "Due revisions"],
                  ].map(([value, label]) => (
                    <div className="card metric" key={label}>
                      <strong>{value}</strong>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
                <p className="section-copy">
                  Record independent solutions, questions where you needed help
                  and topics to revisit. Task completion and practice outcomes
                  stay separate.
                </p>
              </div>
              <article className="card suggestion">
                <div className="between">
                  <span className="tag">Example suggestion</span>
                  <span className="review-label">Requires your review</span>
                </div>
                <p className="eyebrow suggestion-topic">Focus topic</p>
                <h3>Arrays</h3>
                <p className="evidence">
                  You needed help in two of your last three practice attempts in
                  this topic.
                </p>
                <p>
                  Replace one pending 30-minute arrays task with a 30-minute
                  fundamentals review.
                </p>
                <div className="change-row">
                  <span>Before: Arrays practice</span>
                  <span>30 min</span>
                </div>
                <div className="change-row proposed">
                  <span>Proposed: Arrays fundamentals review</span>
                  <span>30 min</span>
                </div>
                <p className="small-note">
                  Daily planned time stays at 90 minutes.
                </p>
                <p className="plan-note">
                  You decide whether to apply the change. This example does not
                  change a saved plan.
                </p>
              </article>
            </div>
          </PageContainer>
        </section>
        <section className="section" id="faq">
          <PageContainer>
            <div className="section-intro">
              <p className="eyebrow">A little more clarity</p>
              <h2>A few things you might be wondering.</h2>
            </div>
            <div className="faq-list">
              {questions.map(([question, answer]) => (
                <details className="card faq" key={question}>
                  <summary>
                    {question}
                    <span aria-hidden="true" className="faq-plus">
                      +
                    </span>
                  </summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
            <div className="closing-panel" id="availability">
              <p className="eyebrow">Your next chapter</p>
              <h2>Give your preparation a clear next step.</h2>
              <p>
                Bring your goals, daily practice and revision into one
                manageable plan.
              </p>
              <p className="availability-note">
                You’re viewing the homepage preview. Account creation and saved
                study plans are not available yet.
              </p>
              <a className="button" href="#sample-plan">
                Explore the sample plan <span aria-hidden="true">↑</span>
              </a>
            </div>
          </PageContainer>
        </section>
      </main>
      <footer>
        <PageContainer>
          <div className="footer-top">
            <div>
              <Brand />
              <p>Structured preparation for your next opportunity.</p>
            </div>
            <nav aria-label="Footer navigation">
              <a href="#how-it-works">How it works</a>
              <a href="#subjects">Subjects</a>
              <a href="#faq">FAQ</a>
            </nav>
          </div>
          <div className="footer-bottom">
            <p>© 2026 PrepPilot</p>
            <p>A little more prepared, every day.</p>
          </div>
        </PageContainer>
      </footer>
    </>
  );
}
