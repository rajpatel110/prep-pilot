import assert from "node:assert/strict";
import { test } from "node:test";
import { spawnSync } from "node:child_process";
import {
  publicationFields,
  lifecycleSchema,
  archiveSchema,
} from "../src/modules/catalog/publication";
import {
  editorValues,
  editorPayload,
  editorPatch,
  rebaseEditor,
} from "../src/modules/catalog/editor-values";

test("publication requires usable learning content, review and ready attachments", () => {
  const base = { type: "question", reviewedAt: null, assetIds: [] };
  assert.deepEqual(Object.keys(publicationFields(base)).sort(), [
    "prompt",
    "reviewedAt",
  ]);
  assert.deepEqual(
    publicationFields({
      ...base,
      reviewedAt: new Date("2026-01-01"),
      prompt: "Valid question",
    }),
    {},
  );
  assert.ok(
    publicationFields({ ...base, reviewedAt: new Date(), prompt: " " }).prompt,
  );
  assert.ok(
    publicationFields({ ...base, type: "resource", reviewedAt: new Date() })
      .body,
  );
  assert.deepEqual(
    publicationFields({
      ...base,
      type: "resource",
      reviewedAt: new Date(),
      assetIds: ["507f1f77bcf86cd799439011"],
      readyAssets: 1,
    }),
    {},
  );
  assert.ok(
    publicationFields({
      ...base,
      type: "resource",
      reviewedAt: new Date(),
      assetIds: ["507f1f77bcf86cd799439011"],
      readyAssets: 0,
    }).assetIds,
  );
  assert.ok(
    publicationFields({
      ...base,
      reviewedAt: new Date(),
      assetIds: ["507f1f77bcf86cd799439011"],
      readyAssets: 1,
    }).prompt,
  );
  assert.deepEqual(
    publicationFields({
      ...base,
      type: "resource",
      reviewedAt: new Date(),
      externalUrl: "https://example.com",
    }),
    {},
  );
  assert.equal(
    lifecycleSchema.safeParse({ expectedRevision: 1, status: "published" })
      .success,
    false,
  );
  assert.equal(
    archiveSchema.safeParse({ expectedRevision: 1, reason: " " }).success,
    false,
  );
});
test("editor patches omit unchanged fields, clear optional values and replace arrays; explicit rebase retains remote unrelated edits", () => {
  const base = editorValues(null);
  const changed = {
    ...base,
    title: "Local title",
    tags: "arrays, hashing",
    prompt: "Question",
  };
  assert.deepEqual(editorPatch(base, base, 4), { expectedRevision: 4 });
  assert.deepEqual(editorPatch(changed, base, 4), {
    expectedRevision: 4,
    title: "Local title",
    tags: ["arrays", "hashing"],
    prompt: "Question",
  });
  assert.deepEqual(
    editorPatch({ ...changed, prompt: "", tags: "" }, changed, 4),
    { expectedRevision: 4, prompt: null, tags: [] },
  );
  assert.equal(
    rebaseEditor(changed, base, { ...base, source: "New remote source" })
      .source,
    "New remote source",
  );
  assert.equal(
    rebaseEditor(changed, base, { ...base, title: "Other title" }).title,
    "Local title",
  );
  assert.equal(
    editorPayload({ ...base, reviewedAt: "invalid" }).reviewedAt,
    "invalid",
  );
});
test("actual Markdown rendering rejects HTML, remote images and unsafe links", () => {
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", "tests/preview-render.tsx"],
    {
      encoding: "utf8",
      env: { ...process.env, TSX_TSCONFIG_PATH: "tests/tsconfig.render.json" },
    },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
});
