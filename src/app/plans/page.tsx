import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { studentPageActor } from "@/modules/identity/page-access";
import { readPlan } from "@/modules/planning/service";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export default async function Page() {
  await studentPageActor("/plans");
  const { plan } = await readPlan(await headers());
  redirect(plan ? `/plans/${plan.id}` : "/dashboard");
}
