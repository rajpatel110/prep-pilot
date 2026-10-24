import { randomUUID } from "node:crypto";
import { listStudentContent } from "@/modules/catalog/reads";
import { failure } from "@/shared/server/http";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const requestId = randomUUID();
  try {
    return Response.json(
      await listStudentContent(
        request.headers,
        new URL(request.url).searchParams,
      ),
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
