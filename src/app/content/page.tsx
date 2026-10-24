import { headers } from "next/headers";
import { studentPageActor } from "@/modules/identity/page-access";
import { listStudentContent } from "@/modules/catalog/reads";
import { catalogParams } from "@/modules/catalog/student-navigation";
import { StudentLibrary } from "@/modules/catalog/ui/student-library";
import { StudentShell } from "@/shared/ui/student-shell";
import { HttpError } from "@/shared/server/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = catalogParams(await searchParams);
  const query = params.toString();
  const actor = await studentPageActor(`/content${query ? `?${query}` : ""}`);
  let initial = null;
  let error = null;
  try {
    initial = await listStudentContent(await headers(), params);
  } catch (cause) {
    error = {
      code: cause instanceof HttpError ? cause.code : "SERVICE_UNAVAILABLE",
      message:
        cause instanceof HttpError
          ? cause.message
          : "Content is temporarily unavailable. Please retry.",
      fields: cause instanceof HttpError ? cause.fields : undefined,
    };
  }
  const version =
    initial?.data.map((item) => `${item.id}:${item.revision}`).join(",") ??
    error?.code;
  return (
    <StudentShell name={actor.session.user.name}>
      <StudentLibrary
        key={`${actor.session.user.id}:${query}:${version}`}
        userId={actor.session.user.id}
        initial={initial}
        initialError={error}
        query={query}
      />
    </StudentShell>
  );
}
