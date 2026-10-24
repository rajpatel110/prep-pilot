import assert from "node:assert/strict";
import { ObjectId, type Db } from "mongodb";

export async function exerciseLifecycle({
  db,
  request,
  error,
  noMutation,
  studentCookie,
  adminId,
}: {
  db: Db;
  request: (
    path: string,
    method?: string,
    body?: unknown,
    extra?: Record<string, string>,
  ) => Promise<Response>;
  error: (
    response: Response,
    status: number,
    code: string,
    field?: string,
  ) => Promise<unknown>;
  noMutation: (operation: () => Promise<unknown>) => Promise<void>;
  studentCookie: string;
  adminId: string;
}) {
  const root = "/api/v1/admin/content";
  const profile = () => db.collection("profiles").findOne({ userId: adminId });
  const catalog = () =>
    db
      .collection<{ _id: string; revision: number; commitSerial: number }>(
        "catalogState",
      )
      .findOne({ _id: "catalog" });
  async function mutation(
    path: string,
    method: string,
    body: unknown,
    status = 200,
  ) {
    const beforeCatalog = await catalog();
    const beforeProfile = await profile();
    const auditCount = await db.collection("adminAudit").countDocuments();
    const response = await request(path, method, body);
    assert.equal(response.status, status, `Lifecycle ${method} ${path}`);
    const item = (await response.json()).data;
    assert.equal((await catalog())!.revision, beforeCatalog!.revision + 1);
    assert.equal((await catalog())!.commitSerial, beforeCatalog!.commitSerial);
    assert.equal(
      (await profile())!.stateRevision,
      beforeProfile!.stateRevision + 1,
    );
    assert.equal(
      await db.collection("adminAudit").countDocuments(),
      auditCount + 1,
    );
    const audit = await db
      .collection("adminAudit")
      .findOne({ requestId: response.headers.get("x-request-id") });
    assert.equal(audit!.newRevision, item.revision);
    assert.equal(audit!.actorUserId, adminId);
    return item;
  }
  const draft = {
    slug: "workflow-question",
    title: "Workflow question",
    subject: "dsa",
    topic: "arrays",
    type: "question",
    difficulty: "easy",
    estimatedMinutes: 30,
    source: "Disposable original work",
    attribution: "",
  };
  let item = await mutation(root, "POST", draft, 201);
  const path = `${root}/${item.id}`;
  const student = (suffix: string) =>
    request(`/api/v1/content${suffix}`, "GET", undefined, {
      cookie: studentCookie,
    });
  await error(await student(`/${item.id}`), 404, "RESOURCE_NOT_FOUND");
  for (const action of ["publish", "archive", "reopen"]) {
    await error(
      await request(
        `${path}/${action}`,
        "POST",
        { expectedRevision: item.revision },
        { cookie: "" },
      ),
      401,
      "UNAUTHENTICATED",
    );
    await error(
      await request(
        `${path}/${action}`,
        "POST",
        { expectedRevision: item.revision },
        { cookie: studentCookie },
      ),
      403,
      "FORBIDDEN",
    );
    for (const extra of [
      { "x-csrf-token": "" },
      { "x-csrf-token": "tampered" },
      { origin: "https://untrusted.example" },
    ])
      await error(
        await request(
          `${path}/${action}`,
          "POST",
          { expectedRevision: item.revision },
          extra,
        ),
        403,
        "CSRF_INVALID",
      );
    await error(
      await request(`${path}/${action}`, "POST", { expectedRevision: 0 }),
      422,
      "VALIDATION_ERROR",
    );
    await error(
      await request(`${path}/${action}`, "POST", {
        expectedRevision: 1,
        status: "published",
      }),
      422,
      "VALIDATION_ERROR",
    );
  }
  await noMutation(() =>
    errorFrom(
      `${path}/publish`,
      { expectedRevision: item.revision },
      422,
      "PUBLISH_REQUIREMENTS_NOT_MET",
    ),
  );
  await noMutation(() =>
    errorFrom(
      `${path}/archive`,
      { expectedRevision: item.revision, reason: "retire" },
      409,
      "INVALID_CONTENT_STATE",
    ),
  );
  item = await mutation(path, "PATCH", {
    expectedRevision: item.revision,
    prompt: "## Work through this\nExplain your approach.",
    explanation: "Review the invariant.",
    reviewedAt: "2026-01-01T00:00:00Z",
  });
  for (const action of ["publish", "archive", "reopen"]) {
    if (action === "archive")
      await errorFrom(
        `${path}/archive`,
        { expectedRevision: item.revision, reason: " " },
        422,
        "VALIDATION_ERROR",
      );
    await db.command({
      collMod: "adminAudit",
      validator: { action: { $ne: `${action}_content` } },
      validationLevel: "strict",
      validationAction: "error",
    });
    try {
      await noMutation(() =>
        errorFrom(
          `${path}/${action}`,
          {
            expectedRevision: item.revision,
            ...(action === "archive" ? { reason: "outdated source" } : {}),
          },
          500,
          "INTERNAL_ERROR",
        ),
      );
    } finally {
      await db.command({ collMod: "adminAudit", validator: {} });
    }
    const old = item;
    item = await mutation(`${path}/${action}`, "POST", {
      expectedRevision: item.revision,
      ...(action === "archive" ? { reason: "outdated source" } : {}),
    });
    assert.equal(item.revision, old.revision + 1);
    if (action === "publish") {
      assert.equal(item.status, "published");
      assert.ok(item.publishedAt);
      const response = await student(`/${item.id}`);
      assert.equal(response.status, 200);
      const detail = (await response.json()).data;
      assert.equal(detail.availability, "available");
      assert.equal(detail.prompt, item.prompt);
      for (const field of [
        "status",
        "assetIds",
        "createdBy",
        "updatedAt",
        "revisionGuard",
      ])
        assert.ok(!(field in detail));
      await noMutation(() =>
        errorFrom(
          path,
          { expectedRevision: item.revision, prompt: null },
          422,
          "PUBLISH_REQUIREMENTS_NOT_MET",
          "PATCH",
        ),
      );
      await noMutation(() =>
        errorFrom(
          path,
          { expectedRevision: item.revision, slug: "changed-published" },
          422,
          "VALIDATION_ERROR",
          "PATCH",
        ),
      );
      const publicationDate = item.publishedAt;
      item = await mutation(path, "PATCH", {
        expectedRevision: item.revision,
        title: "Reviewed workflow title",
      });
      assert.equal(item.publishedAt, publicationDate);
      await noMutation(() =>
        errorFrom(
          `${path}/publish`,
          { expectedRevision: item.revision },
          409,
          "INVALID_CONTENT_STATE",
        ),
      );
    }
    if (action === "archive") {
      assert.equal(item.status, "archived");
      assert.ok(item.archivedAt);
      assert.equal(
        (await db
          .collection("adminAudit")
          .findOne({ entityId: item.id, action: "archive_content" }))!.reason,
        "outdated source",
      );
      await error(await student(`/${item.id}`), 404, "RESOURCE_NOT_FOUND");
      const me = (
        await (
          await request("/api/v1/me", "GET", undefined, {
            cookie: studentCookie,
          })
        ).json()
      ).data;
      const snapshot = {
        title: "Historical title",
        subject: "dsa",
        topic: "arrays",
        type: "question",
        contentRevision: 1,
      };
      const attempt = {
        userId: me.userId,
        contentId: new ObjectId(item.id),
        contentSnapshot: snapshot,
        attemptSequence: 1,
      };
      await db.collection("attempts").insertOne(attempt);
      const historical = (await (await student(`/${item.id}`)).json()).data;
      assert.equal(historical.availability, "unavailable");
      assert.equal(historical.reason, "archived");
      assert.deepEqual(historical.snapshot, {
        title: "Historical title",
        subject: "dsa",
        topic: "arrays",
        type: "question",
      });
      assert.ok(!("prompt" in historical));
      await noMutation(() =>
        errorFrom(
          path,
          { expectedRevision: item.revision, title: "blocked" },
          409,
          "INVALID_CONTENT_STATE",
          "PATCH",
        ),
      );
    }
    if (action === "reopen") {
      assert.equal(item.status, "draft");
      assert.ok(item.publishedAt);
      assert.ok(item.archivedAt);
      const historical = (await (await student(`/${item.id}`)).json()).data;
      assert.equal(historical.reason, "not_published");
      assert.ok(!("body" in historical));
      await noMutation(() =>
        errorFrom(
          path,
          { expectedRevision: item.revision, slug: "changed-reopened" },
          422,
          "VALIDATION_ERROR",
          "PATCH",
        ),
      );
      await noMutation(() =>
        errorFrom(
          `${path}/publish`,
          { expectedRevision: item.revision - 1 },
          409,
          "CONTENT_CONFLICT",
        ),
      );
    }
  }
  const race = await Promise.all([
    request(`${path}/publish`, "POST", { expectedRevision: item.revision }),
    request(path, "PATCH", {
      expectedRevision: item.revision,
      title: "Concurrent edit",
    }),
  ]);
  assert.deepEqual(race.map((response) => response.status).sort(), [200, 409]);
  const raced = (await (await request(path)).json()).data;
  if (raced.status === "draft")
    await mutation(`${path}/publish`, "POST", {
      expectedRevision: raced.revision,
    });
  const resource = await mutation(
    root,
    "POST",
    {
      ...draft,
      slug: "workflow-resource",
      type: "resource",
      title: "Resource workflow",
      reviewedAt: "2026-01-01T00:00:00Z",
    },
    201,
  );
  await noMutation(() =>
    errorFrom(
      `${root}/${resource.id}/publish`,
      { expectedRevision: resource.revision },
      422,
      "PUBLISH_REQUIREMENTS_NOT_MET",
    ),
  );
  const linked = await mutation(`${root}/${resource.id}`, "PATCH", {
    expectedRevision: 1,
    externalUrl: "https://example.com/learn",
  });
  await mutation(`${root}/${linked.id}/publish`, "POST", {
    expectedRevision: linked.revision,
  });
  const response = await student("?q=workflow&limit=1");
  assert.equal(response.status, 200);
  const page = await response.json();
  for (const entry of page.data)
    for (const key of ["explanation", "body", "prompt", "status", "createdAt"])
      assert.ok(!(key in entry));
  await error(await student("?status=draft"), 422, "VALIDATION_ERROR");
  if (page.meta.page.nextCursor) {
    const changed = await request(
      `/api/v1/content?limit=1&q=workflow&cursor=${page.meta.page.nextCursor}`,
      "GET",
      undefined,
      { cookie: studentCookie },
    );
    assert.equal(changed.status, 200);
    await error(
      await request(
        `${root}?limit=1&q=workflow&cursor=${page.meta.page.nextCursor}`,
      ),
      400,
      "INVALID_CURSOR",
    );
  }
  const missingId = new ObjectId();
  const otherId = new ObjectId();
  const studentId = (
    await (
      await request("/api/v1/me", "GET", undefined, { cookie: studentCookie })
    ).json()
  ).data.userId;
  const snapshot = {
    title: "Plan snapshot",
    subject: "cs",
    topic: "dbms",
    type: "resource",
    contentRevision: 1,
  };
  await db.collection("plans").insertOne({
    userId: studentId,
    version: 1,
    tasks: [{ contentId: missingId, contentSnapshot: snapshot }],
  });
  await db.collection("attempts").insertOne({
    userId: "another-user",
    attemptSequence: 1,
    contentId: otherId,
    contentSnapshot: snapshot,
  });
  assert.equal(
    (await (await student(`/${missingId}`)).json()).data.reason,
    "missing",
  );
  await error(await student(`/${otherId}`), 404, "RESOURCE_NOT_FOUND");
  assert.equal(
    (await db.collection("plans").findOne({ userId: studentId }))!.tasks[0]
      .contentSnapshot.title,
    "Plan snapshot",
  );
  await error(
    await request("/api/v1/content", "GET", undefined, { cookie: "" }),
    401,
    "UNAUTHENTICATED",
  );
  async function errorFrom(
    endpoint: string,
    body: unknown,
    status: number,
    code: string,
    method = "POST",
  ) {
    return error(await request(endpoint, method, body), status, code);
  }
}
