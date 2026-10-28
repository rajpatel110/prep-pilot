import { studentPageActor } from "@/modules/identity/page-access";
import { GeneratePlan } from "@/modules/planning/ui/workspace";
import { StudentShell } from "@/shared/ui/student-shell";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ReviewPlanPage() {
  const actor = await studentPageActor("/plans/review");
  return (
    <StudentShell name={actor.session.user.name}>
      <h1>Review your study plan</h1>
      <p className="student-lead">
        Review a suggested schedule based on your saved goals and available
        time. Your current plan stays unchanged until you accept a replacement.
      </p>
      <GeneratePlan revision={actor.profile.stateRevision} kind="preferences" />
    </StudentShell>
  );
}
