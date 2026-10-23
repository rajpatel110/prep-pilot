import "server-only";
import { serverConfig } from "./config";
import { HttpError } from "./http";
import { validCsrf } from "@/modules/identity/csrf-token";

export function requireOrigin(request: Request) {
  if (request.headers.get("origin") !== serverConfig.APP_URL)
    throw new HttpError(
      403,
      "ORIGIN_REJECTED",
      "Request origin is not allowed.",
    );
}
export function requireCsrf(request: Request, sessionId: string) {
  requireOrigin(request);
  if (
    !validCsrf(
      request.headers.get("x-csrf-token") ?? "",
      sessionId,
      serverConfig.CSRF_SECRET!,
    )
  )
    throw new HttpError(
      403,
      "CSRF_TOKEN_INVALID",
      "Refresh the page and try again.",
    );
}
