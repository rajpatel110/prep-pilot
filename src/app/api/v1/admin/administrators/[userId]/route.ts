import { administrationHttp } from "@/modules/administration/http";
export const runtime = "nodejs";
export async function GET(
  request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  return administrationHttp(request, "read", (await context.params).userId);
}
