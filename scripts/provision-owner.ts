import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import { databaseTarget } from "./database-target";
import {
  previewOwner,
  provisionOwner,
} from "../src/modules/identity/provision-owner";
import { HttpError } from "../src/shared/server/http";

async function main() {
  let connection: mongoose.Connection | undefined;
  try {
    const args = process.argv.slice(2),
      userId = args.shift() ?? "";
    const mode = args.shift();
    if (mode !== "--preview" && mode !== "--apply")
      throw new Error("Choose preview or apply explicitly.");
    const flags = new Map<string, string>();
    for (let index = 0; index < args.length; index += 2) {
      const key = args[index]!,
        value = args[index + 1];
      if (
        ![
          "--email",
          "--expected-revision",
          "--database",
          "--environment",
        ].includes(key) ||
        !value ||
        value.startsWith("--") ||
        flags.has(key)
      )
        throw new Error("Invalid arguments.");
      flags.set(key, value);
    }
    const target = databaseTarget(
      [
        "--database",
        flags.get("--database") ?? "",
        "--environment",
        flags.get("--environment") ?? "",
      ],
      process.env,
    );
    connection = await mongoose
      .createConnection(target.uri, {
        dbName: target.database,
        autoIndex: false,
        autoCreate: false,
        maxPoolSize: 1,
        serverSelectionTimeoutMS: 10000,
      })
      .asPromise();
    const email = flags.get("--email") ?? "";
    if (mode === "--preview") {
      if (flags.has("--expected-revision"))
        throw new Error("Revision is only used with apply.");
      console.log(
        JSON.stringify(
          {
            database: target.database,
            environment: target.environment,
            account: await previewOwner(connection, userId, email),
            mutation: false,
          },
          null,
          2,
        ),
      );
    } else {
      const revision = flags.get("--expected-revision") ?? "";
      if (!/^(?:0|[1-9][0-9]*)$/.test(revision))
        throw new Error("An exact preview revision is required.");
      const result = await provisionOwner(
        connection,
        userId,
        email,
        Number(revision),
        randomUUID(),
      );
      console.log(
        result === "unchanged"
          ? "Selected owner unchanged; no duplicate audit event."
          : "Selected verified account provisioned as sole owner and audited atomically.",
      );
    }
  } catch (error) {
    console.error(
      error instanceof HttpError
        ? `${error.code}: ${error.message}`
        : "Owner provisioning failed. Use an exact existing user ID/email, explicit development/test database, --preview first, then --apply with --expected-revision. Require verification and migration 006. No partial promotion is committed.",
    );
    process.exitCode = 1;
  } finally {
    await connection?.close();
  }
}
void main();
