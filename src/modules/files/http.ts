import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireAdmin, requireStudyActor } from "@/modules/identity/service";
import { requireCsrf } from "@/shared/server/csrf";
import { failure, json, readJson, HttpError } from "@/shared/server/http";
import { files } from "./service";
import { fileId } from "./schemas";

export function createFileHttp(
  service = files,
  guards = { admin: requireAdmin, study: requireStudyActor },
) {
  return async function handle(
    request: Request,
    action:
      | "list"
      | "status"
      | "grant"
      | "finalize"
      | "preview"
      | "download"
      | "cleanup",
    id = "",
  ) {
    const requestId = randomUUID();
    try {
      const actor = await (action === "download"
        ? guards.study(request.headers)
        : guards.admin(request.headers));
      if (action !== "list" && new URL(request.url).search)
        throw new HttpError(
          422,
          "VALIDATION_ERROR",
          "Remove query parameters.",
        );
      if (action === "list") {
        const result = await service.list(
          request.headers,
          new URL(request.url).searchParams,
        );
        return Response.json(result, {
          headers: {
            "Cache-Control": "private, no-store",
            "X-Request-Id": requestId,
          },
        });
      }
      if (action === "status")
        return json(await service.status(request.headers, id), 200, {
          requestId,
        });
      requireCsrf(request, actor.session.session.id);
      const body = await readJson(request);
      if (
        ["finalize", "preview"].includes(action) &&
        !z.strictObject({}).safeParse(body).success
      )
        throw new HttpError(422, "VALIDATION_ERROR", "Supply an empty object.");
      let data;
      if (action === "grant")
        data = await service.grant(request.headers, body, requestId);
      else if (action === "cleanup")
        data = await service.cleanup(request.headers, body, requestId);
      else if (action === "finalize")
        data = await service.finalize(request.headers, id, requestId);
      else if (action === "preview")
        data = await service.download(request.headers, id);
      else {
        const value = z.strictObject({ contentId: fileId }).safeParse(body);
        if (!value.success)
          throw new HttpError(422, "VALIDATION_ERROR", "Supply a content ID.", {
            contentId: ["Use a valid content identifier."],
          });
        data = await service.download(
          request.headers,
          id,
          value.data.contentId,
        );
      }
      return json(data, action === "grant" ? 201 : 200, { requestId });
    } catch (error) {
      return failure(
        error instanceof HttpError
          ? error
          : new HttpError(
              503,
              "DEPENDENCY_UNAVAILABLE",
              "File operation unavailable. Read status before retrying.",
            ),
        requestId,
      );
    }
  };
}
export const fileHttp = createFileHttp();
