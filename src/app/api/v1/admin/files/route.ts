import { fileHttp } from "@/modules/files/http";
export const runtime = "nodejs";
export const GET = (request: Request) => fileHttp(request, "list");
