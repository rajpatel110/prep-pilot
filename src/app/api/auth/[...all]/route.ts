import { getAuth } from "@/modules/identity/auth";
import {
  signupSchema,
  loginSchema,
  signoutSchema,
} from "@/modules/identity/schemas";
import { requireOrigin } from "@/shared/server/csrf";
import { rateLimit } from "@/shared/server/rate-limit";
import { failure, HttpError, readJson } from "@/shared/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function handle(request: Request) {
  try {
    const path = new URL(request.url).pathname.replace(/^\/api\/auth/, "");
    const auth = await getAuth();
    if (request.method === "GET" && path === "/get-session") {
      const result = await auth.handler(request);
      result.headers.set("Cache-Control", "no-store");
      return result;
    }
    const schema =
      path === "/sign-up/email"
        ? signupSchema
        : path === "/sign-in/email"
          ? loginSchema
          : path === "/sign-out"
            ? signoutSchema
            : null;
    if (!schema) throw new HttpError(404, "NOT_FOUND", "Route not available.");
    if (request.method !== "POST")
      throw new HttpError(405, "METHOD_NOT_ALLOWED", "Use POST.");
    requireOrigin(request);
    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success)
      throw new HttpError(
        422,
        "VALIDATION_ERROR",
        "Check your name, email and password. Passwords must be 12–128 characters when creating an account.",
      );
    await rateLimit(
      `auth-global:${path}`,
      "all",
      path === "/sign-up/email" ? 30 : 200,
      900,
    );
    if ("email" in parsed.data)
      await rateLimit(
        `auth-account:${path}`,
        parsed.data.email,
        path === "/sign-up/email" ? 5 : 10,
        900,
      );
    const forwarded = new Request(request.url, {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify(parsed.data),
    });
    const result = await auth.handler(forwarded);
    result.headers.set("Cache-Control", "no-store");
    return result;
  } catch (error) {
    return failure(error);
  }
}
export const GET = handle;
export const POST = handle;
