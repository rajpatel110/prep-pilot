import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createServer } from "node:net";
import { MongoClient } from "mongodb";
import { migrateDatabase } from "../../scripts/database-migrations";
import { exercisePractice } from "./practice-cases";
import { exercisePlanning } from "./planning-cases";
import { exerciseProgress } from "./progress-cases";
import {
  minimumDeadline,
  studyDate,
} from "../../src/modules/identity/preferences-schema";

let stage = "configuration";
async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required.");
  const database = `prep_pilot_student_test_${randomBytes(6).toString("hex")}`;
  const origin = "http://127.0.0.1:3104";
  const dev = process.argv.includes("--dev");
  const direct = process.argv.includes("--direct");
  const practice = process.argv.includes("--practice");
  const planning = process.argv.includes("--planning");
  const environment = {
    ...process.env,
    APP_URL: origin,
    MONGODB_DB_NAME: database,
    AUTH_ENABLED: "true",
    EMAIL_MODE: "test",
    BETTER_AUTH_SECRET: randomBytes(32).toString("hex"),
    CSRF_SECRET: randomBytes(32).toString("hex"),
    RATE_LIMIT_SECRET: randomBytes(32).toString("hex"),
  };
  if (direct) Object.assign(process.env, environment);
  const client = new MongoClient(process.env.MONGODB_URI, {
    maxPoolSize: 4,
    serverSelectionTimeoutMS: 10000,
  });
  const db = client.db(database);
  let server: ChildProcess | undefined;
  let cookie = "";
  const password = "Disposable-student-browser-only-481!";
  async function request(
    path: string,
    method = "GET",
    body?: unknown,
    extra: Record<string, string> = {},
  ) {
    const request = new Request(`${origin}${path}`, {
      method,
      redirect: "manual",
      signal: AbortSignal.timeout(60000),
      headers: {
        origin,
        "Content-Type": "application/json",
        ...(cookie ? { cookie } : {}),
        ...extra,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!direct) return fetch(request);
    const url = new URL(request.url);
    if (url.pathname === "/api/v1/progress")
      return (await import("../../src/app/api/v1/progress/route")).GET(request);
    const planningMatch =
      /^\/api\/v1\/(plan-previews|plans|dashboard)(?:\/([a-f0-9]{24}|current))?(?:\/(confirm))?$/.exec(
        url.pathname,
      );
    if (planningMatch) {
      const { planningHttp } = await import("../../src/modules/planning/http");
      const operation =
        planningMatch[1] === "dashboard"
          ? "dashboard"
          : planningMatch[1] === "plans"
            ? planningMatch[2] === "current"
              ? "current"
              : planningMatch[2]
                ? "plan"
                : "history"
            : planningMatch[3]
              ? "confirm"
              : planningMatch[2]
                ? "preview"
                : "create";
      return planningHttp(request, operation, planningMatch[2]);
    }
    if (url.pathname === "/api/v1/attempts") {
      const routes = await import("../../src/app/api/v1/attempts/route");
      return method === "POST" ? routes.POST(request) : routes.GET(request);
    }
    if (url.pathname === "/api/v1/revisions")
      return (await import("../../src/app/api/v1/revisions/route")).GET(
        request,
      );
    const taskMatch =
      /^\/api\/v1\/plans\/([a-f0-9]{24})\/tasks\/([a-f0-9-]{36})$/.exec(
        url.pathname,
      );
    if (taskMatch)
      return (
        await import("../../src/app/api/v1/plans/[id]/tasks/[taskId]/route")
      ).PATCH(request, {
        params: Promise.resolve({ id: taskMatch[1]!, taskId: taskMatch[2]! }),
      });
    if (url.pathname.startsWith("/api/auth/"))
      return (
        await (await import("../../src/modules/identity/auth")).getAuth()
      ).handler(request);
    if (url.pathname === "/api/v1/me/preferences")
      return (await import("../../src/app/api/v1/me/preferences/route")).PATCH(
        request,
      );
    if (url.pathname === "/api/v1/me")
      return (await import("../../src/app/api/v1/me/route")).GET(request);
    if (url.pathname === "/api/v1/security/csrf")
      return (await import("../../src/app/api/v1/security/csrf/route")).GET(
        request,
      );
    if (url.pathname === "/api/v1/content")
      return (await import("../../src/app/api/v1/content/route")).GET(request);
    if (url.pathname === "/api/v1/admin/content")
      return (await import("../../src/app/api/v1/admin/content/route")).POST(
        request,
      );
    const match =
      /^\/api\/v1\/(admin\/)?content\/([a-f0-9]{24})(?:\/(publish|archive))?$/.exec(
        url.pathname,
      );
    if (match) {
      const context = { params: Promise.resolve({ id: match[2]! }) };
      if (match[1] && !match[3] && method === "PATCH")
        return (
          await import("../../src/app/api/v1/admin/content/[id]/route")
        ).PATCH(request, context);
      if (!match[1])
        return (await import("../../src/app/api/v1/content/[id]/route")).GET(
          request,
          context,
        );
      if (match[3] === "publish")
        return (
          await import("../../src/app/api/v1/admin/content/[id]/publish/route")
        ).POST(request, context);
      if (match[3] === "archive")
        return (
          await import("../../src/app/api/v1/admin/content/[id]/archive/route")
        ).POST(request, context);
    }
    throw new Error("No direct test dispatcher for this endpoint.");
  }
  async function error(response: Response, status: number, code: string) {
    assert.equal(response.status, status, stage);
    const value = await response.json();
    assert.equal(value.error.code, code, stage);
    assert.equal(value.requestId, response.headers.get("x-request-id"));
    assert.equal(response.headers.get("cache-control"), "no-store");
    return value;
  }
  async function signup(email: string) {
    const response = await request("/api/auth/sign-up/email", "POST", {
      name: "Disposable student",
      email,
      password,
    });
    assert.equal(response.status, 200);
    cookie = response.headers
      .getSetCookie()
      .map((value) => value.split(";")[0])
      .join("; ");
    const me = (await (await request("/api/v1/me")).json()).data;
    return me;
  }
  async function csrf() {
    return (await (await request("/api/v1/security/csrf")).json()).data
      .token as string;
  }
  async function redirect(path: string, destination: string) {
    if (direct) return;
    const response = await request(path);
    let location = response.headers.get("location");
    if (response.status === 200) {
      const html = await response.text();
      location =
        /<meta[^>]*http-equiv="refresh"[^>]*content="\d+;url=([^"]+)"/
          .exec(html)?.[1]
          ?.replaceAll("&amp;", "&") ?? null;
      assert.ok(
        location,
        `${stage}: ${path} must contain a streaming redirect, not protected page data`,
      );
    } else assert.equal(response.status, 307, `${stage}: ${path}`);
    assert.equal(new URL(location!, origin).pathname, destination);
  }
  const preferences = {
    companies: ["cognizant", "ltm"],
    dailyMinutes: 90,
    deadline: minimumDeadline(),
    skills: { dsa: 2, aptitude: 3, cs: 1 },
    expectedStateRevision: 0,
  };
  try {
    await client.connect();
    await migrateDatabase(db);
    await new Promise<void>((resolve, reject) => {
      const probe = createServer();
      probe.once("error", reject);
      probe.listen(3104, "127.0.0.1", () => probe.close(() => resolve()));
    });
    if (!direct) {
      server = spawn(
        process.execPath,
        [
          "node_modules/next/dist/bin/next",
          ...(dev ? ["dev", "--webpack"] : ["start"]),
          "--hostname",
          "127.0.0.1",
          "--port",
          "3104",
        ],
        { env: environment, stdio: "ignore" },
      );
      let ready = false;
      for (let attempt = 0; attempt < 90; attempt++) {
        if (server.exitCode !== null) throw new Error("Owned server exited.");
        try {
          if (
            (
              await fetch(`${origin}/api/health`, {
                signal: AbortSignal.timeout(2000),
              })
            ).ok
          ) {
            ready = true;
            break;
          }
        } catch {}
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      assert.ok(ready);
    }
    stage = "anonymous access";
    await error(
      await request("/api/v1/me/preferences", "PATCH", preferences),
      401,
      "UNAUTHENTICATED",
    );
    await redirect("/content?subject=dsa", "/login");
    const student = await signup("student-browser@example.com");
    const studentCookie = cookie;
    assert.equal(student.role, "student");
    assert.equal(student.preferences, null);
    stage = "onboarding protection and preferences validation";
    await redirect("/content", "/onboarding");
    if (!direct) assert.equal((await request("/onboarding")).status, 200);
    const protection = { "x-csrf-token": await csrf() };
    await error(
      await request("/api/v1/me/preferences", "PATCH", preferences),
      403,
      "CSRF_INVALID",
    );
    await error(
      await request("/api/v1/me/preferences", "PATCH", preferences, {
        "x-csrf-token": "tampered",
      }),
      403,
      "CSRF_INVALID",
    );
    await error(
      await request("/api/v1/me/preferences", "PATCH", preferences, {
        ...protection,
        origin: "https://evil.example",
      }),
      403,
      "CSRF_INVALID",
    );
    for (const patch of [
      { role: "admin" },
      { userId: "another" },
      { timezone: "UTC" },
      { activePlanId: null },
      { deadline: studyDate() },
      { dailyMinutes: 31 },
      { skills: { dsa: 6, aptitude: 2, cs: 1 } },
    ]) {
      const value = await error(
        await request(
          "/api/v1/me/preferences",
          "PATCH",
          { ...preferences, ...patch },
          protection,
        ),
        422,
        "VALIDATION_ERROR",
      );
      assert.ok(value.error.fields);
    }
    assert.equal(
      (await db.collection("profiles").findOne({ userId: student.userId }))!
        .preferences,
      null,
    );
    const beforeCatalog = await db.collection("catalogState").findOne({});
    const savedResponse = await request(
      "/api/v1/me/preferences",
      "PATCH",
      preferences,
      protection,
    );
    assert.equal(savedResponse.status, 200);
    const saved = (await savedResponse.json()).data;
    assert.equal(saved.stateRevision, 1);
    assert.equal(saved.nextAction, "open_dashboard");
    assert.equal(saved.activePlanId, null);
    assert.equal(saved.planVersion, 0);
    assert.equal(saved.timezone, "Asia/Kolkata");
    assert.equal(saved.capabilities.passwordRecovery, false);
    assert.equal(saved.capabilities.verificationEmail, false);
    assert.equal(saved.preferences.dailyMinutes, 90);
    assert.equal(await db.collection("plans").countDocuments(), 0);
    assert.deepEqual(
      await db.collection("catalogState").findOne({}),
      beforeCatalog,
    );
    await error(
      await request(
        "/api/v1/me/preferences",
        "PATCH",
        { ...preferences, dailyMinutes: 120 },
        protection,
      ),
      409,
      "STATE_CONFLICT",
    );
    const concurrent = await Promise.all(
      [90, 120].map((dailyMinutes) =>
        request(
          "/api/v1/me/preferences",
          "PATCH",
          { ...preferences, dailyMinutes, expectedStateRevision: 1 },
          protection,
        ),
      ),
    );
    assert.deepEqual(
      concurrent.map((response) => response.status).sort(),
      [200, 409],
    );
    assert.equal(
      (await db.collection("profiles").findOne({ userId: student.userId }))!
        .stateRevision,
      2,
    );
    await redirect("/onboarding", "/dashboard");
    if (!direct) assert.equal((await request("/dashboard")).status, 200);
    await redirect(
      "/account?returnTo=https://evil.example/content",
      "/dashboard",
    );
    if (!direct)
      assert.equal((await request("/onboarding?edit=1")).status, 200);
    stage = "disposable publishing and admin separation";
    const admin = await signup("admin-student-fixture@example.com");
    const adminCookie = cookie;
    await db
      .collection("profiles")
      .updateOne({ userId: admin.userId }, { $set: { role: "admin" } });
    await redirect("/onboarding", "/admin");
    await redirect("/content", "/admin");
    const adminProtection = {
      cookie: adminCookie,
      "x-csrf-token": await csrf(),
    };
    const base = {
      subject: "dsa",
      topic: "arrays",
      difficulty: "easy",
      estimatedMinutes: 15,
      source: "Explicit disposable test fixture",
      attribution: "Original test material",
      reviewedAt: new Date().toISOString(),
      companies: [],
      tags: ["fixture"],
    };
    async function create(slug: string, type: string, publish: boolean) {
      const response = await request(
        "/api/v1/admin/content",
        "POST",
        {
          ...base,
          slug,
          title: `Fixture ${slug}`,
          type,
          ...(type === "question"
            ? {
                prompt: "Find a pair in **an array**.",
                explanation: "Use a hash map.",
              }
            : {
                body: "# Arrays\n\nRead this original test resource.",
                externalUrl: "https://example.com/material",
              }),
        },
        adminProtection,
      );
      assert.equal(response.status, 201);
      let item = (await response.json()).data;
      if (publish) {
        const published = await request(
          `/api/v1/admin/content/${item.id}/publish`,
          "POST",
          { expectedRevision: item.revision },
          adminProtection,
        );
        assert.equal(published.status, 200);
        item = (await published.json()).data;
      }
      return item;
    }
    const question = await create("array-question", "question", true);
    const resource = await create("array-resource", "resource", true);
    const draft = await create("hidden-draft", "question", false);
    cookie = studentCookie;
    stage = "published browsing and connected server pages";
    const list = await request(
      "/api/v1/content?subject=dsa&company=ltm&limit=1",
    );
    assert.equal(list.status, 200);
    const first = await list.json();
    assert.equal(first.data.length, 1);
    assert.equal(first.data[0].explanation, undefined);
    assert.equal(first.data[0].status, undefined);
    assert.ok(first.meta.page.nextCursor);
    const second = await (
      await request(
        `/api/v1/content?subject=dsa&company=ltm&limit=1&cursor=${encodeURIComponent(first.meta.page.nextCursor)}`,
      )
    ).json();
    assert.equal(second.data.length, 1);
    assert.notEqual(first.data[0].id, second.data[0].id);
    assert.equal(
      (await (await request("/api/v1/content?q=nonexistent-word")).json()).data
        .length,
      0,
    );
    await error(
      await request(`/api/v1/content/${draft.id}`),
      404,
      "RESOURCE_NOT_FOUND",
    );
    if (!direct) {
      const library = await request("/content?subject=dsa&company=ltm");
      assert.equal(library.status, 200);
      assert.ok((await library.text()).includes("Find your next practice."));
      for (const item of [question, resource]) {
        const detail = await request(
          `/content/${item.id}?returnTo=${encodeURIComponent("/content?subject=dsa&company=ltm")}`,
        );
        assert.equal(detail.status, 200);
        const html = await detail.text();
        assert.ok(html.includes("Back to content library"));
        assert.ok(html.includes(item.title));
        assert.ok(!html.includes("Save outcome"));
        assert.ok(!html.includes("Mark as studied"));
      }
    }
    if (practice) {
      stage = "practice and revision integration";
      await exercisePractice({
        db,
        request,
        studentCookie,
        adminCookie,
        studentId: student.userId,
        question,
        resource,
        create,
      });
    }
    cookie = adminCookie;
    assert.equal(
      (
        await request(
          `/api/v1/admin/content/${question.id}/archive`,
          "POST",
          {
            expectedRevision: question.revision,
            reason: "Disposable archival test",
          },
          adminProtection,
        )
      ).status,
      200,
    );
    await create("active-reading-question", "question", true);
    cookie = studentCookie;
    if (practice) {
      const unavailable = await request(`/api/v1/content/${question.id}`);
      assert.equal(unavailable.status, 200);
      const value = (await unavailable.json()).data;
      assert.equal(value.availability, "unavailable");
      assert.equal(value.prompt, undefined);
      await error(
        await request(
          "/api/v1/attempts",
          "POST",
          {
            submissionId: crypto.randomUUID(),
            contentId: question.id,
            kind: "practice",
            outcome: "failed",
          },
          { "x-csrf-token": await csrf() },
        ),
        409,
        "CONTENT_UNAVAILABLE",
      );
    } else {
      await error(
        await request(`/api/v1/content/${question.id}`),
        404,
        "RESOURCE_NOT_FOUND",
      );
      assert.equal(await db.collection("attempts").countDocuments(), 0);
      assert.equal(await db.collection("plans").countDocuments(), 0);
    }
    if (planning) {
      stage = "planning integration";
      await exercisePlanning({
        db,
        request,
        studentCookie,
        adminCookie,
        studentId: student.userId,
        rateSecret: environment.RATE_LIMIT_SECRET,
        create,
      });
    }
    if (planning || process.argv.includes("--progress")) {
      stage = "progress integration";
      await exerciseProgress({
        db,
        request,
        studentCookie,
        adminCookie,
        studentId: student.userId,
      });
    }
    if (!practice && !planning)
      await db
        .collection("profiles")
        .updateOne({ userId: student.userId }, { $set: { preferences: null } });
    if (!direct && process.argv.includes("--browser")) {
      console.log(
        "BROWSER READY: isolated student journey fixture at http://127.0.0.1:3104/login; press Enter to finish, automatic cleanup in ten minutes.",
      );
      if (practice || planning)
        console.log(`Disposable browser fixture database: ${database}`);
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
    console.log(
      `PASS: ${planning ? "planning preview/acceptance/dashboard and connected student regression" : practice ? "practice/revisions and connected student regression" : "student preferences, privileged-field rejection, CSRF, concurrency, published filters/cursors and no study-side effects"} (${direct ? "direct Route Handlers; Next server, pages and UI not exercised" : `${dev ? "development" : "production"}; routing/admin separation and server pages included`}).`,
    );
  } finally {
    server?.kill();
    if (server && server.exitCode === null)
      await new Promise<void>((resolve) => {
        server!.once("exit", resolve);
        setTimeout(resolve, 5000);
      });
    if (direct) {
      const { getAuthClient, getDomainConnection } =
        await import("../../src/shared/server/db");
      await (await getDomainConnection()).close();
      await (await getAuthClient()).close();
    }
    assert.ok(/^prep_pilot_student_test_[a-f0-9]{12}$/.test(database));
    try {
      await db.dropDatabase();
    } finally {
      await client.close();
    }
  }
}
main().catch((error) => {
  if (error instanceof Error)
    console.error(
      `Diagnostic: ${error.name.replace(/[^a-zA-Z]/g, "")} at ${(error.stack?.match(/(?:src|tests|scripts)[\\/][^\s)]+:\d+:\d+/g) ?? []).slice(0, 4).join(", ") || "external dependency"}.`,
    );
  console.error(
    error instanceof assert.AssertionError
      ? `Student integration assertion failed at ${stage}: ${error.message}`
      : `Student integration failed at ${stage}. Check isolated database/server access; no secrets are logged.`,
  );
  process.exitCode = 1;
});
