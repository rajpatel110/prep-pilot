import { randomUUID } from "node:crypto";
import { completeTask } from "@/modules/planning/task-completion";
import { requirePracticeActor } from "@/modules/practice/access";
import { requireCsrf } from "@/shared/server/csrf";
import { HttpError, failure, json, readJson } from "@/shared/server/http";
export const runtime = "nodejs";
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; taskId: string }> },
) {
  const requestId = randomUUID();
  try {
    const actor = await requirePracticeActor(request.headers);
    requireCsrf(request, actor.session.session.id);
    if (new URL(request.url).search)
      throw new HttpError(
        422,
        "VALIDATION_ERROR",
        "Query parameters are not supported.",
      );
    const { id, taskId } = await context.params;
    return json(
      await completeTask(request.headers, id, taskId, await readJson(request)),
      200,
      { requestId },
    );
  } catch (error) {
    return failure(error, requestId);
  }
}
