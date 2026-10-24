import { planningHttp } from "@/modules/planning/http";
export const runtime = "nodejs";
export async function GET(request: Request) {
  return planningHttp(request, "progress");
}
