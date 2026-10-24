import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { ObjectId, type Db } from "mongodb";
import { studyDate } from "../../src/modules/identity/preferences-schema";

export async function exercisePractice({
  db,
  request,
  studentCookie,
  adminCookie,
  studentId,
  question,
  resource,
  create,
}: {
  db: Db;
  request: (
    path: string,
    method?: string,
    body?: unknown,
    extra?: Record<string, string>,
  ) => Promise<Response>;
  studentCookie: string;
  adminCookie: string;
  studentId: string;
  question: { id: string; revision: number };
  resource: { id: string };
  create: (
    slug: string,
    type: string,
    publish: boolean,
  ) => Promise<{ id: string; revision: number }>;
}) {
  assert.ok(/^prep_pilot_student_test_[a-f0-9]{12}$/.test(db.databaseName));
  const csrf = (cookie: string) =>
    request("/api/v1/security/csrf", "GET", undefined, { cookie })
      .then((response) => response.json())
      .then((value) => value.data.token as string);
  const protection = {
    cookie: studentCookie,
    "x-csrf-token": await csrf(studentCookie),
  };
  const adminProtection = {
    cookie: adminCookie,
    "x-csrf-token": await csrf(adminCookie),
  };
  const post = (body: unknown, extra: Record<string, string> = {}) =>
    request("/api/v1/attempts", "POST", body, { ...protection, ...extra });
  async function error(response: Response, status: number, code: string) {
    assert.equal(response.status, status, `practice ${code}`);
    const value = await response.json();
    assert.equal(value.error.code, code);
    assert.equal(value.requestId, response.headers.get("x-request-id"));
    assert.equal(response.headers.get("cache-control"), "no-store");
    return value;
  }
  const body = {
    submissionId: randomUUID(),
    contentId: question.id,
    kind: "practice",
    outcome: "failed",
  };
  const profile = () =>
    db.collection("profiles").findOne({ userId: studentId });
  async function snapshot() {
    return {
      profile: await db
        .collection("profiles")
        .findOne({ userId: studentId }, { projection: { updatedAt: 0 } }),
      attempts: await db
        .collection("attempts")
        .find({})
        .sort({ _id: 1 })
        .toArray(),
      revisions: await db
        .collection("revisions")
        .find({})
        .sort({ _id: 1 })
        .toArray(),
      catalog: await db.collection("catalogState").findOne({}),
    };
  }
  await error(await post(body, { cookie: "" }), 401, "UNAUTHENTICATED");
  await error(await post(body, { cookie: adminCookie }), 403, "FORBIDDEN");
  await error(await post(body, { "x-csrf-token": "" }), 403, "CSRF_INVALID");
  await error(
    await post(body, { origin: "https://evil.example" }),
    403,
    "CSRF_INVALID",
  );
  await error(
    await post(body, { "x-csrf-token": adminProtection["x-csrf-token"] }),
    403,
    "CSRF_INVALID",
  );
  for (const patch of [
    { outcome: "solved" },
    { planId: new ObjectId().toString() },
    { taskId: randomUUID() },
    { userId: "other" },
    { attemptSequence: 77 },
    { createdAt: new Date().toISOString() },
    { dueDate: "2026-10-24" },
  ])
    await error(await post({ ...body, ...patch }), 422, "VALIDATION_ERROR");
  await error(
    await post({ ...body, contentId: resource.id }),
    422,
    "CONTENT_NOT_ATTEMPTABLE",
  );
  await error(
    await post({ ...body, contentId: new ObjectId().toString() }),
    409,
    "CONTENT_UNAVAILABLE",
  );
  await error(
    await post({ ...body, kind: "revision" }),
    422,
    "REVISION_NOT_FOUND",
  );
  const initial = await profile();
  const catalogBefore = await db.collection("catalogState").findOne({});
  const created = await post(body);
  assert.equal(created.status, 201);
  const first = await created.json();
  assert.equal(first.meta.replayed, false);
  assert.equal(first.data.attemptSequence, 1);
  assert.equal(first.data.revision.intervalDays, 1);
  assert.equal((await profile())!.stateRevision, initial!.stateRevision + 1);
  const catalogAfter = await db.collection("catalogState").findOne({});
  assert.equal(catalogAfter!.revision, catalogBefore!.revision);
  assert.equal(catalogAfter!.commitSerial, catalogBefore!.commitSerial);
  const replay = await post(body);
  assert.equal(replay.status, 200);
  assert.deepEqual((await replay.json()).data, first.data);
  await error(
    await post({ ...body, outcome: "independent" }),
    409,
    "IDEMPOTENCY_CONFLICT",
  );
  const same = { ...body, submissionId: randomUUID(), outcome: "independent" };
  const duplicates = await Promise.all([post(same), post(same)]);
  assert.deepEqual(
    duplicates.map((response) => response.status).sort(),
    [200, 201],
  );
  const receipt = await duplicates[0]!.json();
  assert.equal(receipt.data.revision.intervalDays, 7);
  const concurrent = await Promise.all([
    post({ ...body, submissionId: randomUUID(), outcome: "needed_help" }),
    post({
      ...body,
      submissionId: randomUUID(),
      outcome: "independent",
      perceivedDifficulty: "hard",
    }),
  ]);
  assert.ok(concurrent.every((response) => response.status === 201));
  const history = await db
    .collection("attempts")
    .find({ userId: studentId })
    .sort({ attemptSequence: 1 })
    .toArray();
  assert.deepEqual(
    history.map((attempt) => attempt.attemptSequence),
    [1, 2, 3, 4],
  );
  const current = await db
    .collection("revisions")
    .findOne({ userId: studentId, contentId: new ObjectId(question.id) });
  assert.equal(current!.lastAttemptSequence, 4);
  assert.equal(String(current!.lastAttemptId), String(history.at(-1)!._id));
  assert.equal(
    await db.collection("revisions").countDocuments({ userId: studentId }),
    1,
  );
  const oldReplay = await post(body);
  assert.equal(oldReplay.status, 200);
  assert.deepEqual((await oldReplay.json()).data, first.data);
  for (const collection of ["attempts", "revisions"] as const) {
    const before = await snapshot();
    await db.command({
      collMod: collection,
      validator: { $expr: { $eq: [1, 0] } },
      validationLevel: "strict",
    });
    try {
      await error(
        await post({ ...body, submissionId: randomUUID() }),
        500,
        "INTERNAL_ERROR",
      );
      assert.deepEqual(
        await snapshot(),
        before,
        `${collection} failure rolls back all domain state`,
      );
    } finally {
      await db.command({
        collMod: collection,
        validator: {},
        validationLevel: "strict",
      });
    }
  }
  const revision = await post({
    ...body,
    submissionId: randomUUID(),
    kind: "revision",
    outcome: "independent",
    perceivedDifficulty: "medium",
  });
  assert.equal(revision.status, 201);
  assert.equal((await revision.json()).data.revision.intervalDays, 3);
  const firstPage = await (
    await request(
      `/api/v1/attempts?contentId=${question.id}&limit=2`,
      "GET",
      undefined,
      protection,
    )
  ).json();
  assert.equal(firstPage.data.length, 2);
  assert.equal(firstPage.data[0].attemptSequence, 5);
  assert.ok(!JSON.stringify(firstPage).includes("requestHash"));
  assert.ok(!JSON.stringify(firstPage).includes("resultSnapshot"));
  const next = await (
    await request(
      `/api/v1/attempts?contentId=${question.id}&limit=2&cursor=${encodeURIComponent(firstPage.meta.page.nextCursor)}`,
      "GET",
      undefined,
      protection,
    )
  ).json();
  assert.equal(next.data[0].attemptSequence, 3);
  await error(
    await request(
      `/api/v1/attempts?limit=2&cursor=${encodeURIComponent(firstPage.meta.page.nextCursor)}`,
      "GET",
      undefined,
      protection,
    ),
    400,
    "INVALID_CURSOR",
  );
  const otherSignup = await request(
    "/api/auth/sign-up/email",
    "POST",
    {
      name: "Other fixture student",
      email: "other-practice-fixture@example.com",
      password: "Disposable-other-practice-only-481!",
    },
    { cookie: "" },
  );
  assert.equal(otherSignup.status, 200);
  const otherCookie = otherSignup.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  const otherMe = (
    await (
      await request("/api/v1/me", "GET", undefined, { cookie: otherCookie })
    ).json()
  ).data;
  const otherProtection = {
    cookie: otherCookie,
    "x-csrf-token": await csrf(otherCookie),
  };
  assert.equal(
    (
      await (
        await request("/api/v1/attempts", "GET", undefined, otherProtection)
      ).json()
    ).data.length,
    0,
  );
  assert.equal(
    (
      await (
        await request(
          "/api/v1/revisions?dueOnly=false",
          "GET",
          undefined,
          otherProtection,
        )
      ).json()
    ).data.length,
    0,
  );
  await error(
    await post(
      { ...body, submissionId: randomUUID(), kind: "revision" },
      otherProtection,
    ),
    422,
    "REVISION_NOT_FOUND",
  );
  const taskResource = await create("task-only-resource", "resource", true);
  const planId = new ObjectId(),
    taskId = randomUUID(),
    now = new Date();
  const task = {
    taskId,
    contentId: new ObjectId(taskResource.id),
    contentSnapshot: {
      title: "Saved reading task",
      subject: "dsa",
      topic: "arrays",
      type: "resource",
      contentRevision: 2,
    },
    kind: "fresh",
    scheduledDate: studyDate(),
    estimatedMinutes: 15,
    priority: "fresh",
    status: "pending",
    completedAt: null,
    reasonCode: "fresh",
    reason: "Explicit disposable resource task",
  };
  await db.collection("plans").insertOne({
    _id: planId,
    userId: studentId,
    version: 1,
    previousPlanId: null,
    sourcePreviewId: new ObjectId(),
    generatedAt: now,
    templateVersion: "fixture",
    rulesVersion: "fixture",
    timezone: "Asia/Kolkata",
    windowStart: studyDate(),
    windowEnd: studyDate(),
    budgetSnapshot: { dailyMinutes: 90 },
    tasks: [task],
    deferred: [],
    schemaVersion: 1,
    createdAt: now,
    updatedAt: now,
  });
  await db
    .collection("profiles")
    .updateOne({ userId: studentId }, { $set: { activePlanId: planId } });
  const patch = (
    status: string,
    expectedStateRevision: number,
    extra: Record<string, string> = {},
  ) =>
    request(
      `/api/v1/plans/${planId}/tasks/${taskId}`,
      "PATCH",
      { status, expectedStateRevision },
      { ...protection, ...extra },
    );
  await error(
    await patch("completed", (await profile())!.stateRevision, otherProtection),
    404,
    "RESOURCE_NOT_FOUND",
  );
  await error(
    await patch("completed", (await profile())!.stateRevision, {
      "x-csrf-token": "",
    }),
    403,
    "CSRF_INVALID",
  );
  const beforeTask = await snapshot();
  const planBefore = await db.collection("plans").findOne({ _id: planId });
  await db.command({
    collMod: "plans",
    validator: { $expr: { $eq: [1, 0] } },
    validationLevel: "strict",
  });
  try {
    await error(
      await patch("completed", (await profile())!.stateRevision),
      500,
      "INTERNAL_ERROR",
    );
    assert.deepEqual(await snapshot(), beforeTask);
    assert.deepEqual(
      await db.collection("plans").findOne({ _id: planId }),
      planBefore,
    );
  } finally {
    await db.command({
      collMod: "plans",
      validator: {},
      validationLevel: "strict",
    });
  }
  let state = (await profile())!.stateRevision;
  const completion = await patch("completed", state);
  assert.equal(completion.status, 200);
  const completed = (await completion.json()).data;
  assert.equal(completed.stateRevision, state + 1);
  assert.ok(completed.task.completedAt);
  assert.equal(
    await db.collection("attempts").countDocuments({ userId: studentId }),
    5,
  );
  state = completed.stateRevision;
  const noOp = await patch("completed", state);
  assert.equal(noOp.status, 200);
  assert.deepEqual((await noOp.json()).data, completed);
  await error(await patch("pending", state - 1), 409, "STATE_CONFLICT");
  const archived = await request(
    `/api/v1/admin/content/${taskResource.id}/archive`,
    "POST",
    {
      expectedRevision: taskResource.revision,
      reason: "Disposable task archive",
    },
    adminProtection,
  );
  assert.equal(archived.status, 200);
  const undo = await patch("pending", state);
  assert.equal(undo.status, 200);
  state = (await undo.json()).data.stateRevision;
  await error(await patch("completed", state), 409, "CONTENT_UNAVAILABLE");
  await db
    .collection("profiles")
    .updateOne({ userId: studentId }, { $set: { activePlanId: null } });
  await error(await patch("pending", state), 409, "PLAN_NOT_ACTIVE");
  const due = await create("due-recall", "question", true);
  const dueAttempt = await post({
    ...body,
    submissionId: randomUUID(),
    contentId: due.id,
  });
  assert.equal(dueAttempt.status, 201);
  await db
    .collection("revisions")
    .updateOne(
      { userId: studentId, contentId: new ObjectId(due.id) },
      { $set: { dueDate: studyDate() } },
    );
  const revisionPage = await (
    await request(
      "/api/v1/revisions?dueOnly=false&limit=1",
      "GET",
      undefined,
      protection,
    )
  ).json();
  assert.ok(revisionPage.meta.page.nextCursor);
  await error(
    await request(
      `/api/v1/revisions?dueOnly=true&limit=1&cursor=${encodeURIComponent(revisionPage.meta.page.nextCursor)}`,
      "GET",
      undefined,
      protection,
    ),
    400,
    "INVALID_CURSOR",
  );
  const revisionNext = await (
    await request(
      `/api/v1/revisions?dueOnly=false&limit=1&cursor=${encodeURIComponent(revisionPage.meta.page.nextCursor)}`,
      "GET",
      undefined,
      protection,
    )
  ).json();
  assert.notEqual(revisionNext.data[0].id, revisionPage.data[0].id);
  const dueList = await (
    await request("/api/v1/revisions", "GET", undefined, protection)
  ).json();
  assert.ok(
    dueList.data.some(
      (entry: { contentId: string }) => entry.contentId === due.id,
    ),
  );
  assert.ok(
    dueList.data.every(
      (entry: { outsidePlan: null }) => entry.outsidePlan === null,
    ),
  );
  const recalled = await post({
    ...body,
    submissionId: randomUUID(),
    contentId: due.id,
    kind: "revision",
    outcome: "independent",
  });
  assert.equal(recalled.status, 201);
  assert.ok(
    !(
      await (
        await request("/api/v1/revisions", "GET", undefined, protection)
      ).json()
    ).data.some((entry: { contentId: string }) => entry.contentId === due.id),
  );
  await db
    .collection("revisions")
    .updateOne(
      { userId: studentId, contentId: new ObjectId(due.id) },
      { $set: { dueDate: studyDate() } },
    );
  await db
    .collection("profiles")
    .updateOne({ userId: otherMe.userId }, { $set: { lifecycle: "deleting" } });
  await error(
    await post({ ...body, submissionId: randomUUID() }, otherProtection),
    403,
    "ACCOUNT_UNAVAILABLE",
  );
  console.log(
    "PASS: practice idempotency/conflicts, original receipts, sequences/races, attempt+revision rollback, owned history/cursors, revision recalls and task-only resource completion/undo.",
  );
}
