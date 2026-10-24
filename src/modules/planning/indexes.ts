import type { IndexDescription } from "mongodb";
export const planningIndexes: Record<string, IndexDescription[]> = {
  plans: [
    {
      key: { userId: 1, version: -1 },
      name: "plans_user_version_unique",
      unique: true,
    },
    { key: { sourcePreviewId: 1 }, name: "plans_preview_unique", unique: true },
  ],
  planPreviews: [
    {
      key: { userId: 1, createdAt: -1, _id: -1 },
      name: "previews_user_recent",
    },
    { key: { purgeAt: 1 }, name: "previews_purge_ttl", expireAfterSeconds: 0 },
  ],
};
