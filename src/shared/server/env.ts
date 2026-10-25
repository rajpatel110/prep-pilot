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
  FILES_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  R2_ACCOUNT_ID: z
    .string()
    .regex(/^[a-f0-9]{32}$/)
    .optional(),
  R2_BUCKET: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/)
    .optional(),
  R2_ACCESS_KEY_ID: z.string().min(1).optional(),
  R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  EMAIL_MODE: z.enum(["test", "live"]).default("test"),
  EMAIL_DELIVERY_MODE: z
    .enum(["disabled", "owner_test", "live"])
    .default("disabled"),
  EMAIL_TEST_RECIPIENT: z.string().trim().toLowerCase().email().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().max(320).optional(),
  RESEND_SENDER_VERIFIED: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
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
    FILES_ENABLED: source.FILES_ENABLED,
    R2_ACCOUNT_ID: source.R2_ACCOUNT_ID || undefined,
    R2_BUCKET: source.R2_BUCKET || undefined,
    R2_ACCESS_KEY_ID: source.R2_ACCESS_KEY_ID || undefined,
    R2_SECRET_ACCESS_KEY: source.R2_SECRET_ACCESS_KEY || undefined,
    AUTH_ENABLED: source.AUTH_ENABLED,
    MONGODB_URI: source.MONGODB_URI || undefined,
    MONGODB_DB_NAME: source.MONGODB_DB_NAME || undefined,
    BETTER_AUTH_SECRET: source.BETTER_AUTH_SECRET || undefined,
    CSRF_SECRET: source.CSRF_SECRET || undefined,
    RATE_LIMIT_SECRET: source.RATE_LIMIT_SECRET || undefined,
    EMAIL_MODE: source.EMAIL_MODE,
    EMAIL_DELIVERY_MODE: source.EMAIL_DELIVERY_MODE,
    EMAIL_TEST_RECIPIENT: source.EMAIL_TEST_RECIPIENT || undefined,
    RESEND_API_KEY: source.RESEND_API_KEY || undefined,
    RESEND_FROM_EMAIL: source.RESEND_FROM_EMAIL || undefined,
    RESEND_SENDER_VERIFIED: source.RESEND_SENDER_VERIFIED,
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
  const config = result.data;
  if (
    config.FILES_ENABLED &&
    (!config.AUTH_ENABLED ||
      !config.R2_ACCOUNT_ID ||
      !config.R2_BUCKET ||
      !config.R2_ACCESS_KEY_ID ||
      !config.R2_SECRET_ACCESS_KEY)
  )
    throw new Error(
      "Files require authentication and complete server-only R2 configuration.",
    );
  if (config.EMAIL_DELIVERY_MODE !== "disabled") {
    const sender = config.RESEND_FROM_EMAIL ?? "";
    const address = sender.includes("<")
      ? sender.match(/^[^<>\r\n]+<([^<>]+)>$/)?.[1]
      : sender;
    if (
      !config.AUTH_ENABLED ||
      !config.RESEND_API_KEY?.trim() ||
      !z.email().safeParse(address).success ||
      /[\r\n]/.test(sender)
    )
      throw new Error(
        "Email delivery requires AUTH_ENABLED, RESEND_API_KEY and a valid RESEND_FROM_EMAIL.",
      );
    if (
      config.EMAIL_DELIVERY_MODE === "owner_test" &&
      (config.EMAIL_MODE !== "test" ||
        !config.EMAIL_TEST_RECIPIENT ||
        !["localhost", "127.0.0.1", "[::1]"].includes(
          new URL(config.APP_URL).hostname,
        ))
    )
      throw new Error(
        "Owner-inbox testing requires EMAIL_MODE=test, EMAIL_TEST_RECIPIENT and a loopback APP_URL.",
      );
    if (
      config.EMAIL_DELIVERY_MODE === "live" &&
      (config.EMAIL_MODE !== "live" ||
        !config.RESEND_SENDER_VERIFIED ||
        /@(?:[^@]+\.)?resend\.dev$/i.test(address!) ||
        !config.APP_URL.startsWith("https://"))
    )
      throw new Error(
        "Live delivery requires EMAIL_MODE=live, HTTPS and an explicitly verified non-testing sender.",
      );
  }
  return config;
}
