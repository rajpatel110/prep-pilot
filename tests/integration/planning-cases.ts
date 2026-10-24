import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { ObjectId, type Db } from "mongodb";
import { studyDate } from "../../src/modules/identity/preferences-schema";
import { migrateDatabase } from "../../scripts/database-migrations";
export async function exercisePlanning({
  db,
  request,
  studentCookie,
  adminCookie,
  studentId,
  rateSecret,
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
  rateSecret: string;
  create: (
    slug: string,
    type: string,
    publish: boolean,
  ) => Promise<{ id: string; revision: number }>;
}) {
  assert.match(db.databaseName, /^prep_pilot_student_test_[a-f0-9]{12}$/);
  const token = (
    await (
      await request("/api/v1/security/csrf", "GET", undefined, {
        cookie: studentCookie,
      })
    ).json()
  ).data.token;
  const protection = { cookie: studentCookie, "x-csrf-token": token };
  async function error(response: Response, status: number, code: string) {
    const value = await response.json();
    assert.equal(response.status, status, JSON.stringify(value));
    assert.equal(value.error.code, code);
    assert.equal(value.requestId, response.headers.get("x-request-id"));
  }
  const revision = async () =>
    (await db.collection("profiles").findOne({ userId: studentId }))!
      .stateRevision as number;
  async function generate(kind = "initial") {
    const response = await request(
      "/api/v1/plan-previews",
      "POST",
      { kind, expectedStateRevision: await revision() },
      protection,
    );
    const value = await response.json();
    assert.equal(response.status, 201, JSON.stringify(value));
    assert.equal(
      response.headers.get("location"),
      `/api/v1/plan-previews/${value.data.id}`,
    );
    return value.data;
  }
  const accept = (
    preview: { id: string; proposal: { deferred: { taskId: string }[] } },
    extra: Record<string, string> = {},
  ) =>
    request(
      `/api/v1/plan-previews/${preview.id}/confirm`,
      "POST",
      {
        acknowledgedDeferredIds: preview.proposal.deferred.map(
          (task) => task.taskId,
        ),
      },
      { ...protection, ...extra },
    );
  const counters = async () => ({
    profile: await db.collection("profiles").findOne(
      { userId: studentId },
      {
        projection: {
          stateRevision: 1,
          planVersion: 1,
          activePlanId: 1,
          attemptSequence: 1,
        },
      },
    ),
    catalog: await db
      .collection("catalogState")
      .findOne({}, { projection: { revision: 1, commitSerial: 1 } }),
    plans: await db.collection("plans").countDocuments({ userId: studentId }),
  });
  await error(
    await request(
      "/api/v1/plan-previews",
      "POST",
      { kind: "initial", expectedStateRevision: 0 },
      { cookie: "" },
    ),
    401,
    "UNAUTHENTICATED",
  );
  await error(
    await request(
      "/api/v1/plan-previews",
      "POST",
      { kind: "initial", expectedStateRevision: await revision() },
      { cookie: studentCookie },
    ),
    403,
    "CSRF_INVALID",
  );
  await error(
    await request(
      "/api/v1/plan-previews",
      "POST",
      { kind: "initial", expectedStateRevision: await revision() },
      { ...protection, origin: "https://evil.example" },
    ),
    403,
    "CSRF_INVALID",
  );
  await error(
    await request(
      "/api/v1/plan-previews",
      "POST",
      {
        kind: "initial",
        expectedStateRevision: await revision(),
        userId: "injected",
        tasks: [],
      },
      protection,
    ),
    422,
    "VALIDATION_ERROR",
  );
  await error(
    await request("/api/v1/dashboard", "GET", undefined, {
      cookie: adminCookie,
    }),
    403,
    "FORBIDDEN",
  );
  const first = await generate();
  await error(
    await request(
      `/api/v1/plan-previews/${first.id}/confirm`,
      "POST",
      {
        acknowledgedDeferredIds: [
          "00000000-0000-4000-8000-000000000001",
          "00000000-0000-4000-8000-000000000001",
        ],
      },
      protection,
    ),
    422,
    "DEFERRED_ACK_REQUIRED",
  );
  await error(
    await request(
      `/api/v1/plan-previews/${first.id}/confirm`,
      "POST",
      { acknowledgedDeferredIds: [] },
      { cookie: studentCookie },
    ),
    403,
    "CSRF_INVALID",
  );
  await error(
    await request(
      `/api/v1/plan-previews/${first.id}/confirm`,
      "POST",
      { acknowledgedDeferredIds: ["00000000-0000-4000-8000-000000000001"] },
      protection,
    ),
    422,
    "DEFERRED_ACK_REQUIRED",
  );
  await error(
    await request(
      `/api/v1/plan-previews/${first.id}/confirm`,
      "POST",
      { acknowledgedDeferredIds: [], tasks: [], userId: studentId },
      protection,
    ),
    422,
    "VALIDATION_ERROR",
  );
  await error(
    await request(
      `/api/v1/plan-previews/${new ObjectId()}/confirm`,
      "POST",
      { acknowledgedDeferredIds: [] },
      protection,
    ),
    404,
    "RESOURCE_NOT_FOUND",
  );
  assert.equal(first.state, "pending");
  assert.ok(first.proposal.tasks.length > 0);
  assert.ok(
    first.dailyTotals.every(
      (day: { afterMinutes: number; budgetMinutes: number }) =>
        day.afterMinutes <= day.budgetMinutes,
    ),
  );
  assert.equal(
    (await (await request("/api/v1/plans/current")).json()).data.plan,
    null,
  );
  const otherResponse = await request("/api/auth/sign-up/email", "POST", {
    name: "Other planning fixture",
    email: "other-planning-fixture@example.com",
    password: "Disposable-other-planning-only-481!",
  });
  assert.equal(otherResponse.status, 200);
  const otherCookie = otherResponse.headers
    .getSetCookie()
    .map((cookie) => cookie.split(";")[0])
    .join("; ");
  await error(
    await request(`/api/v1/plan-previews/${first.id}`, "GET", undefined, {
      cookie: otherCookie,
    }),
    404,
    "RESOURCE_NOT_FOUND",
  );
  const otherToken = (
    await (
      await request("/api/v1/security/csrf", "GET", undefined, {
        cookie: otherCookie,
      })
    ).json()
  ).data.token;
  await error(
    await accept(first, { cookie: otherCookie, "x-csrf-token": otherToken }),
    404,
    "RESOURCE_NOT_FOUND",
  );
  const accepted = await accept(first);
  assert.equal(accepted.status, 201);
  const firstPlan = (await accepted.json()).data.plan;
  const firstStored = await db
    .collection("plans")
    .findOne({ _id: new ObjectId(firstPlan.id) });
  assert.equal((await accept(first)).status, 200);
  const resource = firstPlan.tasks.find(
    (task: { contentSnapshot: { type: string } }) =>
      task.contentSnapshot.type === "resource",
  );
  assert.ok(resource);
  await error(
    await request(
      `/api/v1/plans/${firstPlan.id}/tasks/${resource.taskId}`,
      "PATCH",
      { status: "completed", expectedStateRevision: await revision() },
      { cookie: otherCookie, "x-csrf-token": otherToken },
    ),
    404,
    "RESOURCE_NOT_FOUND",
  );
  const attemptBefore = await db.collection("attempts").countDocuments();
  assert.equal(
    (
      await request(
        `/api/v1/plans/${firstPlan.id}/tasks/${resource.taskId}`,
        "PATCH",
        { status: "completed", expectedStateRevision: await revision() },
        protection,
      )
    ).status,
    200,
  );
  assert.equal(await db.collection("attempts").countDocuments(), attemptBefore);
  const stale = await generate("reschedule");
  await db
    .collection("profiles")
    .updateOne({ userId: studentId }, { $inc: { stateRevision: 1 } });
  await error(await accept(stale), 409, "STALE_PREVIEW");
  const expired = await generate("reschedule");
  await db
    .collection("planPreviews")
    .updateOne(
      { _id: new ObjectId(expired.id) },
      { $set: { expiresAt: new Date(0) } },
    );
  await error(await accept(expired), 409, "PREVIEW_EXPIRED");
  const midnight = await generate("reschedule");
  await db
    .collection("planPreviews")
    .updateOne(
      { _id: new ObjectId(midnight.id) },
      { $set: { localDateAtCreation: "2000-01-01" } },
    );
  await error(await accept(midnight), 409, "STALE_PREVIEW");
  const incompatible = await generate("reschedule");
  await db
    .collection("planPreviews")
    .updateOne(
      { _id: new ObjectId(incompatible.id) },
      { $set: { templateVersion: "incompatible" } },
    );
  await error(await accept(incompatible), 409, "STALE_PREVIEW");
  await db.collection("planPreviews").updateOne(
    { _id: new ObjectId(incompatible.id) },
    {
      $set: {
        templateVersion: incompatible.proposal.templateVersion,
        rulesVersion: "incompatible",
      },
    },
  );
  await error(await accept(incompatible), 409, "STALE_PREVIEW");
  const changedCatalog = await generate("reschedule");
  await create("planning-catalog-change", "question", true);
  await error(await accept(changedCatalog), 409, "STALE_PREVIEW");
  const rollback = await generate("reschedule");
  const before = await counters();
  await db.command({
    collMod: "plans",
    validator: { $expr: { $eq: [1, 0] } },
    validationLevel: "strict",
    validationAction: "error",
  });
  try {
    await error(await accept(rollback), 500, "INTERNAL_ERROR");
    assert.deepEqual(await counters(), before);
    assert.equal(
      (await db
        .collection("planPreviews")
        .findOne({ _id: new ObjectId(rollback.id) }))!.state,
      "pending",
    );
  } finally {
    await db.command({
      collMod: "plans",
      validator: {},
      validationLevel: "strict",
    });
  }
  await db.command({
    collMod: "planPreviews",
    validator: { $expr: { $eq: [1, 0] } },
    validationLevel: "strict",
    validationAction: "error",
  });
  try {
    await error(await accept(rollback), 500, "INTERNAL_ERROR");
    assert.deepEqual(await counters(), before);
    assert.equal(
      (await db
        .collection("planPreviews")
        .findOne({ _id: new ObjectId(rollback.id) }))!.state,
      "pending",
    );
  } finally {
    await db.command({
      collMod: "planPreviews",
      validator: {},
      validationLevel: "strict",
    });
  }
  const race = await Promise.all([accept(rollback), accept(rollback)]);
  assert.deepEqual(race.map((response) => response.status).sort(), [200, 201]);
  const raceValues = await Promise.all(race.map((response) => response.json()));
  assert.equal(raceValues[0].data.plan.id, raceValues[1].data.plan.id);
  const nextPlan = raceValues[0].data.plan;
  assert.equal(
    nextPlan.tasks.find(
      (task: { taskId: string }) => task.taskId === resource.taskId,
    ).status,
    "completed",
  );
  const oldPlan = (
    await (await request(`/api/v1/plans/${firstPlan.id}`)).json()
  ).data;
  assert.equal(oldPlan.status, "archived");
  assert.equal(
    (await db
      .collection("plans")
      .findOne({ _id: firstStored!._id }))!.tasks.find(
      (task: { taskId: string }) => task.taskId === resource.taskId,
    ).status,
    "completed",
  );
  const archivedSnapshot = await db
    .collection("plans")
    .findOne({ _id: new ObjectId(firstPlan.id) });
  const left = await generate("reschedule"),
    right = await generate("reschedule");
  const competing = await Promise.all([accept(left), accept(right)]);
  assert.deepEqual(
    competing.map((response) => response.status).sort(),
    [201, 409],
  );
  assert.deepEqual(
    await db.collection("plans").findOne({ _id: new ObjectId(firstPlan.id) }),
    archivedSnapshot,
  );
  await db
    .collection("planPreviews")
    .deleteOne({ _id: new ObjectId(first.id) });
  const receipt = await accept(first);
  assert.equal(receipt.status, 200);
  assert.equal((await receipt.json()).data.plan.id, firstPlan.id);
  const history = await (await request("/api/v1/plans?limit=1")).json();
  assert.equal(history.data.length, 1);
  assert.ok(history.meta.page.nextCursor);
  assert.equal(
    (
      await request(
        `/api/v1/plans?limit=1&cursor=${encodeURIComponent(history.meta.page.nextCursor)}`,
      )
    ).status,
    200,
  );
  const dash = (await (await request("/api/v1/dashboard")).json()).data;
  const preserved = await counters();
  await migrateDatabase(db);
  await migrateDatabase(db);
  assert.deepEqual(await counters(), preserved);
  assert.equal(
    dash.activePlanId,
    String(
      (await db.collection("profiles").findOne({ userId: studentId }))!
        .activePlanId,
    ),
  );
  assert.equal(dash.studyDate, studyDate());
  assert.equal(dash.progress.readingCompleted, 1);
  await error(
    await request(
      "/api/v1/plan-previews",
      "POST",
      { kind: "initial", expectedStateRevision: await revision() },
      protection,
    ),
    409,
    "ACTIVE_PLAN_EXISTS",
  );
  const rateWindow = Math.floor(Date.now() / 600000);
  await db.collection("rateBuckets").deleteMany({});
  const supportSource = await create("adjustment-source", "question", true);
  const adminToken = (
    await (
      await request("/api/v1/security/csrf", "GET", undefined, {
        cookie: adminCookie,
      })
    ).json()
  ).data.token;
  const sourceEdit = await request(
    `/api/v1/admin/content/${supportSource.id}`,
    "PATCH",
    { difficulty: "medium", expectedRevision: supportSource.revision },
    { cookie: adminCookie, "x-csrf-token": adminToken },
  );
  assert.equal(sourceEdit.status, 200);
  const easier = await create("adjustment-easier", "question", true);
  const outcomesBefore = await db
    .collection("attempts")
    .countDocuments({ userId: studentId });
  async function recordSupport() {
    const response = await request(
      "/api/v1/attempts",
      "POST",
      {
        submissionId: crypto.randomUUID(),
        contentId: supportSource.id,
        kind: "practice",
        outcome: "needed_help",
      },
      protection,
    );
    assert.equal(response.status, 201, JSON.stringify(await response.json()));
  }
  await recordSupport();
  await recordSupport();
  let supportDashboard = (await (await request("/api/v1/dashboard")).json())
    .data;
  assert.equal(
    supportDashboard.suggestions.some(
      (entry: { ruleCode: string }) => entry.ruleCode === "LAST_THREE_SUPPORT",
    ),
    false,
  );
  const noEvidence = await generate("adapt");
  assert.equal(noEvidence.adjustment.useful, false);
  await error(await accept(noEvidence), 422, "VALIDATION_ERROR");
  await recordSupport();
  supportDashboard = (await (await request("/api/v1/dashboard")).json()).data;
  assert.ok(
    supportDashboard.suggestions.some(
      (entry: { ruleCode: string; attemptIds: string[] }) =>
        entry.ruleCode === "LAST_THREE_SUPPORT" &&
        entry.attemptIds.length === 3,
    ),
  );
  const unchanged = await counters();
  const adjustment = await generate("adapt");
  assert.equal(adjustment.adjustment.useful, true);
  assert.ok(
    adjustment.proposal.tasks.some(
      (task: { contentId: string }) => task.contentId === easier.id,
    ),
  );
  assert.equal(adjustment.evidence[0].attemptIds.length, 3);
  assert.deepEqual(await counters(), unchanged);
  assert.equal(
    (await request(`/api/v1/plan-previews/${adjustment.id}`)).status,
    200,
  );
  assert.deepEqual(await counters(), unchanged);
  await recordSupport();
  await error(await accept(adjustment), 409, "STALE_PREVIEW");
  const reviewed = await generate("adapt");
  const rollbackCounters = await counters();
  await db.command({
    collMod: "plans",
    validator: { $expr: { $eq: [1, 0] } },
    validationLevel: "strict",
    validationAction: "error",
  });
  try {
    await error(await accept(reviewed), 500, "INTERNAL_ERROR");
    assert.deepEqual(await counters(), rollbackCounters);
  } finally {
    await db.command({
      collMod: "plans",
      validator: {},
      validationLevel: "strict",
    });
  }
  const acceptedAdjustment = await Promise.all([
    accept(reviewed),
    accept(reviewed),
  ]);
  assert.deepEqual(
    acceptedAdjustment.map((response) => response.status).sort(),
    [200, 201],
  );
  const adjustedPlans = await Promise.all(
    acceptedAdjustment.map((response) => response.json()),
  );
  assert.equal(adjustedPlans[0].data.plan.id, adjustedPlans[1].data.plan.id);
  assert.equal(
    adjustedPlans[0].data.plan.previousPlanId,
    String(rollbackCounters.profile!.activePlanId),
  );
  assert.equal(
    adjustedPlans[0].data.plan.tasks.find(
      (task: { taskId: string }) => task.taskId === resource.taskId,
    ).status,
    "completed",
  );
  assert.equal(
    await db.collection("attempts").countDocuments({ userId: studentId }),
    outcomesBefore + 4,
  );
  assert.deepEqual(
    (await (await request("/api/v1/dashboard")).json()).data.suggestions,
    [],
  );
  const storedAdjustment = await db
    .collection("plans")
    .findOne({ _id: new ObjectId(adjustedPlans[0].data.plan.id) });
  assert.equal(
    storedAdjustment!.attemptSequenceAtGeneration,
    rollbackCounters.profile!.attemptSequence,
  );
  await recordSupport();
  const laterAttempt = await db
    .collection("attempts")
    .findOne({ userId: studentId }, { sort: { attemptSequence: -1 } });
  await db
    .collection("attempts")
    .updateOne(
      { _id: laterAttempt!._id },
      { $set: { createdAt: new Date("2000-01-01") } },
    );
  assert.ok(
    (await (await request("/api/v1/dashboard")).json()).data.suggestions.some(
      (entry: { ruleCode: string }) => entry.ruleCode === "LAST_THREE_SUPPORT",
    ),
  );
  if (process.argv.includes("--adjustment-browser")) {
    console.log(
      `Adjustment browser source: /content/${supportSource.id}; active plan retained in disposable fixture.`,
    );
  }
  console.log(
    "PASS: adjustment evidence/non-triggers, no-useful result, explicit review without mutation, new-practice staleness, transactional rollback, concurrent replay and completion/history preservation.",
  );
  for (const window of [rateWindow, rateWindow + 1]) {
    const bucketId = createHmac("sha256", rateSecret)
      .update(`plan-previews:${studentId}:${window}`)
      .digest("hex");
    await db
      .collection<{ _id: string; count: number; expiresAt: Date }>(
        "rateBuckets",
      )
      .updateOne(
        { _id: bucketId },
        {
          $set: {
            count: 10,
            expiresAt: new Date((window + 1) * 600000 + 86400000),
          },
        },
        { upsert: true },
      );
  }
  const limited = await request(
    "/api/v1/plan-previews",
    "POST",
    { kind: "initial", expectedStateRevision: await revision() },
    protection,
  );
  assert.equal(limited.headers.get("retry-after"), "600");
  await error(limited, 429, "RATE_LIMITED");
  if (process.argv.includes("--browser")) {
    if (!process.argv.includes("--adjustment-browser"))
      await db
        .collection("profiles")
        .updateOne(
          { userId: studentId },
          { $set: { activePlanId: null }, $inc: { stateRevision: 1 } },
        );
    await db.collection("rateBuckets").deleteMany({});
  }
  console.log(
    "PASS: planning ownership/CSRF, preview bounds, expiry/date/config/catalog/state guards, acceptance receipts/races, rollback, history preservation, owned resource completion and persisted dashboard.",
  );
}
