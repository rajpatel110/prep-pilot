import { randomUUID } from "node:crypto";
import { submitAttempt } from "@/modules/practice/service";
import { listAttempts } from "@/modules/practice/reads";
import { requirePracticeActor } from "@/modules/practice/access";
import { requireCsrf } from "@/shared/server/csrf";
import { failure, HttpError, readJson } from "@/shared/server/http";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const requestId = randomUUID();
  try {
    return Response.json(
      await listAttempts(request.headers, new URL(request.url).searchParams),
      {
        headers: {
          "Cache-Control": "private, no-store",
          "X-Request-Id": requestId,
        },
      },
    );
  } catch (error) {
    return failure(error, requestId);
  }
}
export async function POST(request: Request) {
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
    const result = await submitAttempt(
      request.headers,
      await readJson(request),
    );
    return Response.json(result, {
      status: result.meta.replayed ? 200 : 201,
      headers: { "Cache-Control": "no-store", "X-Request-Id": requestId },
    });
  } catch (error) {
    const response = failure(error, requestId);
    if (error instanceof HttpError && error.status === 429)
      response.headers.set("Retry-After", "60");
    return response;
  }
}
