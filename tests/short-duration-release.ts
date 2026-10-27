import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createServer } from "node:net";
import { MongoClient } from "mongodb";
import { migrateDatabase } from "../scripts/database-migrations";
import { minimumDeadline } from "../src/modules/identity/preferences-schema";

const database = `prep_pilot_duration_test_${randomBytes(6).toString("hex")}`;
const origin = "http://127.0.0.1:3123";
const password = "Disposable-duration-browser-only-481!";
let stage = "configuration";

async function main() {
  assert.ok(process.env.MONGODB_URI, "MongoDB configuration is required.");
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
    cookie = "",
    csrf = "",
  ) {
    return fetch(`${origin}${path}`, {
      method,
      redirect: "manual",
      signal: AbortSignal.timeout(60000),
      headers: {
        origin,
        "Content-Type": "application/json",
        cookie,
        "x-csrf-token": csrf,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  }
  async function signup(email: string) {
    const response = await request("/api/auth/sign-up/email", "POST", {
      name: "Disposable duration actor",
      email,
      password,
    });
    assert.equal(response.status, 200);
    const cookie = response.headers
      .getSetCookie()
      .map((value) => value.split(";")[0])
      .join("; ");
    const me = (
      await (await request("/api/v1/me", "GET", undefined, cookie)).json()
    ).data;
    const csrf = (
      await (
        await request("/api/v1/security/csrf", "GET", undefined, cookie)
      ).json()
    ).data.token;
    return { cookie, csrf, me };
  }
  try {
    await client.connect();
    assert.match(database, /^prep_pilot_duration_test_[a-f0-9]{12}$/);
    assert.equal(
      (await db.listCollections().toArray()).length,
      0,
      "Refuse an existing database",
    );
    created = true;
    await migrateDatabase(db);
    await new Promise<void>((resolve, reject) => {
      const probe = createServer();
      probe.once("error", reject);
      probe.listen(3123, "127.0.0.1", () => probe.close(() => resolve()));
    });
    server = spawn(
      process.execPath,
      [
        "node_modules/next/dist/bin/next",
        "start",
        "--hostname",
        "127.0.0.1",
        "--port",
        "3123",
      ],
      { env: environment, stdio: "ignore" },
    );
    let ready = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      assert.equal(server.exitCode, null, "Owned production server exited");
      try {
        ready = (
          await fetch(`${origin}/api/health`, {
            signal: AbortSignal.timeout(1500),
          })
        ).ok;
      } catch {}
      if (ready) break;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    assert.ok(ready, "Production server must be ready");
    stage = "fixture actors";
    const admin = await signup("duration-admin@example.com");
    await db
      .collection("profiles")
      .updateOne(
        { userId: admin.me.userId },
        { $set: { role: "admin" }, $inc: { stateRevision: 1 } },
      );
    const student = await signup("duration-student@example.com");
    stage = "admin duration boundaries";
    const ids: string[] = [];
    for (const minutes of [1, 5, 7, 60]) {
      const response = await request(
        "/api/v1/admin/content",
        "POST",
        {
          slug: `duration-${minutes}`,
          title: `Duration fixture ${minutes} minutes`,
          subject: "aptitude",
          topic: "quantitative",
          type: "question",
          difficulty: "easy",
          estimatedMinutes: minutes,
          source: "Disposable duration regression fixture",
          attribution: "Synthetic test-only content, not editorial material",
          prompt: "Disposable question for duration validation.",
          explanation: "Synthetic explanation.",
          reviewedAt: new Date().toISOString(),
        },
        admin.cookie,
        admin.csrf,
      );
      assert.equal(response.status, 201);
      const item = (await response.json()).data;
      ids.push(item.id);
      assert.equal(item.estimatedMinutes, minutes);
      const published = await request(
        `/api/v1/admin/content/${item.id}/publish`,
        "POST",
        { expectedRevision: item.revision },
        admin.cookie,
        admin.csrf,
      );
      assert.equal(published.status, 200);
    }
    const target = ids[0]!;
    let revision = 2;
    for (const minutes of [2, 1]) {
      const response = await request(
        `/api/v1/admin/content/${target}`,
        "PATCH",
        { expectedRevision: revision, estimatedMinutes: minutes },
        admin.cookie,
        admin.csrf,
      );
      assert.equal(response.status, 200);
      const saved = (await response.json()).data;
      assert.equal(saved.estimatedMinutes, minutes);
      revision = saved.revision;
    }
    const auditBefore = await db.collection("adminAudit").countDocuments();
    for (const minutes of [0, -1, 0.5, 61, "1"]) {
      const response = await request(
        `/api/v1/admin/content/${target}`,
        "PATCH",
        { expectedRevision: revision, estimatedMinutes: minutes },
        admin.cookie,
        admin.csrf,
      );
      assert.equal(response.status, 422);
      const error = await response.json();
      assert.equal(error.error.code, "VALIDATION_ERROR");
      assert.match(error.error.fields.estimatedMinutes.join(" "), /1 to 60/);
    }
    assert.equal(
      await db.collection("adminAudit").countDocuments(),
      auditBefore,
    );
    const unchanged = (
      await (
        await request(
          `/api/v1/admin/content/${target}`,
          "GET",
          undefined,
          admin.cookie,
        )
      ).json()
    ).data;
    assert.equal(unchanged.revision, revision);
    assert.equal(unchanged.estimatedMinutes, 1);
    console.log(
      "PASS compiled admin create/PATCH: short estimates persist; invalid values return safe 422 without writes",
    );
    stage = "student reads and budget";
    const list = (
      await (
        await request("/api/v1/content", "GET", undefined, student.cookie)
      ).json()
    ).data;
    assert.deepEqual(
      list
        .map((item: { estimatedMinutes: number }) => item.estimatedMinutes)
        .sort((left: number, right: number) => left - right),
      [1, 5, 7, 60],
    );
    const detail = (
      await (
        await request(
          `/api/v1/content/${target}`,
          "GET",
          undefined,
          student.cookie,
        )
      ).json()
    ).data;
    assert.equal(detail.estimatedMinutes, 1);
    const preferences = await request(
      "/api/v1/me/preferences",
      "PATCH",
      {
        companies: ["cognizant"],
        deadline: minimumDeadline(),
        dailyMinutes: 30,
        skills: { dsa: 3, aptitude: 3, cs: 3 },
        expectedStateRevision: student.me.stateRevision,
      },
      student.cookie,
      student.csrf,
    );
    assert.equal(preferences.status, 200);
    const profile = (await preferences.json()).data;
    const preview = await request(
      "/api/v1/plan-previews",
      "POST",
      { kind: "initial", expectedStateRevision: profile.stateRevision },
      student.cookie,
      student.csrf,
    );
    assert.equal(preview.status, 201);
    const proposal = (await preview.json()).data.proposal;
    assert.deepEqual(
      proposal.tasks
        .map((task: { estimatedMinutes: number }) => task.estimatedMinutes)
        .sort((left: number, right: number) => left - right),
      [1, 5, 7],
    );
    assert.equal(
      new Set(
        proposal.tasks.map((task: { contentId: string }) => task.contentId),
      ).size,
      3,
    );
    assert.ok(
      proposal.deferred.some(
        (task: { contentId: string; reasonCode: string }) =>
          task.contentId === ids[3] && task.reasonCode === "CAPACITY",
      ),
    );
    for (const date of new Set(
      proposal.tasks.map(
        (task: { scheduledDate: string }) => task.scheduledDate,
      ),
    ))
      assert.ok(
        proposal.tasks
          .filter(
            (task: { scheduledDate: string }) => task.scheduledDate === date,
          )
          .reduce(
            (sum: number, task: { estimatedMinutes: number }) =>
              sum + task.estimatedMinutes,
            0,
          ) <= 30,
      );
    assert.equal(await db.collection("attempts").countDocuments(), 0);
    console.log(
      "PASS compiled student list/detail and plan preview: exact 1/5/7 minutes, no duplicates, daily <=30; 60-minute item deferred",
    );
    if (process.argv.includes("--browser")) {
      console.log(
        `BROWSER READY: ${origin}/login; disposable database ${database}; press Enter to clean up`,
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
  } finally {
    server?.kill();
    if (server && server.exitCode === null)
      await new Promise<void>((resolve) => {
        server!.once("exit", resolve);
        setTimeout(resolve, 5000);
      });
    try {
      if (created) {
        assert.match(database, /^prep_pilot_duration_test_[a-f0-9]{12}$/);
        await db.dropDatabase();
        console.log("Disposable duration database cleaned");
      }
    } finally {
      await client.close();
    }
  }
}
main().catch(() => {
  console.error(
    `FAIL short-duration compiled checks at ${stage}; no credentials or response bodies logged`,
  );
  process.exitCode = 1;
});
