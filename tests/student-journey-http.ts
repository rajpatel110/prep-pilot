import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { minimumDeadline } from "../src/modules/identity/preferences-schema";

const origin = "http://127.0.0.1:3151";
async function request(
  cookie: string,
  path: string,
  method = "GET",
  body?: object,
) {
  let token = "";
  if (body) {
    const protection = await fetch(`${origin}/api/v1/security/csrf`, {
      headers: { cookie },
    });
    assert.equal(protection.status, 200);
    token = (await protection.json()).data.token;
  }
  return fetch(`${origin}${path}`, {
    method,
    redirect: "manual",
    signal: AbortSignal.timeout(30000),
    headers: {
      cookie,
      origin,
      "content-type": "application/json",
      ...(token ? { "x-csrf-token": token } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
async function json(
  cookie: string,
  path: string,
  method = "GET",
  body?: object,
) {
  const response = await request(cookie, path, method, body);
  assert.ok(response.ok, `${method} ${path}: ${response.status}`);
  return (await response.json()).data;
}
async function destination(cookie: string, path: string, expected: string) {
  const response = await request(cookie, path);
  const location = response.headers.get("location");
  if (location) assert.equal(location, expected);
  else {
    const html = await response.text();
    assert.ok(
      html.includes(expected),
      "Streamed guard must contain expected destination",
    );
    assert.match(html, /NEXT_REDIRECT|http-equiv="refresh"/);
  }
}
async function main() {
  const bridge = await fetch("http://127.0.0.1:3152/student", {
    redirect: "manual",
  });
  assert.equal(bridge.status, 302);
  const fixtureCookie = bridge.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  assert.equal(
    (await json(fixtureCookie, "/api/v1/me")).email,
    "ui-reader@example.invalid",
  );
  await destination("", "/plans/review", "/login?returnTo=%2Fplans%2Freview");
  await destination(
    fixtureCookie,
    "/signup?returnTo=%2Fplans%2Freview",
    "/plans/review",
  );
  await destination(
    fixtureCookie,
    "/login?returnTo=%2Fplans%2Freview",
    "/plans/review",
  );
  const signup = await fetch(`${origin}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify({
      name: "Disposable journey student",
      email: `journey-${randomBytes(6).toString("hex")}@example.invalid`,
      password: randomBytes(24).toString("base64url"),
    }),
  });
  assert.equal(signup.status, 200);
  const cookie = signup.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  await destination(
    cookie,
    "/plans/review",
    "/onboarding?returnTo=%2Fplans%2Freview",
  );
  let me = await json(cookie, "/api/v1/me");
  await json(cookie, "/api/v1/me/preferences", "PATCH", {
    expectedStateRevision: me.stateRevision,
    companies: ["ltm"],
    dailyMinutes: 30,
    deadline: minimumDeadline(),
    skills: { dsa: 1, aptitude: 5, cs: 3 },
  });
  const reviewPage = await (await request(cookie, "/plans/review")).text();
  assert.match(reviewPage, /Review my plan/);
  me = await json(cookie, "/api/v1/me");
  const preview = await json(cookie, "/api/v1/plan-previews", "POST", {
    kind: "initial",
    expectedStateRevision: me.stateRevision,
  });
  const details = await json(cookie, `/api/v1/plan-previews/${preview.id}`);
  assert.equal((await json(cookie, "/api/v1/plans/current")).plan, null);
  assert.ok(
    details.dailyTotals.every(
      (day: { afterMinutes: number; budgetMinutes: number }) =>
        day.afterMinutes <= day.budgetMinutes,
    ),
  );
  const previewPage = await (
    await request(cookie, `/plan-previews/${preview.id}`)
  ).text();
  assert.match(previewPage, /Your plan’s subject mix/);
  assert.match(previewPage, /Proposed daily schedule/);
  assert.match(previewPage, /No tasks scheduled/);
  assert.doesNotMatch(previewPage, /Daily budget comparison/);
  const accepted = await json(
    cookie,
    `/api/v1/plan-previews/${preview.id}/confirm`,
    "POST",
    {
      acknowledgedDeferredIds: details.proposal.deferred.map(
        (item: { taskId: string }) => item.taskId,
      ),
    },
  );
  const selected = accepted.plan.tasks.find(
    (task: { contentSnapshot: { type: string } }) =>
      task.contentSnapshot.type === "question",
  );
  assert.ok(selected);
  await json(cookie, "/api/v1/attempts", "POST", {
    submissionId: randomUUID(),
    contentId: selected.contentId,
    kind: "practice",
    outcome: "independent",
  });
  const progress = await json(cookie, "/api/v1/progress");
  assert.equal(progress.submissions, 1);
  assert.equal(progress.activePlan.completed, 0);
  me = await json(cookie, "/api/v1/me");
  await json(
    cookie,
    `/api/v1/plans/${accepted.plan.id}/tasks/${selected.taskId}`,
    "PATCH",
    { status: "completed", expectedStateRevision: me.stateRevision },
  );
  assert.equal(
    (await json(cookie, "/api/v1/progress")).activePlan.completed,
    1,
  );
  const current = await json(cookie, "/api/v1/plans/current");
  const replacement = await json(cookie, "/api/v1/plan-previews", "POST", {
    kind: "reschedule",
    expectedStateRevision: current.stateRevision,
  });
  assert.equal(
    (await json(cookie, "/api/v1/plans/current")).plan.id,
    accepted.plan.id,
  );
  assert.match(
    await (await request(cookie, `/plan-previews/${replacement.id}`)).text(),
    /Previous versus proposed schedule/,
  );
  const adminBridge = await fetch("http://127.0.0.1:3152/admin", {
    redirect: "manual",
  });
  const adminCookie = adminBridge.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  assert.equal(
    (await json(adminCookie, "/api/v1/me")).email,
    "ui-author@example.invalid",
  );
  await destination(adminCookie, "/plans/review", "/admin");
  console.log(
    "PASS: disposable signed-out/incomplete/complete/admin routing; sparse preview; explicit acceptance; practice and Progress; replacement preserves active plan.",
  );
}
main().catch((error) => {
  console.error(
    error instanceof assert.AssertionError
      ? `Disposable journey assertion failed (${error.operator}); no response bodies logged.`
      : "Disposable journey verification failed; no credentials or bodies logged.",
  );
  process.exitCode = 1;
});
