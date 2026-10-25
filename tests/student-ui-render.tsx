import assert from "node:assert/strict";
import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  AppRouterContext,
  type AppRouterInstance,
} from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { DashboardView } from "../src/modules/planning/ui/workspace";
import { StudentNavigation } from "../src/shared/ui/student-navigation";

type Props = ComponentProps<typeof DashboardView>;
const router: AppRouterInstance = {
  bfcacheId: "student-render-fixture",
  back() {},
  forward() {},
  refresh() {},
  push() {},
  replace() {},
  prefetch() {},
};
const preferences: NonNullable<Props["preferences"]> = {
  companies: ["ltm"],
  deadline: "2026-11-30",
  dailyMinutes: 60,
  skills: { dsa: 2, aptitude: 2, cs: 2 },
};
const data: Props["data"] = {
  asOf: "2026-10-25T12:00:00.000Z",
  studyDate: "2026-10-25",
  timezone: "Asia/Kolkata",
  stateRevision: 1,
  activePlanId: null,
  progress: {
    distinctAttempted: 7,
    currentlySolved: 3,
    planCompleted: 0,
    planTotal: 0,
    planCompletionPercent: null,
    readingCompleted: 0,
  },
  todayTasks: [],
  upcomingTasks: [],
  overdue: { count: 0, items: [] },
  revisions: { dueCount: 0, unavailableDueCount: 0, items: [] },
  topics: [],
  suggestions: [],
};
function render(props: Props) {
  return renderToStaticMarkup(
    createElement(
      AppRouterContext.Provider,
      { value: router },
      createElement(DashboardView, props),
    ),
  );
}
const first = render({ data, plan: null, preferences });
assert.match(first, /Your saved preferences/);
assert.match(first, /LTM/);
assert.match(first, /60 min\/day/);
assert.match(first, /Preview my study plan/);
assert.match(first, /Distinct questions attempted<\/dt><dd>7/);
assert.match(first, /Currently solved independently<\/dt><dd>3/);
assert.match(first, /No active plan/);
assert.ok(!first.includes("Continue practice"));
assert.ok(!first.includes("50+"));
const task: NonNullable<Props["plan"]>["tasks"][number] = {
  taskId: "12345678-1234-4234-8234-123456789abc",
  contentId: "507f1f77bcf86cd799439011",
  contentSnapshot: {
    title: "Disposable array task",
    subject: "dsa",
    topic: "arrays",
    type: "question",
    contentRevision: 1,
  },
  kind: "fresh",
  revisionSourceSequence: null,
  scheduledDate: data.studyDate,
  estimatedMinutes: 15,
  priority: "fresh",
  status: "pending",
  completedAt: null,
  reasonCode: "FOUNDATION",
  reason: "Explicit render fixture",
  availability: "available",
  overdue: false,
  supersededRevision: false,
};
const plan: NonNullable<Props["plan"]> = {
  id: "507f1f77bcf86cd799439012",
  version: 1,
  previousPlanId: null,
  sourcePreviewId: "507f1f77bcf86cd799439013",
  status: "active",
  generatedAt: data.asOf,
  stateRevision: 1,
  windowStart: data.studyDate,
  windowEnd: "2026-11-01",
  timezone: "Asia/Kolkata",
  budgetSnapshot: { dailyMinutes: 60, preferences },
  templateVersion: "render-fixture",
  rulesVersion: "render-fixture",
  tasks: [task],
  deferred: [],
};
const activeData = {
  ...data,
  activePlanId: plan.id,
  todayTasks: [task],
  progress: { ...data.progress, planTotal: 1, planCompletionPercent: 0 },
};
const active = render({ data: activeData, plan });
assert.match(active, /Continue practice/);
assert.match(active, /returnTo=%2Fdashboard&amp;planId=/);
assert.match(active, /aria-label="Today&#x27;s scheduled task completion"/);
assert.match(active, /15 estimated minutes remaining/);
const unavailable = render({
  data: {
    ...activeData,
    todayTasks: [{ ...task, availability: "unavailable" }],
  },
  plan,
});
assert.ok(!unavailable.includes("Continue practice"));
assert.match(unavailable, /Material unavailable/);
const completed = render({
  data: {
    ...activeData,
    todayTasks: [{ ...task, status: "completed", completedAt: data.asOf }],
  },
  plan,
});
assert.match(completed, /Today’s tasks are completed/);
assert.ok(!completed.includes("Continue practice"));
for (const [path, label] of [
  ["/content/507f1f77bcf86cd799439011", "Content library"],
  ["/dashboard", "Dashboard"],
  ["/plan-previews/507f1f77bcf86cd799439013", "Study plan"],
  ["/account", "Settings"],
]) {
  const nav = renderToStaticMarkup(
    createElement(
      PathnameContext.Provider,
      { value: path! },
      createElement(StudentNavigation),
    ),
  );
  assert.match(nav, new RegExp(`aria-current="page"[^>]*>${label}`));
  assert.match(nav, /<summary>Study navigation<\/summary>/);
}
console.log(
  "PASS student UI render contracts: first visit, real-count projection, active/completed/unavailable agenda, safe contextual links and current-page navigation. Not interactive browser evidence.",
);
