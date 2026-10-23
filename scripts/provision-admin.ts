import { MongoClient } from "mongodb";
import { randomUUID } from "node:crypto";

const userId = process.argv[2] ?? "";
if (!userId)
  throw new Error("Usage: npm run admin:provision -- <existing-auth-user-id>");
const client = new MongoClient(process.env.MONGODB_URI!, {
  maxPoolSize: 1,
  serverSelectionTimeoutMS: 10000,
});
async function main() {
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME);
    const user = await db.collection("user").findOne({
      $or: [
        { id: userId },
        ...(/^[a-f0-9]{24}$/.test(userId)
          ? [{ _id: new (await import("mongodb")).ObjectId(userId) }]
          : []),
      ],
    });
    if (!user || (process.env.EMAIL_MODE === "live" && !user.emailVerified))
      throw new Error("No eligible existing identity");
    await client.withSession(async (session) =>
      session.withTransaction(async () => {
        const now = new Date();
        const result = await db.collection("profiles").updateOne(
          { userId, lifecycle: "active" },
          {
            $set: { role: "admin", updatedAt: now },
            $inc: { stateRevision: 1 },
          },
          { session },
        );
        if (result.matchedCount !== 1)
          throw new Error("Sign in once to create an active profile first");
        await db.collection("adminAudit").insertOne(
          {
            actorUserId: "operator",
            action: "provision_admin",
            entityType: "profile",
            entityId: userId,
            changedFields: ["role"],
            requestId: randomUUID(),
            createdAt: now,
            updatedAt: now,
            schemaVersion: 1,
          },
          { session },
        );
      }),
    );
    console.log(
      "Existing profile promoted and audited. No public role mutation is exposed.",
    );
  } catch {
    console.error(
      "Admin provisioning failed. Confirm the exact existing user ID and active profile; live mode requires verification.",
    );
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}
void main();
