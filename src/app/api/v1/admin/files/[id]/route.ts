import { fileHttp } from "@/modules/files/http";
export const runtime = "nodejs";
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return fileHttp(request, "status", (await context.params).id);
}
