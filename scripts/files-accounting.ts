import { MongoClient } from "mongodb";
import { databaseTarget } from "./database-target";
import { fileRecord, quotaRecord } from "../src/modules/files/schemas";
async function main() {
  const target = databaseTarget(process.argv.slice(2), process.env);
  const client = new MongoClient(target.uri, {
    maxPoolSize: 1,
    serverSelectionTimeoutMS: 10000,
  });
  try {
    await client.connect();
    const db = client.db(target.database);
    const total = {
      readyBytes: 0,
      readyCount: 0,
      reservedBytes: 0,
      reservedCount: 0,
    };
    for await (const record of db.collection("fileAssets").find({})) {
      const asset = fileRecord.parse({ ...record, _id: String(record._id) });
      if (asset.reservationState === "committed") {
        total.readyBytes += asset.actualBytes!;
        total.readyCount++;
      }
      if (asset.reservationState === "reserved") {
        total.reservedBytes += asset.reservationBytes;
        total.reservedCount++;
      }
    }
    const quota = quotaRecord.parse(
      await db
        .collection<{ _id: string }>("storageQuota")
        .findOne({ _id: "r2" }),
    );
    const matches = Object.entries(total).every(
      ([key, value]) => quota[key as keyof typeof total] === value,
    );
    console.log(
      JSON.stringify({
        database: target.database,
        environment: target.environment,
        expected: total,
        matches,
        readOnly: true,
      }),
    );
    if (!matches) process.exitCode = 1;
  } finally {
    await client.close();
  }
}
void main().catch(() => {
  console.error(
    "Accounting inspection failed. Check explicit development/test target, configuration and schema. No records were changed.",
  );
  process.exitCode = 1;
});
