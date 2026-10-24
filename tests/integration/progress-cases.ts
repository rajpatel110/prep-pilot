import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { ObjectId, type Db } from "mongodb";
import { studyDate } from "../../src/modules/identity/preferences-schema";

export async function exerciseProgress({
  db,
  request,
  studentCookie,
  adminCookie,
  studentId,
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
}) {
  assert.match(db.databaseName, /^prep_pilot_student_test_[a-f0-9]{12}$/);
  const auth = { cookie: studentCookie };
  const token = (
    await (
      await request("/api/v1/security/csrf", "GET", undefined, auth)
    ).json()
  ).data.token;
  const protection = { ...auth, "x-csrf-token": token };
  async function read() {
    const response = await request("/api/v1/progress", "GET", undefined, auth);
    const body = await response.json();
    assert.equal(response.status, 200, JSON.stringify(body));
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    assert.ok(response.headers.get("x-request-id"));
    return body.data;
  }
  assert.equal(
    (await request("/api/v1/progress", "GET", undefined, { cookie: "" }))
      .status,
    401,
  );
  assert.equal(
    (
      await request("/api/v1/progress", "GET", undefined, {
        cookie: adminCookie,
      })
    ).status,
    403,
  );
  assert.equal(
    (await request("/api/v1/progress?userId=other", "GET", undefined, auth))
      .status,
    422,
  );
  const question = await db
    .collection("contentItems")
    .findOne({ status: "published", type: "question" });
  assert.ok(question);
  async function record(kind: string, outcome: string) {
    const response = await request(
      "/api/v1/attempts",
      "POST",
      {
        submissionId: randomUUID(),
        contentId: String(question!._id),
        kind,
        outcome,
      },
      protection,
    );
    assert.equal(response.status, 201, JSON.stringify(await response.json()));
  }
  await record("practice", "independent");
  const independent = await read();
  await record("revision", "failed");
  const failed = await read();
  assert.equal(failed.submissions, independent.submissions + 1);
  assert.equal(failed.distinctAttempted, independent.distinctAttempted);
  assert.equal(failed.currentlySolved, independent.currentlySolved - 1);
  const attempts = await db
    .collection("attempts")
    .find({ userId: studentId })
    .sort({ attemptSequence: -1 })
    .toArray();
  const latest = new Map();
  for (const attempt of attempts)
    if (!latest.has(String(attempt.contentId)))
      latest.set(String(attempt.contentId), attempt);
  assert.equal(failed.submissions, attempts.length);
  assert.equal(
    failed.practiceSubmissions,
    attempts.filter((item) => item.kind === "practice").length,
  );
  assert.equal(
    failed.revisionSubmissions,
    attempts.filter((item) => item.kind === "revision").length,
  );
  assert.equal(failed.distinctAttempted, latest.size);
  assert.equal(
    failed.currentlySolved,
    [...latest.values()].filter((item) => item.outcome === "independent")
      .length,
  );
  const foreign = {
    ...attempts[0]!,
    _id: new ObjectId(),
    userId: "disposable-progress-other",
    submissionId: randomUUID(),
  };
  await db.collection("attempts").insertOne(foreign);
  const isolated = await read();
  assert.deepEqual({ ...isolated, asOf: null }, { ...failed, asOf: null });
  await db
    .collection("attempts")
    .deleteMany({ userId: "disposable-progress-other" });
  const profile = await db
    .collection("profiles")
    .findOne({ userId: studentId });
  assert.ok(profile);
  const active = await db
    .collection("plans")
    .findOne({ _id: profile.activePlanId, userId: studentId });
  if (active) {
    assert.equal(
      failed.activePlan.completed,
      active.tasks.filter(
        (task: { status: string }) => task.status === "completed",
      ).length,
    );
    assert.equal(failed.activePlan.total, active.tasks.length);
    assert.equal(
      failed.activePlan.readingCompleted,
      active.tasks.filter(
        (task: { status: string; contentSnapshot: { type: string } }) =>
          task.status === "completed" &&
          task.contentSnapshot.type === "resource",
      ).length,
    );
  }
  assert.equal(
    failed.historicalPlanVersions,
    (await db.collection("plans").countDocuments({ userId: studentId })) -
      (active ? 1 : 0),
  );
  const beforePlans = await db
    .collection("plans")
    .find({ userId: studentId })
    .toArray();
  await db.collection("rateBuckets").deleteMany({});
  const previewResponse = await request(
    "/api/v1/plan-previews",
    "POST",
    {
      kind:
        active && active.windowEnd >= studyDate() ? "reschedule" : "initial",
      expectedStateRevision: profile.stateRevision,
    },
    protection,
  );
  const preview = (await previewResponse.json()).data;
  assert.equal(previewResponse.status, 201);
  const saved = await request(
    "/api/v1/me/preferences",
    "PATCH",
    {
      ...profile.preferences,
      dailyMinutes: profile.preferences.dailyMinutes === 60 ? 90 : 60,
      expectedStateRevision: profile.stateRevision,
    },
    protection,
  );
  assert.equal(saved.status, 200, JSON.stringify(await saved.json()));
  const stale = await request(
    `/api/v1/plan-previews/${preview.id}/confirm`,
    "POST",
    {
      acknowledgedDeferredIds: preview.proposal.deferred.map(
        (task: { taskId: string }) => task.taskId,
      ),
    },
    protection,
  );
  assert.equal(stale.status, 409);
  assert.equal((await stale.json()).error.code, "STALE_PREVIEW");
  assert.deepEqual(
    await db.collection("plans").find({ userId: studentId }).toArray(),
    beforePlans,
  );
  const deadline = profile.preferences.deadline;
  await db
    .collection("profiles")
    .updateOne(
      { userId: studentId },
      { $set: { "preferences.deadline": "2000-01-01" } },
    );
  assert.equal(
    (await request("/api/v1/progress", "GET", undefined, auth)).status,
    200,
  );
  await db
    .collection("profiles")
    .updateOne(
      { userId: studentId },
      { $set: { "preferences.deadline": deadline } },
    );
  const due = await db
    .collection("revisions")
    .countDocuments({ userId: studentId, dueDate: { $lte: studyDate() } });
  assert.equal((await read()).revisions.due, due);
  const cycle = await db
    .collection("revisions")
    .findOne({ userId: studentId, contentId: question._id });
  assert.ok(cycle);
  await db
    .collection("revisions")
    .updateOne({ _id: cycle._id }, { $set: { dueDate: studyDate() } });
  const available = await read();
  await db
    .collection("contentItems")
    .updateOne({ _id: question._id }, { $set: { status: "archived" } });
  const unavailable = await read();
  assert.equal(
    unavailable.revisions.unavailable,
    available.revisions.unavailable + 1,
  );
  assert.equal(unavailable.submissions, available.submissions);
  const history = await request(
    `/api/v1/attempts?contentId=${question._id}`,
    "GET",
    undefined,
    auth,
  );
  assert.equal(history.status, 200);
  assert.ok(
    (await history.json()).data.some(
      (item: { contentSnapshot: { title: string } }) =>
        item.contentSnapshot.title === question.title,
    ),
  );
  await db
    .collection("contentItems")
    .updateOne({ _id: question._id }, { $set: { status: "published" } });
  await db
    .collection("revisions")
    .updateOne({ _id: cycle._id }, { $set: { dueDate: cycle.dueDate } });
  const attemptIndex = await db
    .collection("attempts")
    .find({ userId: studentId })
    .sort({ attemptSequence: -1 })
    .explain("queryPlanner");
  assert.match(JSON.stringify(attemptIndex.queryPlanner), /IXSCAN/);
  const beforeUnavailable = await db
    .collection("profiles")
    .findOne({ userId: studentId }, { projection: { updatedAt: 0 } });
  const migrations = db.collection<{ _id: string; state: string }>(
    "schemaMigrations",
  );
  await migrations.updateOne(
    { _id: "003_planning" },
    { $set: { state: "progress-test-unavailable" } },
  );
  const unavailableSummary = await request(
    "/api/v1/progress",
    "GET",
    undefined,
    auth,
  );
  assert.equal(unavailableSummary.status, 503);
  const unavailableBody = await unavailableSummary.json();
  assert.ok(!("data" in unavailableBody));
  assert.equal(
    unavailableBody.requestId,
    unavailableSummary.headers.get("x-request-id"),
  );
  assert.equal(
    (await request("/api/v1/attempts?limit=5", "GET", undefined, auth)).status,
    200,
  );
  await migrations.updateOne(
    { _id: "003_planning" },
    { $set: { state: "applied" } },
  );
  assert.deepEqual(
    await db
      .collection("profiles")
      .findOne({ userId: studentId }, { projection: { updatedAt: 0 } }),
    beforeUnavailable,
  );
  console.log(
    "PASS: progress latest self-report/recall, exact totals, user isolation, active/historical tasks/resources, due/unavailable history, indexed owner reads, partial failure, expired-goal access, preference preview staleness and unchanged active plan.",
  );
}
