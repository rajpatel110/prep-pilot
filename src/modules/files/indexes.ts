import type { IndexDescription } from "mongodb";
export const fileIndexes: Record<string, IndexDescription[]> = {
  fileAssets: [
    { key: { stagingKey: 1 }, name: "file_staging_unique", unique: true },
    {
      key: { finalKey: 1 },
      name: "file_final_unique",
      unique: true,
      partialFilterExpression: { finalKey: { $type: "string" } },
    },
    { key: { status: 1, createdAt: 1, _id: 1 }, name: "file_status_created" },
    { key: { status: 1, expiresAt: 1 }, name: "file_expiration" },
    { key: { createdAt: -1, _id: -1 }, name: "file_listing" },
  ],
  storageQuota: [],
};
