import { test } from "node:test";
import assert from "node:assert/strict";
import {
  draftPatchSchema,
  draftInputSchema,
  storedContentSchema,
} from "../src/modules/catalog/schemas";
import { parseCatalogInput } from "../src/modules/catalog/validation";
import { adminContentDto } from "../src/modules/catalog/dto";
import { catalogMutationError } from "../src/modules/catalog/errors";
import { HttpError, failure, json } from "../src/shared/server/http";
import { randomUUID } from "node:crypto";

test("draft patches require revisions without injecting create defaults or accepting privileged fields", () => {
  assert.deepEqual(
    draftPatchSchema.parse({ expectedRevision: 2, title: "Updated" }),
    { expectedRevision: 2, title: "Updated" },
  );
  assert.deepEqual(
    draftPatchSchema.parse({
      expectedRevision: 2,
      tags: [],
      reviewedAt: null,
      body: null,
    }),
    { expectedRevision: 2, tags: [], reviewedAt: null, body: null },
  );
  for (const invalid of [
    { title: "No revision" },
    { expectedRevision: 0 },
    { expectedRevision: 1.5 },
    { expectedRevision: Number.MAX_SAFE_INTEGER + 1 },
    { expectedRevision: "1" },
    { expectedRevision: 1, title: null },
    { expectedRevision: 1, tags: null },
    { expectedRevision: 1, assetIds: ["invalid"] },
  ])
    assert.equal(draftPatchSchema.safeParse(invalid).success, false);
  for (const field of [
    "role",
    "ownerId",
    "status",
    "revision",
    "seedKey",
    "createdBy",
    "updatedBy",
    "createdAt",
    "updatedAt",
    "publishedAt",
    "archivedAt",
    "actorUserId",
    "changedFields",
    "requestId",
    "$set",
    "__proto__",
  ])
    assert.equal(
      draftPatchSchema.safeParse({ expectedRevision: 1, [field]: "forged" })
        .success,
      false,
      field,
    );
});

test("field validation never echoes untrusted values or unknown field names", async () => {
  let caught: unknown;
  try {
    parseCatalogInput(draftPatchSchema, {
      expectedRevision: 0,
      externalUrl: "javascript:secret-value",
      "secret-field-name": "private-value",
    });
  } catch (error) {
    caught = error;
  }
  assert.ok(caught instanceof HttpError);
  assert.equal(caught.code, "VALIDATION_ERROR");
  const body = await failure(caught).text();
  for (const value of ["secret-value", "secret-field-name", "private-value"])
    assert.ok(!body.includes(value));
  assert.ok(caught.fields?.expectedRevision?.length);
  assert.ok(caught.fields?.externalUrl?.length);
  assert.ok(caught.fields?._form?.length);
});

test("admin DTO exposes only the documented fields, nullable text and ISO dates", () => {
  const now = new Date();
  const values = draftInputSchema.parse({
    slug: "arrays",
    title: "Arrays",
    subject: "dsa",
    topic: "arrays",
    type: "question",
    difficulty: "easy",
    estimatedMinutes: 15,
    source: "Original",
    attribution: "",
  });
  const stored = storedContentSchema.parse({
    ...values,
    _id: "507f1f77bcf86cd799439011",
    seedKey: "private-seed-key",
    status: "draft",
    revision: 1,
    createdBy: "private-owner",
    updatedBy: "private-owner",
    publishedAt: null,
    archivedAt: null,
    schemaVersion: 1,
    createdAt: now,
    updatedAt: now,
  });
  const dto = adminContentDto(stored);
  assert.equal(dto.id, stored._id);
  assert.equal(dto.createdAt, now.toISOString());
  assert.equal(dto.prompt, null);
  assert.equal(dto.body, null);
  assert.equal(dto.explanation, null);
  assert.equal(dto.externalUrl, null);
  assert.deepEqual(dto.assetIds, []);
  assert.deepEqual(dto.attachments, []);
  assert.equal(dto.attachmentCount, 0);
  for (const key of [
    "_id",
    "__v",
    "schemaVersion",
    "seedKey",
    "createdBy",
    "updatedBy",
    "availability",
  ])
    assert.ok(!(key in dto));
});

test("catalog error mapping distinguishes slug uniqueness, aborted conflicts, uncertain commits and unexpected errors", () => {
  assert.equal(
    catalogMutationError({ code: 11000, keyPattern: { slug: 1 } }).code,
    "SLUG_TAKEN",
  );
  assert.equal(
    catalogMutationError({ code: 11000, keyPattern: { _id: 1 } }).code,
    "INTERNAL_ERROR",
  );
  assert.equal(catalogMutationError({ code: 112 }).code, "CONTENT_CONFLICT");
  assert.equal(
    catalogMutationError({
      hasErrorLabel: (label: string) =>
        label === "UnknownTransactionCommitResult",
      code: 112,
    }).code,
    "DEPENDENCY_UNAVAILABLE",
  );
  assert.equal(
    catalogMutationError({ name: "MongoOperationTimeoutError" }).status,
    503,
  );
  const expected = new HttpError(409, "INVALID_CONTENT_STATE", "Drafts only.");
  assert.equal(catalogMutationError(expected), expected);
  assert.equal(
    catalogMutationError(new Error("private connection details")).status,
    500,
  );
  assert.ok(
    !catalogMutationError(
      new Error("private connection details"),
    ).message.includes("private"),
  );
});

test("mutation audit and response IDs can share the server-generated request ID without changing existing envelopes", async () => {
  const requestId = randomUUID();
  const success = json({ id: "content" }, 201, {
    requestId,
    location: "/api/v1/admin/content/content",
  });
  assert.equal(success.headers.get("x-request-id"), requestId);
  assert.equal(
    success.headers.get("location"),
    "/api/v1/admin/content/content",
  );
  assert.deepEqual(await success.json(), { data: { id: "content" } });
  const error = failure(
    new HttpError(404, "RESOURCE_NOT_FOUND", "Missing."),
    requestId,
  );
  assert.equal((await error.json()).requestId, requestId);
  assert.equal(error.headers.get("x-request-id"), requestId);
});
