import "server-only";
import { randomUUID } from "node:crypto";
import { failure, HttpError, readJson } from "@/shared/server/http";
import { requirePracticeActor } from "@/modules/practice/access";
import { requireCsrf } from "@/shared/server/csrf";
import { studyError } from "@/modules/practice/errors";
import {
  createPreview,
  readPreview,
  confirmPreview,
  readPlan,
  planHistory,
  dashboard,
} from "./service";
export async function planningHttp(
  request: Request,
  operation:
    | "create"
    | "preview"
    | "confirm"
    | "current"
    | "plan"
    | "history"
    | "dashboard",
  id?: string,
) {
  const requestId = randomUUID();
  try {
    const query = new URL(request.url).searchParams;
    if (operation !== "history" && query.size)
      throw new HttpError(
        422,
        "VALIDATION_ERROR",
        "Query parameters are not supported.",
      );
    if (request.method === "POST") {
      const actor = await requirePracticeActor(request.headers);
      requireCsrf(request, actor.session.session.id);
    }
    let result: unknown,
      status = 200,
      location: string | undefined;
    if (operation === "create") {
      const preview = await createPreview(
        request.headers,
        await readJson(request),
      );
      result = { data: preview };
      status = 201;
      location = `/api/v1/plan-previews/${preview.id}`;
    } else if (operation === "confirm") {
      const confirmed = await confirmPreview(
        request.headers,
        id!,
        await readJson(request),
      );
      result = confirmed;
      status = confirmed.meta.replayed ? 200 : 201;
    } else if (operation === "preview")
      result = { data: await readPreview(request.headers, id!) };
    else if (operation === "history")
      result = await planHistory(request.headers, query);
    else if (operation === "dashboard")
      result = { data: await dashboard(request.headers) };
    else {
      const current = await readPlan(
        request.headers,
        operation === "plan" ? id : undefined,
      );
      result = { data: operation === "plan" ? current.plan : current };
    }
    return Response.json(result, {
      status,
      headers: {
        "Cache-Control": "private, no-store",
        "X-Request-Id": requestId,
        ...(location ? { Location: location } : {}),
      },
    });
  } catch (error) {
    const response = failure(studyError(error), requestId);
    if (error instanceof HttpError && error.status === 429)
      response.headers.set("Retry-After", "600");
    return response;
  }
}
