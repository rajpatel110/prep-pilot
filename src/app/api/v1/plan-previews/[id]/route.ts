import { planningHttp } from "@/modules/planning/http";
export const runtime = "nodejs";
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return planningHttp(request, "preview", (await context.params).id);
}
