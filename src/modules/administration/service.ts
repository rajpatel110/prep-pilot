import "server-only";
import { createHash } from "node:crypto";
import type { ClientSession, Connection } from "mongoose";
import { getDomainConnection } from "@/shared/server/db";
import { serverConfig } from "@/shared/server/config";
import { HttpError } from "@/shared/server/http";
import { rateLimit } from "@/shared/server/rate-limit";
import { getAuth } from "@/modules/identity/auth";
import { requireOwner } from "@/modules/identity/service";
import {
  administrationProfile,
  administrationProfiles,
  guardOwnerAdministration,
  updateAdministratorRole,
} from "@/modules/identity/admin-profiles";
import { administrationIdentity } from "@/modules/identity/admin-identities";
import {
  issueCatalogCursor,
  inspectCatalogCursor,
} from "@/modules/catalog/cursor";
import { appendAudit } from "./audit";
import {
  identityId,
  lookupInput,
  passwordInput,
  roleInput,
  RECENT_AUTH_MS,
  type ManagedAccount,
} from "./schemas";

const conflict = () =>
  new HttpError(
    409,
    "STATE_CONFLICT",
    "Account state changed. Look up the account again before confirming.",
  );
const missing = () =>
  new HttpError(
    404,
    "ACCOUNT_NOT_FOUND",
    "No matching account with an existing profile.",
  );
const recentRequired = () =>
  new HttpError(
    403,
    "REAUTHENTICATION_REQUIRED",
    "Confirm your current password before changing access.",
  );
const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const options = {
  readConcern: { level: "snapshot" as const },
  writeConcern: { w: "majority" as const },
  readPreference: "primary" as const,
  maxCommitTimeMS: 10000,
};

