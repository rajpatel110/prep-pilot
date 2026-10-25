import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { MongoClient, ObjectId, type Document } from "mongodb";
import mongoose from "mongoose";
import { catalogModels } from "../src/modules/catalog/model";
import { appendAudit } from "../src/modules/administration/audit";
import { draftInputSchema } from "../src/modules/catalog/schemas";
import { migrateDatabase } from "../scripts/database-migrations";

type NamedDocument = Document & { _id: string };
let stage = "configuration";

async function command(
  script: string,
  args: string[],
  env: NodeJS.ProcessEnv,
  expected = 0,
) {
  const child = spawn(
    process.execPath,
    ["--conditions=react-server", "--import", "tsx", script, ...args],
    { env, stdio: ["ignore", "pipe", "pipe"] },
  );
  let output = "";
  child.stdout.on("data", (chunk: Buffer) => {
    if (output.length < 8192) output += chunk.toString();
  });
  child.stderr.on("data", (chunk: Buffer) => {
    if (output.length < 8192) output += chunk.toString();
  });
  const timer = setTimeout(() => child.kill(), 120000);
  try {
    const code = await new Promise<number | null>((resolve, reject) => {
      child.once("exit", resolve);
      child.once("error", reject);
    });
    assert.equal(code, expected, `${script} exit status`);
    return output;
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  if (!process.env.MONGODB_URI)
    throw new Error("MONGODB_URI is required; no database target is inferred.");
  const database = `prep_pilot_step1_test_${randomBytes(6).toString("hex")}`;
  const conflictDatabase = `${database}_c`;
  const duplicateDatabase = `${database}_d`;
  const client = new MongoClient(process.env.MONGODB_URI, {
    maxPoolSize: 2,
    serverSelectionTimeoutMS: 10000,
  });
  let connection: mongoose.Connection | undefined;
  const db = client.db(database);
  const conflict = client.db(conflictDatabase);
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    MONGODB_DB_NAME: database,
    AUTH_ENABLED: "true",
    EMAIL_MODE: "test",
    APP_URL: "http://127.0.0.1:3102",
    NODE_ENV: "development",
    BETTER_AUTH_SECRET: randomBytes(32).toString("hex"),
    CSRF_SECRET: randomBytes(32).toString("hex"),
    RATE_LIMIT_SECRET: randomBytes(32).toString("hex"),
  };
  const args = ["--database", database, "--environment", "test"];
  try {
    stage = "database connection";
    await client.connect();
    stage = "missing-configuration command";
    const missing = await command(
      "scripts/setup-database.ts",
      [],
      { ...env, MONGODB_URI: "" },
      1,
    );
    assert.ok(missing.includes("Require MONGODB_URI"));
    stage = "initial migration command";
    await command("scripts/setup-database.ts", args, env);
    const migrations = db.collection<NamedDocument>("schemaMigrations");
    const initialMigration = await migrations.findOne({
      _id: "001_identity_catalog_foundation",
    });
    assert.equal(initialMigration?.state, "applied");
    const state = db.collection<NamedDocument>("catalogState");
    assert.equal((await state.findOne({ _id: "catalog" }))?.revision, 0);
    stage = "catalog persistence and unique indexes";
    connection = await mongoose
      .createConnection(process.env.MONGODB_URI, {
        dbName: database,
        autoIndex: false,
        autoCreate: false,
        maxPoolSize: 2,
        serverSelectionTimeoutMS: 10000,
      })
      .asPromise();
    const models = catalogModels(connection);
    const draft = draftInputSchema.parse({
      slug: "disposable-array",
      title: "Disposable array exercise",
      subject: "dsa",
      topic: "arrays",
      type: "question",
      difficulty: "easy",
      estimatedMinutes: 15,
      source: "Disposable test fixture",
      attribution: "",
    });
    const create = (values: Record<string, unknown> = {}) =>
      new models.content({
        ...draft,
        createdBy: "disposable-admin",
        updatedBy: "disposable-admin",
        ...values,
      }).save();
    const content = await create();
    assert.equal(content.revision, 1);
    await assert.rejects(
      create(),
      (error: unknown) => (error as { code?: number }).code === 11000,
    );
    await create({ slug: "another-unseeded" });
    await create({ slug: "seeded-first", seedKey: "disposable-seed" });
    await assert.rejects(
      create({ slug: "seeded-second", seedKey: "disposable-seed" }),
      (error: unknown) => (error as { code?: number }).code === 11000,
    );
    const before = await db
      .collection("contentItems")
      .findOne({ _id: new ObjectId(content._id.toString()) });
    await state.updateOne(
      { _id: "catalog" },
      { $set: { revision: 7, commitSerial: 11 } },
    );
    const stateBefore = await state.findOne({ _id: "catalog" });
    stage = "repeat migration command";
    await command("scripts/setup-database.ts", args, env);
    assert.deepEqual(await state.findOne({ _id: "catalog" }), stateBefore);
    assert.deepEqual(
      await db
        .collection("contentItems")
        .findOne({ _id: new ObjectId(content._id.toString()) }),
      before,
    );
    assert.equal(await db.collection("contentItems").countDocuments(), 3);
    assert.equal(
      (await db.collection("contentItems").listIndexes().toArray()).length,
      8,
    );
    stage = "direct permission test-mode worker";
    await command("tests/permission-integration.ts", [], env);
    stage = "direct permission live-mode worker";
    await command("tests/permission-integration.ts", [], {
      ...env,
      EMAIL_MODE: "live",
    });
    stage = "owner provisioning and audit rollback";

    const userId = `disposable-${randomUUID()}`;
    await db.collection("user").insertOne({
      id: userId,
      email: `${randomUUID()}@example.com`,
      emailVerified: false,
    });
    await db.collection("profiles").insertOne({
      userId,
      role: "student",
      lifecycle: "active",
      stateRevision: 0,
      schemaVersion: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const provision = (
      id = userId,
      overrides: Partial<NodeJS.ProcessEnv> = {},
      expected = 0,
    ) =>
      command(
        "scripts/provision-owner.ts",
        [
          id,
          "--apply",
          "--email",
          "operator-test@example.com",
          "--expected-revision",
          "0",
          ...args,
        ],
        { ...env, ...overrides },
        expected,
      );
    await provision("missing-identity", {}, 1);
    await provision(userId, { EMAIL_MODE: "live" }, 1);
    assert.equal(
      (await db.collection("profiles").findOne({ userId }))?.role,
      "student",
    );
    await db
      .collection("profiles")
      .updateOne({ userId }, { $set: { lifecycle: "deleting" } });
    await provision(userId, {}, 1);
    await db
      .collection("profiles")
      .updateOne({ userId }, { $set: { lifecycle: "active" } });
    const profileBefore = await db.collection("profiles").findOne({ userId });
    await db
      .collection("user")
      .updateOne(
        { id: userId },
        { $set: { email: "operator-test@example.com", emailVerified: true } },
      );
    await db.command({
      collMod: "adminAudit",
      validator: { action: { $eq: "reject_disposable_audit" } },
      validationLevel: "strict",
      validationAction: "error",
    });
    await provision(userId, {}, 1);
    assert.deepEqual(
      await db.collection("profiles").findOne({ userId }),
      profileBefore,
      "Audit rejection must roll back profile role and revision",
    );
    assert.equal(
      await db.collection("adminAudit").countDocuments({ entityId: userId }),
      0,
    );
    await db.command({ collMod: "adminAudit", validator: {} });
    await provision();
    assert.equal(
      (await db.collection("profiles").findOne({ userId }))?.role,
      "owner",
    );
    const event = await db
      .collection("adminAudit")
      .findOne({ entityId: userId });
    assert.equal(event?.priorRevision, 0);
    assert.equal(event?.newRevision, 1);
    assert.deepEqual(event?.changedFields, ["role"]);
    await provision();
    assert.equal(
      await db.collection("adminAudit").countDocuments({ entityId: userId }),
      1,
    );
    await assert.rejects(
      connection.transaction(async (session) => {
        await appendAudit(connection!, session, {
          actorUserId: "disposable-admin",
          action: "test_rollback",
          entityType: "content",
          entityId: content._id.toString(),
          priorRevision: 1,
          newRevision: 2,
          changedFields: ["title"],
          requestId: randomUUID(),
        });
        throw new Error("Abort disposable transaction");
      }),
    );
    assert.equal(
      await db
        .collection("adminAudit")
        .countDocuments({ action: "test_rollback" }),
      0,
    );
    stage = "migration recovery and conflicts";

    stage = "migration checksum rejection";
    const checksum = initialMigration!.checksum;
    await migrations.updateOne(
      { _id: "001_identity_catalog_foundation" },
      { $set: { checksum: "deliberately-wrong" } },
    );
    await assert.rejects(migrateDatabase(db), {
      code: "MIGRATION_CHECKSUM_MISMATCH",
    });
    stage = "migration crashed-runner recovery";
    await migrations.updateOne(
      { _id: "001_identity_catalog_foundation" },
      {
        $set: {
          checksum,
          state: "running",
          ownerToken: "crashed-disposable-runner",
          leaseUntil: new Date(0),
        },
      },
    );
    await migrateDatabase(db);
    assert.equal(
      (await migrations.findOne({ _id: "001_identity_catalog_foundation" }))
        ?.state,
      "applied",
    );
    stage = "migration lock exclusion";
    await migrations.updateOne(
      { _id: "__database_runner_lock__" },
      {
        $set: {
          ownerToken: "other-runner",
          leaseUntil: new Date(Date.now() + 60000),
        },
      },
    );
    await assert.rejects(migrateDatabase(db), { code: "MIGRATION_LOCKED" });
    await migrations.updateOne(
      { _id: "__database_runner_lock__" },
      { $set: { leaseUntil: new Date(0) } },
    );
    await migrateDatabase(db);
    assert.deepEqual(await state.findOne({ _id: "catalog" }), stateBefore);

    stage = "migration index conflict preservation";
    await conflict
      .collection("contentItems")
      .createIndex({ slug: 1 }, { name: "content_slug_unique", unique: false });
    await assert.rejects(migrateDatabase(conflict), { code: "INDEX_CONFLICT" });
    const untouchedIndexes = await conflict
      .collection("contentItems")
      .listIndexes()
      .toArray();
    assert.equal(
      untouchedIndexes.find((index) => index.name === "content_slug_unique")
        ?.unique,
      undefined,
    );
    await conflict.collection("contentItems").insertMany([
      { ...before!, _id: new ObjectId() },
      { ...before!, _id: new ObjectId() },
    ]);
    await assert.rejects(migrateDatabase(conflict), { code: "INDEX_CONFLICT" });
    assert.equal(await conflict.collection("contentItems").countDocuments(), 2);
    const invalidState = {
      _id: "catalog",
      revision: -1,
      commitSerial: 9,
      schemaVersion: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await conflict
      .collection<NamedDocument>("catalogState")
      .insertOne(invalidState);
    await assert.rejects(migrateDatabase(conflict), {
      code: "INVALID_CATALOG_STATE",
    });
    assert.deepEqual(
      await conflict
        .collection<NamedDocument>("catalogState")
        .findOne({ _id: "catalog" }),
      invalidState,
    );
    stage = "migration duplicate and invalid record preservation";
    const duplicates = client.db(duplicateDatabase);
    await duplicates.collection("contentItems").insertMany([
      { ...before!, _id: new ObjectId() },
      { ...before!, _id: new ObjectId() },
    ]);
    await assert.rejects(migrateDatabase(duplicates), {
      code: "DUPLICATE_EXISTING_DATA",
    });
    assert.equal(
      await duplicates.collection("contentItems").countDocuments(),
      2,
    );
    await duplicates
      .collection("contentItems")
      .updateOne({}, { $set: { revision: -1 } });
    await assert.rejects(migrateDatabase(duplicates), {
      code: "INVALID_EXISTING_CONTENT",
    });
    assert.equal(
      await duplicates.collection("contentItems").countDocuments(),
      2,
    );
    console.log(
      "PASS: explicit setup, migration repeatability/restart/checksum/lock/conflict preservation, strict catalog persistence/unique indexes, canonical permission guards, disposable owner provisioning/failures/audit rollback. Only disposable test databases were used.",
    );
  } finally {
    await connection?.close();
    try {
      for (const name of [database, conflictDatabase, duplicateDatabase]) {
        assert.ok(/^prep_pilot_step1_test_[a-f0-9]{12}(?:_[cd])?$/.test(name));
        await client.db(name).dropDatabase();
      }
    } finally {
      await client.close();
    }
  }
}

main().catch((error) => {
  const code =
    error && typeof error === "object" && "code" in error
      ? String(error.code)
          .replace(/[^A-Za-z0-9_]/g, "")
          .slice(0, 80)
      : "unclassified";
  console.error(
    error instanceof assert.AssertionError
      ? `Catalog integration assertion failed at ${stage}: ${error.message}`
      : `Catalog integration failed at ${stage} (${code}). Check disposable database access and replica-set availability. No secrets are logged.`,
  );
  process.exitCode = 1;
});
