import Link from "next/link";
import Image from "next/image";
import { HomeHeader } from "@/shared/ui/home-header";
import { HomeMotion } from "@/shared/ui/home-motion";
import { PageContainer } from "@/shared/ui/page-container";
import styles from "./home.module.css";

const steps = [
  [
    "Set your direction",
    "Choose your target companies, deadline and daily study time.",
    "30 minutes to 4 hours a day",
  ],
  [
    "Preview, then accept",
    "See the eligible tasks, time totals and any work that cannot fit.",
    "Your confirmation saves the plan",
  ],
  [
    "Practise and revisit",
    "Record an outcome, complete tasks explicitly and return to your revision queue.",
    "Practice and completion stay separate",
  ],
];
const subjects = [
  [
    "</>",
    "DSA",
    "Work through questions and explain the reasoning behind your solution.",
    ["Arrays", "Strings", "Searching and sorting"],
  ],
  [
    "∑",
    "Aptitude",
    "Build quantitative, logical and verbal reasoning, one question at a time.",
    ["Percentages", "Logical reasoning", "Verbal ability"],
  ],
  [
    "◇",
    "CS fundamentals",
    "Connect core concepts with explanations and recall questions.",
    ["DBMS", "Operating systems", "Networking", "OOP"],
  ],
] as const;
const questions = [
  [
    "Do I solve coding questions inside PrepPilot?",
    "Read the question in PrepPilot or follow its practice link when provided. Solve it yourself, then record whether you solved independently, needed help or could not solve. PrepPilot does not run or automatically grade your code.",
  ],
  [
    "Can I choose how much time I study each day?",
    "Choose 30 minutes to 4 hours daily, in 15-minute steps. Individual content estimates can be shorter. Scheduled work stays within your daily budget; missing eligible content can leave time unused.",
  ],
  [
    "What happens if I miss a day?",
    "Your saved plan does not silently move to another day. Review a new plan preview to see what fits your remaining time before accepting a replacement plan.",
  ],
  [
    "Will my plan change automatically?",
    "No. Review a plan preview and its time totals before confirming it. Recording a practice outcome updates your practice history and revision queue, but does not automatically mark a plan task complete.",
  ],
  [
    "Which areas and companies does it cover?",
    "DSA, aptitude and CS fundamentals are the subject areas, with Cognizant and LTM planning preferences alongside shared foundations. The starter catalog is limited: some topics may have no eligible material. Company labels are not an official syllabus, endorsement or hiring guarantee.",
  ],
  [
    "How do verification and password recovery work?",
    "The hosted app requires email verification for protected access. Open your verification link and explicitly confirm your email. Password recovery also uses an emailed link. Request acceptance does not guarantee inbox delivery; check spam or request a new link if needed.",
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
      <HomeHeader />
      <main id="main-content" className={styles.home}>
        <HomeMotion />
        <section className="hero section-border">
          <PageContainer>
            <div className="hero-grid">
              <div>
                <h1>
                  Placement prep.
                  <br />A clearer next step.
                </h1>
                <p className="hero-copy">
                  Plan DSA, aptitude and CS fundamentals around your time.
                  Preview your schedule before you accept it.
                </p>
                <div className="actions">
                  <Link
                    className="button"
                    href="/plans/review"
                    prefetch={false}
                  >
                    Create my study plan <span aria-hidden="true">↗</span>
                  </Link>
                  <a className="button button-secondary" href="#sample-plan">
                    See a sample plan
                  </a>
                </div>
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
                <p className="small-note">
                  27 estimated minutes / 30-minute daily budget
                </p>
                <ul className="task-list">
                  {[
                    ["Arrays practice", "DSA", "15", "Completed"],
                    ["Mixture practice", "Aptitude", "7", "Pending"],
                    ["Logical reasoning", "Aptitude", "5", "Pending"],
                  ].map(([title, subject, minutes, status]) => (
                    <li
                      className={`task ${status === "Completed" ? "completed" : ""}`}
                      key={title}
                    >
                      <span aria-hidden="true" className="task-icon">
                        {status === "Completed" ? "✓" : "◷"}
                      </span>
                      <div className="task-copy">
                        <p>{title}</p>
                        <span>
                          {subject} · {minutes} min
                        </span>
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
                  Sample data only. Your preview depends on eligible content.
                </p>
              </article>
            </div>
          </PageContainer>
        </section>
        <section className="section section-border" id="how-it-works">
          <PageContainer>
            <div className="section-intro" data-home-reveal="text">
              <h2>From a goal to a manageable daily plan.</h2>
              <p>Choose your direction. Review the plan. Take the next step.</p>
            </div>
            <ol className={styles.workflow}>
              {steps.map(([title, text, note], index) => (
                <li key={title} data-home-reveal="item">
                  <span className={styles.stepNumber} aria-hidden="true">
                    0{index + 1}
                  </span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                    <p className={styles.stepNote}>{note}</p>
                  </div>
                </li>
              ))}
            </ol>
          </PageContainer>
        </section>
        <section className="section section-border" id="subjects">
          <PageContainer>
            <div className="section-intro" data-home-reveal="text">
              <h2>Three areas. One organised plan.</h2>
              <p>
                Example topics below; availability varies across the starter
                catalog.
              </p>
            </div>
            <div className="three-grid">
              {subjects.map(([icon, title, text, topics]) => (
                <article
                  className="card feature-card"
                  key={title}
                  data-home-reveal="item"
                >
                  <div className={styles.subjectHeading}>
                    <span className="subject-icon" aria-hidden="true">
                      {icon}
                    </span>
                    <h3>{title}</h3>
                  </div>
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
                Choose Cognizant, LTM or both as planning preferences, alongside
                shared fundamentals.
              </p>
              <p className="small-note">
                Coverage is limited, not a complete company syllabus. Company
                labels do not imply partnerships or hiring guarantees.
              </p>
            </div>
          </PageContainer>
        </section>
        <section className="section section-border">
          <PageContainer>
            <div className={styles.practiceStory}>
              <div>
                <h2 data-home-reveal="text">
                  See your progress.
                  <br />
                  Understand your next step.
                </h2>
                <p className="section-copy">
                  A plan gives you a place to start. Your recorded outcomes help
                  you see what to revisit in Dashboard, Progress and Revisions.
                </p>
                <dl className={styles.outcomeKey}>
                  <div>
                    <dt>Practice outcome</dt>
                    <dd>
                      How the question went: independently, with help or not
                      solved.
                    </dd>
                  </div>
                  <div>
                    <dt>Task completion</dt>
                    <dd>A separate action you control in your saved plan.</dd>
                  </div>
                </dl>
              </div>
              <article
                className={`card ${styles.exampleFlow}`}
                aria-labelledby="workflow-example-title"
              >
                <p className={styles.exampleLabel}>
                  Illustrative workflow / sample data
                </p>
                <h3 id="workflow-example-title">Three deliberate steps.</h3>
                <ol className={styles.exampleSteps}>
                  <li>
                    <h4>Preview the schedule</h4>
                    <p>
                      27 of 30 minutes planned. Inspect the tasks and unused
                      time.
                    </p>
                  </li>
                  <li>
                    <h4>Explicitly accept</h4>
                    <p>
                      Confirm the preview to save the plan. Viewing it alone
                      does not activate a plan.
                    </p>
                  </li>
                  <li>
                    <h4>Record a practice outcome</h4>
                    <p>
                      <strong>Arrays practice: solved with help.</strong> The
                      outcome enters practice history and schedules a revision.
                    </p>
                  </li>
                </ol>
                <p className="plan-note">
                  Mark the task complete separately. This illustration does not
                  change a saved plan.
                </p>
              </article>
            </div>
          </PageContainer>
        </section>
        <section className="section" id="faq">
          <PageContainer>
            <div className="section-intro" data-home-reveal="text">
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
              <h2>Give your preparation a clear next step.</h2>
              <p>
                Preview and accept a plan, record your practice outcomes and
                keep track of what to revisit.
              </p>
              <p className="availability-note">
                Schedules use available eligible content. Missing topics can
                leave time unused; PrepPilot does not invent tasks to fill it.
              </p>
              <Link className="button" href="/plans/review" prefetch={false}>
                Review my plan <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </PageContainer>
        </section>
        <section
          className="section about-section section-border"
          id="about"
          aria-labelledby="about-heading"
        >
          <PageContainer>
            <div className="section-intro" data-home-reveal="text">
              <p className="eyebrow">About the builder</p>
              <h2 id="about-heading">Meet the builder behind PrepPilot.</h2>
            </div>
            <article
              className="card builder-card"
              aria-labelledby="builder-name"
            >
              <div className="builder-identity">
                <Image
                  className="builder-avatar"
                  src="/images/raj-patel.png"
                  alt="Raj Patel"
                  width={64}
                  height={64}
                  sizes="64px"
                />
                <div>
                  <h3 id="builder-name">Raj Patel</h3>
                  <p>Final-year student · PrepPilot creator.</p>
                </div>
              </div>
              <div className="builder-story">
                <p className="builder-introduction">
                  Hi, I’m Raj Patel, a final-year student building PrepPilot to
                  make interview preparation more organised and approachable.
                </p>
                <p>
                  I’m bringing DSA, aptitude and computer science fundamentals
                  into one focused workspace, while developing my skills in
                  full-stack development and building with AI-assisted tools.
                </p>
                <ul
                  className="builder-links"
                  aria-label="Connect with Raj Patel"
                >
                  <li>
                    <a
                      href="https://github.com/rajpatel110"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      GitHub <span aria-hidden="true">↗</span>
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.linkedin.com/in/raj-patel-cse"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      LinkedIn <span aria-hidden="true">↗</span>
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </li>
                  <li>
                    <a href="mailto:341raj.patel@gmail.com">
                      Email: 341raj.patel@gmail.com
                    </a>
                  </li>
                </ul>
              </div>
            </article>
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
