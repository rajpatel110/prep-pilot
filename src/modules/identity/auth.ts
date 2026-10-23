import "server-only";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { getAuthClient } from "@/shared/server/db";
import { serverConfig } from "@/shared/server/config";
import { HttpError } from "@/shared/server/http";

let instance: ReturnType<typeof buildAuth> | undefined;
function buildAuth(client: Awaited<ReturnType<typeof getAuthClient>>) {
  return betterAuth({
    appName: "PrepPilot",
    baseURL: serverConfig.APP_URL,
    secret: serverConfig.BETTER_AUTH_SECRET!,
    trustedOrigins: [serverConfig.APP_URL],
    database: mongodbAdapter(client.db(serverConfig.MONGODB_DB_NAME), {
      client,
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      revokeSessionsOnPasswordReset: true,
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
