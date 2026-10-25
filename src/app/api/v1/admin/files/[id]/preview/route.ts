import { fileHttp } from "@/modules/files/http";
export const runtime = "nodejs";
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return fileHttp(request, "preview", (await context.params).id);
}
