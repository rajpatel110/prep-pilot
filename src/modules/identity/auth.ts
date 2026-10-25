import "server-only";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { getAuthClient } from "@/shared/server/db";
import { serverConfig } from "@/shared/server/config";
import { HttpError } from "@/shared/server/http";
import { createEmailDispatcher } from "@/modules/notifications/service";

let instance: ReturnType<typeof buildAuth> | undefined;
export function buildAuth(
  client: Awaited<ReturnType<typeof getAuthClient>>,
  config = serverConfig,
  dispatcher = createEmailDispatcher(client, config.MONGODB_DB_NAME!, config),
) {
  return betterAuth({
    appName: "PrepPilot",
    baseURL: config.APP_URL,
    secret: config.BETTER_AUTH_SECRET!,
    trustedOrigins: [config.APP_URL],
    database: mongodbAdapter(client.db(config.MONGODB_DB_NAME), {
      client,
      transaction: true,
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      revokeSessionsOnPasswordReset: true,
      resetPasswordTokenExpiresIn: 1800,
      requireEmailVerification: false,
      sendResetPassword: async ({ user, token }, request) => {
        await dispatcher.queue(
          "reset",
          user,
          token,
          request?.headers.get("x-preppilot-request-id") ?? undefined,
        );
      },
    },
    emailVerification: {
      expiresIn: 3600,
      autoSignInAfterVerification: false,
      sendOnSignUp: false,
      sendOnSignIn: false,
      sendVerificationEmail: async ({ user, token }, request) => {
        await dispatcher.queue(
          "verification",
          user,
          token,
          request?.headers.get("x-preppilot-request-id") ?? undefined,
        );
      },
    },
    session: {
      expiresIn: 7 * 86400,
      updateAge: 86400,
      cookieCache: { enabled: false },
    },
    advanced: {
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
    },
    logger: { disabled: true },
    rateLimit: { enabled: false },
  });
}
export async function getAuth() {
  if (!serverConfig.AUTH_ENABLED)
    throw new HttpError(
      503,
      "AUTH_DISABLED",
      "Account access is not configured yet.",
    );
  instance ??= buildAuth(await getAuthClient());
  return instance;
}
