import { test } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import {
  draftInputSchema,
  storedContentSchema,
  catalogStateSchema,
} from "../src/modules/catalog/schemas";
import { catalogModels } from "../src/modules/catalog/model";
import { auditInputSchema } from "../src/modules/administration/audit";
import { randomUUID } from "node:crypto";

const draft = {
  slug: "array-basics",
  title: "Array basics",
  subject: "dsa",
  topic: "arrays",
  type: "question",
  difficulty: "easy",
  estimatedMinutes: 15,
  source: "Original exercise",
  attribution: "",
};

test("strict draft input permits incomplete bodies and defaults but rejects privileged, unsupported and unsafe fields", () => {
  const result = draftInputSchema.parse(draft);
  assert.deepEqual(result.tags, []);
  assert.deepEqual(result.companies, []);
  assert.deepEqual(result.assetIds, []);
  assert.equal(result.reviewedAt, null);
  for (const field of [
    "status",
    "revision",
    "seedKey",
    "createdBy",
    "updatedBy",
    "createdAt",
    "updatedAt",
    "role",
    "ownerId",
  ])
    assert.equal(
      draftInputSchema.safeParse({ ...draft, [field]: "forged" }).success,
      false,
      field,
    );
  for (const invalid of [
    { slug: "Uppercase" },
    { slug: "not a slug" },
    { title: "" },
    { title: "   " },
    { title: "x".repeat(161) },
    { subject: "unknown" },
    { topic: "unknown" },
    { subject: "cs", topic: "arrays" },
    { estimatedMinutes: 14 },
    { estimatedMinutes: 61 },
    { estimatedMinutes: 15.5 },
    { estimatedMinutes: "15" },
    { tags: ["same", "same"] },
    { tags: Array.from({ length: 21 }, (_, index) => `tag${index}`) },
    { tags: ["x".repeat(41)] },
    { source: "" },
    { source: "   " },
    { attribution: "x".repeat(2001) },
    { assetIds: Array(6).fill("507f1f77bcf86cd799439011") },
    { assetIds: ["invalid"] },
    { reviewedAt: new Date(Date.now() + 60000).toISOString() },
    { reviewedAt: "2026-02-30T00:00:00Z" },
    { prompt: "<script>alert(1)</script>" },
    { prompt: "[bad](javascript:alert(1))" },
    { prompt: "[bad](java&#x73;cript:alert(1))" },
    { body: "<img src=x onerror=alert(1)>" },
    { explanation: "x".repeat(12001) },
    { externalUrl: "http://example.com" },
    { externalUrl: "https://user:password@example.com" },
  ])
    assert.equal(
      draftInputSchema.safeParse({ ...draft, ...invalid }).success,
      false,
      JSON.stringify(Object.keys(invalid)),
    );
  assert.equal(
    draftInputSchema.safeParse({
      ...draft,
      prompt: "**Practice** arrays, then explain your approach.",
      externalUrl: "https://example.com/practice",
    }).success,
    true,
  );
});

test("company associations have strict provenance, unique supported IDs and real review dates", () => {
  const company = {
    companyId: "cognizant",
    association: "student_reported",
    source: "Reviewed student notes",
    reviewedAt: "2026-01-01T00:00:00Z",
  };
  assert.equal(
    draftInputSchema.safeParse({ ...draft, companies: [company] }).success,
    true,
  );
  for (const companies of [
    [company, company],
    [{ ...company, companyId: "other" }],
    [{ ...company, association: "official" }],
    [{ ...company, source: "" }],
    [{ ...company, reviewedAt: "not-a-date" }],
    [{ ...company, ownerId: "forged" }],
  ])
    assert.equal(
      draftInputSchema.safeParse({ ...draft, companies }).success,
      false,
    );
});

test("Mongoose enforces complete document validation, revisions, attachment limits and strict collections without connecting", async () => {
  const connection = mongoose.createConnection();
  const models = catalogModels(connection);
  const input = {
    ...draftInputSchema.parse(draft),
    createdBy: "trusted-admin",
    updatedBy: "trusted-admin",
  };
  assert.equal(models.content.collection.name, "contentItems");
  assert.equal(models.state.collection.name, "catalogState");
  assert.equal(models.content.schema.options.autoIndex, false);
  assert.equal(models.content.schema.options.versionKey, false);
  const document = new models.content(input);
  await document.validate();
  assert.equal(document.revision, 1);
  assert.equal(document.status, "draft");
  for (const invalid of [
    { revision: 0 },
    { revision: 1.5 },
    { revision: Number.MAX_SAFE_INTEGER + 1 },
    {
      assetIds: Array.from({ length: 6 }, () => new mongoose.Types.ObjectId()),
    },
    { topic: "unknown" },
    { prompt: "<script>" },
    { tags: ["duplicate", "duplicate"] },
    { reviewedAt: new Date(Date.now() + 60000) },
  ])
    await assert.rejects(
      new models.content({ ...input, ...invalid }).validate(),
    );
  assert.throws(() => new models.content({ ...input, unknown: true }));
  await new models.state({ _id: "catalog" }).validate();
  for (const invalid of [
    { _id: "other" },
    { revision: -1 },
    { commitSerial: 0.5 },
    { revision: Number.MAX_SAFE_INTEGER + 1 },
  ])
    await assert.rejects(
      new models.state({ _id: "catalog", ...invalid }).validate(),
    );
  assert.equal(
    storedContentSchema.safeParse({
      ...input,
      _id: new mongoose.Types.ObjectId().toString(),
      status: "draft",
      revision: 1,
      publishedAt: null,
      archivedAt: null,
      schemaVersion: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).success,
    true,
  );
  assert.equal(
    catalogStateSchema.safeParse({
      _id: "catalog",
      revision: -1,
      commitSerial: 0,
      schemaVersion: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).success,
    false,
  );
  await connection.close();
});

test("audit input stores bounded safe metadata and explicit revisions, never arbitrary payloads", () => {
  const input = {
    actorUserId: "operator",
    action: "provision_admin",
    entityType: "profile",
    entityId: "user",
    priorRevision: 0,
    newRevision: 1,
    changedFields: ["role"],
    requestId: randomUUID(),
  };
  assert.equal(auditInputSchema.safeParse(input).success, true);
  for (const invalid of [
    { newRevision: 0.5 },
    { priorRevision: -1 },
    { changedFields: ["$set"] },
    { changedFields: Array(41).fill("role") },
    { reason: "x".repeat(501) },
    { password: "never allowed" },
  ])
    assert.equal(
      auditInputSchema.safeParse({ ...input, ...invalid }).success,
      false,
    );
});
