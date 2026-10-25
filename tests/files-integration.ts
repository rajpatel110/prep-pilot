import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { ObjectId, MongoClient } from "mongodb";
import { migrateDatabase } from "../scripts/database-migrations";
import { issueCsrf } from "../src/modules/identity/csrf-token";
import { MockFileStorage, mockPdf } from "./files-mock";
import {
  MAX_BYTES,
  LIMIT_BYTES,
  LEASE_MS,
  REQUEST_MS,
} from "../src/modules/files/schemas";

let stage = "configuration";
async function main() {
  if (!process.env.MONGODB_URI)
    throw new Error("Explicit test connection required");
  const database = `pp_files_${randomBytes(6).toString("hex")}`;
  Object.assign(process.env, {
    MONGODB_DB_NAME: database,
    AUTH_ENABLED: "true",
    APP_URL: "http://127.0.0.1:3133",
    EMAIL_MODE: "test",
    EMAIL_DELIVERY_MODE: "disabled",
    EMAIL_TEST_RECIPIENT: "",
    FILES_ENABLED: "true",
    R2_ACCOUNT_ID: "0".repeat(32),
    R2_BUCKET: "mock-fixture-only",
    R2_ACCESS_KEY_ID: "mock-key",
    R2_SECRET_ACCESS_KEY: "mock-secret",
    BETTER_AUTH_SECRET: randomBytes(32).toString("hex"),
    CSRF_SECRET: randomBytes(32).toString("hex"),
    RATE_LIMIT_SECRET: randomBytes(32).toString("hex"),
  });
  const { getDomainConnection, getAuthClient } =
    await import("../src/shared/server/db");
  const { getAuth } = await import("../src/modules/identity/auth");
  const { requireActor, requireAdmin } =
    await import("../src/modules/identity/service");
  const { profileModel } = await import("../src/modules/identity/model");
  const { createFileService } = await import("../src/modules/files/service");
  const { createFileHttp } = await import("../src/modules/files/http");
  const { createDraft, editDraft, transitionContent } =
    await import("../src/modules/catalog/service");
  const { getAdminContent, getStudentContent } =
    await import("../src/modules/catalog/reads");
  const { rateLimit } = await import("../src/shared/server/rate-limit");
  const client = await new MongoClient(process.env.MONGODB_URI!, {
    maxPoolSize: 4,
    serverSelectionTimeoutMS: 10000,
  }).connect();
  const db = client.db(database),
    connection = await getDomainConnection();
  const quota = db.collection<{
    _id: string;
    readyBytes: number;
    readyCount: number;
    reservedBytes: number;
    reservedCount: number;
  }>("storageQuota");
  let clock = Date.now();
  const storage = new MockFileStorage();
  const service = createFileService({
      storage,
      now: () => clock,
      rate: async () => {},
    }),
    http = createFileHttp(service);
  const input = {
    filename: "original.pdf",
    declaredMime: "application/pdf",
    declaredBytes: mockPdf.length,
  };
  const origin = process.env.APP_URL!;
  async function signup(email: string) {
    const response = await (
      await getAuth()
    ).api.signUpEmail({
      body: {
        name: "Disposable file fixture",
        email,
        password: randomBytes(18).toString("base64url"),
      },
      asResponse: true,
    });
    assert.equal(response.status, 200);
    return new Headers({
      cookie: response.headers
        .getSetCookie()
        .map((value) => value.split(";")[0])
        .join("; "),
    });
  }
  async function request(
    headers: Headers,
    action: Parameters<typeof http>[1],
    body: unknown = {},
    id = "",
    csrf = true,
  ) {
    const values = new Headers(headers);
    values.set("origin", origin);
    values.set("content-type", "application/json");
    if (csrf && headers.has("cookie")) {
      const actor = await requireActor(headers);
      values.set(
        "x-csrf-token",
        issueCsrf(actor.session.session.id, process.env.CSRF_SECRET!).token,
      );
    }
    return http(
      new Request(
        `${origin}/api/v1/${action === "download" ? "files" : "admin/files"}`,
        {
          method: ["list", "status"].includes(action) ? "GET" : "POST",
          headers: values,
          ...(["list", "status"].includes(action)
            ? {}
            : { body: JSON.stringify(body) }),
        },
      ),
      action,
      id,
    );
  }
  async function fresh(headers: Headers, bytes = mockPdf) {
    const grant = await service.grant(headers, {
      ...input,
      declaredBytes: Math.min(bytes.length, MAX_BYTES),
    });
    storage.upload(grant.uploadUrl, bytes);
    return grant;
  }
  async function expectCode(work: () => Promise<unknown>, code: string) {
    await assert.rejects(
      work,
      (error) => (error as { code?: string }).code === code,
    );
  }
  async function usage() {
    return quota.findOne({ _id: "r2" });
  }
  try {
    stage = "additive migration repeatability";
    await migrateDatabase(db);
    const initial = await usage();
    await migrateDatabase(db);
    assert.deepEqual(await usage(), initial);
    assert.equal(
      (await db.collection("catalogState").findOne({}))?.revision,
      0,
    );
    stage = "disposable actors";
    const adminHeaders = await signup("admin-file@example.com"),
      studentHeaders = await signup("student-file@example.com");
    const actor = await requireActor(adminHeaders);
    await requireActor(studentHeaders);
    await profileModel(connection).updateOne(
      { userId: actor.session.user.id },
      { $set: { role: "admin" } },
    );
    stage = "authorization CSRF strict inputs and disabled mode";
    assert.equal((await request(new Headers(), "grant", input)).status, 401);
    assert.equal((await request(studentHeaders, "grant", input)).status, 403);
    assert.equal(
      (await request(adminHeaders, "grant", input, "", false)).status,
      403,
    );
    const badHeaders = new Headers(adminHeaders);
    badHeaders.set("origin", "https://untrusted.invalid");
    badHeaders.set("content-type", "application/json");
    badHeaders.set("x-csrf-token", "tampered");
    assert.equal(
      (
        await http(
          new Request(`${origin}/api/v1/admin/files/uploads`, {
            method: "POST",
            headers: badHeaders,
            body: JSON.stringify(input),
          }),
          "grant",
        )
      ).status,
      403,
    );
    assert.equal(
      (await request(adminHeaders, "grant", { ...input, owner: "client" }))
        .status,
      422,
    );
    assert.equal(
      (
        await request(adminHeaders, "grant", {
          ...input,
          declaredMime: "text/html",
        })
      ).status,
      422,
    );
    const disabled = createFileHttp(
      createFileService({ enabled: false, storage }),
    );
    const current = await requireAdmin(adminHeaders);
    const protectedHeaders = new Headers(adminHeaders);
    protectedHeaders.set("origin", origin);
    protectedHeaders.set("content-type", "application/json");
    protectedHeaders.set(
      "x-csrf-token",
      issueCsrf(current.session.session.id, process.env.CSRF_SECRET!).token,
    );
    assert.equal(
      (
        await disabled(
          new Request(`${origin}/api/v1/admin/files/uploads`, {
            method: "POST",
            headers: protectedHeaders,
            body: JSON.stringify(input),
          }),
          "grant",
        )
      ).status,
      503,
    );
    stage = "upload finalize attach publish student grant";
    const response = await request(adminHeaders, "grant", input);
    assert.equal(response.status, 201);
    const grant = (await response.json()).data;
    storage.upload(grant.uploadUrl, mockPdf);
    const readyResponse = await request(
      adminHeaders,
      "finalize",
      {},
      grant.assetId,
    );
    assert.equal(readyResponse.status, 200);
    const ready = (await readyResponse.json()).data;
    assert.equal(ready.status, "ready");
    assert.equal(ready.sizeBytes, mockPdf.length);
    assert.ok(!JSON.stringify(ready).includes("Key"));
    const afterReady = await usage();
    assert.equal(afterReady?.reservedBytes, 0);
    assert.equal(afterReady?.readyBytes, mockPdf.length);
    assert.deepEqual(
      await service.finalize(adminHeaders, grant.assetId),
      ready,
    );
    assert.deepEqual(await usage(), afterReady);
    const stored = await db
      .collection("fileAssets")
      .findOne({ _id: new ObjectId(grant.assetId) });
    assert.ok(stored);
    storage.upload(grant.uploadUrl, Buffer.from("overwritten staging"));
    assert.deepEqual(storage.objects.get(stored.finalKey), mockPdf);
    let content = await createDraft(adminHeaders, {
      slug: `file-${randomBytes(4).toString("hex")}`,
      title: "Attachment-only resource",
      subject: "cs",
      topic: "dbms",
      type: "resource",
      difficulty: "easy",
      estimatedMinutes: 15,
      source: "Original disposable fixture",
      attribution: "",
      assetIds: [grant.assetId],
    });
    assert.equal(content.attachments.length, 1);
    assert.equal(content.attachmentCount, 1);
    await expectCode(
      () => service.download(studentHeaders, grant.assetId, content.id),
      "RESOURCE_NOT_FOUND",
    );
    content = await editDraft(adminHeaders, content.id, {
      expectedRevision: content.revision,
      reviewedAt: new Date(clock - 10000).toISOString(),
    });
    content = await transitionContent(adminHeaders, content.id, "publish", {
      expectedRevision: content.revision,
    });
    const downloadResponse = await request(
      studentHeaders,
      "download",
      { contentId: content.id },
      grant.assetId,
    );
    assert.equal(downloadResponse.status, 200);
    assert.ok(
      (await downloadResponse.json()).data.url.startsWith(
        "https://mock.invalid/",
      ),
    );
    assert.equal(
      (await getStudentContent(studentHeaders, content.id)).availability,
      "available",
    );
    assert.equal(
      (await getAdminContent(adminHeaders, content.id)).attachments[0]?.status,
      "ready",
    );
    await expectCode(
      () =>
        service.download(
          studentHeaders,
          grant.assetId,
          new ObjectId().toString(),
        ),
      "RESOURCE_NOT_FOUND",
    );
    assert.equal(
      (await service.cleanup(adminHeaders, { assetIds: [grant.assetId] }))
        .results[0]?.code,
      "ASSET_REFERENCED",
    );
    content = await transitionContent(adminHeaders, content.id, "archive", {
      expectedRevision: content.revision,
      reason: "Disposable fixture",
    });
    await expectCode(
      () => service.download(studentHeaders, grant.assetId, content.id),
      "RESOURCE_NOT_FOUND",
    );
    await service.download(adminHeaders, grant.assetId);
    content = await transitionContent(adminHeaders, content.id, "reopen", {
      expectedRevision: content.revision,
    });
    content = await editDraft(adminHeaders, content.id, {
      expectedRevision: content.revision,
      assetIds: [],
    });
    const cleaned = await service.cleanup(adminHeaders, {
      assetIds: [grant.assetId],
    });
    assert.equal(cleaned.deletedCount, 1);
    const afterDelete = await usage();
    assert.equal(
      (await service.cleanup(adminHeaders, { assetIds: [grant.assetId] }))
        .deletedCount,
      1,
    );
    assert.deepEqual(await usage(), afterDelete);
    stage = "invalid bytes and bounded reads";
    const invalid = await fresh(
      adminHeaders,
      Buffer.from("<svg>not allowed</svg>"),
    );
    await expectCode(
      () => service.finalize(adminHeaders, invalid.assetId),
      "FILE_VALIDATION_FAILED",
    );
    assert.equal(
      (await service.status(adminHeaders, invalid.assetId)).status,
      "rejected",
    );
    assert.equal((await usage())?.reservedBytes, 0);
    clock += REQUEST_MS + 1;
    assert.equal(
      (await service.cleanup(adminHeaders, { assetIds: [invalid.assetId] }))
        .deletedCount,
      1,
    );
    const oversized = await fresh(adminHeaders, Buffer.alloc(MAX_BYTES + 1));
    const beforeRead = storage.readBytes;
    await expectCode(
      () => service.finalize(adminHeaders, oversized.assetId),
      "FILE_TOO_LARGE",
    );
    assert.equal(storage.readBytes, beforeRead);
    stage = "provider failure lease expiry retry and orphan recovery";
    const failed = await fresh(adminHeaders);
    storage.fail = "put";
    await expectCode(
      () => service.finalize(adminHeaders, failed.assetId),
      "DEPENDENCY_UNAVAILABLE",
    );
    storage.fail = null;
    await expectCode(
      () => service.finalize(adminHeaders, failed.assetId),
      "UPLOAD_IN_PROGRESS",
    );
    clock += LEASE_MS + 1;
    await service.finalize(adminHeaders, failed.assetId);
    storage.objects.set(`final/${failed.assetId}/old-orphan`, mockPdf);
    storage.fail = "remove";
    assert.equal(
      (await service.cleanup(adminHeaders, { assetIds: [failed.assetId] }))
        .failedCount,
      1,
    );
    storage.fail = null;
    clock += LEASE_MS + 1;
    assert.equal(
      (await service.cleanup(adminHeaders, { assetIds: [failed.assetId] }))
        .deletedCount,
      1,
    );
    assert.equal(
      [...storage.objects.keys()].filter((key) =>
        key.startsWith(`final/${failed.assetId}/`),
      ).length,
      0,
    );
    stage = "audit rollback grant and ready conversion";
    const { appendAudit } = await import("../src/modules/administration/audit");
    const auditFailure = createFileService({
      storage,
      now: () => clock,
      rate: async () => {},
      audit: async () => {
        throw new Error("mock audit failure");
      },
    });
    const beforeAudit = await usage();
    await assert.rejects(() => auditFailure.grant(adminHeaders, input));
    assert.deepEqual(await usage(), beforeAudit);
    const rollback = await fresh(adminHeaders);
    await assert.rejects(() =>
      auditFailure.finalize(adminHeaders, rollback.assetId),
    );
    assert.equal(
      (await service.status(adminHeaders, rollback.assetId)).status,
      "validating",
    );
    assert.equal(((await usage())?.reservedBytes ?? 0) >= MAX_BYTES, true);
    clock += LEASE_MS + REQUEST_MS + 1;
    assert.equal(
      (await service.cleanup(adminHeaders, { assetIds: [rollback.assetId] }))
        .deletedCount,
      1,
    );
    stage = "cleanup database failure preserves accounting until retry";
    const cleanupRollback = await fresh(adminHeaders);
    await service.finalize(adminHeaders, cleanupRollback.assetId);
    const cleanupBefore = await usage();
    const failDelete = createFileService({
      storage,
      now: () => clock,
      rate: async () => {},
      audit: async (...args) => {
        if (args[2].action === "delete_file")
          throw new Error("mock commit failure");
        await appendAudit(...args);
      },
    });
    assert.equal(
      (
        await failDelete.cleanup(adminHeaders, {
          assetIds: [cleanupRollback.assetId],
        })
      ).failedCount,
      1,
    );
    assert.deepEqual(await usage(), cleanupBefore);
    clock += LEASE_MS + 1;
    assert.equal(
      (
        await service.cleanup(adminHeaders, {
          assetIds: [cleanupRollback.assetId],
        })
      ).deletedCount,
      1,
    );
    const committedCleanup = await usage();
    await service.cleanup(adminHeaders, {
      assetIds: [cleanupRollback.assetId],
    });
    assert.deepEqual(await usage(), committedCleanup);
    stage = "stale finalizer cannot publish and attach versus cleanup race";
    const stale = await fresh(adminHeaders);
    let putEntered!: () => void, releasePut!: () => void;
    const entered = new Promise<void>((resolve) => {
      putEntered = resolve;
    });
    const held = new Promise<void>((resolve) => {
      releasePut = resolve;
    });
    storage.beforePut = async () => {
      putEntered();
      await held;
    };
    const old = service.finalize(adminHeaders, stale.assetId);
    const oldOutcome = old.then(
      () => "success",
      (error) => (error as { code: string }).code,
    );
    await entered;
    clock += LEASE_MS + 1;
    storage.beforePut = undefined;
    const newer = await service.finalize(adminHeaders, stale.assetId);
    releasePut();
    assert.equal(await oldOutcome, "UPLOAD_IN_PROGRESS");
    assert.equal(
      (await service.status(adminHeaders, stale.assetId)).status,
      "ready",
    );
    assert.equal(newer.status, "ready");
    let raceContent = await createDraft(adminHeaders, {
      slug: `race-${randomBytes(4).toString("hex")}`,
      title: "Race fixture",
      subject: "cs",
      topic: "dbms",
      type: "resource",
      difficulty: "easy",
      estimatedMinutes: 15,
      source: "Original test",
      attribution: "",
      body: "Ready for race",
    });
    const race = await Promise.allSettled([
      editDraft(adminHeaders, raceContent.id, {
        expectedRevision: raceContent.revision,
        assetIds: [stale.assetId],
      }),
      service.cleanup(adminHeaders, { assetIds: [stale.assetId] }),
    ]);
    raceContent = await getAdminContent(adminHeaders, raceContent.id);
    const raceAsset = await service.status(adminHeaders, stale.assetId);
    assert.ok(
      !(
        raceContent.assetIds.includes(stale.assetId) &&
        raceAsset.status === "deleted"
      ),
    );
    assert.equal(race.length, 2);
    if (raceContent.assetIds.includes(stale.assetId)) {
      assert.equal(raceAsset.status, "ready");
      assert.equal(race[1].status, "fulfilled");
      if (race[1].status === "fulfilled")
        assert.equal(
          (race[1].value as Awaited<ReturnType<typeof service.cleanup>>)
            .results[0]?.code,
          "ASSET_REFERENCED",
        );
    } else {
      assert.equal(raceAsset.status, "deleted");
      assert.equal(race[0].status, "rejected");
    }
    if (raceContent.assetIds.length)
      raceContent = await editDraft(adminHeaders, raceContent.id, {
        expectedRevision: raceContent.revision,
        assetIds: [],
      });
    clock += LEASE_MS + REQUEST_MS + 1;
    await service.cleanup(adminHeaders, { assetIds: [stale.assetId] });
    stage = "concurrent byte quota reservations";
    await db.collection("fileAssets").deleteMany({});
    await quota.updateOne(
      { _id: "r2" },
      {
        $set: {
          readyBytes: 0,
          readyCount: 0,
          reservedBytes: 49 * MAX_BYTES,
          reservedCount: 49,
        },
      },
    );
    const reserved = Array.from({ length: 49 }, () => {
      const _id = new ObjectId();
      return {
        _id,
        createdBy: actor.session.user.id,
        displayName: "quota.pdf",
        stagingKey: `staging/${_id}/fixture`,
        declaredMime: "application/pdf",
        declaredBytes: 1,
        status: "uploading",
        expiresAt: new Date(clock + 900000),
        leaseId: null,
        leaseUntil: null,
        reservationBytes: MAX_BYTES,
        reservationState: "reserved",
        readyAt: null,
        deletedAt: null,
        schemaVersion: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });
    await db.collection("fileAssets").insertMany(reserved);
    const grants = await Promise.allSettled(
      Array.from({ length: 3 }, () => service.grant(adminHeaders, input)),
    );
    assert.equal(
      grants.filter((value) => value.status === "fulfilled").length,
      1,
    );
    assert.equal((await usage())?.reservedBytes, LIMIT_BYTES);
    stage = "object count quota and honest missing upload expiry";
    await db.collection("fileAssets").deleteMany({});
    const countFixtures = Array.from({ length: 100 }, () => {
      const _id = new ObjectId();
      return {
        ...reserved[0]!,
        _id,
        stagingKey: `staging/${_id}/count`,
        status: "ready",
        reservationState: "committed",
        actualBytes: mockPdf.length,
        detectedMime: "application/pdf",
        sha256: "a".repeat(64),
        readyAt: new Date(),
        finalKey: `final/${_id}/count`,
      };
    });
    await db.collection("fileAssets").insertMany(countFixtures);
    await quota.updateOne(
      { _id: "r2" },
      {
        $set: {
          readyBytes: 100 * mockPdf.length,
          readyCount: 100,
          reservedBytes: 0,
          reservedCount: 0,
        },
      },
    );
    await expectCode(
      () => service.grant(adminHeaders, input),
      "STORAGE_QUOTA_EXCEEDED",
    );
    await db.collection("fileAssets").deleteMany({});
    await quota.updateOne(
      { _id: "r2" },
      {
        $set: {
          readyBytes: 0,
          readyCount: 0,
          reservedBytes: 0,
          reservedCount: 0,
        },
      },
    );
    const missing = await service.grant(adminHeaders, input);
    await expectCode(
      () => service.finalize(adminHeaders, missing.assetId),
      "UPLOAD_NOT_FOUND",
    );
    clock += 900001;
    await expectCode(
      () => service.finalize(adminHeaders, missing.assetId),
      "UPLOAD_EXPIRED",
    );
    assert.equal(
      (await service.cleanup(adminHeaders, { assetIds: [missing.assetId] }))
        .deletedCount,
      1,
    );
    stage = "durable rate limiting";
    for (let index = 0; index < 20; index++)
      await rateLimit("file-upload-test", actor.session.user.id, 20, 3600);
    await expectCode(
      () => rateLimit("file-upload-test", actor.session.user.id, 20, 3600),
      "RATE_LIMITED",
    );
    stage = "downgraded admin cannot mutate";
    await profileModel(connection).updateOne(
      { userId: actor.session.user.id },
      { $set: { role: "student" } },
    );
    await expectCode(() => service.grant(adminHeaders, input), "FORBIDDEN");
    assert.ok(
      (await db
        .collection("adminAudit")
        .countDocuments({ entityType: "file" })) > 0,
    );
    console.log(
      "PASS isolated files integration: guards/CSRF, grant→finalize→attach→publish→student grant, validation, quotas, leases, stale finalizers, immutable bytes, provider/audit rollback, orphans, accounting, reference races and durable limits. Storage mocked; no real R2 access.",
    );
  } finally {
    await connection.close();
    await (await getAuthClient()).close();
    assert.match(database, /^pp_files_[a-f0-9]{12}$/);
    await db.dropDatabase();
    await client.close();
    console.log("Disposable file database removed; no normal records changed.");
  }
}
void main().catch((error) => {
  console.error(
    JSON.stringify({
      stage,
      type: error instanceof Error ? error.name : "Unknown",
      code:
        typeof (error as { code?: unknown }).code === "number"
          ? (error as { code: number }).code
          : undefined,
      location:
        error instanceof Error
          ? error.stack?.match(/files-integration\.ts:\d+:\d+/)?.[0]
          : undefined,
      actual:
        typeof (error as { actual?: unknown }).actual === "number" ||
        (typeof (error as { actual?: unknown }).actual === "string" &&
          /^[A-Z_]+$/.test(String((error as { actual?: unknown }).actual)))
          ? (error as { actual: unknown }).actual
          : undefined,
      expected:
        typeof (error as { expected?: unknown }).expected === "number" ||
        (typeof (error as { expected?: unknown }).expected === "string" &&
          /^[A-Z_]+$/.test(String((error as { expected?: unknown }).expected)))
          ? (error as { expected: unknown }).expected
          : undefined,
    }),
  );
  process.exitCode = 1;
});
