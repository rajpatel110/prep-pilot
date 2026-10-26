import "server-only";
import { randomUUID } from "node:crypto";
import { emailClientSubject } from "@/shared/server/email-client";
export { emailClientSubject } from "@/shared/server/email-client";
import { getAuth } from "./auth";
import { requireActor } from "./service";
import { emailSchemas } from "./email-schema";
import { emailAllowed } from "@/modules/notifications/policy";
import {
  claimVerification,
  emailDigest,
  emailIssuance,
} from "@/modules/notifications/service";
import { emailIdentity } from "./profile";
import { getAuthClient } from "@/shared/server/db";
import { serverConfig } from "@/shared/server/config";
import { requireCsrf, requireOrigin } from "@/shared/server/csrf";
import { rateLimit } from "@/shared/server/rate-limit";
import { failure, HttpError, json, readJson } from "@/shared/server/http";

const invalid = () =>
  new HttpError(
    400,
    "TOKEN_INVALID_OR_EXPIRED",
    "This link is invalid, expired or already used. Request a new link.",
  );
export function createIdentityEmailHttp(dependencies: {
  config: typeof serverConfig;
  auth: typeof getAuth;
  actor: typeof requireActor;
  client: typeof getAuthClient;
  limit: typeof rateLimit;
}) {
  return async (request: Request) => {
    const requestId = randomUUID();
    const { config } = dependencies;
    try {
      const url = new URL(request.url),
        operation = url.pathname.replace(/^\/api\/v1\/identity\//, "");
      if (url.searchParams.size)
        throw new HttpError(
          422,
          "VALIDATION_ERROR",
          "Query parameters are not supported.",
        );
      if (request.method !== "POST" || !Object.hasOwn(emailSchemas, operation))
        throw new HttpError(404, "NOT_FOUND", "Route not available.");
      requireOrigin(request);
      const parsed = emailSchemas[
        operation as keyof typeof emailSchemas
      ].safeParse(await readJson(request));
      if (!parsed.success) {
        const fields: Record<string, string[]> = {};
        for (const issue of parsed.error.issues) {
          const field = issue.path[0];
          if (
            typeof field === "string" &&
            ["email", "token", "newPassword"].includes(field)
          )
            fields[field] = [
              field === "newPassword"
                ? "Use 12–128 characters."
                : field === "email"
                  ? "Enter a valid email address."
                  : "Use the link from your email.",
            ];
        }
        throw new HttpError(
          422,
          "VALIDATION_ERROR",
          "Check the submitted fields.",
          fields,
        );
      }
      const body = parsed.data;
      const ip = emailClientSubject(request);
      let actor: Awaited<ReturnType<typeof requireActor>> | undefined;
      if (operation === "verification/request") {
        actor = await dependencies.actor(request.headers);
        requireCsrf(request, actor.session.session.id);
        if (actor.session.user.emailVerified)
          return json({ status: "already_verified" }, 200, { requestId });
      }
      if (
        !config.AUTH_ENABLED ||
        config.EMAIL_DELIVERY_MODE === "disabled" ||
        (actor && !emailAllowed(config, actor.session.user.email))
      )
        throw new HttpError(
          503,
          "EMAIL_DISABLED",
          "Email delivery is unavailable for this account in this environment. General demo verification and recovery remain disabled.",
        );
      const headers = new Headers(request.headers);
      headers.set("x-preppilot-request-id", requestId);
      if (operation.endsWith("/request")) {
        const address =
          actor?.session.user.email ?? ("email" in body ? body.email : "");
        await dependencies.limit(`email-send-ip:${operation}`, ip, 10, 3600);
        await dependencies.limit(
          `email-send-address:${operation}`,
          address.toLowerCase(),
          3,
          3600,
        );
        if (operation === "verification/request") {
          const auth = await dependencies.auth();
          await auth.api.sendVerificationEmail({
            headers,
            body: {
              email: address,
              callbackURL: `${config.APP_URL}/verify-email`,
            },
          });
        } else {
          const started = Date.now();
          try {
            if (emailAllowed(config, address))
              await (
                await dependencies.auth()
              ).api.requestPasswordReset({
                headers,
                body: {
                  email: address,
                  redirectTo: `${config.APP_URL}/reset-password`,
                },
              });
          } catch {
            console.error(
              JSON.stringify({ requestId, code: "EMAIL_REQUEST_UNAVAILABLE" }),
            );
          }
          await new Promise((resolve) =>
            setTimeout(resolve, Math.max(0, 500 - (Date.now() - started))),
          );
        }
        return json({ status: "accepted" }, 202, { requestId });
      }
      await dependencies.limit("email-consume-ip", ip, 10, 900);
      if (!("token" in body)) throw invalid();
      const client = await dependencies.client();
      const db = client.db(config.MONGODB_DB_NAME);
      const verification = operation === "verification/confirm";
      const digest = emailDigest(
        verification ? "verification" : "reset",
        body.token,
      );
      const record = await emailIssuance(
        client,
        config.MONGODB_DB_NAME!,
        verification ? "verification" : "reset",
        digest,
      );
      if (!record || typeof record.userId !== "string") throw invalid();
      const identity = await emailIdentity(db, record.userId);
      if (!identity || !emailAllowed(config, identity.email)) throw invalid();
      const auth = await dependencies.auth();
      if (verification) {
        let issuedEmail: unknown;
        try {
          issuedEmail = JSON.parse(
            Buffer.from(body.token.split(".")[1]!, "base64url").toString(
              "utf8",
            ),
          ).email;
        } catch {
          throw invalid();
        }
        if (issuedEmail !== identity.email.toLowerCase()) throw invalid();
        const claimed = await claimVerification(
          client,
          config.MONGODB_DB_NAME!,
          digest,
          record.userId,
        );
        if (!claimed) throw invalid();
      }
      try {
        if (verification)
          await auth.api.verifyEmail({ query: { token: body.token } });
        else if ("newPassword" in body)
          await auth.api.resetPassword({
            body: { token: body.token, newPassword: body.newPassword },
          });
        else throw invalid();
      } catch (error) {
        const code = (error as { body?: { code?: string } }).body?.code;
        if (
          code &&
          ["INVALID_TOKEN", "TOKEN_EXPIRED", "USER_NOT_FOUND"].includes(code)
        )
          throw invalid();
        throw new HttpError(
          503,
          "DEPENDENCY_UNAVAILABLE",
          verification
            ? "Confirmation could not finish. Request a new verification link."
            : "Reset could not be confirmed. Try signing in with the intended password before requesting another link.",
        );
      }
      return json(
        verification
          ? { verified: true, nextAction: "sign_in" }
          : { reset: true, nextAction: "sign_in" },
        200,
        { requestId },
      );
    } catch (error) {
      return failure(error, requestId);
    }
  };
}
export const identityEmailHttp = createIdentityEmailHttp({
  config: serverConfig,
  auth: getAuth,
  actor: requireActor,
  client: getAuthClient,
  limit: rateLimit,
});
