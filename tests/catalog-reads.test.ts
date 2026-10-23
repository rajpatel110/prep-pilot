import assert from "node:assert/strict";
import { test } from "node:test";
import {
  catalogQuerySchema,
  queryObject,
  cursorBinding,
  keywordSearch,
} from "../src/modules/catalog/read-query";
import {
  issueCatalogCursor,
  inspectCatalogCursor,
} from "../src/modules/catalog/cursor";

test("strict catalog query limits, enums, configured topic and scalar uniqueness", () => {
  for (const value of [
    "limit=0",
    "limit=51",
    "limit=1.5",
    "limit=01",
    "status=all",
    "subject=unknown",
    "topic=arbitrary",
    "subject=dsa&topic=dbms",
    "company=other",
    "difficulty=other",
    "q=%20",
    `q=${"a".repeat(101)}`,
    "sort=title",
    "status=draft&status=draft",
    "q[a]=x",
  ])
    assert.equal(
      catalogQuerySchema.safeParse(queryObject(new URLSearchParams(value)))
        .success,
      false,
      value,
    );
  const parsed = catalogQuerySchema.parse(
    queryObject(new URLSearchParams("q=%20arrays%20&topic=arrays")),
  );
  assert.equal(parsed.q, "arrays");
  assert.equal(parsed.limit, 20);
  assert.equal(catalogQuerySchema.parse({ limit: "50" }).limit, 50);
});

test("cursor signatures, expiry, canonical encoding and binding to every scope dimension", () => {
  const query = catalogQuerySchema.parse({});
  const scope = cursorBinding(query, "admin-one");
  const secret = "disposable-test-secret";
  const now = Date.now();
  const id = "507f1f77bcf86cd799439011";
  const token = issueCatalogCursor(id, scope, secret, now);
  assert.equal(inspectCatalogCursor(token, scope, secret, now), id);
  assert.equal(inspectCatalogCursor(token, scope, secret, now + 1800000), null);
  assert.equal(inspectCatalogCursor(token, scope, "other-secret", now), null);
  assert.equal(inspectCatalogCursor(token + "x", scope, secret, now), null);
  assert.equal(inspectCatalogCursor("invalid", scope, secret, now), null);
  assert.equal(
    inspectCatalogCursor(token, cursorBinding(query, "admin-two"), secret, now),
    null,
  );
  for (const changed of [
    scope.replace("/api/v1/admin/content", "/api/v1/content"),
    scope.replace("id:asc", "id:desc"),
  ])
    assert.equal(inspectCatalogCursor(token, changed, secret, now), null);
  for (const changed of [
    { status: "draft" },
    { subject: "dsa" },
    { topic: "arrays" },
    { company: "ltm" },
    { difficulty: "easy" },
    { q: "arrays" },
    { limit: "5" },
  ])
    assert.equal(
      inspectCatalogCursor(
        token,
        cursorBinding(catalogQuerySchema.parse(changed), "admin-one"),
        secret,
        now,
      ),
      null,
    );
  assert.equal(
    inspectCatalogCursor(
      issueCatalogCursor(id, scope, secret, now - 1800001),
      scope,
      secret,
      now,
    ),
    null,
  );
  assert.equal(
    inspectCatalogCursor(
      issueCatalogCursor(id, scope, secret, now + 1),
      scope,
      secret,
      now,
    ),
    null,
  );
});

test("search uses quoted words, never regex or client text-search operators", () => {
  assert.equal(
    keywordSearch('arrays -trees "tags" /x.*/'),
    '"arrays" "trees" "tags" "x"',
  );
  assert.equal(keywordSearch(".*"), "");
});
