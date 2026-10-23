import { randomUUID } from "node:crypto";
import { ObjectId } from "mongodb";
import type { Db, Document, IndexDescription, ClientSession } from "mongodb";
import {
  foundationMigration,
  foundationChecksum,
} from "./migrations/001-foundation";
import {
  storedContentSchema,
  catalogStateSchema,
} from "../src/modules/catalog/schemas";

const migrationId = foundationMigration.id;
const indexes = foundationMigration.indexes;
const checksum = foundationChecksum;
const lockId = "__database_runner_lock__";
const leaseMilliseconds = 5 * 60 * 1000;
type NamedDocument = Document & { _id: string };

export class MigrationError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value !== null && typeof value === "object")
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${key}:${stable(entry)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}

function compatible(actual: Document, expected: IndexDescription) {
  const expectedKey = expected.key as Record<string, unknown>;
  const textFields = Object.entries(expectedKey)
    .filter(([, value]) => value === "text")
    .map(([key]) => key)
    .sort();
  const keysMatch = textFields.length
    ? stable(actual.key) === stable({ _fts: "text", _ftsx: 1 }) &&
      stable(actual.weights) ===
        stable(Object.fromEntries(textFields.map((field) => [field, 1]))) &&
      actual.default_language === "english" &&
      actual.language_override === "language"
    : JSON.stringify(actual.key) === JSON.stringify(expected.key);
  return (
    keysMatch &&
    Boolean(actual.unique) === Boolean(expected.unique) &&
    Boolean(actual.sparse) === Boolean(expected.sparse) &&
    actual.expireAfterSeconds === expected.expireAfterSeconds &&
    stable(actual.partialFilterExpression ?? null) ===
      stable(expected.partialFilterExpression ?? null) &&
    !actual.hidden &&
    !actual.collation
  );
}

async function existingIndexes(db: Db, collection: string) {
  if (
    !(await db
      .listCollections({ name: collection }, { nameOnly: true })
      .hasNext())
  )
    return [];
  return db.collection(collection).listIndexes().toArray();
}

async function validateExistingCatalog(db: Db, renew: () => Promise<void>) {
  let count = 0;
  for await (const content of db
    .collection("contentItems")
    .find({})
    .batchSize(100)) {
    if (count++ % 100 === 0) await renew();
    if (!(content._id instanceof ObjectId))
      throw new MigrationError("INVALID_EXISTING_CONTENT");
    const result = storedContentSchema.safeParse({
      ...content,
      _id: String(content._id),
      assetIds: Array.isArray(content.assetIds)
        ? content.assetIds.map(String)
        : content.assetIds,
    });
    if (!result.success) throw new MigrationError("INVALID_EXISTING_CONTENT");
  }
  for await (const state of db
    .collection<NamedDocument>("catalogState")
    .find({}))
    if (!catalogStateSchema.safeParse(state).success)
      throw new MigrationError("INVALID_CATALOG_STATE");
  for (const [collection, definitions] of Object.entries(indexes)) {
    const current = await existingIndexes(db, collection);
    for (const definition of definitions) {
      const named = current.find((item) => item.name === definition.name);
      if (named && !compatible(named, definition))
        throw new MigrationError("INDEX_CONFLICT");
      for (const other of current) {
        if (other.name === "_id_" || other.name === definition.name) continue;
        if (
          JSON.stringify(other.key) === JSON.stringify(definition.key) ||
          (other.key._fts && Object.values(definition.key).includes("text"))
        )
          throw new MigrationError("INDEX_CONFLICT");
      }
      if (definition.unique) {
        const duplicate = await db
          .collection(collection)
          .aggregate(
            [
              ...(definition.partialFilterExpression
                ? [{ $match: definition.partialFilterExpression }]
                : []),
              {
                $group: {
                  _id: Object.fromEntries(
                    Object.keys(definition.key).map((field) => [
                      field,
                      `$${field}`,
                    ]),
                  ),
                  count: { $sum: 1 },
                },
              },
              { $match: { count: { $gt: 1 } } },
              { $limit: 1 },
            ],
            { maxTimeMS: 60000 },
          )
          .hasNext();
        if (duplicate) throw new MigrationError("DUPLICATE_EXISTING_DATA");
      }
      await renew();
    }
  }
}

