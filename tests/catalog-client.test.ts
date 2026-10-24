import assert from "node:assert/strict";
import { test } from "node:test";
import {
  catalogRequest,
  CatalogRequestError,
} from "../src/modules/catalog/ui/catalog-client";

test("failed saves preserve caller input, expose safe field errors and never retry mutations", async () => {
  const original = globalThis.fetch;
  const input = { title: "Preserve local title", expectedRevision: 1 };
  const before = structuredClone(input);
  let calls = 0;
  try {
    globalThis.fetch = async (path) => {
      calls++;
      return String(path).includes("/security/csrf")
        ? Response.json({ data: { token: "disposable-token" } })
        : Response.json(
            {
              error: {
                code: "VALIDATION_ERROR",
                message: "Check fields.",
                fields: { title: ["Review title."] },
              },
              requestId: "disposable-request-id",
            },
            { status: 422 },
          );
    };
    await assert.rejects(
      catalogRequest("/api/v1/admin/content/example", "PATCH", input),
      (error: unknown) =>
        error instanceof CatalogRequestError &&
        error.code === "VALIDATION_ERROR" &&
        !error.uncertain &&
        !!error.fields.title,
    );
    assert.equal(calls, 2);
    assert.deepEqual(input, before);
    calls = 0;
    globalThis.fetch = async (path) => {
      calls++;
      if (String(path).includes("/security/csrf"))
        return Response.json({ data: { token: "disposable-token" } });
      throw new Error("Simulated lost response");
    };
    await assert.rejects(
      catalogRequest("/api/v1/admin/content/example", "PATCH", input),
      (error: unknown) =>
        error instanceof CatalogRequestError && error.uncertain,
    );
    assert.equal(calls, 2);
    assert.deepEqual(input, before);
  } finally {
    globalThis.fetch = original;
  }
});

test("a missing session/CSRF grant stops before any mutation is sent", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  try {
    globalThis.fetch = async () => {
      calls++;
      return Response.json(
        { error: { code: "UNAUTHENTICATED" } },
        { status: 401 },
      );
    };
    await assert.rejects(
      catalogRequest("/api/v1/admin/content", "POST", {}),
      (error: unknown) =>
        error instanceof CatalogRequestError && !error.uncertain,
    );
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = original;
  }
});
