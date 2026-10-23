// This parser is also used by next.config.ts, outside React's module graph.
// Application code must import it through the server-only config.ts wrapper.
import { z } from "zod";

const schema = z.object({
  AUTH_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  MONGODB_URI: z.string().optional(),
  MONGODB_DB_NAME: z
    .string()
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
  BETTER_AUTH_SECRET: z.string().min(32).optional(),
  CSRF_SECRET: z.string().min(32).optional(),
  RATE_LIMIT_SECRET: z.string().min(32).optional(),
  EMAIL_MODE: z.enum(["test", "live"]).default("test"),
  APP_URL: z
    .string()
    .url()
    .refine((value) => {
      if (!URL.canParse(value)) return false;
      const url = new URL(value);
      return (
        ["http:", "https:"].includes(url.protocol) &&
        !url.username &&
        !url.password &&
        url.pathname === "/" &&
        !url.search &&
        !url.hash
      );
    })
    .default("http://localhost:3000")
    .transform((value) => new URL(value).origin),
});

export function getServerEnv(
  source: Record<string, string | undefined> = process.env,
) {
  const result = schema.safeParse({
    APP_URL: source.APP_URL,
    AUTH_ENABLED: source.AUTH_ENABLED,
    MONGODB_URI: source.MONGODB_URI || undefined,
    MONGODB_DB_NAME: source.MONGODB_DB_NAME || undefined,
    BETTER_AUTH_SECRET: source.BETTER_AUTH_SECRET || undefined,
    CSRF_SECRET: source.CSRF_SECRET || undefined,
    RATE_LIMIT_SECRET: source.RATE_LIMIT_SECRET || undefined,
    EMAIL_MODE: source.EMAIL_MODE,
  });
  if (!result.success) {
    // Field names only: do not include environment values in diagnostics.
    throw new Error(
      `Invalid server configuration fields: ${result.error.issues.map((issue) => issue.path.join(".")).join(", ")}. Check origin, modes and secret lengths.`,
    );
  }
  if (
    result.data.AUTH_ENABLED &&
    (!result.data.MONGODB_URI?.match(/^mongodb(\+srv)?:\/\//) ||
      !result.data.MONGODB_DB_NAME ||
      !result.data.BETTER_AUTH_SECRET ||
      !result.data.CSRF_SECRET ||
      !result.data.RATE_LIMIT_SECRET)
  ) {
    throw new Error(
      "Authentication configuration is incomplete. Configure MongoDB and independent authentication, CSRF and rate-limit secrets.",
    );
  }
  return result.data;
}
