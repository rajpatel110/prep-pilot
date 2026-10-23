import { actorDto, requireActor } from "@/modules/identity/service";
import { json, failure } from "@/shared/server/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    return json(actorDto(await requireActor(request.headers)));
  } catch (error) {
    return failure(error);
  }
}
