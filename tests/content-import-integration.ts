import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import batch from "../docs/content/company-batch.v1.json";
import { migrateDatabase } from "../scripts/database-migrations";
import { databaseTarget } from "../scripts/database-target";
import { importDrafts } from "../src/modules/catalog/import-drafts";
import { catalogModels } from "../src/modules/catalog/model";
import { profileModel } from "../src/modules/identity/model";

let stage = "connect";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI required.");
  const database = "prep_pilot_import_test_" + randomBytes(6).toString("hex");
  const connection = await mongoose
    .createConnection(uri, {
      dbName: database,
      autoIndex: false,
      autoCreate: false,
      maxPoolSize: 2,
      serverSelectionTimeoutMS: 10000,
    })
    .asPromise();
  try {
    stage = "migrations";
    await migrateDatabase(connection.db!);
    const id = new ObjectId();
    const operator = {
      userId: id.toHexString(),
      email: "import-fixture@example.invalid",
    };
    await connection.db!.collection("user").insertOne({
      _id: id,
      email: operator.email,
      emailVerified: true,
      name: "Disposable operator",
    });
    const profile = profileModel(connection);
    await profile.create({ userId: operator.userId, role: "admin" });
    const model = catalogModels(connection);
    const baseline = (await model.state.findById("catalog").lean())!.revision;
    const counts = async () => [
      await model.content.countDocuments(),
      await connection.db!.collection("adminAudit").countDocuments(),
      (await model.state.findById("catalog").lean())!.revision,
      (await profile.findOne({ userId: operator.userId }).lean())!
        .stateRevision,
    ];
    const before = await counts();
    stage = "dry-run";
    const dry = await importDrafts(connection, operator, batch);
    assert.equal(dry.filter((item) => item.outcome === "new").length, 20);
    assert.equal(
      dry.filter((item) => item.outcome === "provenance_review_required")
        .length,
      19,
    );
    assert.deepEqual(await counts(), before);
    await assert.rejects(
      importDrafts(connection, operator, batch, { apply: true }),
    );
    const options = {
      apply: true,
      associationReviewedAt: "2026-01-01T00:00:00.000Z",
    };
    stage = "apply";
    const imported = await importDrafts(connection, operator, batch, options);
    assert.equal(
      imported.filter((item) => item.outcome === "created_draft").length,
      39,
      JSON.stringify(imported),
    );
    assert.deepEqual(await counts(), [39, 39, baseline + 39, 39]);
    assert.equal(
      await model.content.countDocuments({
        status: "draft",
        revision: 1,
        reviewedAt: null,
        createdBy: operator.userId,
      }),
      39,
    );
    assert.equal(
      await model.content.countDocuments({
        "companies.association": "student_reported",
      }),
      19,
    );
    const after = await counts();
    stage = "retry";
    const retry = await importDrafts(connection, operator, batch, options);
    assert.ok(retry.every((item) => item.outcome === "identical"));
    assert.deepEqual(await counts(), after);
    const conflict = structuredClone(batch);
    stage = "conflict";
    conflict.candidates[0]!.content.title += " changed";
    const conflicts = await importDrafts(
      connection,
      operator,
      conflict,
      options,
    );
    assert.equal(conflicts[0]!.outcome, "conflict");
    assert.deepEqual(await counts(), after);
    const newItem = structuredClone(batch);
    newItem.candidates = newItem.candidates.slice(0, 1);
    newItem.candidates[0]!.content.slug += "-rollback";
    newItem.candidates[0]!.content.title += " rollback";
    newItem.candidates[0]!.content.prompt += " New distinct fixture.";
    const failed = await importDrafts(connection, operator, newItem, {
      ...options,
      audit: async () => {
        throw new Error("Injected audit failure");
      },
    });
    assert.match(failed[0]!.outcome, /^failed_/);
    assert.deepEqual(await counts(), after);
    stage = "concurrent";
    const concurrent = await Promise.all([
      importDrafts(connection, operator, newItem, options),
      importDrafts(connection, operator, newItem, options),
    ]);
    assert.equal(
      concurrent.flat().filter((item) => item.outcome === "created_draft")
        .length,
      1,
    );
    assert.equal(
      concurrent.flat().filter((item) => item.outcome === "identical").length,
      1,
    );
    assert.deepEqual(await counts(), [40, 40, baseline + 40, 40]);
    for (const role of ["student", "admin", "owner"]) {
      stage = "authorization";
      await profile.updateOne(
        { userId: operator.userId },
        { $set: { role, lifecycle: "active" } },
      );
      if (role === "student")
        await assert.rejects(importDrafts(connection, operator, batch));
      else
        assert.equal(
          (await importDrafts(connection, operator, batch, options)).length,
          39,
        );
    }
    await profile.updateOne(
      { userId: operator.userId },
      { $set: { lifecycle: "deleting" } },
    );
    await assert.rejects(importDrafts(connection, operator, batch));
    await profile.updateOne(
      { userId: operator.userId },
      { $set: { lifecycle: "active" } },
    );
    await connection
      .db!.collection("user")
      .updateOne({ _id: id }, { $set: { emailVerified: false } });
    await assert.rejects(importDrafts(connection, operator, batch));
    await connection
      .db!.collection("user")
      .updateOne({ _id: id }, { $set: { emailVerified: true } });
    await assert.rejects(
      importDrafts(
        connection,
        { ...operator, email: "wrong@example.invalid" },
        batch,
      ),
    );
    stage = "cli";
    const bundle =
      "const esbuild=require('esbuild');const Module=require('module');const path=require('path');process.argv.splice(1,0,'scripts/import-content.ts');const code=esbuild.buildSync({entryPoints:['scripts/import-content.ts'],bundle:true,packages:'external',platform:'node',format:'cjs',write:false}).outputFiles[0].text;const m=new Module(path.resolve('.import-cli-check.cjs'));m.filename=path.resolve('.import-cli-check.cjs');m.paths=module.paths;m._compile(code,m.filename);";
    const cliArgs = [
      "--conditions=react-server",
      "-e",
      bundle,
      "--",
      "--file",
      "docs/content/company-batch.v1.json",
      "--database",
      database,
      "--environment",
      "test",
      "--admin-user-id",
      operator.userId,
      "--admin-email",
      operator.email,
      "--association-reviewed-at",
      options.associationReviewedAt,
    ];
    const child = spawn(process.execPath, cliArgs, {
      env: {
        ...process.env,
        NODE_ENV: "development",
        MONGODB_DB_NAME: database,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    child.stdout.on("data", (chunk: Buffer) => {
      if (output.length < 20000) output += chunk.toString();
    });
    child.stderr.resume();
    const timer = setTimeout(() => child.kill(), 60000);
    const code = await new Promise<number | null>((resolve, reject) => {
      child.once("exit", resolve);
      child.once("error", reject);
    }).finally(() => clearTimeout(timer));
    assert.equal(code, 0);
    const result = JSON.parse(output) as {
      apply: boolean;
      report: { outcome: string }[];
    };
    assert.equal(result.apply, false);
    assert.ok(result.report.every((item) => item.outcome === "identical"));
    assert.throws(() => databaseTarget([], process.env));
    assert.throws(() =>
      databaseTarget(
        ["--database", "prep_pilot_dev", "--environment", "test"],
        { ...process.env, HOSTED_DATABASE_CONFIRMATION: "prep_pilot_dev" },
      ),
    );
    console.log(
      JSON.stringify({
        database,
        dryRun: { new: 20, provenance_review_required: 19, mutations: 0 },
        apply: { drafts: 39, audits: 39, catalogIncrements: 39 },
        retry: "39 identical, zero writes",
        conflict: "preserved",
        auditRollback: "passed",
        concurrent: "one create, one identical",
        authorization: "passed",
        cli: "dry-run default passed",
      }),
    );
  } finally {
    if (!/^prep_pilot_import_test_[a-f0-9]{12}$/.test(database))
      throw new Error("Unsafe cleanup target.");
    await connection.dropDatabase();
    await connection.close();
    console.log("Disposable database removed; shared database untouched.");
  }
}
main().catch((error: unknown) => {
  if (error instanceof assert.AssertionError) console.error(error.message);
  console.error("Stage: " + stage);
  console.error("Content-import integration failed; no credentials emitted.");
  process.exitCode = 1;
});
