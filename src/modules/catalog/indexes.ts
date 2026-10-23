import type { IndexDescription } from "mongodb";

export const catalogIndexes: Record<string, IndexDescription[]> = {
  contentItems: [
    { key: { slug: 1 }, name: "content_slug_unique", unique: true },
    {
      key: { seedKey: 1 },
      name: "content_seedKey_unique",
      unique: true,
      partialFilterExpression: { seedKey: { $type: "string" } },
    },
    { key: { status: 1, _id: 1 }, name: "content_status_id" },
    {
      key: { status: 1, subject: 1, topic: 1, difficulty: 1, _id: 1 },
      name: "content_classification",
    },
    {
      key: { status: 1, "companies.companyId": 1, _id: 1 },
      name: "content_company",
    },
    { key: { assetIds: 1 }, name: "content_assets" },
    {
      key: { title: "text", topic: "text", tags: "text" },
      name: "content_search",
      default_language: "english",
    },
  ],
  adminAudit: [
    {
      key: { entityType: 1, entityId: 1, createdAt: -1, _id: -1 },
      name: "audit_entity_history",
    },
    {
      key: { actorUserId: 1, createdAt: -1, _id: -1 },
      name: "audit_actor_history",
    },
  ],
};
