import { randomUUID } from "node:crypto";
import { getStudentContent } from "@/modules/catalog/reads";
import { failure, json } from "@/shared/server/http";
export const runtime = "nodejs";
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const requestId = randomUUID();
  try {
    const { id } = await context.params;
    return json(
      await getStudentContent(
        request.headers,
        id,
        new URL(request.url).searchParams,
      ),
      200,
      { requestId },
    );
  } catch (error) {
    return failure(error, requestId);
  }
}
