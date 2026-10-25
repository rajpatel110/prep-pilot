import assert from "node:assert/strict";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { MongoClient, ObjectId } from "mongodb";
import { migrateDatabase } from "../scripts/database-migrations";
import { issueCsrf } from "../src/modules/identity/csrf-token";

let stage = "configuration";
async function main() {
  assert.ok(process.env.MONGODB_URI);
  const database = `pp_owner_${randomBytes(6).toString("hex")}`;
  const origin = "http://127.0.0.1:3140";
  Object.assign(process.env, {
    MONGODB_DB_NAME: database,
    APP_URL: origin,
    AUTH_ENABLED: "true",
    EMAIL_MODE: "test",
    EMAIL_DELIVERY_MODE: "disabled",
    EMAIL_TEST_RECIPIENT: "",
    FILES_ENABLED: "false",
    BETTER_AUTH_SECRET: randomBytes(32).toString("hex"),
    CSRF_SECRET: randomBytes(32).toString("hex"),
    RATE_LIMIT_SECRET: randomBytes(32).toString("hex"),
  });
  const { getDomainConnection, getAuthClient } =
    await import("../src/shared/server/db");
  const { getAuth } = await import("../src/modules/identity/auth");
  const { requireActor, requireAdmin, requireOwner } =
    await import("../src/modules/identity/service");
  const { profileModel } = await import("../src/modules/identity/model");
  const { previewOwner, provisionOwner } =
    await import("../src/modules/identity/provision-owner");
  const { provisionAdministrator } =
    await import("../src/modules/identity/provision-admin");
  const { createAdministrationService } =
    await import("../src/modules/administration/service");
  const { administrationHttp } =
    await import("../src/modules/administration/http");
  const { createDraft } = await import("../src/modules/catalog/service");
  const { fileHttp } = await import("../src/modules/files/http");
  const { savePreferences } =
    await import("../src/modules/identity/preferences");
  const nativeAuth = await import("../src/app/api/auth/[...all]/route");
  const client = await new MongoClient(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  }).connect();
  const db = client.db(database),
    connection = await getDomainConnection();
  const conflictDatabase = `${database}_c`;
  const auth = await getAuth();
  const model = profileModel(connection);
  const password = randomBytes(24).toString("base64url");
  let clock = Date.now();
  const service = createAdministrationService({ now: () => clock });
  async function signup(email: string, verified = true) {
    const response = await auth.api.signUpEmail({
      body: { name: "Disposable owner test", email, password },
      asResponse: true,
    });
    assert.equal(response.status, 200);
    const headers = new Headers({
      cookie: response.headers
        .getSetCookie()
        .map((value) => value.split(";")[0])
        .join("; "),
    });
    const actor = await requireActor(headers);
    if (verified)
      await db
        .collection("user")
        .updateOne(
          { _id: new ObjectId(actor.session.user.id) },
          { $set: { emailVerified: true } },
        );
    return { headers, userId: actor.session.user.id, email };
  }
  async function request(
    headers: Headers,
    action: Parameters<typeof administrationHttp>[1],
    body?: unknown,
    userId = "",
    protection = true,
  ) {
    const actor = headers.has("cookie") ? await requireActor(headers) : null;
    const token = actor
      ? issueCsrf(actor.session.session.id, process.env.CSRF_SECRET!).token
      : "";
    return administrationHttp(
      new Request(`${origin}/api/v1/admin/administrators`, {
        method:
          action === "list" || action === "read"
            ? "GET"
            : action === "change"
              ? "PATCH"
              : "POST",
        headers: {
          ...Object.fromEntries(headers),
          origin,
          "content-type": "application/json",
          ...(protection ? { "x-csrf-token": token } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      }),
      action,
      userId,
    );
  }
  async function command(args: string[], expected: number) {
    const child = spawn(
      process.execPath,
      [
        "--conditions=react-server",
        "--import",
        "tsx",
        "scripts/provision-owner.ts",
        ...args,
        "--database",
        database,
        "--environment",
        "test",
      ],
      { env: process.env, stdio: "ignore" },
    );
    const timer = setTimeout(() => child.kill(), 90000);
    try {
      assert.equal(
        await new Promise((resolve, reject) => {
          child.once("exit", resolve);
          child.once("error", reject);
        }),
        expected,
      );
    } finally {
      clearTimeout(timer);
    }
  }
  try {
    stage = "migration and exact operator preview";
    const conflictDb = client.db(conflictDatabase);
    await conflictDb.collection("profiles").insertMany(
      ["one", "two"].map((userId) => ({
        userId,
        role: "owner",
        lifecycle: "active",
        stateRevision: 0,
      })),
    );
    await assert.rejects(migrateDatabase(conflictDb), {
      code: "DUPLICATE_EXISTING_DATA",
    });
    assert.equal(
      await conflictDb.collection("profiles").countDocuments({ role: "owner" }),
      2,
    );
    await migrateDatabase(db);
    const first = await signup("owner-one@example.com"),
      second = await signup("owner-two@example.com"),
      helper = await signup("helper@example.com"),
      unverified = await signup("unverified@example.com", false);
    const before = await model.findOne({ userId: first.userId }).lean();
    await assert.rejects(
      provisionOwner(
        connection,
        unverified.userId,
        unverified.email,
        0,
        randomUUID(),
      ),
    );
    const preview = await previewOwner(
      connection,
      first.userId,
      first.email.toUpperCase(),
    );
    assert.equal(preview.role, "student");
    assert.equal(preview.ownerExists, false);
    await command([first.userId, "--preview", "--email", first.email], 0);
    assert.deepEqual(
      await model.findOne({ userId: first.userId }).lean(),
      before,
    );
    await assert.rejects(previewOwner(connection, first.userId, second.email));
    stage = "owner provisioning audit rollback";
    await assert.rejects(
      provisionOwner(
        connection,
        first.userId,
        first.email,
        0,
        randomUUID(),
        async () => {
          throw new Error("Injected audit failure");
        },
      ),
    );
    assert.equal(
      (await model.findOne({ userId: first.userId }).lean())?.role,
      "student",
    );
    stage = "concurrent unique owner provisioning";
    const results = await Promise.allSettled(
      [first, second].map((account) =>
        provisionOwner(
          connection,
          account.userId,
          account.email,
          0,
          randomUUID(),
        ),
      ),
    );
    assert.equal(
      results.filter((result) => result.status === "fulfilled").length,
      1,
    );
    assert.equal(
      await db.collection("profiles").countDocuments({ role: "owner" }),
      1,
    );
    const ownerId = (await model.findOne({ role: "owner" }).lean())!.userId;
    const owner = ownerId === first.userId ? first : second;
    const other = ownerId === first.userId ? second : first;
    assert.equal(
      await provisionOwner(
        connection,
        owner.userId,
        owner.email,
        0,
        randomUUID(),
      ),
      "unchanged",
    );
    await command(
      [
        other.userId,
        "--apply",
        "--email",
        other.email,
        "--expected-revision",
        "0",
      ],
      1,
    );
    assert.equal(
      await provisionAdministrator(
        connection,
        owner.userId,
        "test",
        randomUUID(),
      ),
      "unchanged",
    );
    await assert.rejects(
      provisionAdministrator(connection, helper.userId, "test", randomUUID()),
    );
    await migrateDatabase(db);
    assert.equal(
      await db.collection("profiles").countDocuments({ role: "owner" }),
      1,
    );
    stage = "guards CSRF strict input and owner admin inheritance";
    await requireOwner(owner.headers);
    await requireAdmin(owner.headers);
    assert.equal(
      (
        await fileHttp(
          new Request(`${origin}/api/v1/admin/files`, {
            headers: owner.headers,
          }),
          "list",
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await nativeAuth.POST(
          new Request(`${origin}/api/auth/sign-up/email`, {
            method: "POST",
            headers: { origin, "content-type": "application/json" },
            body: JSON.stringify({
              name: "Role injection",
              email: "role-injection@example.com",
              password,
              role: "owner",
            }),
          }),
        )
      ).status,
      422,
    );
    await assert.rejects(
      savePreferences(helper.headers, { role: "owner", owner: true }),
      { code: "VALIDATION_ERROR" },
    );
    await createDraft(owner.headers, {
      slug: "owner-inherited-content",
      title: "Owner content permissions",
      subject: "cs",
      topic: "dbms",
      type: "resource",
      difficulty: "easy",
      estimatedMinutes: 15,
      source: "Original disposable fixture",
      attribution: "",
      assetIds: [],
    });
    const actorForCsrf = await requireOwner(owner.headers);
    assert.equal(
      (
        await administrationHttp(
          new Request(`${origin}/api/v1/admin/administrators/lookup`, {
            method: "POST",
            headers: {
              ...Object.fromEntries(owner.headers),
              origin: "https://untrusted.example",
              "content-type": "application/json",
              "x-csrf-token": issueCsrf(
                actorForCsrf.session.session.id,
                process.env.CSRF_SECRET!,
              ).token,
            },
            body: JSON.stringify({ email: helper.email }),
          }),
          "lookup",
        )
      ).status,
      403,
    );
    assert.equal((await request(new Headers(), "list")).status, 401);
    assert.equal((await request(helper.headers, "list")).status, 403);
    assert.equal(
      (
        await request(
          owner.headers,
          "lookup",
          { email: helper.email },
          "",
          false,
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await request(owner.headers, "lookup", {
          email: helper.email,
          role: "owner",
        })
      ).status,
      422,
    );
    assert.equal(
      (await request(owner.headers, "lookup", { email: "missing@example.com" }))
        .status,
      404,
    );
    assert.equal(
      (
        await service.lookup(owner.headers, {
          email: helper.email.toUpperCase(),
        })
      ).userId,
      helper.userId,
    );
    const changeInput = () => ({
      expectedRole: "student",
      role: "admin",
      expectedStateRevision: 0,
      operationId: randomUUID(),
      reason: "Disposable editorial helper",
    });
    await assert.rejects(
      service.change(owner.headers, helper.userId, changeInput(), randomUUID()),
      { code: "REAUTHENTICATION_REQUIRED" },
    );
    stage = "supported password confirmation and session binding";
    await assert.rejects(
      service.reauthenticate(owner.headers, { password: "wrong-password" }),
      { code: "REAUTHENTICATION_FAILED" },
    );
    await service.reauthenticate(owner.headers, { password });
    const secondSession = await auth.api.signInEmail({
      body: { email: owner.email, password },
      asResponse: true,
    });
    const secondHeaders = new Headers({
      cookie: secondSession.headers
        .getSetCookie()
        .map((value) => value.split(";")[0])
        .join("; "),
    });
    await assert.rejects(
      service.change(secondHeaders, helper.userId, changeInput(), randomUUID()),
      { code: "REAUTHENTICATION_REQUIRED" },
    );
    stage = "verification cannot be bypassed by demo mode";
    await assert.rejects(
      service.change(
        owner.headers,
        unverified.userId,
        changeInput(),
        randomUUID(),
      ),
      { code: "EMAIL_NOT_VERIFIED" },
    );
    await assert.rejects(
      service.change(
        owner.headers,
        helper.userId,
        { ...changeInput(), role: "owner" },
        randomUUID(),
      ),
      { code: "VALIDATION_ERROR" },
    );
    stage = "atomic grant retries concurrency and author preservation";
    const input = changeInput();
    const granted = await service.change(
      owner.headers,
      helper.userId,
      input,
      randomUUID(),
    );
    assert.equal(granted?.account.role, "admin");
    assert.equal(granted?.account.stateRevision, 1);
    const replay = await service.change(
      owner.headers,
      helper.userId,
      input,
      randomUUID(),
    );
    assert.equal(replay?.replayed, true);
    assert.equal(
      await db
        .collection("adminAudit")
        .countDocuments({ entityId: helper.userId }),
      1,
    );
    await assert.rejects(
      service.change(
        owner.headers,
        helper.userId,
        { ...input, reason: "Changed payload" },
        randomUUID(),
      ),
      { code: "STATE_CONFLICT" },
    );
    await requireAdmin(helper.headers);
    assert.equal((await request(helper.headers, "list")).status, 403);
    const content = await createDraft(helper.headers, {
      slug: "preserved-helper-draft",
      title: "Preserve author record",
      subject: "dsa",
      topic: "arrays",
      type: "resource",
      difficulty: "easy",
      estimatedMinutes: 15,
      source: "Original disposable fixture",
      attribution: "",
      assetIds: [],
    });
    const authored = await db
      .collection("contentItems")
      .findOne({ _id: new ObjectId(content.id) });
    const historyId = new ObjectId();
    await db.collection("attempts").insertOne({
      _id: historyId,
      userId: helper.userId,
      fixtureMarker: "preserve-only",
    });
    let target = await service.read(owner.headers, helper.userId);
    const remove = {
      expectedRole: "admin",
      role: "student",
      expectedStateRevision: target.stateRevision,
      operationId: randomUUID(),
      reason: "Disposable removal",
    };
    const concurrent = await Promise.allSettled(
      [remove, { ...remove, operationId: randomUUID() }].map((body) =>
        service.change(owner.headers, helper.userId, body, randomUUID()),
      ),
    );
    assert.equal(
      concurrent.filter((value) => value.status === "fulfilled").length,
      1,
    );
    await assert.rejects(requireAdmin(helper.headers), { code: "FORBIDDEN" });
    assert.equal(
      (await requireActor(helper.headers)).destination,
      "/onboarding",
    );
    assert.deepEqual(
      await db
        .collection("contentItems")
        .findOne({ _id: new ObjectId(content.id) }),
      authored,
    );
    assert.ok(await db.collection("attempts").findOne({ _id: historyId }));
    assert.equal(
      await db
        .collection("adminAudit")
        .countDocuments({ entityId: helper.userId }),
      2,
    );
    stage = "audit failure rolls back role revision and retry ledger";
    target = await service.read(owner.headers, helper.userId);
    const retry = {
      ...changeInput(),
      expectedStateRevision: target.stateRevision,
    };
    const failing = createAdministrationService({
      audit: async () => {
        throw new Error("Injected audit failure");
      },
      now: () => clock,
    });
    await assert.rejects(
      failing.change(owner.headers, helper.userId, retry, randomUUID()),
    );
    assert.equal(
      (await service.read(owner.headers, helper.userId)).stateRevision,
      target.stateRevision,
    );
    assert.equal(
      await db
        .collection("adminRoleOperations")
        .countDocuments({ operationId: retry.operationId }),
      0,
    );
    await service.change(owner.headers, helper.userId, retry, randomUUID());
    stage = "owner protection and stale authorization inside transaction";
    await assert.rejects(
      service.change(
        owner.headers,
        owner.userId,
        {
          expectedRole: "admin",
          role: "student",
          expectedStateRevision: 1,
          operationId: randomUUID(),
          reason: "Attempt owner demotion",
        },
        randomUUID(),
      ),
      { code: "OWNER_PROTECTED" },
    );
    const staleActor = await requireOwner(owner.headers);
    const staleService = createAdministrationService({
      owner: async () => staleActor,
      now: () => clock,
    });
    await model.updateOne(
      { userId: owner.userId },
      { $set: { lifecycle: "deleting" } },
    );
    const helperNow = await model.findOne({ userId: helper.userId }).lean();
    await assert.rejects(
      staleService.change(
        owner.headers,
        helper.userId,
        {
          ...remove,
          expectedStateRevision: helperNow!.stateRevision,
          operationId: randomUUID(),
        },
        randomUUID(),
      ),
      { code: "FORBIDDEN" },
    );
    await model.updateOne(
      { userId: owner.userId },
      { $set: { lifecycle: "active" } },
    );
    stage = "reauth expiry and revoked session";
    clock += 300001;
    await assert.rejects(
      service.change(owner.headers, other.userId, changeInput(), randomUUID()),
      { code: "REAUTHENTICATION_REQUIRED" },
    );
    clock = Date.now();
    await service.reauthenticate(secondHeaders, { password });
    await auth.api.signOut({ headers: secondHeaders });
    await assert.rejects(
      service.change(secondHeaders, other.userId, changeInput(), randomUUID()),
      { code: "UNAUTHENTICATED" },
    );
    const expiring = await auth.api.signInEmail({
      body: { email: owner.email, password },
      asResponse: true,
    });
    const expiringHeaders = new Headers({
      cookie: expiring.headers
        .getSetCookie()
        .map((value) => value.split(";")[0])
        .join("; "),
    });
    await service.reauthenticate(expiringHeaders, { password });
    const expiringActor = await requireOwner(expiringHeaders);
    await db
      .collection("session")
      .updateOne(
        { _id: new ObjectId(expiringActor.session.session.id) },
        { $set: { expiresAt: new Date(Date.now() - 1000) } },
      );
    await assert.rejects(
      service.change(
        expiringHeaders,
        other.userId,
        changeInput(),
        randomUUID(),
      ),
      { code: "UNAUTHENTICATED" },
    );
    stage = "pagination and rate limits";
    const page = await service.list(
      owner.headers,
      new URLSearchParams({ limit: "1" }),
    );
    assert.equal(page.data.length, 1);
    assert.ok(page.meta.page.nextCursor);
    await assert.rejects(service.list(helper.headers, new URLSearchParams()), {
      code: "FORBIDDEN",
    });
    await assert.rejects(
      service.list(owner.headers, new URLSearchParams({ limit: "51" })),
      { code: "VALIDATION_ERROR" },
    );
    await assert.rejects(
      service.list(
        owner.headers,
        new URLSearchParams({ limit: "2", cursor: page.meta.page.nextCursor! }),
      ),
      { code: "INVALID_CURSOR" },
    );
    const next = await service.list(
      owner.headers,
      new URLSearchParams({ limit: "1", cursor: page.meta.page.nextCursor! }),
    );
    assert.notEqual(next.data[0]?.userId, page.data[0]?.userId);
    for (let attempt = 0; attempt < 1; attempt++)
      await assert.rejects(
        service.reauthenticate(owner.headers, { password: "wrong-password" }),
        { code: "REAUTHENTICATION_FAILED" },
      );
    await assert.rejects(
      service.reauthenticate(owner.headers, { password: "wrong-password" }),
      { code: "RATE_LIMITED" },
    );
    const ownerActor = await requireOwner(owner.headers);
    assert.equal(
      await db.collection("adminReauth").countDocuments({
        _id: createHash("sha256")
          .update(ownerActor.session.session.id)
          .digest("hex") as never,
      }),
      0,
    );
    console.log(
      "PASS: isolated owner provisioning/uniqueness, supported password step-up, authorization/CSRF, verified-target enforcement, atomic audited role transitions, stale/concurrent protection, retries, revocation, history preservation, pagination and rate limits.",
    );
  } finally {
    await connection.close();
    await (await getAuthClient()).close();
    assert.ok(/^pp_owner_[a-f0-9]{12}$/.test(database));
    await db.dropDatabase();
    assert.ok(/^pp_owner_[a-f0-9]{12}_c$/.test(conflictDatabase));
    await client.db(conflictDatabase).dropDatabase();
    await client.close();
    console.log(
      "Disposable owner database removed; no real accounts, email or catalog changed.",
    );
  }
}
main().catch((error) => {
  console.error(
    JSON.stringify({
      stage,
      type: error instanceof Error ? error.name : "Unknown",
      code:
        typeof error?.code === "string" || typeof error?.code === "number"
          ? error.code
          : undefined,
      location:
        error instanceof Error
          ? error.stack?.match(/administration-integration\.ts:\d+:\d+/)?.[0]
          : undefined,
    }),
  );
  process.exitCode = 1;
});
