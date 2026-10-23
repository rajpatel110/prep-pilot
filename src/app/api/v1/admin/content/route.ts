import { randomUUID } from "node:crypto";
import { listAdminContent } from "@/modules/catalog/reads";
import { requireAdmin } from "@/modules/identity/service";
import { createDraft } from "@/modules/catalog/service";
import { requireCsrf } from "@/shared/server/csrf";
import { failure, json, readJson, HttpError } from "@/shared/server/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestId = randomUUID();
  try {
    const result = await listAdminContent(
      request.headers,
      new URL(request.url).searchParams,
    );
    return Response.json(result, {
      headers: {
        "Cache-Control": "private, no-store",
        "X-Request-Id": requestId,
      },
    });
  } catch (error) {
    return failure(error, requestId);
  }
}

export async function POST(request: Request) {
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
    const data = await createDraft(
      request.headers,
      await readJson(request),
      requestId,
    );
    return json(data, 201, {
      requestId,
      location: `/api/v1/admin/content/${data.id}`,
    });
  } catch (error) {
    return failure(error, requestId);
  }
}
