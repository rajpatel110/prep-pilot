import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  subjectMix,
  comparisonDays,
} from "../src/modules/planning/presentation";
import { studentReturn } from "../src/modules/identity/student-routing";
import { watchAccountReturn } from "../src/shared/ui/account-events";
import { generatePlan, type Material } from "../src/modules/planning/engine";

test("confidence 1/5, 5/5, 3/5 limits difficulty without changing baseline weights", () => {
  const materials: Material[] = (
    [
      ["dsa", "arrays"],
      ["aptitude", "quantitative"],
      ["cs", "dbms"],
    ] as const
  ).flatMap(([subject, topic]) =>
    (["easy", "medium", "hard"] as const).map((difficulty) => ({
      id: `${subject}-${difficulty}`,
      snapshot: {
        title: `${subject}-${difficulty}`,
        subject,
        topic,
        type: "question",
        contentRevision: 1,
      },
      difficulty,
      available: true,
      estimatedMinutes: 5,
      companies: [],
    })),
  );
  const proposal = generatePlan({
    today: "2026-10-28",
    preferences: {
      companies: ["ltm"],
      deadline: "2026-11-03",
      dailyMinutes: 30,
      skills: { dsa: 1, aptitude: 5, cs: 3 },
    },
    kind: "initial",
    active: null,
    materials,
    cycles: [],
    attemptedIds: [],
    idFor: (identity) => identity,
  });
  const ids = proposal.tasks.map((task) => task.contentId);
  assert.ok(ids.includes("dsa-easy"));
  assert.ok(!ids.includes("dsa-medium") && !ids.includes("dsa-hard"));
  assert.ok(ids.includes("aptitude-hard") && ids.includes("cs-medium"));
  assert.ok(!ids.includes("cs-hard"));
});

test("actual subject mix uses scheduled minutes, not confidence or full budget", () => {
  const tasks = (
    [
      ["dsa", 35],
      ["aptitude", 12],
      ["cs", 40],
    ] as const
  ).map(([subject, estimatedMinutes]) => ({
    contentSnapshot: {
      title: "Fixture",
      subject,
      topic: "fixture",
      type: "question" as const,
      contentRevision: 1,
    },
    estimatedMinutes,
  }));
  const mix = subjectMix(tasks);
  assert.equal(mix.total, 87);
  assert.deepEqual(
    mix.subjects.map((entry) => entry.percent),
    [40.2, 13.8, 46],
  );
  assert.ok(subjectMix([]).subjects.every((entry) => entry.percent === null));
});

test("first plans keep empty dates; replacements omit unchanged comparisons", () => {
  const days = [
    { beforeMinutes: 0, afterMinutes: 0 },
    { beforeMinutes: 0, afterMinutes: 7 },
    { beforeMinutes: 15, afterMinutes: 15 },
  ];
  assert.deepEqual(comparisonDays(days, true), days);
  assert.deepEqual(comparisonDays(days, false), [days[1]]);
});

test("review destination is allowed but external redirects remain rejected", () => {
  assert.equal(studentReturn("/plans/review"), "/plans/review");
  assert.equal(studentReturn("//evil.invalid/plans/review"), null);
  assert.equal(studentReturn("/plans/review?unsafe=1"), null);
  const home = readFileSync("src/app/page.tsx", "utf8");
  assert.doesNotMatch(home, /href="\/signup"/);
  assert.match(
    readFileSync("src/app/(auth)/signup/page.tsx", "utf8"),
    /redirectSignedInAuth/,
  );
  assert.match(
    readFileSync("src/app/(auth)/login/page.tsx", "utf8"),
    /redirectSignedInAuth/,
  );
});

test("return events refresh authoritative state, coalesce and clean up without account payloads", () => {
  const events = new EventTarget();
  const document = Object.assign(new EventTarget(), {
    visibilityState: "visible",
  });
  let pending: (() => void) | undefined;
  let refreshes = 0;
  const view = Object.assign(events, {
    document,
    setTimeout(callback: () => void) {
      pending = callback;
      return 1;
    },
    clearTimeout() {
      pending = undefined;
    },
  });
  const cleanup = watchAccountReturn(
    view as unknown as Parameters<typeof watchAccountReturn>[0],
    () => {
      refreshes++;
    },
  );
  events.dispatchEvent(new Event("focus"));
  events.dispatchEvent(new Event("preppilot-account-change"));
  assert.equal(refreshes, 0);
  pending?.();
  assert.equal(refreshes, 1);
  document.visibilityState = "hidden";
  document.dispatchEvent(new Event("visibilitychange"));
  assert.equal(refreshes, 1);
  cleanup();
  events.dispatchEvent(new Event("focus"));
  assert.equal(pending, undefined);
});

test("Progress streams separately guarded reads and keeps navigation in loading UI", () => {
  const page = readFileSync("src/app/progress/page.tsx", "utf8");
  assert.match(page, /<Suspense fallback={<ProgressSkeleton/);
  assert.match(page, /<Summary requestHeaders/);
  assert.match(page, /<RecentHistory requestHeaders/);
  assert.match(page, /Missing data is not zero activity/);
  assert.match(
    readFileSync("src/app/progress/loading.tsx", "utf8"),
    /StudentShell/,
  );
});

test("verification labels use the current server user, not another link or event payload", () => {
  const source = readFileSync(
    "src/modules/identity/ui/email-panel.tsx",
    "utf8",
  );
  assert.match(source, /verificationConfirmedForView\(\s*user\?\.verified,/);
  assert.match(source, /announceAccountChange\(\)/);
  assert.match(source, /<AccountRefresh/);
  assert.match(source, /Confirm email verification/);
});
