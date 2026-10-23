import { test } from "node:test";
import assert from "node:assert/strict";
import { databaseTarget } from "../scripts/database-target";

test("database tools require an explicit non-production target and never infer one from the URI or environment name", () => {
  const env = {
    MONGODB_URI: "mongodb://localhost/ignored_default",
    MONGODB_DB_NAME: "do_not_guess",
  };
  const args = ["--database", "prep_pilot_test", "--environment", "test"];
  assert.equal(databaseTarget(args, env).database, "prep_pilot_test");
  assert.throws(() => databaseTarget(args, {}));
  assert.throws(() => databaseTarget(args, { ...env, NODE_ENV: "production" }));
  for (const invalid of [
    [],
    ["--environment", "test"],
    ["--database", "prep_pilot_test"],
    ["--database", "admin", "--environment", "test"],
    ["--database", "prep_pilot_test", "--environment", "production"],
    [...args, "--database", "other"],
    [...args, "--drop", "true"],
    ["--database", "unsafe.name", "--environment", "test"],
  ])
    assert.throws(() => databaseTarget(invalid, env));
});
