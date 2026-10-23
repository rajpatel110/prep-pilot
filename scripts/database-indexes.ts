import type { Db } from "mongodb";

export async function provisionIndexes(db: Db) {
  await db
    .collection("profiles")
    .createIndex(
      { userId: 1 },
      { unique: true, name: "profiles_userId_unique" },
    );
  await db
    .collection("rateBuckets")
    .createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0, name: "rateBuckets_expiry" },
    );
  await db.collection("user").createIndex({ email: 1 }, { unique: true });
  await db.collection("session").createIndex({ token: 1 }, { unique: true });
  await db
    .collection("account")
    .createIndex({ providerId: 1, accountId: 1 }, { unique: true });
}
