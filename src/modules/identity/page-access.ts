import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireActor } from "./service";
import { HttpError } from "@/shared/server/http";
import { studentReturn } from "./student-routing";

export async function redirectSignedInAuth(returnTo: string | null) {
  let actor;
  try {
    actor = await requireActor(await headers());
  } catch (error) {
    if (error instanceof HttpError && error.status === 401) return;
    throw error;
  }
  redirect(
    actor.destination === "/dashboard"
      ? (studentReturn(returnTo) ?? "/dashboard")
      : actor.destination,
  );
}

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

export async function studentPageActor(
  returnTo = "/content",
  allowIncomplete = false,
) {
  let actor;
  try {
    actor = await requireActor(await headers());
  } catch (error) {
    if (error instanceof HttpError && error.status === 401)
      redirect(
        `/login?returnTo=${encodeURIComponent(studentReturn(returnTo) ?? "/content")}`,
      );
    throw new Error(
      "Account access is temporarily unavailable. Sign in again or retry shortly.",
    );
  }
  if (actor.destination === "/verify-email") redirect("/verify-email");
  if (actor.profile.role === "admin" || actor.profile.role === "owner")
    redirect("/admin");
  if (actor.destination === "/onboarding" && !allowIncomplete)
    redirect(
      `/onboarding?returnTo=${encodeURIComponent(studentReturn(returnTo) ?? "/content")}`,
    );
  return actor;
}
