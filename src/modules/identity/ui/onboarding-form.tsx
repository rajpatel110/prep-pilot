"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MeDto } from "../service";
import {
  minimumDeadline,
  preferenceFields,
  preferencesInputSchema,
  studyDate,
} from "../preferences-schema";
import {
  apiRequest as catalogRequest,
  ApiRequestError as CatalogRequestError,
} from "@/shared/ui/api-client";
import { UnsavedGuard } from "@/shared/ui/unsaved-guard";
import { GeneratePlan } from "@/modules/planning/ui/workspace";

const subjects = {
  dsa: "Data Structures & Algorithms",
  aptitude: "Quantitative & Logical Aptitude",
  cs: "Computer Science Fundamentals",
};
const ratings = [
  "New to this",
  "Know the basics",
  "Need practice",
  "Mostly confident",
  "Very confident",
];
type Values = {
  companies: ("cognizant" | "ltm")[];
  dailyMinutes: number;
  deadline: string;
  skills: { dsa: number; aptitude: number; cs: number };
};

export function OnboardingForm({
  initial,
  returnTo,
  settings = false,
}: {
  initial: MeDto;
  returnTo: string;
  settings?: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Values>(
    initial.preferences ?? {
      companies: [],
      dailyMinutes: 90,
      deadline: "",
      skills: { dsa: 0, aptitude: 0, cs: 0 },
    },
  );
  const [baseline, setBaseline] = useState(JSON.stringify(values));
  const [revision, setRevision] = useState(initial.stateRevision);
  const [step, setStep] = useState(1);
  const [fields, setFields] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [remote, setRemote] = useState<MeDto | null>(null);
  const [saved, setSaved] = useState<MeDto | null>(null);
  const submitting = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const dirty = JSON.stringify(values) !== baseline;
  function move(next: number) {
    setStep(next);
    setFields({});
    setMessage("");
    requestAnimationFrame(() => heading.current?.focus());
  }
  function next() {
    const parsed = preferencesInputSchema.safeParse({
      ...values,
      expectedStateRevision: revision,
    });
    const errors = parsed.success ? {} : preferenceFields(parsed.error);
    const required = step === 1 ? ["companies"] : ["dailyMinutes", "deadline"];
    const visible = Object.fromEntries(
      Object.entries(errors).filter(([key]) => required.includes(key)),
    );
    setFields(visible);
    if (!Object.keys(visible).length) move(step + 1);
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!settings && step < 3) {
      next();
      return;
    }
    if (submitting.current || blocked) return;
    const input = { ...values, expectedStateRevision: revision };
    const parsed = preferencesInputSchema.safeParse(input);
    if (!parsed.success) {
      setFields(preferenceFields(parsed.error));
      setMessage("Check your preparation setup. Your entries are preserved.");
      return;
    }
    submitting.current = true;
    setBusy(true);
    setSaved(null);
    setMessage("");
    setFields({});
    try {
      const response = await catalogRequest(
        "/api/v1/me/preferences",
        "PATCH",
        input,
      );
      setBaseline(JSON.stringify(values));
      setRevision(response.data.stateRevision);
      setSaved(response.data);
      setMessage(
        response.data.activePlanId
          ? "Preferences saved. Your current plan stays unchanged until you accept a replacement."
          : "Your preparation setup is saved. Review a suggested plan based on your goals and available time.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save. Your entries are preserved.",
      );
      if (error instanceof CatalogRequestError) {
        setFields(error.fields);
        if (error.uncertain || error.code === "STATE_CONFLICT") {
          setBlocked(true);
          setRemote(null);
        }
      }
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  async function reconcile() {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    try {
      const response = await catalogRequest("/api/v1/me");
      setRemote(response.data);
      setMessage(
        "Saved preferences loaded. Your local entries are unchanged; choose explicitly how to continue.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Cannot read saved preferences.",
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  const errorFor = (key: string) =>
    fields[key] ? (
      <p id={`pref-${key}-error`} className="student-error">
        {fields[key]?.join(" ")}
      </p>
    ) : null;
  const days = values.deadline
    ? Math.floor(
        (Date.parse(`${values.deadline}T00:00:00Z`) -
          Date.parse(`${studyDate()}T00:00:00Z`)) /
          86400000,
      ) + 1
    : null;
  return (
    <>
      <UnsavedGuard dirty={dirty} />
      {!settings && (
        <ol className="onboarding-steps" aria-label="Preparation setup steps">
          {["Goals", "Schedule", "Starting point"].map((title, index) => (
            <li
              key={title}
              aria-current={step === index + 1 ? "step" : undefined}
            >
              <span>{index + 1}</span>
              {title}
            </li>
          ))}
        </ol>
      )}
      <div className="onboarding-layout">
        <section>
          <p className="eyebrow">
            {settings
              ? "Your preparation preferences"
              : `Step ${step} of 3 · Preparation preferences`}
          </p>
          <h1 ref={heading} tabIndex={-1}>
            {settings
              ? "Settings"
              : step === 1
                ? "What are you preparing for?"
                : step === 2
                  ? "Make room for consistent progress."
                  : "Where are you starting?"}
          </h1>
          <p className="student-lead">
            {settings
              ? "Update your goals and current confidence. Review a new plan before making schedule changes."
              : step === 1
                ? "Choose your target companies. Your preparation also includes shared placement foundations."
                : step === 2
                  ? "Choose a daily commitment that fits your schedule."
                  : "Choose your current confidence in each subject, from 1 (new) to 5 (very confident). This is not a test."}
          </p>
          {message && (
            <div className="student-notice" role="status">
              {message}{" "}
              {!saved && (
                <Link
                  href={`/login?returnTo=${encodeURIComponent(returnTo)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Sign in again in a new tab if your session expired; then
                  return here to retry
                </Link>
              )}
            </div>
          )}
          {Object.keys(fields).length > 0 && (
            <div role="alert" className="student-error">
              <p>Check these fields:</p>
              <ul>
                {Object.entries(fields).map(([field, errors]) => (
                  <li key={field}>
                    {field}: {errors.join(" ")}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <form onSubmit={save} aria-busy={busy}>
            <fieldset disabled={busy} className="student-fieldset">
              {(settings || step === 1) && (
                <fieldset
                  className="student-options"
                  aria-describedby={
                    fields.companies ? "pref-companies-error" : undefined
                  }
                >
                  <legend>Target companies</legend>
                  {(["cognizant", "ltm"] as const).map((company) => (
                    <label
                      key={company}
                      className={`company-option ${values.companies.includes(company) ? "selected" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={values.companies.includes(company)}
                        onChange={(event) =>
                          setValues({
                            ...values,
                            companies: event.target.checked
                              ? [...values.companies, company]
                              : values.companies.filter(
                                  (entry) => entry !== company,
                                ),
                          })
                        }
                      />
                      <span>
                        <strong>
                          {company === "ltm" ? "LTM" : "Cognizant"}
                        </strong>
                        <span className="student-muted">
                          {company === "ltm"
                            ? "Technical and problem-solving foundations."
                            : "Aptitude, logical reasoning and programming foundations."}
                        </span>
                      </span>
                    </label>
                  ))}
                  {errorFor("companies")}
                  <div className="student-notice">
                    <strong>Build your foundations</strong>
                    <p>
                      DSA, aptitude and core CS topics are included. Company
                      labels describe provenance, not guaranteed hiring
                      requirements.
                    </p>
                  </div>
                </fieldset>
              )}
              {(settings || step === 2) && (
                <div className="student-stack">
                  <fieldset className="student-card">
                    <legend>Daily study time</legend>
                    <p>30–240 minutes, in 15-minute increments.</p>
                    <div className="duration-presets">
                      {[30, 60, 90, 120].map((minutes) => (
                        <button
                          type="button"
                          className="student-choice"
                          aria-pressed={values.dailyMinutes === minutes}
                          key={minutes}
                          onClick={() =>
                            setValues({ ...values, dailyMinutes: minutes })
                          }
                        >
                          {minutes} min
                        </button>
                      ))}
                    </div>
                    <label className="student-label">
                      Daily minutes
                      <input
                        type="number"
                        min={30}
                        max={240}
                        step={15}
                        required
                        value={
                          Number.isNaN(values.dailyMinutes)
                            ? ""
                            : values.dailyMinutes
                        }
                        aria-invalid={!!fields.dailyMinutes}
                        aria-describedby="pref-dailyMinutes-error"
                        onChange={(event) =>
                          setValues({
                            ...values,
                            dailyMinutes: event.target.valueAsNumber,
                          })
                        }
                      />
                    </label>
                    {errorFor("dailyMinutes")}
                  </fieldset>
                  <div className="student-card">
                    <label className="student-label">
                      Target preparation date
                      <input
                        type="date"
                        required
                        min={minimumDeadline()}
                        value={values.deadline}
                        aria-invalid={!!fields.deadline}
                        aria-describedby="pref-deadline-error"
                        onChange={(event) =>
                          setValues({ ...values, deadline: event.target.value })
                        }
                      />
                    </label>
                    {errorFor("deadline")}
                    <p>
                      At least seven inclusive study days, including today, in
                      Asia/Kolkata. A longer goal will use a preparation window
                      of at most 30 days when you generate a proposal.
                    </p>
                  </div>
                  <p className="student-notice">Times shown in IST.</p>
                </div>
              )}
              {(settings || step === 3) && (
                <div className="student-stack">
                  <p>
                    Current confidence sets the hardest fresh questions to
                    include: 1–2 includes easy, 3 adds medium, and 4–5 adds
                    hard. Easier work remains eligible. It does not change the
                    subject allocation.
                  </p>
                  {(Object.keys(subjects) as (keyof typeof subjects)[]).map(
                    (subject) => (
                      <fieldset
                        key={subject}
                        className="student-card skill-options"
                        aria-describedby="pref-skills-error"
                      >
                        <legend>Current confidence: {subjects[subject]}</legend>
                        <div>
                          {ratings.map((rating, index) => (
                            <label
                              key={rating}
                              className={
                                values.skills[subject] === index + 1
                                  ? "selected"
                                  : ""
                              }
                            >
                              <input
                                type="radio"
                                name={`skill-${subject}`}
                                required
                                checked={values.skills[subject] === index + 1}
                                onChange={() =>
                                  setValues({
                                    ...values,
                                    skills: {
                                      ...values.skills,
                                      [subject]: index + 1,
                                    },
                                  })
                                }
                              />{" "}
                              <span>
                                <strong>{index + 1}</strong>
                                {rating}
                              </span>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    ),
                  )}
                  {errorFor("skills")}
                  <section className="student-card">
                    <h2>Review your preparation setup</h2>
                    <p>
                      {values.companies
                        .map((company) =>
                          company === "ltm" ? "LTM" : "Cognizant",
                        )
                        .join(" + ")}{" "}
                      · {values.dailyMinutes} min/day · Target{" "}
                      {values.deadline || "not set"}
                    </p>
                    <p>
                      DSA {values.skills.dsa || "unrated"}/5 · Aptitude{" "}
                      {values.skills.aptitude || "unrated"}/5 · CS{" "}
                      {values.skills.cs || "unrated"}/5
                    </p>
                    <p>
                      Saving preferences does not generate, accept or change a
                      study plan. Review a proposal from your dashboard before
                      explicitly accepting a schedule.
                    </p>
                  </section>
                </div>
              )}
              <div className="student-actions">
                {settings && (
                  <Link className="button button-outline" href="/dashboard">
                    Cancel
                  </Link>
                )}
                {!settings && step > 1 && (
                  <button
                    className="button button-outline"
                    type="button"
                    onClick={() => move(step - 1)}
                  >
                    Back
                  </button>
                )}
                {!settings && step < 3 ? (
                  <button className="button" type="submit">
                    Continue
                  </button>
                ) : (
                  <button className="button" disabled={blocked} type="submit">
                    {busy
                      ? "Saving…"
                      : settings
                        ? "Save preferences"
                        : "Save and continue"}
                  </button>
                )}
              </div>
            </fieldset>
          </form>
          {settings &&
            initial.preferences &&
            initial.preferences.deadline < minimumDeadline() && (
              <p className="student-notice">
                Your saved target date is too near or has passed. Study access
                remains available. Choose at least seven inclusive study days
                before saving new preferences.
              </p>
            )}
          {saved && !dirty && !blocked && (
            <section aria-label="Saved preference planning options">
              <h2>Your next step</h2>
              <p>
                Inspect the selected tasks and time totals before accepting. If
                you have a current plan, it stays unchanged until acceptance.
              </p>
              <GeneratePlan revision={saved.stateRevision} kind="preferences" />
            </section>
          )}
          {blocked && (
            <section
              className="student-card"
              aria-label="Preference reconciliation"
            >
              <h2>Reconcile before retrying</h2>
              <p>
                No automatic retry was sent. Read the current saved preferences
                to resolve an uncertain save or a changed revision.
              </p>
              <button
                className="button"
                disabled={busy}
                onClick={() => void reconcile()}
              >
                Read saved preferences
              </button>
              {remote && (
                <>
                  <p>
                    Saved: {remote.preferences?.companies.join(" + ")} ·{" "}
                    {remote.preferences?.dailyMinutes} minutes/day · Target{" "}
                    {remote.preferences?.deadline}. Self-assessment: DSA{" "}
                    {remote.preferences?.skills.dsa}/5 · Aptitude{" "}
                    {remote.preferences?.skills.aptitude}/5 · CS{" "}
                    {remote.preferences?.skills.cs}/5. Existing plan unchanged.
                  </p>
                  {remote.preferences && (
                    <button
                      className="button"
                      disabled={busy}
                      onClick={() => {
                        if (settings && remote.preferences) {
                          setValues(remote.preferences);
                          setBaseline(JSON.stringify(remote.preferences));
                          setRevision(remote.stateRevision);
                          setSaved(remote);
                          setBlocked(false);
                          setRemote(null);
                          setFields({});
                          setMessage(
                            "Saved preferences loaded. Current plan unchanged.",
                          );
                          return;
                        }
                        setBaseline(JSON.stringify(values));
                        router.replace(returnTo);
                        router.refresh();
                      }}
                    >
                      Continue with saved preferences
                    </button>
                  )}
                  <button
                    className="button button-outline"
                    disabled={busy}
                    onClick={() => {
                      setRevision(remote.stateRevision);
                      setBaseline(JSON.stringify(remote.preferences));
                      setBlocked(false);
                      setRemote(null);
                      setMessage(
                        "Local entries retained against the current revision. Review and explicitly save again.",
                      );
                    }}
                  >
                    Keep my entries and use current revision
                  </button>
                </>
              )}
            </section>
          )}
        </section>
        <aside className="preparation-brief student-card">
          {settings && (
            <section>
              <h2>Account</h2>
              <p>{initial.name}</p>
              <p>{initial.email}</p>
              <p>
                {initial.emailVerified
                  ? "Email verified"
                  : "Email not verified"}
              </p>
              <p>
                Sign out is available in the navigation. Name and email editing
                are not available here.
              </p>
              <p>
                <Link href="/verify-email">Email verification status</Link>
              </p>
              <p>
                <Link href="/forgot-password">Password recovery</Link>
                {!initial.capabilities.passwordRecovery &&
                  " — unavailable in this environment"}
              </p>
            </section>
          )}
          <p className="eyebrow">Your preparation profile</p>
          <h2>Preparation brief</h2>
          <dl>
            <dt>Target companies</dt>
            <dd>
              {values.companies.length
                ? values.companies
                    .map((company) => (company === "ltm" ? "LTM" : "Cognizant"))
                    .join(" + ")
                : "Not selected yet"}
            </dd>
            <dt>Daily commitment</dt>
            <dd>{values.dailyMinutes || "Not set"} minutes</dd>
            <dt>Target date</dt>
            <dd>{values.deadline || "Not set"}</dd>
            <dt>Preparation window</dt>
            <dd>
              {days && days >= 7
                ? `${Math.min(days, 30)} days in a proposed plan`
                : "Choose at least seven study days"}
            </dd>
          </dl>
          <p>
            Preferences are saved only when you finish. No placement prediction
            or plan is generated.
          </p>
          {!initial.capabilities.verificationEmail &&
            !initial.capabilities.passwordRecovery && (
              <p>
                Verification email and password recovery are unavailable in this
                environment.
              </p>
            )}
        </aside>
      </div>
    </>
  );
}
