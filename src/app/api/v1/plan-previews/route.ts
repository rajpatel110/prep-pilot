import { planningHttp } from "@/modules/planning/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  return planningHttp(request, "create");
}
