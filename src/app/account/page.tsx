import { redirect } from "next/navigation";
import { pageActor } from "@/modules/identity/page-access";
import { studentReturn } from "@/modules/identity/student-routing";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await pageActor();
  const returnTo = studentReturn((await searchParams).returnTo);
  if (actor.profile.role === "student" && actor.destination === "/dashboard")
    redirect(returnTo ?? "/dashboard");
  if (actor.destination === "/onboarding" && returnTo)
    redirect(`/onboarding?returnTo=${encodeURIComponent(returnTo)}`);
  redirect(actor.destination);
}
