import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createServer } from "node:net";
import { MongoClient, ObjectId } from "mongodb";
import { migrateDatabase } from "../scripts/database-migrations";
import { minimumDeadline } from "../src/modules/identity/preferences-schema";

const sourceName = "prep_pilot_dev";
const databaseName = `pp_resource_release_${randomBytes(6).toString("hex")}`;
const origin = "http://127.0.0.1:3154";
const sourceSlugs = [
  "dsa-arrays-running-totals",
  "cs-os-process-thread-boundaries",
  "cs-net-http-request-response",
];
let stage = "configuration";

async function main() {
  assert.ok(process.env.MONGODB_URI);
  assert.equal(process.env.MONGODB_DB_NAME, sourceName);
  assert.match(databaseName, /^pp_resource_release_[a-f0-9]{12}$/);
  assert.notEqual(databaseName, sourceName);
  const client = new MongoClient(process.env.MONGODB_URI, {
    maxPoolSize: 2,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 15000,
  });
  const database = client.db(databaseName);
  let server: ChildProcess | undefined;
  let created = false;
  let cookie = "";
  let csrf = "";
  async function request(path: string, method = "GET", body?: object) {
    return fetch(origin + path, {
      method,
      redirect: "manual",
      signal: AbortSignal.timeout(30000),
      headers: {
        origin,
        "content-type": "application/json",
        cookie,
        ...(body ? { "x-csrf-token": csrf } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  }
  async function data(path: string, method = "GET", body?: object) {
    const response = await request(path, method, body);
    assert.ok(response.ok, `${stage}: HTTP ${response.status}`);
    return (await response.json()).data;
  }
  try {
    await client.connect();
    stage = "read-only published content snapshot";
    const originals = await client
      .db(sourceName)
      .collection("contentItems")
      .find(
        { slug: { $in: sourceSlugs }, status: "published" },
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
      .toArray();
    assert.equal(originals.length, 3);
    assert.equal(
      originals.filter((item) => item.type === "resource").length,
      2,
    );
    assert.ok(
      originals.every(
        (item) =>
          item.assetIds.length === 0 &&
          item.companies.length === 0 &&
          item.reviewedAt,
      ),
    );
    stage = "isolated fixture setup";
    assert.equal((await database.listCollections().toArray()).length, 0);
    await new Promise<void>((resolve, reject) => {
      const probe = createServer();
      probe.once("error", reject);
      probe.listen(3154, "127.0.0.1", () => probe.close(() => resolve()));
    });
    created = true;
    await migrateDatabase(database);
    const now = new Date();
    await database.collection("contentItems").insertMany(
      originals.map((item) => ({
        ...item,
        _id: new ObjectId(),
        createdBy: "disposable-public-content-copy",
        updatedBy: "disposable-public-content-copy",
        status: "published",
        revision: 1,
        publishedAt: now,
        archivedAt: null,
        schemaVersion: 1,
        createdAt: now,
        updatedAt: now,
      })),
    );
    await database
      .collection("catalogState")
      .updateOne(
        { _id: "catalog" as never },
        { $inc: { revision: 3, commitSerial: 3 } },
      );
    server = spawn(
      process.execPath,
      [
        "node_modules/next/dist/bin/next",
        "start",
        "--hostname",
        "127.0.0.1",
        "--port",
        "3154",
      ],
      {
        env: {
          ...process.env,
          NODE_OPTIONS: "",
          NODE_ENV: "production",
          APP_URL: origin,
          MONGODB_DB_NAME: databaseName,
          AUTH_ENABLED: "true",
          EMAIL_MODE: "test",
          EMAIL_DELIVERY_MODE: "disabled",
          FILES_ENABLED: "false",
          BETTER_AUTH_SECRET: randomBytes(32).toString("hex"),
          CSRF_SECRET: randomBytes(32).toString("hex"),
          RATE_LIMIT_SECRET: randomBytes(32).toString("hex"),
        },
        stdio: "ignore",
      },
    );
    stage = "compiled disposable server";
    console.log(
      JSON.stringify({
        database: databaseName,
        port: 3154,
        ownedServerPid: server.pid,
        source: "three public content copies only; no real accounts or history",
      }),
    );
    let ready = false;
    for (let count = 0; count < 60; count++) {
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
    stage = "disposable student signup";
    const signup = await request("/api/auth/sign-up/email", "POST", {
      name: "Disposable resource reader",
      email: `resource-${randomBytes(6).toString("hex")}@example.invalid`,
      password: randomBytes(24).toString("base64url"),
    });
    assert.equal(signup.status, 200);
    cookie = signup.headers
      .getSetCookie()
      .map((value) => value.split(";")[0])
      .join("; ");
    assert.ok(cookie);
    csrf = (await data("/api/v1/security/csrf")).token;
    stage = "preferences and explicit plan acceptance";
    const me = await data("/api/v1/me");
    assert.equal(me.role, "student");
    await data("/api/v1/me/preferences", "PATCH", {
      expectedStateRevision: me.stateRevision,
      companies: ["cognizant", "ltm"],
      deadline: minimumDeadline(),
      dailyMinutes: 30,
      skills: { dsa: 3, aptitude: 3, cs: 3 },
    });
    const current = await data("/api/v1/plans/current");
    const preview = await data("/api/v1/plan-previews", "POST", {
      kind: "initial",
      expectedStateRevision: current.stateRevision,
    });
    const proposed = await data(`/api/v1/plan-previews/${preview.id}`);
    assert.equal(proposed.proposal.tasks.length, 3);
    assert.equal(
      new Set(
        proposed.proposal.tasks.map(
          (task: { contentId: string }) => task.contentId,
        ),
      ).size,
      3,
    );
    assert.ok(
      proposed.dailyTotals.every(
        (day: { afterMinutes: number; budgetMinutes: number }) =>
          day.afterMinutes <= day.budgetMinutes && day.budgetMinutes === 30,
      ),
    );
    const accepted = await data(
      `/api/v1/plan-previews/${preview.id}/confirm`,
      "POST",
      {
        acknowledgedDeferredIds: proposed.proposal.deferred.map(
          (task: { taskId: string }) => task.taskId,
        ),
      },
    );
    const resources = accepted.plan.tasks.filter(
      (task: { contentSnapshot: { type: string } }) =>
        task.contentSnapshot.type === "resource",
    );
    assert.equal(resources.length, 2);
    stage = "resource list request within the documented 50-item maximum";
    const list = await data("/api/v1/content?limit=50");
    assert.equal(list.length, 3);
    for (const task of resources) {
      stage = `resource list membership ${task.contentId}`;
      const summary = list.find(
        (item: { id: string }) => item.id === task.contentId,
      );
      assert.ok(summary);
      assert.equal(summary.type, "resource");
      stage = `resource detail ${task.contentId}`;
      const detail = await data(`/api/v1/content/${task.contentId}`);
      assert.ok(detail.body);
      assert.ok([10, 12].includes(detail.estimatedMinutes));
      stage = `resource page ${task.contentId}`;
      const page = await request(
        `/content/${task.contentId}?planId=${accepted.plan.id}&taskId=${task.taskId}`,
      );
      assert.equal(page.status, 200);
      const html = await page.text();
      assert.match(html, /Mark as studied/);
      assert.doesNotMatch(html, /How did this attempt go/);
      stage = `resource completion ${task.contentId}`;
      const fresh = await data("/api/v1/plans/current");
      await data(
        `/api/v1/plans/${accepted.plan.id}/tasks/${task.taskId}`,
        "PATCH",
        { status: "completed", expectedStateRevision: fresh.stateRevision },
      );
    }
    stage = "Dashboard and Progress reading metrics";
    const dashboard = await data("/api/v1/dashboard");
    const progress = await data("/api/v1/progress");
    assert.equal(dashboard.progress.readingCompleted, 2);
    assert.equal(dashboard.progress.distinctAttempted, 0);
    assert.equal(progress.activePlan.readingCompleted, 2);
    assert.equal(progress.activePlan.completed, 2);
    assert.equal(progress.activePlan.total, 3);
    assert.equal(progress.submissions, 0);
    assert.equal(progress.distinctAttempted, 0);
    assert.equal(progress.currentlySolved, 0);
    assert.deepEqual(await data("/api/v1/revisions?dueOnly=false"), []);
    assert.equal(await database.collection("attempts").countDocuments({}), 0);
    assert.equal(await database.collection("plans").countDocuments({}), 1);
    console.log(
      "PASS two published resource copies: preview -> explicit acceptance -> open -> mark studied -> Dashboard/Progress readingCompleted=2, task completion=2/3, zero attempts/revisions; daily budgets respected.",
    );
  } finally {
    if (server && server.exitCode === null) {
      server.kill();
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, 5000);
        server!.once("exit", () => {
          clearTimeout(timer);
          resolve();
        });
      });
    }
    try {
      if (created) {
        assert.match(databaseName, /^pp_resource_release_[a-f0-9]{12}$/);
        assert.notEqual(databaseName, sourceName);
        await database.dropDatabase();
        const remaining = await client
          .db("admin")
          .admin()
          .listDatabases({ nameOnly: true });
        assert.equal(
          remaining.databases.some((item) => item.name === databaseName),
          false,
        );
        console.log(
          `CLEANED exact disposable database ${databaseName}; owned server stopped.`,
        );
      }
    } finally {
      await client.close();
    }
  }
}
main().catch((error) => {
  console.error(
    JSON.stringify({
      stage,
      type: error instanceof Error ? error.name : "unknown",
      message:
        error instanceof assert.AssertionError
          ? `Assertion ${error.operator}`
          : "Details withheld; no secrets or response bodies logged",
      ...(error instanceof assert.AssertionError &&
      typeof error.actual === "number" &&
      typeof error.expected === "number"
        ? { actual: error.actual, expected: error.expected }
        : {}),
    }),
  );
  process.exitCode = 1;
});
