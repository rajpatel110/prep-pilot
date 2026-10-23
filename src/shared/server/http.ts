import "server-only";
import { randomUUID } from "node:crypto";

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Readonly<Record<string, readonly string[]>>,
  ) {
    super(message);
  }
}
export function json(data: unknown, status = 200) {
  return Response.json(
    { data },
    {
      status,
      headers: { "Cache-Control": "no-store", "X-Request-Id": randomUUID() },
    },
  );
}
export function failure(error: unknown) {
  const requestId = randomUUID();
  const known = error instanceof HttpError;
  return Response.json(
    {
      error: {
        code: known ? error.code : "SERVICE_UNAVAILABLE",
        message: known
          ? error.message
          : "The service is temporarily unavailable. Please try again.",
        ...(known && error.fields ? { fields: error.fields } : {}),
      },
      requestId,
    },
    {
      status: known ? error.status : 503,
      headers: {
        "Cache-Control": "no-store",
        "X-Request-Id": requestId,
        ...(known && error.status === 429 ? { "Retry-After": "900" } : {}),
      },
    },
  );
}
export async function readJson(request: Request) {
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json")
    throw new HttpError(415, "UNSUPPORTED_MEDIA_TYPE", "Use application/json.");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "INVALID_JSON", "Invalid JSON.");
  let length = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    length += part.value.byteLength;
    if (length > 65536) {
      await reader.cancel();
      throw new HttpError(413, "BODY_TOO_LARGE", "Request too large.");
    }
    chunks.push(part.value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch {
    throw new HttpError(400, "INVALID_JSON", "Invalid JSON.");
  }
}
