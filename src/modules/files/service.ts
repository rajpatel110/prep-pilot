import "server-only";
import { randomUUID } from "node:crypto";
import { Types, type ClientSession } from "mongoose";
import { requireAdmin, requireStudyActor } from "@/modules/identity/service";
import { lockAdminProfile } from "@/modules/identity/mutation-guard";
import { appendAudit } from "@/modules/administration/audit";
import { getDomainConnection } from "@/shared/server/db";
import { serverConfig } from "@/shared/server/config";
import { HttpError } from "@/shared/server/http";
import { rateLimit } from "@/shared/server/rate-limit";
import {
  lockAttachmentReferences,
  assetReferenced,
  publishedAttachment,
} from "@/modules/catalog/repository";
import {
  issueCatalogCursor,
  inspectCatalogCursor,
} from "@/modules/catalog/cursor";
import { fileModels } from "./model";
import { fileIndexes } from "./indexes";
import { r2Storage, boundedRead, type FileStorage } from "./storage";
import { validateBytes } from "./validation";
import {
  fileRecord,
  fileDto,
  filename,
  MAX_BYTES,
  LEASE_MS,
  REQUEST_MS,
  FINALIZE_SECONDS,
  UPLOAD_SECONDS,
  quotaRecord,
  fileId,
  fileStatus,
} from "./schemas";
import type { z } from "zod";
import { uploadInput, cleanupInput } from "./schemas";

