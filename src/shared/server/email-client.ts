import { isIP } from "node:net";

export function emailClientSubject(request: Request) {
  const supplied = request.headers
    .get("x-vercel-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  return process.env.VERCEL === "1" && supplied && isIP(supplied)
    ? supplied
    : "untrusted-or-local";
}
