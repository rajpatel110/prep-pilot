import { readFile } from "node:fs/promises";
import mongoose from "mongoose";
import { z } from "zod";
import { databaseTarget } from "./database-target";
import { prepareImport } from "../src/modules/catalog/import-schema";
import { importDrafts } from "../src/modules/catalog/import-drafts";

async function main() {
  let connection: mongoose.Connection | undefined;
  try {
    const args = process.argv.slice(2);
    const options = new Map<string, string>();
    let apply = false;
    const allowed = new Set([
      "--file",
      "--database",
      "--environment",
      "--admin-user-id",
      "--admin-email",
      "--association-reviewed-at",
    ]);
    for (let index = 0; index < args.length; index++) {
      const key = args[index]!;
      if (key === "--apply" && !apply) {
        apply = true;
        continue;
      }
      const value = args[++index];
      if (
        !allowed.has(key) ||
        options.has(key) ||
        !value ||
        value.startsWith("--")
      )
        throw new Error("Invalid options.");
      options.set(key, value);
    }
    const target = databaseTarget(
      [
        "--database",
        options.get("--database") ?? "",
        "--environment",
        options.get("--environment") ?? "",
      ],
      process.env,
    );
    const userId = z
      .string()
      .min(1)
      .max(200)
      .parse(options.get("--admin-user-id"));
    const email = z.email().parse(options.get("--admin-email"));
    const file = z.string().min(1).parse(options.get("--file"));
    const input: unknown = JSON.parse(await readFile(file, "utf8"));
    const reviewedAt = options.get("--association-reviewed-at");
    prepareImport(input, reviewedAt);
    connection = await mongoose
      .createConnection(target.uri, {
        dbName: target.database,
        autoIndex: false,
        autoCreate: false,
        maxPoolSize: 2,
        serverSelectionTimeoutMS: 10000,
      })
      .asPromise();
    const report = await importDrafts(connection, { userId, email }, input, {
      apply,
      ...(reviewedAt ? { associationReviewedAt: reviewedAt } : {}),
    });
    console.log(
      JSON.stringify(
        {
          database: target.database,
          environment: target.environment,
          apply,
          report,
        },
        null,
        2,
      ),
    );
    if (
      report.some(
        (item) => !["new", "created_draft", "identical"].includes(item.outcome),
      )
    )
      process.exitCode = 2;
  } catch {
    console.error(
      "Import stopped. Check strict batch fields, explicit target/administrator, genuine provenance review time, configuration, migrations and connectivity. No existing records are overwritten; earlier successful items may remain drafts. Rerun dry-run to reconcile.",
    );
    process.exitCode = 1;
  } finally {
    await connection?.close();
  }
}
void main();
