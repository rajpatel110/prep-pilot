import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { createServer } from "node:net";
import { MongoClient, ObjectId, type Document } from "mongodb";
import { migrateDatabase } from "../../scripts/database-migrations";
import { issueCsrf } from "../../src/modules/identity/csrf-token";

type NamedDocument = Document & { _id: string };
let stage = "configuration";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is required.");
  const database = `prep_pilot_s2_test_${randomBytes(6).toString("hex")}`;
  const origin = "http://127.0.0.1:3103";
  const dev = process.argv.includes("--dev");
  Object.assign(process.env, {
    MONGODB_DB_NAME: database,
    AUTH_ENABLED: "true",
    EMAIL_MODE: "test",
    APP_URL: origin,
    NODE_ENV: dev ? "development" : "production",
    BETTER_AUTH_SECRET: randomBytes(32).toString("hex"),
    CSRF_SECRET: randomBytes(32).toString("hex"),
    RATE_LIMIT_SECRET: randomBytes(32).toString("hex"),
  });
  const client = new MongoClient(uri, {
    maxPoolSize: 4,
    serverSelectionTimeoutMS: 10000,
  });
  const db = client.db(database);
  let server: ChildProcess | undefined;
  let domain:
    | Awaited<
        ReturnType<
          (typeof import("../../src/shared/server/db"))["getDomainConnection"]
        >
      >
    | undefined;
  let authClient: MongoClient | undefined;
  let cookie = "";
  let csrf = "";
  let adminId = "";
  const draft = {
    slug: "original-array",
    title: "Original array",
    subject: "dsa",
    topic: "arrays",
    type: "question",
    difficulty: "easy",
    estimatedMinutes: 15,
    source: "Disposable original exercise",
    attribution: "",
  };
  async function request(
    path: string,
    method = "GET",
    body?: unknown,
    extra: Record<string, string> = {},
  ) {
    return fetch(`${origin}${path}`, {
      method,
      redirect: "manual",
      signal: AbortSignal.timeout(60000),
      headers: {
        origin,
        "content-type": "application/json",
        ...(cookie ? { cookie } : {}),
        ...(csrf ? { "x-csrf-token": csrf } : {}),
        ...extra,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  }
  async function error(
    response: Response,
    status: number,
    code: string,
    field?: string,
  ) {
    assert.equal(response.status, status, `${stage}: HTTP status`);
    const value = await response.json();
    assert.equal(value.error.code, code, `${stage}: error code`);
    assert.equal(value.requestId, response.headers.get("x-request-id"));
    assert.equal(response.headers.get("cache-control"), "no-store");
    if (field)
      assert.ok(
        value.error.fields?.[field]?.length,
        `${stage}: safe field feedback`,
      );
    assert.ok(!JSON.stringify(value).includes("MongoServerError"));
    return value;
  }
  async function snapshot() {
    return {
      catalog: await db
        .collection<NamedDocument>("catalogState")
        .findOne({ _id: "catalog" }),
      content: await db
        .collection("contentItems")
        .find({})
        .sort({ _id: 1 })
        .toArray(),
      audit: await db
        .collection("adminAudit")
        .find({})
        .sort({ _id: 1 })
        .toArray(),
      profile: await db
        .collection("profiles")
        .findOne({ userId: adminId }, { projection: { updatedAt: 0 } }),
    };
  }
  async function noMutation(operation: () => Promise<unknown>) {
    const before = await snapshot();
    await operation();
    assert.deepEqual(
      await snapshot(),
      before,
      `${stage}: rejected operation must leave domain state unchanged`,
    );
  }
  async function success(
    response: Response,
    status: number,
    priorCatalog: number,
    priorProfile: number,
  ) {
    assert.equal(response.status, status, `${stage}: success status`);
    const data = (await response.json()).data;
    assert.equal(
      (
        await db
          .collection<NamedDocument>("catalogState")
          .findOne({ _id: "catalog" })
      )?.revision,
      priorCatalog + 1,
    );
    assert.equal(
      (await db.collection("profiles").findOne({ userId: adminId }))
        ?.stateRevision,
      priorProfile + 1,
    );
    const event = await db
      .collection("adminAudit")
      .findOne({ requestId: response.headers.get("x-request-id") });
    assert.equal(event?.actorUserId, adminId);
    assert.equal(event?.entityId, data.id);
    assert.equal(event?.newRevision, data.revision);
    assert.equal(
      event?.priorRevision,
      status === 201 ? null : data.revision - 1,
    );
    for (const key of [
      "_id",
      "__v",
      "schemaVersion",
      "seedKey",
      "createdBy",
      "updatedBy",
      "availability",
    ])
      assert.ok(!(key in data));
    assert.deepEqual(data.assetIds, []);
    assert.deepEqual(data.attachments, []);
    assert.equal(data.attachmentCount, 0);
    return data;
  }
  try {
    stage = "disposable setup";
    await client.connect();
    await migrateDatabase(db);
    await new Promise<void>((resolve, reject) => {
      const probe = createServer();
      probe.once("error", reject);
      probe.listen(3103, "127.0.0.1", () => probe.close(() => resolve()));
    });
    server = spawn(
      process.execPath,
      [
        "node_modules/next/dist/bin/next",
        ...(dev ? ["dev", "--webpack"] : ["start"]),
        "--hostname",
        "127.0.0.1",
        "--port",
        "3103",
      ],
      { env: process.env, stdio: "ignore" },
    );
    let ready = false;
    for (let attempt = 0; attempt < 90; attempt++) {
      if (server.exitCode !== null)
        throw new Error("Owned test server exited.");
      try {
        if (
          (
            await fetch(`${origin}/api/health`, {
              signal: AbortSignal.timeout(2000),
            })
          ).ok
        ) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    assert.ok(ready, "Owned test server must become ready");
    stage = "anonymous access";
    await error(
      await request("/api/v1/admin/content", "POST", draft),
      401,
      "UNAUTHENTICATED",
    );
    await error(
      await request(`/api/v1/admin/content/${new ObjectId()}`, "PATCH", {
        expectedRevision: 1,
        title: "Denied",
      }),
      401,
      "UNAUTHENTICATED",
    );
    async function signup(browser = false) {
      const response = await request("/api/auth/sign-up/email", "POST", {
        name: "Disposable content actor",
        email: browser
          ? "library-browser@example.com"
          : `${randomUUID()}@example.com`,
        password: browser
          ? "Disposable-library-browser-only-481!"
          : randomBytes(24).toString("base64url"),
      });
      assert.equal(response.status, 200);
      cookie = response.headers
        .getSetCookie()
        .map((value) => value.split(";")[0])
        .join("; ");
      const me = (await (await request("/api/v1/me")).json()).data;
      csrf = (await (await request("/api/v1/security/csrf")).json()).data.token;
      return me.userId as string;
    }
    stage = "student access";
    await signup();
    const studentCookie = cookie;
    const studentCsrf = csrf;
    await error(
      await request("/api/v1/admin/content", "POST", draft, {
        "x-role": "admin",
      }),
      403,
      "FORBIDDEN",
    );
    await error(
      await request(`/api/v1/admin/content/${new ObjectId()}`, "PATCH", {
        expectedRevision: 1,
      }),
      403,
      "FORBIDDEN",
    );
    cookie = "";
    csrf = "";
    adminId = await signup(process.argv.includes("--browser"));
    await db
      .collection("profiles")
      .updateOne({ userId: adminId }, { $set: { role: "admin" } });
    if (
      !process.argv.includes("--reads-only") &&
      !process.argv.includes("--lifecycle-only")
    ) {
      stage = "CSRF protection";
      for (const headers of [
        { "x-csrf-token": "" },
        { "x-csrf-token": "invalid" },
        { "x-csrf-token": studentCsrf },
        { origin: "" },
        { origin: "https://untrusted.example" },
      ])
        await noMutation(async () =>
          error(
            await request("/api/v1/admin/content", "POST", draft, headers),
            403,
            "CSRF_INVALID",
          ),
        );
      const sessionRecord = await db
        .collection("session")
        .findOne({ userId: new ObjectId(adminId) });
      assert.ok(sessionRecord);
      const expired = issueCsrf(
        sessionRecord._id.toString(),
        process.env.CSRF_SECRET!,
        Date.now() - 1800001,
      ).token;
      await error(
        await request("/api/v1/admin/content", "POST", draft, {
          "x-csrf-token": expired,
        }),
        403,
        "CSRF_TOKEN_EXPIRED",
      );
      await error(
        await request("/api/v1/admin/content", "POST", draft, {
          "x-csrf-token": `${expired}x`,
        }),
        403,
        "CSRF_INVALID",
      );
      stage = "strict create validation";
      for (const field of [
        "status",
        "role",
        "ownerId",
        "revision",
        "seedKey",
        "createdBy",
        "updatedBy",
        "createdAt",
        "publishedAt",
        "actorUserId",
        "changedFields",
        "requestId",
      ])
        await error(
          await request("/api/v1/admin/content", "POST", {
            ...draft,
            [field]: "forged",
          }),
          422,
          "VALIDATION_ERROR",
          "_form",
        );
      for (const [invalid, field] of [
        [{ title: "" }, "title"],
        [{ estimatedMinutes: 15.5 }, "estimatedMinutes"],
        [{ topic: "unknown" }, "topic"],
        [{ externalUrl: "javascript:private-value" }, "externalUrl"],
        [{ prompt: "<script>" }, "prompt"],
        [{ assetIds: [new ObjectId().toString()] }, "assetIds"],
      ] as const)
        await error(
          await request("/api/v1/admin/content", "POST", {
            ...draft,
            ...invalid,
          }),
          422,
          "VALIDATION_ERROR",
          field,
        );
      stage = "explicit setup requirement";
      await db
        .collection<NamedDocument>("schemaMigrations")
        .updateOne(
          { _id: "001_identity_catalog_foundation" },
          { $set: { state: "failed" } },
        );
      await noMutation(async () =>
        error(
          await request("/api/v1/admin/content", "POST", draft),
          503,
          "DEPENDENCY_UNAVAILABLE",
        ),
      );
      await db
        .collection<NamedDocument>("schemaMigrations")
        .updateOne(
          { _id: "001_identity_catalog_foundation" },
          { $set: { state: "applied" } },
        );
      stage = "create incomplete draft";
      const createdResponse = await request(
        "/api/v1/admin/content",
        "POST",
        draft,
      );
      assert.equal(
        createdResponse.headers
          .get("location")
          ?.startsWith("/api/v1/admin/content/"),
        true,
      );
      let content = await success(createdResponse, 201, 0, 0);
      assert.equal(content.status, "draft");
      assert.equal(content.revision, 1);
      assert.equal(
        createdResponse.headers.get("location"),
        `/api/v1/admin/content/${content.id}`,
      );
      assert.equal(content.prompt, null);
      assert.equal(content.reviewedAt, null);
      const id = content.id as string;
      const path = `/api/v1/admin/content/${id}`;
      stage = "patch CSRF and transport protection";
      for (const token of ["", "invalid", studentCsrf])
        await noMutation(async () =>
          error(
            await request(
              path,
              "PATCH",
              { expectedRevision: 1, title: "Denied" },
              { "x-csrf-token": token },
            ),
            403,
            "CSRF_INVALID",
          ),
        );
      await noMutation(async () =>
        error(
          await request(
            path,
            "PATCH",
            { expectedRevision: 1 },
            { "content-type": "text/plain" },
          ),
          415,
          "UNSUPPORTED_MEDIA_TYPE",
        ),
      );
      await noMutation(async () =>
        error(
          await request(path, "PATCH", {
            expectedRevision: 1,
            body: "x".repeat(65536),
          }),
          413,
          "BODY_TOO_LARGE",
        ),
      );
      stage = "duplicate slug and missing content";
      await noMutation(async () =>
        error(
          await request("/api/v1/admin/content", "POST", draft),
          409,
          "SLUG_TAKEN",
          "slug",
        ),
      );
      await noMutation(async () =>
        error(
          await request(`/api/v1/admin/content/${new ObjectId()}`, "PATCH", {
            expectedRevision: 1,
            title: "Missing",
          }),
          404,
          "RESOURCE_NOT_FOUND",
        ),
      );
      await error(
        await request("/api/v1/admin/content/not-an-id", "PATCH", {
          expectedRevision: 1,
        }),
        422,
        "VALIDATION_ERROR",
        "id",
      );
      stage = "edit omission and replacement";
      const company = {
        companyId: "cognizant",
        association: "student_reported",
        source: "Disposable reviewed notes",
        reviewedAt: "2026-01-01T00:00:00Z",
      };
      content = await success(
        await request(path, "PATCH", {
          expectedRevision: 1,
          prompt: "Practice arrays",
          body: "Reading",
          explanation: "A safe explanation",
          externalUrl: "https://example.com/practice",
          tags: ["first", "second"],
          companies: [company],
          reviewedAt: "2026-01-01T00:00:00Z",
        }),
        200,
        1,
        1,
      );
      assert.equal(content.revision, 2);
      content = await success(
        await request(path, "PATCH", {
          expectedRevision: 2,
          title: "Edited title",
        }),
        200,
        2,
        2,
      );
      assert.deepEqual(content.tags, ["first", "second"]);
      assert.equal(content.body, "Reading");
      assert.equal(content.companies.length, 1);
      stage = "edit validation and stale revision";
      await noMutation(async () =>
        error(
          await request(path, "PATCH", { title: "No revision" }),
          422,
          "VALIDATION_ERROR",
          "expectedRevision",
        ),
      );
      await noMutation(async () =>
        error(
          await request(path, "PATCH", { expectedRevision: 1, title: "Stale" }),
          409,
          "CONTENT_CONFLICT",
        ),
      );
      await noMutation(async () =>
        error(
          await request(path, "PATCH", { expectedRevision: 3, subject: "cs" }),
          422,
          "VALIDATION_ERROR",
          "topic",
        ),
      );
      await noMutation(async () =>
        error(
          await request(path, "PATCH", {
            expectedRevision: 3,
            assetIds: [new ObjectId().toString()],
          }),
          422,
          "VALIDATION_ERROR",
          "assetIds",
        ),
      );
      await noMutation(async () =>
        error(
          await request(path, "PATCH", { expectedRevision: 3, role: "admin" }),
          422,
          "VALIDATION_ERROR",
          "_form",
        ),
      );
      stage = "null clearing and arrays";
      content = await success(
        await request(path, "PATCH", {
          expectedRevision: 3,
          prompt: null,
          body: null,
          explanation: null,
          externalUrl: null,
          reviewedAt: null,
          tags: ["replacement"],
          companies: [],
          assetIds: [],
        }),
        200,
        3,
        3,
      );
      assert.deepEqual(content.tags, ["replacement"]);
      assert.deepEqual(content.companies, []);
      const cleared = await db
        .collection("contentItems")
        .findOne({ _id: new ObjectId(id) });
      for (const field of ["prompt", "body", "explanation", "externalUrl"]) {
        assert.equal(content[field], null);
        assert.ok(!Object.hasOwn(cleared!, field));
      }
      assert.equal(cleared?.createdBy, adminId);
      assert.equal(cleared?.updatedBy, adminId);
      stage = "concurrent edits";
      const concurrent = await Promise.all([
        request(path, "PATCH", { expectedRevision: 4, title: "Winner A" }),
        request(path, "PATCH", { expectedRevision: 4, title: "Winner B" }),
      ]);
      assert.deepEqual(
        concurrent.map((response) => response.status).sort(),
        [200, 409],
      );
      content = await success(
        concurrent.find((response) => response.status === 200)!,
        200,
        4,
        4,
      );
      await error(
        concurrent.find((response) => response.status === 409)!,
        409,
        "CONTENT_CONFLICT",
      );
      assert.equal(content.revision, 5);
      assert.ok(["Winner A", "Winner B"].includes(content.title));
      assert.equal(
        await db.collection("adminAudit").countDocuments({ entityId: id }),
        5,
      );
      stage = "concurrent creates";
      const parallelCreates = await Promise.all([
        request("/api/v1/admin/content", "POST", {
          ...draft,
          slug: "parallel-slug",
        }),
        request("/api/v1/admin/content", "POST", {
          ...draft,
          slug: "parallel-slug",
        }),
      ]);
      assert.deepEqual(
        parallelCreates.map((response) => response.status).sort(),
        [201, 409],
      );
      const parallel = await success(
        parallelCreates.find((response) => response.status === 201)!,
        201,
        5,
        5,
      );
      await error(
        parallelCreates.find((response) => response.status === 409)!,
        409,
        "SLUG_TAKEN",
      );
      await noMutation(async () =>
        error(
          await request(path, "PATCH", {
            expectedRevision: 5,
            slug: parallel.slug,
          }),
          409,
          "SLUG_TAKEN",
        ),
      );
      stage = "unsupported states and historical slugs";
      const base = await db
        .collection("contentItems")
        .findOne({ _id: new ObjectId(id) });
      for (const status of ["published", "archived"]) {
        const fixtureId = new ObjectId();
        await db.collection("contentItems").insertOne({
          ...base!,
          _id: fixtureId,
          slug: `${status}-fixture`,
          status,
          revision: 1,
          publishedAt: new Date("2026-01-01T00:00:00Z"),
        });
        await noMutation(async () =>
          error(
            await request(`/api/v1/admin/content/${fixtureId}`, "PATCH", {
              expectedRevision: 1,
              title: "Unsupported",
            }),
            status === "published" ? 422 : 409,
            status === "published"
              ? "PUBLISH_REQUIREMENTS_NOT_MET"
              : "INVALID_CONTENT_STATE",
          ),
        );
      }
      const reopenedId = new ObjectId();
      await db.collection("contentItems").insertOne({
        ...base!,
        _id: reopenedId,
        slug: "reopened-fixture",
        status: "draft",
        revision: 7,
        publishedAt: new Date("2026-01-01T00:00:00Z"),
      });
      await noMutation(async () =>
        error(
          await request(`/api/v1/admin/content/${reopenedId}`, "PATCH", {
            expectedRevision: 7,
            slug: "changed-history",
          }),
          422,
          "VALIDATION_ERROR",
          "slug",
        ),
      );
      const reopened = await success(
        await request(`/api/v1/admin/content/${reopenedId}`, "PATCH", {
          expectedRevision: 7,
          slug: "reopened-fixture",
          title: "Reviewed draft",
        }),
        200,
        6,
        6,
      );
      assert.equal(reopened.revision, 8);
      assert.equal(reopened.publishedAt, "2026-01-01T00:00:00.000Z");
      stage = "audit rollback for create and edit";
      for (const action of ["create_content", "edit_content"]) {
        await db.command({
          collMod: "adminAudit",
          validator: { action: { $ne: action } },
          validationLevel: "strict",
          validationAction: "error",
        });
        await noMutation(async () => {
          const response =
            action === "create_content"
              ? await request("/api/v1/admin/content", "POST", {
                  ...draft,
                  slug: "audit-rejected",
                })
              : await request(path, "PATCH", {
                  expectedRevision: 5,
                  title: "Must roll back",
                });
          await error(response, 500, "INTERNAL_ERROR");
        });
      }
      await db.command({ collMod: "adminAudit", validator: {} });
      stage = "direct service permissions and transactional profile fence";
      const services = await import("../../src/modules/catalog/service");
      const connections = await import("../../src/shared/server/db");
      domain = await connections.getDomainConnection();
      authClient = await connections.getAuthClient();
      for (const call of [
        () => services.createDraft(new Headers(), draft),
        () => services.editDraft(new Headers(), id, { expectedRevision: 5 }),
      ])
        await assert.rejects(call(), { code: "UNAUTHENTICATED" });
      for (const call of [
        () =>
          services.createDraft(new Headers({ cookie: studentCookie }), draft),
        () =>
          services.editDraft(new Headers({ cookie: studentCookie }), id, {
            expectedRevision: 5,
          }),
      ])
        await assert.rejects(call(), { code: "FORBIDDEN" });
      const identity = await import("../../src/modules/identity/service");
      const { lockAdminProfile } =
        await import("../../src/modules/identity/mutation-guard");
      const { advanceCatalog } =
        await import("../../src/modules/catalog/repository");
      const actor = await identity.requireAdmin(new Headers({ cookie }));
      for (const changed of [{ role: "student" }, { lifecycle: "deleting" }]) {
        await db
          .collection("profiles")
          .updateOne({ userId: adminId }, { $set: changed });
        const before = await snapshot();
        await assert.rejects(
          domain.transaction(async (session) => {
            await advanceCatalog(domain!, session);
            await lockAdminProfile(domain!, session, actor);
          }),
          { code: "role" in changed ? "FORBIDDEN" : "ACCOUNT_UNAVAILABLE" },
        );
        assert.deepEqual(await snapshot(), before);
        await db
          .collection("profiles")
          .updateOne(
            { userId: adminId },
            { $set: { role: "admin", lifecycle: "active" } },
          );
      }
      stage = "counter overflow protection";
      await db
        .collection<NamedDocument>("catalogState")
        .updateOne(
          { _id: "catalog" },
          { $set: { revision: Number.MAX_SAFE_INTEGER } },
        );
      await noMutation(async () =>
        error(
          await request("/api/v1/admin/content", "POST", {
            ...draft,
            slug: "overflow-rejected",
          }),
          409,
          "CONTENT_CONFLICT",
        ),
      );
      await db
        .collection<NamedDocument>("catalogState")
        .updateOne({ _id: "catalog" }, { $set: { revision: 7 } });
      await db
        .collection("profiles")
        .updateOne(
          { userId: adminId },
          { $set: { stateRevision: Number.MAX_SAFE_INTEGER } },
        );
      await noMutation(async () =>
        error(
          await request(path, "PATCH", {
            expectedRevision: 5,
            title: "Overflow rejected",
          }),
          409,
          "STATE_CONFLICT",
        ),
      );
      await db
        .collection("profiles")
        .updateOne({ userId: adminId }, { $set: { stateRevision: 7 } });
    }
    stage = "boundary checks";
    if (!process.argv.includes("--reads-only")) {
      stage = "publication lifecycle and student isolation";
      const { exerciseLifecycle } = await import("./lifecycle-cases");
      await exerciseLifecycle({
        db,
        request,
        error,
        noMutation,
        studentCookie,
        adminId,
      });
    }
    stage = "guarded library reads";
    const reads = await import("../../src/modules/catalog/reads");
    domain ??= await (
      await import("../../src/shared/server/db")
    ).getDomainConnection();
    authClient ??= await (
      await import("../../src/shared/server/db")
    ).getAuthClient();
    const fixtures = Array.from({ length: 55 }, (_, index) => ({
      _id: new ObjectId(
        `7f00000000000000${index.toString(16).padStart(8, "0")}`,
      ),
      slug: `library-fixture-${index}`,
      title: `Libraryfixtureword ${index}`,
      subject: index % 2 ? "cs" : "dsa",
      topic: index % 2 ? "dbms" : "arrays",
      type: "question",
      difficulty: index % 2 ? "medium" : "easy",
      estimatedMinutes: 30,
      source: "Isolated library source",
      attribution: "Fixture attribution",
      tags: ["librarytagword"],
      companies:
        index % 3 === 0
          ? []
          : [
              {
                companyId: index % 3 === 1 ? "cognizant" : "ltm",
                association: "student_reported",
                source: "Disposable provenance",
                reviewedAt: new Date("2026-01-01"),
              },
            ],
      status: ["draft", "published", "archived"][index % 3]!,
      revision: 1,
      assetIds: [],
      reviewedAt: new Date("2026-01-01"),
      prompt: "Plain **saved** prompt",
      body: "Saved body",
      explanation: "Private answer, not a summary",
      createdBy: adminId,
      updatedBy: adminId,
      schemaVersion: 1,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
      publishedAt: index % 3 ? new Date("2026-01-01") : null,
      archivedAt: index % 3 === 2 ? new Date("2026-01-01") : null,
    }));
    await db.collection("contentItems").insertMany(fixtures);
    const libraryPath = "/api/v1/admin/content";
    const detailPath = `${libraryPath}/${fixtures[0]!._id}`;
    const savedCookie = cookie;
    cookie = "";
    await error(await request(libraryPath), 401, "UNAUTHENTICATED");
    await error(await request(detailPath), 401, "UNAUTHENTICATED");
    async function deniedPage() {
      const response = await request("/admin/content");
      const body = await response.text();
      assert.ok(
        response.status === 307 ||
          (response.status === 200 && body.includes("NEXT_REDIRECT")),
        "Page must redirect before exposing admin content, including streamed redirects",
      );
      assert.ok(!body.includes("Libraryfixtureword"));
    }
    await deniedPage();
    cookie = studentCookie;
    await error(await request(libraryPath), 403, "FORBIDDEN");
    await error(await request(detailPath), 403, "FORBIDDEN");
    await deniedPage();
    cookie = savedCookie;
    await assert.rejects(
      reads.listAdminContent(new Headers(), new URLSearchParams()),
      { code: "UNAUTHENTICATED" },
    );
    await assert.rejects(
      reads.getAdminContent(
        new Headers({ cookie: studentCookie }),
        fixtures[0]!._id.toString(),
      ),
      { code: "FORBIDDEN" },
    );
    for (const query of [
      "status=unknown",
      "subject=other",
      "subject=dsa&topic=dbms",
      "topic=other",
      "company=other",
      "difficulty=other",
      "limit=51",
      "limit=0",
      "q=",
      "q=" + "a".repeat(101),
      "sort=title",
      "status=draft&status=draft",
      "$where=x",
    ])
      await error(
        await request(`${libraryPath}?${query}`),
        422,
        "VALIDATION_ERROR",
      );
    await error(
      await request(`${libraryPath}/invalid`),
      422,
      "VALIDATION_ERROR",
      "id",
    );
    await error(
      await request(`${libraryPath}/${new ObjectId()}`),
      404,
      "RESOURCE_NOT_FOUND",
    );
    await error(await request(`${detailPath}?x=1`), 422, "VALIDATION_ERROR");
    async function list(query: string) {
      const response = await request(`${libraryPath}?${query}`);
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("cache-control"), "private, no-store");
      assert.ok(response.headers.get("x-request-id"));
      return response.json();
    }
    await noMutation(async () => {
      const plan = await db
        .collection("contentItems")
        .find({ $text: { $search: '"libraryfixtureword"' } })
        .sort({ _id: 1 })
        .limit(21)
        .explain("executionStats");
      assert.equal(plan.executionStats.nReturned, 21);
      assert.ok(
        JSON.stringify(plan.queryPlanner.winningPlan).includes(
          "content_search",
        ),
        "Keyword search must use the existing text index",
      );
      for (const query of [
        "status=draft",
        "status=published",
        "status=archived",
        "subject=dsa",
        "topic=dbms",
        "difficulty=medium",
        "company=cognizant",
        "company=ltm",
        "status=published&subject=dsa&topic=arrays&company=cognizant&difficulty=easy",
      ]) {
        const result = await list(`q=libraryfixtureword&limit=50&${query}`);
        const filters = new URLSearchParams(query);
        const expected = fixtures.filter((fixture) =>
          [...filters].every(([key, value]) =>
            key === "company"
              ? fixture.companies.length === 0 ||
                fixture.companies.some((company) => company.companyId === value)
              : fixture[key as "status"] === value,
          ),
        );
        assert.deepEqual(
          result.data.map((item: { id: string }) => item.id),
          expected.map((fixture) => fixture._id.toString()),
        );
      }
      const first = await list("q=libraryfixtureword&limit=20");
      assert.equal(first.data.length, 20);
      assert.equal(first.meta.page.hasMore, true);
      for (const item of first.data)
        for (const key of [
          "prompt",
          "body",
          "explanation",
          "source",
          "createdBy",
          "seedKey",
          "_id",
          "assetIds",
          "availability",
        ])
          assert.ok(!(key in item), key);
      const second = await list(
        `q=libraryfixtureword&limit=20&cursor=${first.meta.page.nextCursor}`,
      );
      const third = await list(
        `q=libraryfixtureword&limit=20&cursor=${second.meta.page.nextCursor}`,
      );
      assert.deepEqual(
        [...first.data, ...second.data, ...third.data].map(
          (item: { id: string }) => item.id,
        ),
        fixtures.map((fixture) => fixture._id.toString()),
      );
      assert.deepEqual(third.meta.page, {
        limit: 20,
        hasMore: false,
        nextCursor: null,
      });
      await error(
        await request(
          `${libraryPath}?q=libraryfixtureword&limit=20&cursor=${first.meta.page.nextCursor}x`,
        ),
        400,
        "INVALID_CURSOR",
      );
      for (const suffix of [
        "q=librarytagword&limit=20",
        "q=libraryfixtureword&limit=10",
        "q=libraryfixtureword&limit=20&status=draft",
      ])
        await error(
          await request(
            `${libraryPath}?${suffix}&cursor=${first.meta.page.nextCursor}`,
          ),
          400,
          "INVALID_CURSOR",
        );
      const { issueCatalogCursor } =
        await import("../../src/modules/catalog/cursor");
      const { cursorBinding, catalogQuerySchema } =
        await import("../../src/modules/catalog/read-query");
      const binding = cursorBinding(
        catalogQuerySchema.parse({ q: "libraryfixtureword", limit: "20" }),
        adminId,
      );
      for (const token of [
        issueCatalogCursor(
          fixtures[0]!._id.toString(),
          binding,
          process.env.BETTER_AUTH_SECRET!,
          Date.now() - 1800001,
        ),
        issueCatalogCursor(
          fixtures[0]!._id.toString(),
          cursorBinding(
            catalogQuerySchema.parse({ q: "libraryfixtureword", limit: "20" }),
            "another-admin",
          ),
          process.env.BETTER_AUTH_SECRET!,
        ),
      ])
        await error(
          await request(
            `${libraryPath}?q=libraryfixtureword&limit=20&cursor=${token}`,
          ),
          400,
          "INVALID_CURSOR",
        );
      assert.equal((await list("q=librarytagword&limit=50")).data.length, 50);
      assert.equal((await list("q=definitelyabsentword")).data.length, 0);
      assert.equal((await list("q=.*")).data.length, 0);
      assert.ok(
        (await list("q=arrays")).data.every(
          (item: { topic: string }) => item.topic === "arrays",
        ),
      );
      for (const fixture of fixtures.slice(0, 3)) {
        const response = await request(`${libraryPath}/${fixture._id}`);
        assert.equal(response.status, 200);
        const item = (await response.json()).data;
        assert.equal(item.status, fixture.status);
        assert.equal(item.explanation, fixture.explanation);
        assert.deepEqual(item.attachments, []);
        assert.ok(!("createdBy" in item));
      }
      assert.equal((await request("/admin/content")).status, 200);
    });
    for (const change of [{ role: "student" }, { lifecycle: "deleting" }]) {
      await db
        .collection("profiles")
        .updateOne({ userId: adminId }, { $set: change });
      await error(
        await request(libraryPath),
        403,
        "role" in change ? "FORBIDDEN" : "ACCOUNT_UNAVAILABLE",
      );
      await error(
        await request(detailPath),
        403,
        "role" in change ? "FORBIDDEN" : "ACCOUNT_UNAVAILABLE",
      );
      await db
        .collection("profiles")
        .updateOne(
          { userId: adminId },
          { $set: { role: "admin", lifecycle: "active" } },
        );
    }
    if (process.argv.includes("--browser")) {
      console.log(
        "BROWSER READY: disposable library fixture server on port 3103. Press Enter to finish; automatic cleanup after ten minutes.",
      );
      await new Promise<void>((resolve) => {
        const browserDuration = Number(
          process.argv
            .find((value) => value.startsWith("--browser-ms="))
            ?.split("=")[1] ?? 600000,
        );
        const timer = setTimeout(
          finish,
          Number.isFinite(browserDuration)
            ? Math.max(30000, Math.min(browserDuration, 600000))
            : 600000,
        );
        function finish() {
          clearTimeout(timer);
          process.stdin.off("data", finish);
          process.stdin.pause();
          resolve();
        }
        process.stdin.once("data", finish);
        process.stdin.resume();
      });
    }
    await db
      .collection("contentItems")
      .deleteMany({ _id: { $in: fixtures.map((fixture) => fixture._id) } });
    assert.equal((await request(libraryPath, "DELETE")).status, 405);
    await error(
      await request(`${detailPath}?unsupported=1`, "PATCH", {
        expectedRevision: 5,
      }),
      422,
      "VALIDATION_ERROR",
    );
    assert.ok(/^prep_pilot_s2_test_[a-f0-9]{12}$/.test(database));
    await db.collection("contentItems").deleteMany({});
    const empty = await list("");
    assert.deepEqual(empty.data, []);
    assert.deepEqual(empty.meta.page, {
      limit: 20,
      hasMore: false,
      nextCursor: null,
    });
    const emptyPage = await request("/admin/content");
    assert.equal(emptyPage.status, 200);
    assert.ok(
      (await emptyPage.text()).includes("Your content library is empty"),
    );
    console.log(
      process.argv.includes("--reads-only")
        ? `PASS: guarded library reads only (${dev ? "development" : "production"}), permission boundaries, strict filters and IDs, text-index execution plan, company foundations, stable pagination, signed cursor scope/expiry, explicit DTOs, unchanged domain state and empty-library server rendering. Draft mutations skipped by request.`
        : `PASS: admin draft create/edit and guarded library reads (${dev ? "development" : "production"}), strict DTO/validation, permissions/CSRF, filters/search/pagination/cursors, read-only state, duplicate/missing/stale/concurrent cases, clearing/replacement, historical slug/state guards, profile fence, audit rollback and exact revisions.`,
    );
  } finally {
    server?.kill();
    if (server && server.exitCode === null)
      await new Promise<void>((resolve) => {
        server!.once("exit", () => resolve());
        setTimeout(resolve, 5000);
      });
    await domain?.close();
    await authClient?.close();
    try {
      assert.ok(/^prep_pilot_s2_test_[a-f0-9]{12}$/.test(database));
      await db.dropDatabase();
    } finally {
      await client.close();
    }
  }
}

main().catch((error) => {
  console.error(
    error instanceof assert.AssertionError
      ? `Admin-content integration assertion failed at ${stage}: ${error.message}`
      : `Admin-content integration failed at ${stage}. Check isolated replica-set access and server availability; no credentials are logged.`,
  );
  process.exitCode = 1;
});