export async function migrateDatabase(db: Db) {
  const migrations = db.collection<NamedDocument>("schemaMigrations");
  const ownerToken = randomUUID();
  const now = new Date();
  try {
    await migrations.updateOne(
      {
        _id: lockId,
        $or: [{ leaseUntil: { $lte: now } }, { leaseUntil: null }],
      },
      {
        $set: {
          ownerToken,
          leaseUntil: new Date(now.getTime() + leaseMilliseconds),
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now, schemaVersion: 1 },
      },
      { upsert: true },
    );
  } catch (error) {
    if ((error as { code?: number }).code === 11000)
      throw new MigrationError("MIGRATION_LOCKED");
    throw error;
  }
  async function renew(session?: ClientSession) {
    const timestamp = new Date();
    const result = await migrations.updateOne(
      { _id: lockId, ownerToken, leaseUntil: { $gt: timestamp } },
      {
        $set: {
          leaseUntil: new Date(timestamp.getTime() + leaseMilliseconds),
          updatedAt: timestamp,
        },
      },
      session ? { session } : {},
    );
    if (result.matchedCount !== 1)
      throw new MigrationError("MIGRATION_LEASE_LOST");
    await migrations.updateOne(
      { _id: migrationId, ownerToken, state: "running" },
      {
        $set: {
          leaseUntil: new Date(timestamp.getTime() + leaseMilliseconds),
          updatedAt: timestamp,
        },
      },
      session ? { session } : {},
    );
  }
  async function fenced(operation: (session: ClientSession) => Promise<void>) {
    await db.client.withSession((session) =>
      session.withTransaction(
        async () => {
          await renew(session);
          await operation(session);
        },
        {
          readConcern: { level: "snapshot" },
          writeConcern: { w: "majority" },
          readPreference: "primary",
        },
      ),
    );
  }
  let started = false;
  try {
    const previous = await migrations.findOne({ _id: migrationId });
    if (previous && previous.checksum !== checksum)
      throw new MigrationError("MIGRATION_CHECKSUM_MISMATCH");
    if (previous && !["running", "applied", "failed"].includes(previous.state))
      throw new MigrationError("INVALID_MIGRATION_STATE");
    if (
      previous?.state === "applied" &&
      !(await db
        .collection<NamedDocument>("catalogState")
        .findOne({ _id: "catalog" }))
    )
      throw new MigrationError("MISSING_CATALOG_STATE");
    await renew();
    if (previous?.state !== "applied") {
      await fenced(async (session) => {
        await migrations.updateOne(
          {
            _id: migrationId,
            checksum: previous ? checksum : { $exists: false },
          },
          {
            $set: {
              checksum,
              state: "running",
              ownerToken,
              leaseUntil: new Date(Date.now() + leaseMilliseconds),
              startedAt: now,
              completedAt: null,
              updatedAt: now,
            },
            $setOnInsert: { createdAt: now, schemaVersion: 1 },
            $unset: { errorCode: "" },
          },
          { upsert: true, session },
        );
      });
      started = true;
    }
    await validateExistingCatalog(db, renew);
    for (const [collection, definitions] of Object.entries(indexes)) {
      for (const { key, ...options } of definitions) {
        await renew();
        await db
          .collection(collection)
          .createIndex(key, { ...options, maxTimeMS: 60000 });
      }
    }
    await renew();
    const timestamp = new Date();
    if (previous?.state !== "applied")
      await fenced(async (session) => {
        await db.collection<NamedDocument>("catalogState").updateOne(
          { _id: "catalog" },
          {
            $setOnInsert: {
              revision: 0,
              commitSerial: 0,
              schemaVersion: 1,
              createdAt: timestamp,
              updatedAt: timestamp,
            },
          },
          { upsert: true, session },
        );
      });
    if (
      !catalogStateSchema.safeParse(
        await db
          .collection<NamedDocument>("catalogState")
          .findOne({ _id: "catalog" }),
      ).success
    )
      throw new MigrationError("INVALID_CATALOG_STATE");
    for (const [collection, definitions] of Object.entries(indexes)) {
      const actual = await existingIndexes(db, collection);
      if (
        definitions.some(
          (definition) =>
            !actual.some(
              (item) =>
                item.name === definition.name && compatible(item, definition),
            ),
        )
      )
        throw new MigrationError("INDEX_VERIFICATION_FAILED");
    }
    await renew();
    if (started) {
      await fenced(async (session) => {
        const result = await migrations.updateOne(
          { _id: migrationId, ownerToken, checksum, state: "running" },
          {
            $set: {
              state: "applied",
              leaseUntil: null,
              completedAt: new Date(),
              updatedAt: new Date(),
            },
          },
          { session },
        );
        if (result.matchedCount !== 1)
          throw new MigrationError("MIGRATION_LEASE_LOST");
      });
    }
  } catch (error) {
    if (started)
      await fenced(async (session) => {
        await migrations.updateOne(
          { _id: migrationId, ownerToken, state: "running" },
          {
            $set: {
              state: "failed",
              leaseUntil: null,
              errorCode:
                error instanceof MigrationError
                  ? error.code
                  : "MIGRATION_FAILED",
              updatedAt: new Date(),
            },
          },
          { session },
        );
      });
    throw error;
  } finally {
    await migrations.updateOne(
      { _id: lockId, ownerToken },
      { $set: { leaseUntil: null, updatedAt: new Date() } },
    );
  }
}
