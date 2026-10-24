import { MongoClient } from "mongodb";
import { databaseTarget } from "./database-target";
import { assessCoverage } from "../src/modules/catalog/coverage";

async function main() {
  let client: MongoClient | undefined;
  try {
    const target = databaseTarget(process.argv.slice(2), process.env);
    if (target.database !== process.env.MONGODB_DB_NAME)
      throw new Error(
        "Select the configured authorized development/test database explicitly.",
      );
    client = new MongoClient(target.uri, {
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 10000,
    });
    await client.connect();
    const session = client.startSession();
    try {
      const report = await session.withTransaction(
        async () => {
          const database = client!.db(target.database);
          const state = await database
            .collection("catalogState")
            .findOne({}, { session });
          const records = await database
            .collection("contentItems")
            .find({}, { session, maxTimeMS: 10000 })
            .sort({ _id: 1 })
            .limit(2001)
            .toArray();
          if (records.length > 2000)
            throw new Error(
              "Coverage scope exceeds 2000 records; no partial report produced.",
            );
          return {
            database: target.database,
            environment: target.environment,
            asOf: new Date().toISOString(),
            catalogRevision: state?.revision ?? null,
            ...assessCoverage(records),
          };
        },
        { readConcern: { level: "snapshot" } },
      );
      console.log(JSON.stringify(report, null, 2));
    } finally {
      await session.endSession();
    }
  } catch {
    console.error(
      "Coverage report unavailable. Require the explicitly authorized configured development/test database, valid configuration and read access. No records changed; raw connection errors are withheld.",
    );
    process.exitCode = 1;
  } finally {
    await client?.close();
  }
}
void main();