const tx = {
  readPreference: "primary" as const,
  readConcern: { level: "snapshot" as const },
  writeConcern: { w: "majority" as const },
  timeoutMS: 15000,
  maxCommitTimeMS: 5000,
};
export function createFileService(
  overrides: Partial<{
    storage: FileStorage;
    connection: typeof getDomainConnection;
    admin: typeof requireAdmin;
    study: typeof requireStudyActor;
    now: () => number;
    audit: typeof appendAudit;
    enabled: boolean;
    rate: typeof rateLimit;
  }> = {},
) {
  const connection = overrides.connection ?? getDomainConnection;
  const admin = overrides.admin ?? requireAdmin,
    study = overrides.study ?? requireStudyActor;
  const now = overrides.now ?? Date.now,
    audit = overrides.audit ?? appendAudit,
    rate = overrides.rate ?? rateLimit;
  let provider: FileStorage | undefined;
  function enabled() {
    if (!(overrides.enabled ?? serverConfig.FILES_ENABLED))
      throw new HttpError(
        503,
        "FILES_DISABLED",
        "File attachments are disabled in this environment.",
      );
  }
  function storage() {
    enabled();
    return (provider ??= overrides.storage ?? r2Storage(serverConfig));
  }
  async function setup() {
    const db = await connection();
    if (
      !(await db
        .db!.collection<{ _id: string; state: string }>("schemaMigrations")
        .findOne({ _id: "005_files", state: "applied" }))
    )
      throw new HttpError(
        503,
        "DEPENDENCY_UNAVAILABLE",
        "Run explicitly targeted file database setup first.",
      );
    for (const [collection, indexes] of Object.entries(fileIndexes)) {
      const actual = await db
        .db!.collection(collection)
        .listIndexes()
        .toArray();
      if (
        indexes.some(
          (index) =>
            !actual.some(
              (found) =>
                found.name === index.name &&
                JSON.stringify(found.key) === JSON.stringify(index.key) &&
                !!found.unique === !!index.unique &&
                JSON.stringify(found.partialFilterExpression ?? null) ===
                  JSON.stringify(index.partialFilterExpression ?? null) &&
                !found.sparse &&
                !found.collation &&
                found.expireAfterSeconds === undefined,
            ),
        )
      )
        throw new HttpError(
          503,
          "DEPENDENCY_UNAVAILABLE",
          "Required file indexes are unavailable.",
        );
    }
    const quota = await fileModels(db).quota.findById("r2").lean();
    if (!quotaRecord.safeParse(quota).success)
      throw new HttpError(
        503,
        "DEPENDENCY_UNAVAILABLE",
        "Storage accounting is unavailable.",
      );
    return db;
  }
  function parse<Schema extends z.ZodType>(
    schema: Schema,
    input: unknown,
  ): z.output<Schema> {
    const parsed = schema.safeParse(input);
    if (!parsed.success)
      throw new HttpError(
        422,
        "VALIDATION_ERROR",
        "Check the highlighted fields.",
        Object.fromEntries(
          parsed.error.issues.map((issue) => [
            String(issue.path[0] ?? "_form"),
            ["Use the documented file fields and limits."],
          ]),
        ),
      );
    return parsed.data;
  }
  function id(value: string) {
    return parse(fileId, value);
  }
  async function record(assetId: string, session?: ClientSession) {
    const db = await connection(),
      query = fileModels(db).asset.findById(id(assetId)).lean();
    if (session) query.session(session);
    const value = await query;
    if (!value)
      throw new HttpError(404, "RESOURCE_NOT_FOUND", "File not found.");
    return fileRecord.parse({ ...value, _id: String(value._id) });
  }
  async function event(
    session: ClientSession,
    actor: Awaited<ReturnType<typeof admin>>,
    assetId: string,
    action: string,
    fields: string[],
    requestId: string,
  ) {
    await audit(await connection(), session, {
      actorUserId: actor.session.user.id,
      entityType: "file",
      entityId: assetId,
      action,
      priorRevision: null,
      newRevision: null,
      changedFields: fields,
      requestId,
    });
  }
  async function release(
    session: ClientSession,
    asset: ReturnType<typeof fileRecord.parse>,
  ) {
    const models = fileModels(await connection());
    if (asset.reservationState === "released") return;
    const reserved = asset.reservationState === "reserved";
    const bytes = reserved ? asset.reservationBytes : asset.actualBytes!;
    const result = await models.quota.updateOne(
      {
        _id: "r2",
        [reserved ? "reservedBytes" : "readyBytes"]: { $gte: bytes },
        [reserved ? "reservedCount" : "readyCount"]: { $gte: 1 },
      },
      {
        $inc: {
          [reserved ? "reservedBytes" : "readyBytes"]: -bytes,
          [reserved ? "reservedCount" : "readyCount"]: -1,
        },
      },
      { session },
    );
    if (result.matchedCount !== 1)
      throw new HttpError(
        503,
        "DEPENDENCY_UNAVAILABLE",
        "Storage accounting requires reconciliation.",
      );
  }
  async function grant(
    headers: Headers,
    input: unknown,
    requestId = randomUUID(),
  ) {
    const actor = await admin(headers);
    enabled();
    if (
      typeof input === "object" &&
      input &&
      "declaredMime" in input &&
      !["application/pdf", "image/png", "image/jpeg", "image/webp"].includes(
        String(input.declaredMime),
      )
    )
      throw new HttpError(
        422,
        "FILE_TYPE_NOT_ALLOWED",
        "Choose PDF, PNG, JPEG or WebP.",
      );
    const values = parse(uploadInput, input);
    await rate("file-upload", actor.session.user.id, 20, 3600);
    const db = await setup(),
      models = fileModels(db),
      assetId = new Types.ObjectId(),
      timestamp = new Date(now());
    const stagingKey = `staging/${assetId}/${randomUUID()}`;
    const provider = storage();
    const uploadUrl = await provider.signPut(stagingKey, values.declaredMime);
    const asset = await db.transaction(async (session) => {
      await lockAdminProfile(db, session, actor);
      const quota = await models.quota.findOneAndUpdate(
        {
          _id: "r2",
          $expr: {
            $and: [
              {
                $lte: [
                  { $add: ["$readyBytes", "$reservedBytes", MAX_BYTES] },
                  "$limitBytes",
                ],
              },
              {
                $lt: [
                  { $add: ["$readyCount", "$reservedCount"] },
                  "$limitCount",
                ],
              },
            ],
          },
        },
        { $inc: { reservedBytes: MAX_BYTES, reservedCount: 1 } },
        { session, returnDocument: "after" },
      );
      if (!quota)
        throw new HttpError(
          409,
          "STORAGE_QUOTA_EXCEEDED",
          "The application storage quota is full.",
        );
      const [created] = await models.asset.create(
        [
          {
            declaredMime: values.declaredMime,
            declaredBytes: values.declaredBytes,
            _id: assetId,
            createdBy: actor.session.user.id,
            displayName: filename(values.filename),
            stagingKey,
            status: "uploading",
            expiresAt: new Date(now() + FINALIZE_SECONDS * 1000),
            reservationState: "reserved",
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        ],
        { session },
      );
      await event(
        session,
        actor,
        String(assetId),
        "grant_upload",
        ["status", "reservationState"],
        requestId,
      );
      return created!;
    }, tx);
    return {
      assetId: String(assetId),
      method: "PUT" as const,
      uploadUrl,
      headers: { "Content-Type": values.declaredMime },
      uploadUrlExpiresAt: new Date(
        timestamp.getTime() + UPLOAD_SECONDS * 1000,
      ).toISOString(),
      finalizeBy: asset.expiresAt.toISOString(),
      maxBytes: MAX_BYTES,
    };
  }
  async function finalize(
    headers: Headers,
    assetId: string,
    requestId = randomUUID(),
  ) {
    const actor = await admin(headers);
    enabled();
    const provider = storage();
    const db = await setup(),
      models = fileModels(db);
    const initial = await record(assetId);
    if (initial.status === "ready") {
      let verified;
      try {
        verified = await provider.head(
          initial.finalKey!,
          AbortSignal.timeout(REQUEST_MS),
        );
      } catch {
        throw new HttpError(
          503,
          "DEPENDENCY_UNAVAILABLE",
          "The ready object could not be confirmed.",
        );
      }
      if (verified.bytes !== initial.actualBytes)
        throw new HttpError(
          503,
          "DEPENDENCY_UNAVAILABLE",
          "Stored file metadata could not be confirmed.",
        );
      return fileDto(initial);
    }
    const leaseId = randomUUID();
    let candidateKey = "";
    const owned = await db.transaction(async (session) => {
      await lockAdminProfile(db, session, actor);
      const value = await record(assetId, session);
      if (value.status === "ready") return value;
      if (!["uploading", "validating"].includes(value.status))
        throw new HttpError(
          409,
          "UPLOAD_EXPIRED",
          "This upload cannot be finalized.",
        );
      if (value.expiresAt.getTime() <= now())
        throw new HttpError(
          409,
          "UPLOAD_EXPIRED",
          "The finalization deadline has passed.",
        );
      if (value.leaseUntil && value.leaseUntil.getTime() > now())
        throw new HttpError(
          409,
          "UPLOAD_IN_PROGRESS",
          "Another request is finalizing this upload.",
          undefined,
          Math.max(1, Math.ceil((value.leaseUntil.getTime() - now()) / 1000)),
        );
      candidateKey = `final/${assetId}/${leaseId}`;
      await models.asset.updateOne(
        { _id: assetId },
        {
          $set: {
            status: "validating",
            leaseId,
            leaseUntil: new Date(now() + LEASE_MS),
            candidateKey,
          },
          $unset: { errorCode: 1 },
        },
        { session },
      );
      return value;
    }, tx);
    if (owned.status === "ready") return fileDto(owned);
    const signal = AbortSignal.timeout(REQUEST_MS - 15000);
    try {
      const head = await provider.head(owned.stagingKey, signal);
      if (head.bytes > MAX_BYTES)
        throw new HttpError(422, "FILE_TOO_LARGE", "The file exceeds 10 MiB.");
      const bytes = await boundedRead(
        await provider.read(owned.stagingKey, signal),
        signal,
      );
      const validated = validateBytes(bytes, owned.declaredMime);
      if (bytes.length !== head.bytes)
        throw new HttpError(
          422,
          "FILE_VALIDATION_FAILED",
          "Upload changed during validation. Upload again.",
        );
      signal.throwIfAborted();
      await provider.put(candidateKey, bytes, validated.detectedMime, signal);
      signal.throwIfAborted();
      return await db.transaction(async (session) => {
        await lockAdminProfile(db, session, actor);
        const current = await record(assetId, session);
        if (
          current.status !== "validating" ||
          current.leaseId !== leaseId ||
          !current.leaseUntil ||
          current.leaseUntil.getTime() <= now()
        )
          throw new HttpError(
            409,
            "UPLOAD_IN_PROGRESS",
            "This finalization lease is no longer current.",
            undefined,
            1,
          );
        const quota = await models.quota.updateOne(
          {
            _id: "r2",
            reservedBytes: { $gte: MAX_BYTES },
            reservedCount: { $gte: 1 },
          },
          {
            $inc: {
              reservedBytes: -MAX_BYTES,
              reservedCount: -1,
              readyBytes: validated.actualBytes,
              readyCount: 1,
            },
          },
          { session },
        );
        if (quota.matchedCount !== 1)
          throw new HttpError(
            503,
            "DEPENDENCY_UNAVAILABLE",
            "Storage accounting requires reconciliation.",
          );
        const ready = await models.asset.findOneAndUpdate(
          {
            _id: assetId,
            status: "validating",
            leaseId,
            leaseUntil: { $gt: new Date(now()) },
            reservationState: "reserved",
          },
          {
            $set: {
              ...validated,
              status: "ready",
              finalKey: candidateKey,
              readyAt: new Date(now()),
              reservationState: "committed",
              leaseId: null,
              leaseUntil: null,
            },
          },
          { session, returnDocument: "after" },
        );
        if (!ready)
          throw new HttpError(
            409,
            "UPLOAD_IN_PROGRESS",
            "This finalization lease is no longer current.",
            undefined,
            1,
          );
        await event(
          session,
          actor,
          assetId,
          "finalize_upload",
          ["status", "reservationState"],
          requestId,
        );
        return fileDto(fileRecord.parse({ ...ready.toObject(), _id: assetId }));
      }, tx);
    } catch (error) {
      const invalid = error instanceof HttpError && error.status === 422;
      await db.transaction(async (session) => {
        const value = await record(assetId, session);
        if (value.leaseId !== leaseId || value.status !== "validating") return;
        if (invalid) {
          await release(session, value);
        }
        await models.asset.updateOne(
          { _id: assetId, leaseId },
          {
            $set: invalid
              ? {
                  status: "rejected",
                  reservationState: "released",
                  leaseId: null,
                  leaseUntil: new Date(now() + REQUEST_MS),
                  errorCode: (error as HttpError).code,
                }
              : {
                  errorCode:
                    error instanceof HttpError
                      ? error.code
                      : "DEPENDENCY_UNAVAILABLE",
                },
          },
          { session },
        );
        await event(
          session,
          actor,
          assetId,
          invalid ? "reject_upload" : "defer_upload",
          ["status", "errorCode"],
          requestId,
        );
      }, tx);
      throw error instanceof HttpError
        ? error
        : new HttpError(
            503,
            "DEPENDENCY_UNAVAILABLE",
            "File processing could not complete. Read file status before retrying.",
          );
    }
  }
  async function download(
    headers: Headers,
    assetId: string,
    contentId?: string,
  ) {
    const actor =
      contentId === undefined ? await admin(headers) : await study(headers);
    enabled();
    await rate("file-sign", actor.session.user.id, 60, 60);
    const db = await setup();
    const asset = await record(assetId);
    if (
      asset.status !== "ready" ||
      (contentId !== undefined &&
        !(await publishedAttachment(db, id(contentId), assetId)))
    )
      throw new HttpError(
        404,
        "RESOURCE_NOT_FOUND",
        "This attachment is unavailable.",
      );
    return {
      assetId,
      url: await storage().signGet(
        asset.finalKey!,
        asset.detectedMime!,
        asset.displayName,
      ),
      expiresAt: new Date(now() + 60000).toISOString(),
      displayName: asset.displayName,
      mimeType: asset.detectedMime!,
      sizeBytes: asset.actualBytes!,
    };
  }
  async function list(headers: Headers, params: URLSearchParams) {
    const actor = await admin(headers);
    const allowed = new Set(["status", "cursor", "limit"]);
    if (
      [...params.keys()].some(
        (key) => !allowed.has(key) || params.getAll(key).length !== 1,
      )
    )
      throw new HttpError(422, "VALIDATION_ERROR", "Unsupported file filter.");
    const limit = Number(params.get("limit") ?? 20);
    if (!Number.isInteger(limit) || limit < 1 || limit > 50)
      throw new HttpError(422, "VALIDATION_ERROR", "Use a limit of 1–50.");
    const status = params.get("status");
    if (status) parse(fileStatus, status);
    const binding = JSON.stringify([
        "files",
        actor.session.user.id,
        status,
        limit,
      ]),
      cursor = params.get("cursor");
    const after = cursor
      ? inspectCatalogCursor(
          cursor,
          binding,
          serverConfig.BETTER_AUTH_SECRET!,
          now(),
        )
      : null;
    if (cursor && !after)
      throw new HttpError(400, "INVALID_CURSOR", "Refresh file pagination.");
    const db = await connection();
    const filter: Record<string, unknown> = { ...(status ? { status } : {}) };
    if (after) {
      const anchor = await record(after);
      filter.$or = [
        { createdAt: { $lt: anchor.createdAt } },
        { createdAt: anchor.createdAt, _id: { $lt: after } },
      ];
    }
    const values = await fileModels(db)
      .asset.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean();
    const data = values
      .slice(0, limit)
      .map((value) =>
        fileDto(fileRecord.parse({ ...value, _id: String(value._id) })),
      );
    return {
      data,
      meta: {
        page: {
          limit,
          hasMore: values.length > limit,
          nextCursor:
            values.length > limit
              ? issueCatalogCursor(
                  data.at(-1)!.id,
                  binding,
                  serverConfig.BETTER_AUTH_SECRET!,
                  now(),
                )
              : null,
        },
      },
    };
  }
  async function status(headers: Headers, assetId: string) {
    await admin(headers);
    return fileDto(await record(assetId));
  }
  async function cleanup(
    headers: Headers,
    input: unknown,
    requestId = randomUUID(),
  ) {
    const actor = await admin(headers),
      values = parse(cleanupInput, input);
    enabled();
    await rate("file-cleanup", actor.session.user.id, 6, 60);
    const db = await setup(),
      models = fileModels(db),
      provider = storage();
    const signal = AbortSignal.timeout(REQUEST_MS - 15000);
    const results: {
      assetId: string;
      outcome: "deleted" | "skipped" | "failed";
      code: string | null;
    }[] = [];
    for (const assetId of values.assetIds) {
      try {
        signal.throwIfAborted();
        const leaseId = randomUUID();
        const selected = await db.transaction(async (session) => {
          await lockAttachmentReferences(db, session);
          await lockAdminProfile(db, session, actor);
          let value;
          try {
            value = await record(assetId, session);
          } catch (error) {
            if (error instanceof HttpError && error.status === 404)
              return "NOT_FOUND";
            throw error;
          }
          if (value.status === "deleted") return value;
          if (await assetReferenced(db, assetId, session))
            return "ASSET_REFERENCED";
          if (
            value.leaseUntil &&
            value.leaseUntil.getTime() +
              (value.status === "validating" ? REQUEST_MS : 0) >
              now()
          )
            return "UPLOAD_IN_PROGRESS";
          if (value.status === "uploading" && value.expiresAt.getTime() > now())
            return "UPLOAD_IN_PROGRESS";
          await models.asset.updateOne(
            { _id: assetId },
            {
              $set: {
                status: "deleting",
                leaseId,
                leaseUntil: new Date(now() + LEASE_MS),
              },
            },
            { session },
          );
          await event(
            session,
            actor,
            assetId,
            "begin_file_cleanup",
            ["status"],
            requestId,
          );
          return value;
        }, tx);
        if (typeof selected === "string") {
          results.push({ assetId, outcome: "skipped", code: selected });
          continue;
        }
        if (selected.status === "deleted") {
          results.push({ assetId, outcome: "deleted", code: null });
          continue;
        }
        const keys = new Set([
          selected.stagingKey,
          ...(await provider.list(`final/${assetId}/`, signal)),
        ]);
        if (selected.finalKey) keys.add(selected.finalKey);
        if (selected.candidateKey) keys.add(selected.candidateKey);
        for (const key of keys) await provider.remove(key, signal);
        await db.transaction(async (session) => {
          await lockAttachmentReferences(db, session);
          await lockAdminProfile(db, session, actor);
          const value = await record(assetId, session);
          if (
            value.status !== "deleting" ||
            value.leaseId !== leaseId ||
            !value.leaseUntil ||
            value.leaseUntil.getTime() <= now()
          )
            throw new HttpError(
              409,
              "UPLOAD_IN_PROGRESS",
              "Cleanup lease expired.",
            );
          if (await assetReferenced(db, assetId, session))
            throw new HttpError(
              409,
              "ASSET_REFERENCED",
              "Attachment is referenced.",
            );
          await release(session, value);
          await models.asset.updateOne(
            { _id: assetId, leaseId },
            {
              $set: {
                status: "deleted",
                reservationState: "released",
                leaseId: null,
                leaseUntil: null,
                deletedAt: new Date(now()),
              },
            },
            { session },
          );
          await event(
            session,
            actor,
            assetId,
            "delete_file",
            ["status", "reservationState"],
            requestId,
          );
        }, tx);
        results.push({ assetId, outcome: "deleted", code: null });
      } catch {
        results.push({
          assetId,
          outcome: "failed",
          code: "DEPENDENCY_UNAVAILABLE",
        });
      }
    }
    return {
      results,
      deletedCount: results.filter((result) => result.outcome === "deleted")
        .length,
      skippedCount: results.filter((result) => result.outcome === "skipped")
        .length,
      failedCount: results.filter((result) => result.outcome === "failed")
        .length,
    };
  }
  return { grant, finalize, download, list, status, cleanup };
}
export const files = createFileService();
