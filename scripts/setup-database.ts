import { MongoClient } from "mongodb";
import { provisionIndexes } from "./database-indexes";

const client = new MongoClient(process.env.MONGODB_URI!, {
  maxPoolSize: 1,
  serverSelectionTimeoutMS: 10000,
});
async function main() {
  try {
    if (!process.env.MONGODB_URI || !process.env.MONGODB_DB_NAME)
      throw new Error("Missing configuration");
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME);
    await provisionIndexes(db);
    console.log(
      "Authentication foundation indexes verified. No records deleted.",
    );
  } catch {
    console.error(
      "Database setup failed. Check configuration, access and existing index compatibility.",
    );
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}
void main();
