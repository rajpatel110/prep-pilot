import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { createServer } from "node:net";
import { MongoClient } from "mongodb";
import { migrateDatabase } from "../scripts/database-migrations";
import { minimumDeadline } from "../src/modules/identity/preferences-schema";

type Actor = { cookie: string; csrf: string; userId: string };
type Task = {
  taskId: string;
  contentId: string;
  estimatedMinutes: number;
  scheduledDate: string;
};
const database = `prep_pilot_plan_test_${randomBytes(6).toString("hex")}`;
const origin = "http://127.0.0.1:3124";
const password = "Disposable-catalog-journey-only-481!";
let stage = "configuration";

async function main() {
  assert.ok(process.env.MONGODB_URI);
  assert.equal(
    process.env.MONGODB_DB_NAME,
    "prep_pilot_dev",
    "Select the documented read-only catalog source explicitly",
  );
  const client = new MongoClient(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 4,
  });
  const db = client.db(database);
  let server: ChildProcess | undefined;
  let created = false;
  const environment = {
    ...process.env,
    APP_URL: origin,
    MONGODB_DB_NAME: database,
    AUTH_ENABLED: "true",
    EMAIL_MODE: "test",
    EMAIL_DELIVERY_MODE: "disabled",
    FILES_ENABLED: "false",
    BETTER_AUTH_SECRET: randomBytes(32).toString("hex"),
    CSRF_SECRET: randomBytes(32).toString("hex"),
    RATE_LIMIT_SECRET: randomBytes(32).toString("hex"),
  };
  async function request(
    path: string,
    method = "GET",
    body?: unknown,
    actor?: Actor,
  ) {
    return fetch(origin + path, {
      method,
      redirect: "manual",
      signal: AbortSignal.timeout(60000),
      headers: {
        origin,
        "Content-Type": "application/json",
        ...(actor ? { cookie: actor.cookie, "x-csrf-token": actor.csrf } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  }
  async function json(path: string, actor: Actor) {
    const response = await request(path, "GET", undefined, actor);
    assert.equal(response.status, 200, `${stage}: ${path}`);
    return (await response.json()).data;
  }
  async function signup(email: string): Promise<Actor> {
    const response = await request("/api/auth/sign-up/email", "POST", {
      name: "Disposable catalog student",
      email,
      password,
    });
    assert.equal(response.status, 200);
    const cookie = response.headers
      .getSetCookie()
      .map((value) => value.split(";")[0])
      .join("; ");
    const actor = { cookie, csrf: "", userId: "" };
    actor.userId = (await json("/api/v1/me", actor)).userId;
    actor.csrf = (await json("/api/v1/security/csrf", actor)).token;
    return actor;
  }
  async function pause(label: string) {
    if (!process.argv.includes("--browser")) return;
    console.log(
      `${label}: ${origin}; disposable database ${database}; press Enter to continue`,
    );
    await new Promise<void>((resolve) => {
      const finish = () => {
        clearTimeout(timer);
        process.stdin.off("data", finish);
        process.stdin.pause();
        resolve();
      };
      const timer = setTimeout(finish, 600000);
      process.stdin.once("data", finish);
      process.stdin.resume();
    });
  }
  async function preferences(actor: Actor, skills: number) {
    const me = await json("/api/v1/me", actor);
    const response = await request(
      "/api/v1/me/preferences",
      "PATCH",
      {
        companies: ["cognizant", "ltm"],
        deadline: minimumDeadline(),
        dailyMinutes: 30,
        skills: { dsa: skills, aptitude: skills, cs: skills },
        expectedStateRevision: me.stateRevision,
      },
      actor,
    );
    assert.equal(response.status, 200);
  }
  async function preview(actor: Actor) {
    const me = await json("/api/v1/me", actor);
    const response = await request(
      "/api/v1/plan-previews",
      "POST",
      { kind: "initial", expectedStateRevision: me.stateRevision },
      actor,
    );
    assert.equal(response.status, 201);
    return (await response.json()).data;
  }
  try {
    await client.connect();
    stage = "catalog-only source snapshot";
    const sourceItems = await client
      .db("prep_pilot_dev")
      .collection("contentItems")
      .find(
        { status: "published" },
        {
          projection: {
            _id: 0,
            slug: 1,
            title: 1,
            subject: 1,
            topic: 1,
            type: 1,
            difficulty: 1,
            estimatedMinutes: 1,
            source: 1,
            attribution: 1,
            tags: 1,
            companies: 1,
            prompt: 1,
            body: 1,
            explanation: 1,
            externalUrl: 1,
            reviewedAt: 1,
            assetIds: 1,
          },
        },
      )
      .sort({ slug: 1 })
      .toArray();
    assert.equal(
      sourceItems.length,
      7,
      "Reassess coverage if the catalog changed",
    );
    assert.ok(
      sourceItems.every(
        (item) => item.type === "question" && item.assetIds.length === 0,
      ),
    );
    assert.equal(
      sourceItems.reduce((sum, item) => sum + item.estimatedMinutes, 0),
      112,
    );
    assert.equal(
      sourceItems.find(
        (item) => item.slug === "apt-original-mixture-replacement",
      )!.estimatedMinutes,
      7,
    );
    assert.equal(
      sourceItems.find(
        (item) => item.slug === "apt-original-paths-in-small-dag",
      )!.estimatedMinutes,
      5,
    );
    console.log(
      "Catalog-only snapshot: seven questions, six topics, 112 estimated minutes; no accounts/sessions/history copied",
    );
    stage = "disposable namespace setup";
    assert.match(database, /^prep_pilot_plan_test_[a-f0-9]{12}$/);
    assert.notEqual(database, "prep_pilot_dev");
    assert.equal(
      (await db.listCollections().toArray()).length,
      0,
      "Refuse an existing fixture database",
    );
    created = true;
    stage = "disposable migrations";
    await migrateDatabase(db);
    await new Promise<void>((resolve, reject) => {
      const probe = createServer();
      probe.once("error", reject);
      probe.listen(3124, "127.0.0.1", () => probe.close(() => resolve()));
    });
    server = spawn(
      process.execPath,
      [
        "node_modules/next/dist/bin/next",
        "start",
        "--hostname",
        "127.0.0.1",
        "--port",
        "3124",
      ],
      { env: environment, stdio: "ignore" },
    );
    let ready = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      assert.equal(server.exitCode, null);
      try {
        ready = (
          await fetch(origin + "/api/health", {
            signal: AbortSignal.timeout(1500),
          })
        ).ok;
      } catch {}
      if (ready) break;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    assert.ok(ready);
    stage = "disposable catalog copies";
    const admin = await signup("catalog-admin@example.com");
    await db
      .collection("profiles")
      .updateOne(
        { userId: admin.userId },
        { $set: { role: "admin" }, $inc: { stateRevision: 1 } },
      );
    const copiedIds = new Map<string, string>();
    for (const item of sourceItems) {
      const response = await request(
        "/api/v1/admin/content",
        "POST",
        item,
        admin,
      );
      assert.equal(response.status, 201, "Create representative copy");
      const copy = (await response.json()).data;
      copiedIds.set(item.slug, copy.id);
      const published = await request(
        `/api/v1/admin/content/${copy.id}/publish`,
        "POST",
        { expectedRevision: copy.revision },
        admin,
      );
      assert.equal(published.status, 200);
    }
    stage = "preferences and initial preview";
    const student = await signup("catalog-student@example.com");
    await preferences(student, 3);
    const proposed = await preview(student);
    const tasks: Task[] = proposed.proposal.tasks;
    assert.equal(tasks.length, 7);
    assert.equal(
      new Set(tasks.map((task) => task.contentId)).size,
      tasks.length,
    );
    assert.equal(new Set(tasks.map((task) => task.taskId)).size, tasks.length);
    assert.equal(
      tasks.reduce((sum, task) => sum + task.estimatedMinutes, 0),
      112,
    );
    for (const minutes of [5, 7])
      assert.ok(tasks.some((task) => task.estimatedMinutes === minutes));
    assert.ok(
      proposed.dailyTotals.every(
        (day: { afterMinutes: number; budgetMinutes: number }) =>
          day.afterMinutes <= day.budgetMinutes && day.budgetMinutes === 30,
      ),
    );
    assert.equal(proposed.proposal.deferred.length, 0);
    console.log(
      `PASS preferences/preview: ${tasks.length} unique questions, 112/210 window minutes, exact 7/5 estimates; preview ${proposed.id}`,
    );
    const limited = await signup("catalog-easy@example.com");
    await preferences(limited, 1);
    const limitedPreview = await preview(limited);
    assert.equal(limitedPreview.proposal.tasks.length, 3);
    assert.equal(
      limitedPreview.proposal.tasks.reduce(
        (sum: number, task: Task) => sum + task.estimatedMinutes,
        0,
      ),
      55,
    );
    assert.ok(
      !limitedPreview.proposal.tasks.some(
        (task: { contentSnapshot: { subject: string } }) =>
          task.contentSnapshot.subject === "aptitude",
      ),
    );
    console.log(
      `PASS easy-only shortage: three eligible questions/55 minutes, no fabricated aptitude; preview ${limitedPreview.id}`,
    );
    await pause("BROWSER PREVIEW READY");
    stage = "acceptance";
    const accepted = await request(
      `/api/v1/plan-previews/${proposed.id}/confirm`,
      "POST",
      { acknowledgedDeferredIds: [] },
      student,
    );
    assert.equal(accepted.status, 201);
    const plan = (await accepted.json()).data.plan;
    assert.equal(plan.tasks.length, 7);
    assert.equal(
      (await json("/api/v1/plans/current", student)).plan.id,
      plan.id,
    );
    const before = await json("/api/v1/dashboard", student);
    assert.equal(before.progress.distinctAttempted, 0);
    assert.equal(before.progress.planCompleted, 0);
    stage = "practice without automatic task completion";
    const contentId = copiedIds.get("apt-original-paths-in-small-dag")!;
    const selected = plan.tasks.find(
      (task: Task) => task.contentId === contentId,
    );
    assert.ok(selected);
    const attempted = await request(
      "/api/v1/attempts",
      "POST",
      {
        submissionId: randomUUID(),
        contentId,
        kind: "practice",
        outcome: "independent",
      },
      student,
    );
    assert.equal(attempted.status, 201);
    const attempt = (await attempted.json()).data;
    assert.equal(attempt.revision.intervalDays, 7);
    const practiceOnly = await json("/api/v1/dashboard", student);
    assert.equal(practiceOnly.progress.distinctAttempted, 1);
    assert.equal(practiceOnly.progress.currentlySolved, 1);
    assert.equal(practiceOnly.progress.planCompleted, 0);
    stage = "explicit task completion and metrics";
    const me = await json("/api/v1/me", student);
    const completed = await request(
      `/api/v1/plans/${plan.id}/tasks/${selected.taskId}`,
      "PATCH",
      { status: "completed", expectedStateRevision: me.stateRevision },
      student,
    );
    assert.equal(completed.status, 200);
    const dashboard = await json("/api/v1/dashboard", student);
    assert.equal(dashboard.progress.distinctAttempted, 1);
    assert.equal(dashboard.progress.currentlySolved, 1);
    assert.equal(dashboard.progress.planCompleted, 1);
    assert.equal(dashboard.progress.planTotal, 7);
    assert.equal(dashboard.progress.readingCompleted, 0);
    const progress = await json("/api/v1/progress", student);
    assert.equal(progress.submissions, 1);
    assert.equal(progress.distinctAttempted, 1);
    assert.equal(progress.currentlySolved, 1);
    assert.equal(progress.activePlan.completed, 1);
    assert.equal(progress.activePlan.total, 7);
    assert.equal(progress.activePlan.readingCompleted, 0);
    const revisionResponse = await request(
      "/api/v1/revisions?dueOnly=false",
      "GET",
      undefined,
      student,
    );
    assert.equal(revisionResponse.status, 200);
    const revisions = (await revisionResponse.json()).data;
    assert.equal(revisions.length, 1);
    assert.equal(revisions[0].contentId, contentId);
    assert.equal(revisions[0].dueDate, attempt.revision.dueDate);
    assert.equal(
      (
        await (
          await request(
            "/api/v1/revisions?dueOnly=true",
            "GET",
            undefined,
            student,
          )
        ).json()
      ).data.length,
      0,
    );
    assert.equal(await db.collection("attempts").countDocuments(), 1);
    console.log(
      `PASS accepted plan -> independent practice -> explicit completion -> Dashboard/Progress/Revisions: 1 attempt, 1/7 complete, revision ${attempt.revision.dueDate}, no resource claim`,
    );
    await pause("BROWSER METRICS READY");
  } finally {
    server?.kill();
    if (server && server.exitCode === null)
      await new Promise<void>((resolve) => {
        server!.once("exit", resolve);
        setTimeout(resolve, 5000);
      });
    try {
      if (created) {
        assert.match(database, /^prep_pilot_plan_test_[a-f0-9]{12}$/);
        await db.dropDatabase();
        console.log("Disposable catalog journey database cleaned");
      }
    } finally {
      await client.close();
    }
  }
}
main().catch((error) => {
  console.error(
    `FAIL published catalog journey at ${stage}: ${error instanceof assert.AssertionError ? error.message : error instanceof Error ? error.name : "unknown"}; code ${typeof error.code === "number" ? error.code : "unavailable"}; no secret values logged`,
  );
  process.exitCode = 1;
});
