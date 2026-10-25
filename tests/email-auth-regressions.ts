import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { MongoClient } from "mongodb";
import { provisionIndexes } from "../scripts/database-indexes";

async function main() {
  if (!process.env.MONGODB_URI)
    throw new Error("Test database configuration missing");
  const client = await new MongoClient(process.env.MONGODB_URI, {
    maxPoolSize: 2,
    serverSelectionTimeoutMS: 10000,
  }).connect();
  try {
    for (const mode of ["test", "live"]) {
      const database = `prep_pilot_step1_test_${randomBytes(6).toString("hex")}`;
      const db = client.db(database);
      try {
        await provisionIndexes(db);
        const child = spawn(
          process.execPath,
          [
            "--conditions=react-server",
            "--import",
            "tsx",
            "tests/permission-integration.ts",
          ],
          {
            env: {
              ...process.env,
              AUTH_ENABLED: "true",
              APP_URL: "http://127.0.0.1:3118",
              MONGODB_DB_NAME: database,
              EMAIL_MODE: mode,
              EMAIL_DELIVERY_MODE: "disabled",
              EMAIL_TEST_RECIPIENT: "",
              RESEND_API_KEY: "mock-only",
              BETTER_AUTH_SECRET: randomBytes(32).toString("hex"),
              CSRF_SECRET: randomBytes(32).toString("hex"),
              RATE_LIMIT_SECRET: randomBytes(32).toString("hex"),
            },
            stdio: "ignore",
          },
        );
        const timer = setTimeout(() => child.kill(), 120000);
        try {
          const code = await new Promise<number | null>((resolve, reject) => {
            child.once("exit", resolve);
            child.once("error", reject);
          });
          assert.equal(code, 0);
          console.log(
            `PASS existing direct authentication/permission regression in ${mode} mode.`,
          );
        } finally {
          clearTimeout(timer);
        }
      } finally {
        if (database.startsWith("prep_pilot_step1_test_"))
          await db.dropDatabase();
      }
    }
  } finally {
    await client.close();
  }
  console.log(
    "Disposable authentication databases removed; no production server/build used.",
  );
}
void main().catch(() => {
  console.error(
    "Email auth regression failed; no credentials or tokens printed.",
  );
  process.exitCode = 1;
});
