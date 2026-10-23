import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { domainId } from "./schemas";

const payloadSchema = z.strictObject({
  version: z.literal(1),
  after: domainId,
  binding: z.string().max(2048),
  expires: z.number().int().positive(),
});
const lifetime = 30 * 60 * 1000;
const bindingHash = (binding: string) =>
  createHash("sha256").update(binding).digest("base64url");

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret)
    .update(`preppilot:admin-content-cursor:v1:${payload}`)
    .digest();
}

export function issueCatalogCursor(
  after: string,
  binding: string,
  secret: string,
  now = Date.now(),
) {
  const payload = Buffer.from(
    JSON.stringify({
      version: 1,
      after,
      binding: bindingHash(binding),
      expires: now + lifetime,
    }),
  ).toString("base64url");
  return `${payload}.${signature(payload, secret).toString("base64url")}`;
}

export function inspectCatalogCursor(
  token: string,
  binding: string,
  secret: string,
  now = Date.now(),
): string | null {
  if (token.length > 2048) return null;
  const parts = token.split(".");
  if (
    parts.length !== 2 ||
    !/^[A-Za-z0-9_-]+$/.test(parts[0]!) ||
    !/^[A-Za-z0-9_-]{43}$/.test(parts[1]!)
  )
    return null;
  const actual = Buffer.from(parts[1]!, "base64url");
  const expected = signature(parts[0]!, secret);
  if (
    actual.toString("base64url") !== parts[1] ||
    actual.length !== expected.length ||
    !timingSafeEqual(actual, expected)
  )
    return null;
  try {
    const bytes = Buffer.from(parts[0]!, "base64url");
    if (bytes.toString("base64url") !== parts[0]) return null;
    const result = payloadSchema.safeParse(JSON.parse(bytes.toString("utf8")));
    if (
      !result.success ||
      result.data.binding !== bindingHash(binding) ||
      result.data.expires <= now ||
      result.data.expires > now + lifetime
    )
      return null;
    return result.data.after;
  } catch {
    return null;
  }
}
