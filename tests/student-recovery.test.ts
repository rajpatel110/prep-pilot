import assert from "node:assert/strict";
import test from "node:test";
import { acceptPreview } from "../src/modules/planning/accept-preview";
import { refreshStudyAfterAttempt } from "../src/modules/practice/refresh-study";
import { verificationConfirmedForView } from "../src/modules/identity/ui/email-link";

test("accepted plans navigate before a slow current-plan read finishes", async () => {
  const events: string[] = [];
  let finishRead!: () => void;
  const pendingRead = new Promise<void>((resolve) => {
    finishRead = resolve;
  });
  const pending = acceptPreview(
    "preview-id",
    ["deferred-id"],
    (planId) => events.push(`navigate:${planId}`),
    async (path, method, body) => {
      if (method === "POST") {
        assert.equal(path, "/api/v1/plan-previews/preview-id/confirm");
        assert.deepEqual(body, { acknowledgedDeferredIds: ["deferred-id"] });
        return { data: { plan: { id: "saved-plan" } } };
      }
      events.push(path);
      await pendingRead;
      return { data: {} };
    },
  );
  await Promise.resolve();
  assert.deepEqual(events, ["navigate:saved-plan", "/api/v1/plans/current"]);
  finishRead();
  assert.deepEqual(await pending, { refreshed: true });
});

test("a failed follow-up read never turns confirmed or replayed acceptance into a failed mutation", async () => {
  let confirmations = 0;
  const destinations: string[] = [];
  const result = await acceptPreview(
    "same-preview",
    [],
    (planId) => destinations.push(planId),
    async (_path, method) => {
      if (method === "POST") {
        confirmations++;
        return {
          data: { plan: { id: "original-now-archived-plan" } },
          meta: { replayed: true },
        };
      }
      throw new Error("Read unavailable");
    },
  );
  assert.deepEqual(result, { refreshed: false });
  assert.equal(confirmations, 1);
  assert.deepEqual(destinations, ["original-now-archived-plan"]);
});

test("rejected or uncertain confirmation remains an error without navigation or automatic retry", async () => {
  for (const failure of ["PREVIEW_STALE", "UNAUTHENTICATED", "timeout"]) {
    let calls = 0;
    await assert.rejects(
      acceptPreview(
        "same-preview",
        [],
        () => assert.fail("No confirmed plan"),
        async () => {
          calls++;
          throw new Error(failure);
        },
      ),
      { message: failure },
    );
    assert.equal(calls, 1);
  }
});

test("practice refreshes start together rather than waiting for each previous read", async () => {
  const paths: string[] = [];
  let finishReads!: () => void;
  const pendingReads = new Promise<void>((resolve) => {
    finishReads = resolve;
  });
  const pending = refreshStudyAfterAttempt("question-id", async (path) => {
    paths.push(path);
    await pendingReads;
    return { data: [{ attemptSequence: 4 }] };
  });
  assert.deepEqual(paths, [
    "/api/v1/attempts?contentId=question-id&limit=1",
    "/api/v1/revisions?dueOnly=false",
    "/api/v1/plans/current",
    "/api/v1/dashboard",
  ]);
  finishReads();
  assert.deepEqual(await pending, { latest: 4, failed: false });
});

test("one failed study read preserves successful history and does not skip other refreshes", async () => {
  const paths: string[] = [];
  const result = await refreshStudyAfterAttempt("question-id", async (path) => {
    paths.push(path);
    if (path.startsWith("/api/v1/revisions")) throw new Error("unavailable");
    return { data: [{ attemptSequence: 7 }] };
  });
  assert.equal(paths.length, 4);
  assert.deepEqual(result, { latest: 7, failed: true });
});

test("failed or empty history does not invent a latest attempt", async () => {
  assert.deepEqual(
    await refreshStudyAfterAttempt("question-id", async () => ({ data: [] })),
    { latest: null, failed: false },
  );
  assert.deepEqual(
    await refreshStudyAfterAttempt("question-id", async () => {
      throw new Error("session expired");
    }),
    { latest: null, failed: true },
  );
});

test("anonymous verification success belongs only to the explicitly confirmed link revision", () => {
  assert.equal(verificationConfirmedForView(undefined, null, 0), false);
  assert.equal(verificationConfirmedForView(undefined, null, 1), false);
  assert.equal(verificationConfirmedForView(undefined, 1, 1), true);
  assert.equal(verificationConfirmedForView(undefined, 1, 2), false);
  assert.equal(verificationConfirmedForView(undefined, 2, 2), true);
});

test("the current signed-in account remains authoritative over any link confirmation", () => {
  assert.equal(verificationConfirmedForView(false, 1, 1), false);
  assert.equal(verificationConfirmedForView(true, null, 0), true);
  assert.equal(verificationConfirmedForView(true, 1, 2), true);
});
