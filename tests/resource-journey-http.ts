import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { minimumDeadline } from "../src/modules/identity/preferences-schema";

const origin = "http://127.0.0.1:3151";
const cookieHeader = (response: Response) =>
  response.headers
    .getSetCookie()
    .map((entry) => entry.split(";")[0])
    .join("; ");

async function request(
  cookie: string,
  path: string,
  method = "GET",
  body?: object,
) {
  const headers: Record<string, string> = {
    cookie,
    origin,
    "content-type": "application/json",
  };
  if (body) {
    const protection = await fetch(`${origin}/api/v1/security/csrf`, {
      headers: { cookie },
    });
    assert.equal(protection.status, 200);
    headers["x-csrf-token"] = (await protection.json()).data.token;
  }
  return fetch(`${origin}${path}`, {
    method,
    headers,
    redirect: "manual",
    signal: AbortSignal.timeout(30000),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
async function data(
  cookie: string,
  path: string,
  method = "GET",
  body?: object,
) {
  const response = await request(cookie, path, method, body);
  assert.ok(response.ok, `Disposable response status: ${response.status}`);
  return (await response.json()).data;
}

async function main() {
  const bridge = await fetch("http://127.0.0.1:3152/student", {
    redirect: "manual",
  });
  assert.equal(bridge.status, 302);
  const otherCookie = cookieHeader(bridge);
  assert.equal(
    (await data(otherCookie, "/api/v1/me")).email,
    "ui-reader@example.invalid",
  );
  const signup = await fetch(`${origin}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify({
      name: "Disposable resource reviewer",
      email: `resource-${randomBytes(6).toString("hex")}@example.invalid`,
      password: randomBytes(24).toString("base64url"),
    }),
  });
  assert.equal(signup.status, 200);
  const cookie = cookieHeader(signup);
  await data(cookie, "/api/v1/me/preferences", "PATCH", {
    expectedStateRevision: 0,
    companies: ["ltm"],
    dailyMinutes: 30,
    deadline: minimumDeadline(),
    skills: { dsa: 2, aptitude: 2, cs: 2 },
  });
  const current = await data(cookie, "/api/v1/plans/current");
  const preview = await data(cookie, "/api/v1/plan-previews", "POST", {
    kind: "initial",
    expectedStateRevision: current.stateRevision,
  });
  const proposed = await data(cookie, `/api/v1/plan-previews/${preview.id}`);
  const accepted = await data(
    cookie,
    `/api/v1/plan-previews/${preview.id}/confirm`,
    "POST",
    {
      acknowledgedDeferredIds: proposed.proposal.deferred.map(
        (task: { taskId: string }) => task.taskId,
      ),
    },
  );
  const task = accepted.plan.tasks.find(
    (item: { contentSnapshot: { type: string } }) =>
      item.contentSnapshot.type === "resource",
  );
  assert.ok(task, "Fixture must contain a resource task");
  const detail = await (
    await request(
      cookie,
      `/content/${task.contentId}?planId=${accepted.plan.id}&taskId=${task.taskId}`,
    )
  ).text();
  assert.match(detail, /Mark as studied/);
  assert.doesNotMatch(detail, /How did this attempt go/);
  assert.equal(
    (await data(cookie, "/api/v1/progress")).activePlan.completed,
    0,
  );
  const route = `/api/v1/plans/${accepted.plan.id}/tasks/${task.taskId}`;
  const body = {
    status: "completed",
    expectedStateRevision: accepted.plan.stateRevision,
  };
  const noCsrf = await fetch(`${origin}${route}`, {
    method: "PATCH",
    headers: { cookie, origin, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  assert.equal(noCsrf.status, 403);
  assert.equal(
    (await request(otherCookie, `/api/v1/plans/${accepted.plan.id}`)).status,
    404,
  );
  assert.equal(
    (await request(otherCookie, `/api/v1/plan-previews/${preview.id}`)).status,
    404,
  );
  assert.equal((await request(otherCookie, route, "PATCH", body)).status, 404);
  await data(cookie, route, "PATCH", body);
  assert.equal((await request(cookie, route, "PATCH", body)).status, 409);
  const progress = await data(cookie, "/api/v1/progress");
  assert.equal(progress.activePlan.completed, 1);
  assert.equal(progress.activePlan.readingCompleted, 1);
  assert.equal(progress.submissions, 0);
  const dashboard = await data(cookie, "/api/v1/dashboard");
  assert.equal(dashboard.progress.readingCompleted, 1);
  assert.equal(dashboard.progress.distinctAttempted, 0);
  assert.deepEqual(await data(cookie, "/api/v1/revisions?dueOnly=false"), []);
  const savedPreview = await (
    await request(cookie, `/plan-previews/${preview.id}`)
  ).text();
  assert.match(savedPreview, /Accepted proposal/);
  assert.doesNotMatch(savedPreview, /Review · not an active plan/);
  const fresh = await data(cookie, "/api/v1/plans/current");
  await data(cookie, route, "PATCH", {
    status: "pending",
    expectedStateRevision: fresh.stateRevision,
  });
  assert.equal(
    (await data(cookie, "/api/v1/progress")).activePlan.readingCompleted,
    0,
  );
  console.log(
    "PASS disposable resource opening/completion/undo, separate metrics, no attempts or revisions, stale write rejection, CSRF and cross-user isolation; accepted-preview reload label.",
  );
}

main().catch((error) => {
  console.error(
    error instanceof assert.AssertionError
      ? `Resource journey assertion failed (${error.operator}); no response bodies logged.`
      : "Disposable resource journey unavailable; no credentials or bodies logged.",
  );
  process.exitCode = 1;
});
