import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

export function GET() {
  return Response.json(
    { data: { status: "ok" } },
    { headers: { "X-Request-Id": randomUUID(), "Cache-Control": "no-store" } },
  );
}
