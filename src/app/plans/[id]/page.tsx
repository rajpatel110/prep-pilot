import Link from "next/link";
import { headers } from "next/headers";
import { studentPageActor } from "@/modules/identity/page-access";
import { StudentShell } from "@/shared/ui/student-shell";
import { readPlan } from "@/modules/planning/service";
import { PlanView } from "@/modules/planning/ui/workspace";
import { HttpError } from "@/shared/server/http";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const actor = await studentPageActor(`/plans/${id}`);
  let plan: Awaited<ReturnType<typeof readPlan>>["plan"] = null;
  let message = "";
  try {
    plan = (await readPlan(await headers(), id)).plan;
  } catch (error) {
    message =
      error instanceof HttpError
        ? error.message
        : "Please retry shortly. Saved work is unchanged.";
  }
  if (plan)
    return (
      <StudentShell name={actor.session.user.name}>
        <PlanView plan={plan!} />
      </StudentShell>
    );
  return (
    <StudentShell name={actor.session.user.name}>
      <section className="student-card">
        <h1>Plan could not be loaded</h1>
        <p role="alert">{message}</p>
        <Link href={`/plans/${id}`}>Retry plan</Link>
        <Link href="/dashboard">Dashboard</Link>
      </section>
    </StudentShell>
  );
}
