import "server-only";
import { randomUUID } from "node:crypto";
import { requireAdmin } from "@/modules/identity/service";
import { requireCsrf } from "@/shared/server/csrf";
import { failure, HttpError, json, readJson } from "@/shared/server/http";
import { transitionContent } from "./service";
import type { LifecycleAction } from "./publication";

export function lifecycleHandler(action: LifecycleAction) {
  return async (
    request: Request,
    context: { params: Promise<{ id: string }> },
  ) => {
    const requestId = randomUUID();
    try {
      const actor = await requireAdmin(request.headers);
      requireCsrf(request, actor.session.session.id);
      if (new URL(request.url).search)
        throw new HttpError(
          422,
          "VALIDATION_ERROR",
          "Remove unsupported query parameters.",
        );
      const { id } = await context.params;
      return json(
        await transitionContent(
          request.headers,
          id,
          action,
          await readJson(request),
          requestId,
        ),
        200,
        { requestId },
      );
    } catch (error) {
      return failure(error, requestId);
    }
  };
}
