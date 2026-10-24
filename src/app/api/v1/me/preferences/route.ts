import { randomUUID } from "node:crypto";
import { requireActor } from "@/modules/identity/service";
import { savePreferences } from "@/modules/identity/preferences";
import { requireCsrf } from "@/shared/server/csrf";
import { failure, HttpError, json, readJson } from "@/shared/server/http";

export const runtime = "nodejs";
export async function PATCH(request: Request) {
  const requestId = randomUUID();
  try {
    const actor = await requireActor(request.headers);
    requireCsrf(request, actor.session.session.id);
    if (new URL(request.url).search)
      throw new HttpError(
        422,
        "VALIDATION_ERROR",
        "Query parameters are not supported.",
      );
    return json(
      await savePreferences(request.headers, await readJson(request)),
      200,
      { requestId },
    );
  } catch (error) {
    return failure(error, requestId);
  }
}