export function createAdministrationService(
  overrides: Partial<{
    connection: typeof getDomainConnection;
    owner: typeof requireOwner;
    auth: typeof getAuth;
    audit: typeof appendAudit;
    rate: typeof rateLimit;
    now: () => number;
  }> = {},
) {
  const dependencies = {
    connection: getDomainConnection,
    owner: requireOwner,
    auth: getAuth,
    audit: appendAudit,
    rate: rateLimit,
    now: Date.now,
    ...overrides,
  };
  async function setup(connection: Connection) {
    const applied = await connection
      .db!.collection<{ _id: string; state: string }>("schemaMigrations")
      .findOne({ _id: "006_owner_administration", state: "applied" });
    const indexes = await connection
      .db!.collection("profiles")
      .listIndexes()
      .toArray();
    if (
      !applied ||
      !indexes.some(
        (index) =>
          index.name === "profiles_one_owner" &&
          index.unique &&
          JSON.stringify(index.key) === JSON.stringify({ role: 1 }) &&
          index.partialFilterExpression?.role === "owner",
      )
    )
      throw new HttpError(
        503,
        "DATABASE_SETUP_REQUIRED",
        "Explicit owner-administration database setup is required.",
      );
  }
  async function account(
    connection: Connection,
    userId: string,
    session?: ClientSession,
  ): Promise<ManagedAccount> {
    if (!identityId.safeParse(userId).success) throw missing();
    const user = await administrationIdentity(connection, { userId }, session);
    const profile = await administrationProfile(connection, userId, session);
    if (!user || !profile) throw missing();
    return {
      ...user,
      role: profile.role,
      lifecycle: profile.lifecycle,
      stateRevision: profile.stateRevision,
      eligible:
        profile.lifecycle === "active" &&
        profile.role === "student" &&
        user.emailVerified,
    };
  }
  async function read(headers: Headers, userId: string) {
    await dependencies.owner(headers);
    return account(await dependencies.connection(), userId);
  }
  async function lookup(headers: Headers, input: unknown) {
    const actor = await dependencies.owner(headers);
    const parsed = lookupInput.safeParse(input);
    if (!parsed.success)
      throw new HttpError(
        422,
        "VALIDATION_ERROR",
        "Enter one exact account email.",
        { email: ["Use a valid exact email without extra fields."] },
      );
    await dependencies.rate("admin-lookup", actor.session.user.id, 30, 60);
    const connection = await dependencies.connection();
    const user = await administrationIdentity(connection, {
      email: parsed.data.email,
    });
    if (!user) throw missing();
    return account(connection, user.userId);
  }
  async function list(headers: Headers, params: URLSearchParams) {
    const actor = await dependencies.owner(headers);
    const limitText = params.get("limit") ?? "20";
    if (
      [...params.keys()].some(
        (key) =>
          !["limit", "cursor"].includes(key) || params.getAll(key).length !== 1,
      ) ||
      !/^(?:[1-9]|[1-4][0-9]|50)$/.test(limitText)
    )
      throw new HttpError(
        422,
        "VALIDATION_ERROR",
        "Use a limit from 1 to 50 and an optional cursor.",
      );
    const limit = Number(limitText),
      binding = `owner-administrators:${actor.session.user.id}:${limit}`;
    const after = params.has("cursor")
      ? inspectCatalogCursor(
          params.get("cursor")!,
          binding,
          serverConfig.CSRF_SECRET!,
          dependencies.now(),
        )
      : null;
    if (params.has("cursor") && !after)
      throw new HttpError(
        400,
        "INVALID_CURSOR",
        "Refresh the administrator list.",
      );
    const connection = await dependencies.connection();
    await setup(connection);
    const profiles = await administrationProfiles(connection, after, limit + 1);
    const data: ManagedAccount[] = [];
    for (const profile of profiles.slice(0, limit))
      data.push(await account(connection, profile.userId));
    return {
      data,
      meta: {
        page: {
          nextCursor:
            profiles.length > limit
              ? issueCatalogCursor(
                  String(profiles[limit - 1]!._id),
                  binding,
                  serverConfig.CSRF_SECRET!,
                  dependencies.now(),
                )
              : null,
        },
      },
    };
  }
  async function reauthenticate(headers: Headers, input: unknown) {
    const actor = await dependencies.owner(headers);
    const parsed = passwordInput.safeParse(input);
    if (!parsed.success)
      throw new HttpError(
        422,
        "VALIDATION_ERROR",
        "Provide your current password only.",
        { password: ["Enter your current password (maximum 128 characters)."] },
      );
    await dependencies.rate(
      "owner-password-confirmation",
      actor.session.user.id,
      5,
      900,
    );
    const connection = await dependencies.connection();
    await setup(connection);
    const id = digest(actor.session.session.id);
    await connection
      .db!.collection<{ _id: string }>("adminReauth")
      .deleteOne({ _id: id });
    try {
      const result = await (
        await dependencies.auth()
      ).api.verifyPassword({ headers, body: parsed.data });
      if (!result.status) throw new Error("Verification rejected");
    } catch {
      throw new HttpError(
        403,
        "REAUTHENTICATION_FAILED",
        "Password confirmation failed. Try again within the rate limit.",
      );
    }
    const current = await dependencies.owner(headers);
    if (current.session.session.id !== actor.session.session.id)
      throw recentRequired();
    const now = dependencies.now();
    const expiresAt = new Date(
      Math.min(
        now + RECENT_AUTH_MS,
        new Date(current.session.session.expiresAt).getTime(),
      ),
    );
    await connection.db!.collection<{ _id: string }>("adminReauth").updateOne(
      { _id: id },
      {
        $set: {
          userId: actor.session.user.id,
          confirmedAt: new Date(now),
          expiresAt,
        },
      },
      { upsert: true },
    );
    return { status: "confirmed" as const, expiresAt: expiresAt.toISOString() };
  }
  async function change(
    headers: Headers,
    userId: string,
    input: unknown,
    requestId: string,
  ) {
    const actor = await dependencies.owner(headers);
    if (!identityId.safeParse(userId).success) throw missing();
    const parsed = roleInput.safeParse(input);
    if (!parsed.success)
      throw new HttpError(
        422,
        "VALIDATION_ERROR",
        "Check the requested access change.",
        {
          _form: [
            "Provide the current role, revision, operation ID, reason and supported new role only.",
          ],
        },
      );
    const value = parsed.data;
    await dependencies.rate(
      "owner-role-change",
      actor.session.user.id,
      20,
      3600,
    );
    const connection = await dependencies.connection();
    await setup(connection);
    const fingerprint = digest(JSON.stringify({ userId, ...value }));
    const operationKey = `${actor.session.user.id}:${value.operationId}`;
    try {
      return await connection.transaction(async (session) => {
        const fresh = await dependencies.owner(headers);
        if (fresh.session.session.id !== actor.session.session.id)
          throw recentRequired();
        await guardOwnerAdministration(connection, session, fresh);
        const proof = await connection
          .db!.collection<{
            _id: string;
            userId: string;
            expiresAt: Date;
            confirmedAt: Date;
          }>("adminReauth")
          .findOne(
            {
              _id: digest(actor.session.session.id),
              userId: actor.session.user.id,
            },
            { session },
          );
        const now = dependencies.now();
        if (
          !proof ||
          proof.expiresAt.getTime() <= now ||
          proof.confirmedAt.getTime() > now ||
          proof.confirmedAt.getTime() + RECENT_AUTH_MS <= now
        )
          throw recentRequired();
        const operations = connection.db!.collection<{
          _id: string;
          fingerprint: string;
          account: ManagedAccount;
          actorUserId: string;
          operationId: string;
          createdAt: Date;
        }>("adminRoleOperations");
        const previous = await operations.findOne(
          { _id: operationKey },
          { session },
        );
        if (previous) {
          if (previous.fingerprint !== fingerprint) throw conflict();
          return {
            account: previous.account,
            operationId: value.operationId,
            replayed: true,
          };
        }
        const target = await account(connection, userId, session);
        if (target.role === "owner" || userId === actor.session.user.id)
          throw new HttpError(
            403,
            "OWNER_PROTECTED",
            "Ownership cannot be changed here.",
          );
        if (target.lifecycle !== "active")
          throw new HttpError(
            409,
            "ACCOUNT_UNAVAILABLE",
            "This account is inactive.",
          );
        if (
          target.role !== value.expectedRole ||
          target.stateRevision !== value.expectedStateRevision
        )
          throw conflict();
        if (value.role === "admin" && !target.emailVerified)
          throw new HttpError(
            409,
            "EMAIL_NOT_VERIFIED",
            "The target account must verify its own email before promotion.",
          );
        const result = await updateAdministratorRole(
          connection,
          session,
          actor.session.user.id,
          userId,
          value.expectedRole,
          value.role,
          value.expectedStateRevision,
        );
        if (result.modifiedCount !== 1) throw conflict();
        const updated: ManagedAccount = {
          ...target,
          role: value.role,
          stateRevision: target.stateRevision + 1,
          eligible: value.role === "student" && target.emailVerified,
        };
        await dependencies.audit(connection, session, {
          actorUserId: actor.session.user.id,
          action: value.role === "admin" ? "grant_admin" : "remove_admin",
          entityType: "profile",
          entityId: userId,
          priorRevision: target.stateRevision,
          newRevision: updated.stateRevision,
          changedFields: ["role"],
          previousRole: target.role,
          newRole: value.role,
          reason: value.reason,
          requestId,
        });
        await operations.insertOne(
          {
            _id: operationKey,
            fingerprint,
            account: updated,
            actorUserId: actor.session.user.id,
            operationId: value.operationId,
            createdAt: new Date(now),
          },
          { session },
        );
        return {
          account: updated,
          operationId: value.operationId,
          replayed: false,
        };
      }, options);
    } catch (error) {
      if (
        (error as { code?: number }).code === 11000 ||
        (error as { code?: number }).code === 112
      )
        throw conflict();
      throw error;
    }
  }
  return { list, lookup, read, reauthenticate, change };
}
export const administration = createAdministrationService();
