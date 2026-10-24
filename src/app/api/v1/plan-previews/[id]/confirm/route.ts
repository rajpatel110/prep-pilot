import { planningHttp } from "@/modules/planning/http";
export const runtime = "nodejs";
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return planningHttp(request, "confirm", (await context.params).id);
}
