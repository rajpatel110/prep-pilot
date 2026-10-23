import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireActor } from "./service";
import { HttpError } from "@/shared/server/http";

export async function pageActor(expected?: string) {
  let actor;
  try {
    actor = await requireActor(await headers());
  } catch (error) {
    if (error instanceof HttpError && error.status === 401) redirect("/login");
    throw new Error(
      "Account access is temporarily unavailable. Please try again.",
    );
  }
  if (expected && actor.destination !== expected) redirect(actor.destination);
  return actor;
}
