import { fileHttp } from "@/modules/files/http";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return fileHttp(request, "finalize", (await context.params).id);
}
