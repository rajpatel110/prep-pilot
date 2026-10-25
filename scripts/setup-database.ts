import { MongoClient } from "mongodb";
import { databaseTarget } from "./database-target";
import { migrateDatabase, MigrationError } from "./database-migrations";
async function main() {
  let client: MongoClient | undefined;
  try {
    const target = databaseTarget(process.argv.slice(2), process.env);
    client = new MongoClient(target.uri, {
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 10000,
    });
    await client.connect();
    await migrateDatabase(client.db(target.database));
    console.log(
      `Migrations 001–006 verified in explicitly selected ${target.environment} database ${target.database}. Records and singleton state preserved.`,
    );
  } catch (error) {
    console.error(
      error instanceof MigrationError
        ? `Database setup failed: ${error.code}. No records or indexes were deleted.`
        : "Database setup failed. Require MONGODB_URI, --database <name> and --environment development|test; check access and data/index compatibility. Deliberate hosted access also requires exact HOSTED_DATABASE_CONFIRMATION. No records or indexes were deleted.",
    );
    process.exitCode = 1;
  } finally {
    await client?.close();
  }
}
void main();
