import { administrationHttp } from "@/modules/administration/http";
export const runtime = "nodejs";
export const GET = (request: Request) => administrationHttp(request, "list");
