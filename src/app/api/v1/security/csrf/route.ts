import { requireActor } from "@/modules/identity/service";
import { issueCsrf } from "@/modules/identity/csrf-token";
import { serverConfig } from "@/shared/server/config";
import { json, failure } from "@/shared/server/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const actor = await requireActor(request.headers);
    return json(issueCsrf(actor.session.session.id, serverConfig.CSRF_SECRET!));
  } catch (error) {
    return failure(error);
  }
}
