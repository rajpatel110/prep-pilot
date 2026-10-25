import assert from "node:assert/strict";
import { test } from "node:test";
import { requireDatabaseBoundary } from "../src/shared/server/database-boundary";
import { databaseTarget } from "../scripts/database-target";
import { getServerEnv } from "../src/shared/server/env";

const enabled = {
  AUTH_ENABLED: "true",
  MONGODB_URI: "mongodb://localhost:27017",
  BETTER_AUTH_SECRET: "a".repeat(40),
  CSRF_SECRET: "b".repeat(40),
  RATE_LIMIT_SECRET: "c".repeat(40),
};

test("the approved temporary shared runtime works locally including next start", () => {
  for (const NODE_ENV of ["development", "production"])
    assert.doesNotThrow(() =>
      getServerEnv({ ...enabled, NODE_ENV, MONGODB_DB_NAME: "prep_pilot_dev" }),
    );
  assert.equal(
    getServerEnv({ ...enabled, MONGODB_DB_NAME: "prep_pilot_local" })
      .MONGODB_DB_NAME,
    "prep_pilot_local",
  );
});

test("hosted Production and deliberate operator access remain supported", () => {
  assert.doesNotThrow(() =>
    getServerEnv({
      ...enabled,
      MONGODB_DB_NAME: "prep_pilot_dev",
      VERCEL: "1",
      VERCEL_ENV: "production",
    }),
  );
  assert.doesNotThrow(() =>
    getServerEnv({
      ...enabled,
      MONGODB_DB_NAME: "prep_pilot_dev",
      HOSTED_DATABASE_CONFIRMATION: "prep_pilot_dev",
    }),
  );
  assert.throws(() =>
    getServerEnv({
      ...enabled,
      MONGODB_DB_NAME: "prep_pilot_dev",
      HOSTED_DATABASE_CONFIRMATION: "true",
    }),
  );
});

test("Preview cannot inherit hosted or local targets, even with operator acknowledgment", () => {
  for (const database of ["prep_pilot_dev", "prep_pilot_local"])
    assert.throws(() =>
      requireDatabaseBoundary(database, {
        VERCEL: "1",
        VERCEL_ENV: "preview",
        HOSTED_DATABASE_CONFIRMATION: "prep_pilot_dev",
      }),
    );
  assert.doesNotThrow(() =>
    requireDatabaseBoundary("prep_pilot_preview", { VERCEL_ENV: "preview" }),
  );
  assert.equal(getServerEnv({ VERCEL_ENV: "preview" }).AUTH_ENABLED, false);
});

test("operator tools require explicit hosted confirmation and keep target selection strict", () => {
  const args = ["--database", "prep_pilot_dev", "--environment", "development"];
  assert.throws(() => databaseTarget(args, enabled));
  assert.equal(
    databaseTarget(args, {
      ...enabled,
      HOSTED_DATABASE_CONFIRMATION: "prep_pilot_dev",
    }).database,
    "prep_pilot_dev",
  );
  assert.throws(() =>
    databaseTarget(args, {
      ...enabled,
      NODE_ENV: "production",
      HOSTED_DATABASE_CONFIRMATION: "prep_pilot_dev",
    }),
  );
  assert.throws(() =>
    databaseTarget(["--database", "prep_pilot_dev", "--environment", "test"], {
      ...enabled,
      HOSTED_DATABASE_CONFIRMATION: "prep_pilot_dev",
    }),
  );
  assert.equal(
    databaseTarget(
      [
        "--database",
        "prep_pilot_auth_test_123456789abc",
        "--environment",
        "test",
      ],
      enabled,
    ).database,
    "prep_pilot_auth_test_123456789abc",
  );
});
