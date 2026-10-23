import { randomUUID } from "node:crypto";
import { requireAdmin } from "@/modules/identity/service";
import { editDraft } from "@/modules/catalog/service";
import { requireCsrf } from "@/shared/server/csrf";
import { failure, json, readJson, HttpError } from "@/shared/server/http";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const requestId = randomUUID();
  try {
    const actor = await requireAdmin(request.headers);
    requireCsrf(request, actor.session.session.id);
    if (new URL(request.url).search)
      throw new HttpError(
        422,
        "VALIDATION_ERROR",
        "Query parameters are not supported.",
        { _form: ["Remove query parameters."] },
      );
    const { id } = await context.params;
    const data = await editDraft(
      request.headers,
      id,
      await readJson(request),
      requestId,
    );
    return json(data, 200, { requestId });
  } catch (error) {
    return failure(error, requestId);
  }
}
