import type { Db, IndexDescription } from "mongodb";

export const identityIndexes: Record<string, IndexDescription[]> = {
  profiles: [
    { key: { userId: 1 }, unique: true, name: "profiles_userId_unique" },
  ],
  rateBuckets: [
    {
      key: { expiresAt: 1 },
      expireAfterSeconds: 0,
      name: "rateBuckets_expiry",
    },
  ],
  user: [{ key: { email: 1 }, unique: true, name: "email_1" }],
  session: [{ key: { token: 1 }, unique: true, name: "token_1" }],
  account: [
    {
      key: { providerId: 1, accountId: 1 },
      unique: true,
      name: "providerId_1_accountId_1",
    },
  ],
};

export async function provisionIndexes(db: Db) {
  for (const [collection, indexes] of Object.entries(identityIndexes))
    for (const { key, ...options } of indexes)
      await db.collection(collection).createIndex(key, options);
}
