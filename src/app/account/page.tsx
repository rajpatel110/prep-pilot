import { redirect } from "next/navigation";
import { pageActor } from "@/modules/identity/page-access";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export default async function AccountPage() {
  const actor = await pageActor();
  redirect(actor.destination);
}
