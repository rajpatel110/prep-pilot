import { randomUUID } from "node:crypto";
import { listRevisions } from "@/modules/revisions/reads";
import { failure } from "@/shared/server/http";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const requestId = randomUUID();
  try {
    return Response.json(
      await listRevisions(request.headers, new URL(request.url).searchParams),
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
