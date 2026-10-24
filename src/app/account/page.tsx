import { redirect } from "next/navigation";
import { pageActor, studentPageActor } from "@/modules/identity/page-access";
import { studentReturn } from "@/modules/identity/student-routing";
import { actorDto } from "@/modules/identity/service";
import { OnboardingForm } from "@/modules/identity/ui/onboarding-form";
import { StudentShell } from "@/shared/ui/student-shell";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const actor =
    params.view === "settings"
      ? await studentPageActor("/account?view=settings")
      : await pageActor();
  const returnTo = studentReturn(params.returnTo);
  if (
    params.view === "settings" &&
    actor.profile.role === "student" &&
    actor.destination === "/dashboard"
  )
    return (
      <StudentShell name={actor.session.user.name}>
        <OnboardingForm
          initial={actorDto(actor)}
          returnTo="/account?view=settings"
          settings
        />
      </StudentShell>
    );
  if (actor.profile.role === "student" && actor.destination === "/dashboard")
    redirect(returnTo ?? "/dashboard");
  if (actor.destination === "/onboarding" && returnTo)
    redirect(`/onboarding?returnTo=${encodeURIComponent(returnTo)}`);
  redirect(actor.destination);
}
