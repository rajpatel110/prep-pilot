import "server-only";
import { serverConfig } from "./config";
import { HttpError } from "./http";
import { inspectCsrf } from "@/modules/identity/csrf-token";

export function requireOrigin(request: Request) {
  if (request.headers.get("origin") !== serverConfig.APP_URL)
    throw new HttpError(403, "CSRF_INVALID", "Request origin is not allowed.");
}
export function requireCsrf(request: Request, sessionId: string) {
  return checkCsrf(request, sessionId, {
    origin: serverConfig.APP_URL,
    secret: serverConfig.CSRF_SECRET!,
  });
}

export function checkCsrf(
  request: Request,
  sessionId: string,
  protection: { origin: string; secret: string },
  now = Date.now(),
) {
  if (request.headers.get("origin") !== protection.origin)
    throw new HttpError(403, "CSRF_INVALID", "Request origin is not allowed.");
  const result = inspectCsrf(
    request.headers.get("x-csrf-token") ?? "",
    sessionId,
    protection.secret,
    now,
  );
  if (result !== "valid")
    throw new HttpError(
      403,
      result === "expired" ? "CSRF_TOKEN_EXPIRED" : "CSRF_INVALID",
      "Refresh the page and try again.",
    );
}
