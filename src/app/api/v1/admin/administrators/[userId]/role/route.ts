import { administrationHttp } from "@/modules/administration/http";
export const runtime = "nodejs";
export async function PATCH(
  request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  return administrationHttp(request, "change", (await context.params).userId);
}
