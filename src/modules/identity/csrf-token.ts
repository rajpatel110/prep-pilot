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
export function inspectCsrf(
  token: string,
  sessionId: string,
  secret: string,
  now = Date.now(),
): "valid" | "invalid" | "expired" {
  if (token.length > 256) return "invalid";
  const parts = token.split(".");
  if (parts.length !== 3) return "invalid";
  const [expires, nonce, signature] = parts;
  if (
    !/^\d{1,16}$/.test(expires!) ||
    !/^[A-Za-z0-9_-]{32}$/.test(nonce!) ||
    !/^[A-Za-z0-9_-]{43}$/.test(signature!)
  )
    return "invalid";
  const expiry = Number(expires);
  if (!Number.isSafeInteger(expiry) || expiry > now + 1800000) return "invalid";
  const expected = createHmac("sha256", secret)
    .update(`${sessionId}:${expires}.${nonce}`)
    .digest();
  const actual = Buffer.from(signature!, "base64url");
  if (
    actual.toString("base64url") !== signature ||
    actual.length !== expected.length ||
    !timingSafeEqual(actual, expected)
  )
    return "invalid";
  return expiry <= now ? "expired" : "valid";
}

export function validCsrf(
  token: string,
  sessionId: string,
  secret: string,
  now = Date.now(),
) {
  return inspectCsrf(token, sessionId, secret, now) === "valid";
}
