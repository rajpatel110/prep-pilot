import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import { databaseTarget } from "./database-target";
import { provisionAdministrator } from "../src/modules/identity/provision-admin";

async function main() {
  let connection: mongoose.Connection | undefined;
  try {
    const userId = process.argv[2] ?? "";
    if (!userId || userId.startsWith("--"))
      throw new Error("An existing identity is required.");
    const target = databaseTarget(process.argv.slice(3), process.env);
    if (process.env.EMAIL_MODE !== "test" && process.env.EMAIL_MODE !== "live")
      throw new Error("EMAIL_MODE is required.");
    connection = await mongoose
      .createConnection(target.uri, {
        dbName: target.database,
        autoIndex: false,
        autoCreate: false,
        maxPoolSize: 1,
        serverSelectionTimeoutMS: 10000,
      })
      .asPromise();
    const result = await provisionAdministrator(
      connection,
      userId,
      process.env.EMAIL_MODE,
      randomUUID(),
    );
    console.log(
      result === "unchanged"
        ? "Existing administrator unchanged; no duplicate audit event."
        : "Existing profile promoted and audited. No public role mutation is exposed.",
    );
  } catch {
    console.error(
      "Admin provisioning failed. Require an exact existing user ID, MONGODB_URI, EMAIL_MODE, --database <name> and --environment development|test. An active profile is required; live mode requires verification. No partial promotion is committed.",
    );
    process.exitCode = 1;
  } finally {
    await connection?.close();
  }
}
void main();
