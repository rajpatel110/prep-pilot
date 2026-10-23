import { requireActor } from "@/modules/identity/service";
import { requireCsrf, requireOrigin } from "@/shared/server/csrf";
import { failure, HttpError, readJson } from "@/shared/server/http";
import { z } from "zod";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    requireOrigin(request);
    const path = new URL(request.url).pathname;
    const schema = path.endsWith("/verification/request")
      ? z.object({}).strict()
      : path.endsWith("/verification/confirm")
        ? z.object({ token: z.string().min(1).max(8192) }).strict()
        : path.endsWith("/password-reset/request")
          ? z.object({ email: z.string().email().max(254) }).strict()
          : path.endsWith("/password-reset/confirm")
            ? z
                .object({
                  token: z.string().min(1).max(8192),
                  newPassword: z.string().min(12).max(128),
                })
                .strict()
            : null;
    if (!schema) throw new HttpError(404, "NOT_FOUND", "Route not available.");
    if (!schema.safeParse(await readJson(request)).success)
      throw new HttpError(
        422,
        "VALIDATION_ERROR",
        "Check the submitted fields.",
      );
    if (path.endsWith("/verification/request")) {
      const actor = await requireActor(request.headers);
      requireCsrf(request, actor.session.session.id);
    }
    throw new HttpError(
      503,
      "EMAIL_DISABLED",
      "Verification and password recovery are unavailable in this demo. Live email delivery has not been configured.",
    );
  } catch (error) {
    return failure(error);
  }
}
