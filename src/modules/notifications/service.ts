import "server-only";
import { createHash, randomUUID } from "node:crypto";
import type { MongoClient } from "mongodb";
import { after } from "next/server";
import { emailAllowed, type EmailConfiguration } from "./policy";
import {
  resendTransport,
  brevoTransport,
  DeliveryError,
  type EmailTransport,
} from "./transport";
import { emailIndexes } from "./indexes";
import { emailModels } from "./model";

export type EmailUser = { id: string; email: string };
export function emailDigest(type: string, token: string) {
  return createHash("sha256").update(`${type}:${token}`).digest("hex");
}
export async function emailIssuance(
  client: MongoClient,
  database: string,
  type: "verification" | "reset",
  digest: string,
) {
  const models = emailModels(client, database);
  return type === "verification"
    ? models.claims
        .findOne({
          tokenDigest: digest,
          claimedAt: null,
          expiresAt: { $gt: new Date() },
        })
        .select({ userId: 1 })
        .lean()
    : models.deliveries
        .findOne({ operationKey: digest, type: "reset" })
        .select({ userId: 1 })
        .lean();
}
export async function claimVerification(
  client: MongoClient,
  database: string,
  tokenDigest: string,
  userId: string,
) {
  return emailModels(client, database)
    .claims.findOneAndUpdate(
      { tokenDigest, userId, claimedAt: null, expiresAt: { $gt: new Date() } },
      { $set: { claimedAt: new Date() } },
      { returnDocument: "after", runValidators: true },
    )
    .lean();
}
export function createEmailDispatcher(
  client: MongoClient,
  database: string,
  config: EmailConfiguration,
  options: {
    schedule?: (work: () => Promise<void>) => void;
    transport?: EmailTransport;
    pause?: (ms: number) => Promise<void>;
  } = {},
) {
  const db = client.db(database);
  const { deliveries, claims } = emailModels(client, database);
  const schedule = options.schedule ?? after;
  const transport =
    options.transport ??
    (config.EMAIL_PROVIDER === "brevo"
      ? brevoTransport(config.BREVO_API_KEY ?? "", {
          email: config.BREVO_SENDER_EMAIL ?? "",
          name: config.BREVO_SENDER_NAME ?? "",
        })
      : resendTransport(config.RESEND_API_KEY ?? ""));
  const pause =
    options.pause ??
    ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  let readiness: Promise<void> | undefined;
  async function ready() {
    readiness ??= (async () => {
      for (const [name, expected] of Object.entries(emailIndexes)) {
        const indexes = await db.collection(name).listIndexes().toArray();
        for (const definition of expected)
          if (
            !indexes.some(
              (index) =>
                index.name === definition.name &&
                JSON.stringify(index.key) === JSON.stringify(definition.key) &&
                Boolean(index.unique) === Boolean(definition.unique) &&
                index.expireAfterSeconds === definition.expireAfterSeconds,
            )
          )
            throw new Error("Email database setup required.");
      }
    })().catch((error) => {
      readiness = undefined;
      throw error;
    });
    await readiness;
  }
  async function queue(
    type: "verification" | "reset",
    user: EmailUser,
    token: string,
    requestId: string = randomUUID(),
  ) {
    await ready();
    const operationKey = emailDigest(type, token),
      now = new Date();
    const allowed = emailAllowed(config, user.email);
    const session = client.startSession();
    try {
      await session.withTransaction(
        async () => {
          if (allowed && type === "verification") {
            const payload = JSON.parse(
              Buffer.from(token.split(".")[1]!, "base64url").toString("utf8"),
            ) as { exp: number };
            if (!Number.isFinite(payload.exp))
              throw new Error("Invalid issuance.");
            const expiresAt = new Date(payload.exp * 1000);
            await claims.updateOne(
              { tokenDigest: operationKey },
              {
                $setOnInsert: {
                  tokenDigest: operationKey,
                  userId: user.id,
                  expiresAt,
                  claimedAt: null,
                  purgeAt: new Date(expiresAt.getTime() + 86400000),
                  schemaVersion: 1,
                },
              },
              { upsert: true, session, runValidators: true },
            );
          }
          await deliveries.updateOne(
            { operationKey },
            {
              $setOnInsert: {
                operationKey,
                userId: user.id,
                type,
                state: allowed ? "pending" : "skipped_test",
                attempts: 0,
                purgeAt: new Date(now.getTime() + 30 * 86400000),
                requestId,
                schemaVersion: 1,
              },
            },
            { upsert: true, session, runValidators: true },
          );
        },
        {
          readPreference: "primary",
          readConcern: { level: "snapshot" },
          writeConcern: { w: "majority" },
          timeoutMS: 15000,
          maxCommitTimeMS: 5000,
        },
      );
    } finally {
      await session.endSession();
    }
    if (!allowed) return;
    const link = new URL(
      type === "verification" ? "/verify-email" : "/reset-password",
      config.APP_URL,
    );
    link.hash = new URLSearchParams({ token }).toString();
    const message = {
      to: user.email,
      from:
        config.EMAIL_PROVIDER === "brevo"
          ? `${config.BREVO_SENDER_NAME} <${config.BREVO_SENDER_EMAIL}>`
          : config.RESEND_FROM_EMAIL!,
      idempotencyKey: operationKey,
      subject:
        type === "verification"
          ? "Verify your PrepPilot email"
          : "Reset your PrepPilot password",
      text: `${type === "verification" ? "Confirm your email using the button on the page. This link expires in 60 minutes." : "Choose a new password on the page. This link expires in 30 minutes and resetting revokes your existing sessions."}\n\n${link.href}\n\nIf you did not request this, ignore this email. Opening the page alone does not change your account.`,
    };
    schedule(async () => {
      try {
        const record = await deliveries.findOne({ operationKey }).lean();
        if (!record || record.state !== "pending") return;
        for (let attempt = 0; attempt < 3; attempt++) {
          const reserved = await deliveries.findOneAndUpdate(
            { operationKey, state: "pending", attempts: { $lt: 3 } },
            { $inc: { attempts: 1 }, $set: { updatedAt: new Date() } },
            { returnDocument: "after" },
          );
          if (!reserved) return;
          try {
            const sent = await transport(message);
            await deliveries.updateOne(
              { operationKey },
              {
                $set: {
                  state: "accepted",
                  providerId: sent.providerId,
                  updatedAt: new Date(),
                },
                $unset: { errorCode: "" },
              },
            );
            return;
          } catch (error) {
            if (
              error instanceof DeliveryError &&
              error.retryable &&
              attempt < 2
            ) {
              await pause(250 * (attempt + 1));
              continue;
            }
            await deliveries.updateOne(
              { operationKey, state: "pending" },
              {
                $set: {
                  state: "failed",
                  errorCode:
                    error instanceof DeliveryError
                      ? error.code
                      : "DELIVERY_STATE_UNAVAILABLE",
                  updatedAt: new Date(),
                },
              },
            );
            if (
              error instanceof DeliveryError &&
              config.EMAIL_PROVIDER === "brevo"
            )
              console.error(
                JSON.stringify({
                  requestId,
                  code: error.code,
                  provider: "brevo",
                  status: error.providerStatus,
                  providerCode: error.providerCode,
                }),
              );
            return;
          }
        }
      } catch {
        console.error(
          JSON.stringify({
            requestId,
            code: "EMAIL_DELIVERY_STATE_UNAVAILABLE",
          }),
        );
      }
    });
  }
  return { queue, ready };
}
