import { fileHttp } from "@/modules/files/http";
export const runtime = "nodejs";
export const maxDuration = 60;
export const POST = (request: Request) => fileHttp(request, "cleanup");
