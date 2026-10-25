import { administrationHttp } from "@/modules/administration/http";
export const runtime = "nodejs";
export const POST = (request: Request) => administrationHttp(request, "lookup");
