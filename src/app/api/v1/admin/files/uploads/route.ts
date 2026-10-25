import { fileHttp } from "@/modules/files/http";
export const runtime = "nodejs";
export const POST = (request: Request) => fileHttp(request, "grant");
