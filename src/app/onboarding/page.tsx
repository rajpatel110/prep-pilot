import { studentPageActor } from "@/modules/identity/page-access";
import { StudentShell } from "@/shared/ui/student-shell";
import { OnboardingForm } from "@/modules/identity/ui/onboarding-form";
import { actorDto } from "@/modules/identity/service";
import { studentReturn } from "@/modules/identity/student-routing";
import { redirect } from "next/navigation";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const returnTo = studentReturn(params.returnTo) ?? "/dashboard";
  const actor = await studentPageActor(returnTo, true);
  if (actor.destination === "/verify-email" || actor.profile.role !== "student")
    redirect(actor.destination);
  if (actor.profile.preferences != null && params.edit !== "1")
    redirect(returnTo);
  return (
    <StudentShell name={actor.session.user.name} onboarding>
      <OnboardingForm initial={actorDto(actor)} returnTo={returnTo} />
    </StudentShell>
  );
}
