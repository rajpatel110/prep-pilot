import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
const tuple = z.union([
  z.strictObject({
    sequence: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  }),
  z.strictObject({
    date: z.iso.date(),
    id: z.string().regex(/^[a-f0-9]{24}$/),
  }),
]);
const schema = z.strictObject({
  version: z.literal(1),
  after: tuple,
  binding: z.string().length(43),
  expires: z.number().int().positive(),
});
export type StudyTuple = z.infer<typeof tuple>;
const digest = (binding: string) =>
  createHash("sha256").update(binding).digest("base64url");
const signature = (payload: string, secret: string) =>
  createHmac("sha256", secret)
    .update(`preppilot:study-cursor:v1:${payload}`)
    .digest();
export function issueStudyCursor(
  after: StudyTuple,
  binding: string,
  secret: string,
  now = Date.now(),
) {
  const payload = Buffer.from(
    JSON.stringify({
      version: 1,
      after,
      binding: digest(binding),
      expires: now + 1800000,
    }),
  ).toString("base64url");
  return `${payload}.${signature(payload, secret).toString("base64url")}`;
}
export function inspectStudyCursor(
  token: string,
  binding: string,
  secret: string,
  now = Date.now(),
): StudyTuple | null {
  if (token.length > 2048) return null;
  const [payload, signed, ...extra] = token.split(".");
  if (
    extra.length ||
    !payload ||
    !signed ||
    !/^[\w-]+$/.test(payload) ||
    !/^[\w-]{43}$/.test(signed)
  )
    return null;
  const actual = Buffer.from(signed, "base64url");
  const expected = signature(payload, secret);
  if (
    actual.toString("base64url") !== signed ||
    actual.length !== expected.length ||
    !timingSafeEqual(actual, expected)
  )
    return null;
  try {
    const bytes = Buffer.from(payload, "base64url");
    if (bytes.toString("base64url") !== payload) return null;
    const result = schema.safeParse(JSON.parse(bytes.toString("utf8")));
    return result.success &&
      result.data.binding === digest(binding) &&
      result.data.expires > now &&
      result.data.expires <= now + 1800000
      ? result.data.after
      : null;
  } catch {
    return null;
  }
}
