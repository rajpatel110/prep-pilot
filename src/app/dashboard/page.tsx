import { studentPageActor } from "@/modules/identity/page-access";
import { headers } from "next/headers";
import Link from "next/link";
import { StudentShell } from "@/shared/ui/student-shell";
import { dashboard, readPlan } from "@/modules/planning/service";
import { DashboardView } from "@/modules/planning/ui/workspace";
import { HttpError } from "@/shared/server/http";
import { preferencesSchema } from "@/modules/identity/preferences-schema";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export default async function DashboardPage() {
  const actor = await studentPageActor("/dashboard");
  const preferences = preferencesSchema.safeParse(actor.profile.preferences);
  let data: Awaited<ReturnType<typeof dashboard>> | undefined;
  let plan: Awaited<ReturnType<typeof readPlan>>["plan"] = null;
  let message = "";
  try {
    data = await dashboard(await headers());
    plan = (await readPlan(await headers())).plan;
    if (
      (plan?.id ?? null) !== data.activePlanId ||
      (plan && plan.stateRevision !== data.stateRevision)
    )
      throw new HttpError(
        409,
        "STATE_CONFLICT",
        "Study state changed during this read. Refresh the dashboard.",
      );
  } catch (error) {
    message =
      error instanceof HttpError
        ? error.message
        : "Study data is temporarily unavailable. Nothing has been changed.";
  }
  if (!data || message)
    return (
      <StudentShell name={actor.session.user.name}>
        <section className="student-card">
          <h1>Dashboard could not be loaded</h1>
          <p role="alert">{message}</p>
          <Link className="button" href="/dashboard">
            Retry dashboard
          </Link>
          <Link href="/content">Browse content</Link>
        </section>
      </StudentShell>
    );
  return (
    <StudentShell name={actor.session.user.name}>
      {!plan && preferences.success && (
        <section className="student-card">
          <h2>Your saved preferences</h2>
          <p>
            {preferences.data.companies.join(" + ")} ·{" "}
            {preferences.data.dailyMinutes} min/day · through{" "}
            {preferences.data.deadline}
          </p>
          <p>
            Starting self-assessment: DSA {preferences.data.skills.dsa}/5 ·
            Aptitude {preferences.data.skills.aptitude}/5 · CS{" "}
            {preferences.data.skills.cs}/5. These are preferences, not measured
            mastery.
          </p>
        </section>
      )}
      <DashboardView data={data} plan={plan} />
    </StudentShell>
  );
}
