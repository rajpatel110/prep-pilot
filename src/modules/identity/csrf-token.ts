import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export function issueCsrf(sessionId: string, secret: string, now = Date.now()) {
  const expires = now + 30 * 60 * 1000;
  const payload = `${expires}.${randomBytes(24).toString("base64url")}`;
  const signature = createHmac("sha256", secret)
    .update(`${sessionId}:${payload}`)
    .digest("base64url");
  return {
    token: `${payload}.${signature}`,
    expiresAt: new Date(expires).toISOString(),
  };
}
export function validCsrf(
  token: string,
  sessionId: string,
  secret: string,
  now = Date.now(),
) {
  if (token.length > 256) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [expires, nonce, signature] = parts;
  const expiry = Number(expires);
  if (!Number.isSafeInteger(expiry) || expiry <= now || expiry > now + 1800000)
    return false;
  const expected = createHmac("sha256", secret)
    .update(`${sessionId}:${expires}.${nonce}`)
    .digest();
  const actual = Buffer.from(signature!, "base64url");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
