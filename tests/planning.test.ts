import test from "node:test";
import assert from "node:assert/strict";
import {
  generatePlan,
  addDays,
  type Material,
  type Task,
} from "../src/modules/planning/engine";
import {
  validatePlanningConfiguration,
  templateVersion,
} from "../src/config/planning";
import { studyDate } from "../src/modules/identity/preferences-schema";
import {
  proposalValue,
  taskValue,
  deferredValue,
} from "../src/modules/planning/schemas";
import { planTaskModel } from "../src/modules/planning/task-model";
import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import { activatePlanPointer } from "../src/modules/identity/plan-state";
import { Types, type Connection, type ClientSession } from "mongoose";
const preferences = {
  companies: ["cognizant" as const],
  deadline: "2026-11-30",
  dailyMinutes: 60,
  skills: { dsa: 2, aptitude: 2, cs: 2 },
};
const idFor = (identity: string) => identity;
const item = (
  id: string,
  subject: Material["snapshot"]["subject"] = "dsa",
  topic = "arrays",
  estimatedMinutes = 15,
): Material => ({
  id,
  snapshot: { title: id, subject, topic, type: "question", contentRevision: 1 },
  difficulty: "easy",
  companies: [],
  estimatedMinutes,
  available: true,
});
const base = {
  today: "2026-10-24",
  preferences,
  kind: "initial" as const,
  active: null,
  materials: [] as Material[],
  cycles: [],
  attemptedIds: [],
  idFor,
};

test("short estimates remain exact, deterministic and unique within the daily budget", () => {
  const materials = Array.from({ length: 180 }, (_, index) =>
    item(
      String(index).padStart(24, "0"),
      "aptitude",
      "quantitative",
      [1, 2, 5][index % 3]!,
    ),
  );
  const input = {
    ...base,
    preferences: { ...preferences, dailyMinutes: 30, deadline: "2026-10-30" },
    materials,
  };
  const plan = generatePlan(input);
  assert.deepEqual(
    plan,
    generatePlan({ ...input, materials: [...materials].reverse() }),
  );
  assert.deepEqual(
    plan,
    generatePlan({ ...input, materials: [...materials, ...materials] }),
  );
  const all = [...plan.tasks, ...plan.deferred];
  assert.equal(all.length, materials.length);
  assert.equal(new Set(all.map((task) => task.taskId)).size, all.length);
  assert.equal(new Set(all.map((task) => task.contentId)).size, all.length);
  for (const task of all)
    assert.equal(
      task.estimatedMinutes,
      materials.find((material) => material.id === task.contentId)!
        .estimatedMinutes,
    );
  assert.ok(plan.tasks.some((task) => task.estimatedMinutes === 1));
  assert.ok(plan.deferred.some((task) => task.reasonCode === "CAPACITY"));
  for (const date of new Set(plan.tasks.map((task) => task.scheduledDate)))
    assert.ok(
      plan.tasks
        .filter((task) => task.scheduledDate === date)
        .reduce((sum, task) => sum + task.estimatedMinutes, 0) <= 30,
    );
});

test("one-minute content remains bounded by task/deferred limits, not budget division", () => {
  const materials = Array.from({ length: 500 }, (_, index) =>
    item(String(index), "dsa", "arrays", 1),
  );
  const plan = generatePlan({ ...base, materials });
  assert.equal(plan.tasks.length, 480);
  assert.equal(plan.deferred.length, 20);
  assert.ok(plan.deferred.every((task) => task.reasonCode === "CAPACITY"));
  assert.throws(
    () =>
      generatePlan({
        ...base,
        materials: Array.from({ length: 961 }, (_, index) =>
          item(String(index), "dsa", "arrays", 1),
        ),
      }),
    /PLAN_SCOPE_TOO_LARGE/,
  );
});

test("short work preserves prerequisite eligibility, revision priority and saved historical estimates", () => {
  const materials = [
    item("arrays", "dsa", "arrays", 1),
    item("sorting", "dsa", "sorting", 2),
    item("recall", "cs", "dbms", 3),
  ];
  const cycles = [
    { contentId: "recall", lastAttemptSequence: 1, dueDate: base.today },
  ];
  const first = generatePlan({ ...base, materials, cycles });
  assert.equal(first.tasks[0]!.kind, "revision");
  assert.equal(first.tasks[0]!.estimatedMinutes, 3);
  assert.ok(
    first.tasks.findIndex((task) => task.contentId === "arrays") <
      first.tasks.findIndex((task) => task.contentId === "sorting"),
  );
  assert.equal(
    generatePlan({ ...base, materials: [materials[1]!] }).deferred[0]!
      .reasonCode,
    "PREREQUISITE_UNAVAILABLE",
  );
  const active = structuredClone(first);
  active.tasks[0]!.status = "completed";
  active.tasks[0]!.completedAt = "2026-10-24T00:00:00.000Z";
  active.tasks[0]!.estimatedMinutes = 20;
  active.tasks[1]!.estimatedMinutes = 25;
  const before = structuredClone(active);
  const replacement = generatePlan({
    ...base,
    kind: "reschedule",
    active,
    materials,
    cycles,
  });
  assert.deepEqual(active, before);
  assert.deepEqual(
    replacement.tasks.find((task) => task.taskId === active.tasks[0]!.taskId),
    active.tasks[0],
  );
  assert.equal(
    replacement.tasks.find((task) => task.taskId === active.tasks[1]!.taskId)!
      .estimatedMinutes,
    25,
  );
  assert.equal(
    new Set(replacement.tasks.map((task) => task.taskId)).size,
    replacement.tasks.length,
  );
});

test("short task/proposal/deferred and Mongoose plan boundaries preserve daily-budget rules", async () => {
  const connection = mongoose.createConnection();
  try {
    const Model = planTaskModel(connection);
    for (const minutes of [1, 5, 14, 15, 60]) {
      const proposal = generatePlan({
        ...base,
        materials: [item("507f1f77bcf86cd799439011", "dsa", "arrays", minutes)],
        idFor: () => randomUUID(),
      });
      assert.equal(proposalValue.safeParse(proposal).success, true);
      const task = proposal.tasks[0]!;
      assert.equal(taskValue.safeParse(task).success, true);
      assert.equal(
        deferredValue.safeParse({
          taskId: task.taskId,
          contentId: task.contentId,
          kind: "fresh",
          estimatedMinutes: minutes,
          reasonCode: "CAPACITY",
        }).success,
        true,
      );
      const document = new Model({
        userId: "fixture",
        version: 1,
        sourcePreviewId: new Types.ObjectId(),
        generatedAt: new Date(),
        ...proposal,
      });
      await document.validate();
      for (const invalid of [0, -1, 0.5, 1.5, 61]) {
        assert.equal(
          taskValue.safeParse({ ...task, estimatedMinutes: invalid }).success,
          false,
        );
        assert.equal(
          deferredValue.safeParse({
            taskId: task.taskId,
            contentId: task.contentId,
            kind: "fresh",
            estimatedMinutes: invalid,
            reasonCode: "CAPACITY",
          }).success,
          false,
        );
        document.tasks[0]!.estimatedMinutes = invalid;
        await assert.rejects(document.validate());
      }
    }
    for (const dailyMinutes of [1, 29, 31, 241])
      assert.equal(
        proposalValue.safeParse({
          ...generatePlan(base),
          budgetSnapshot: {
            dailyMinutes,
            preferences: { ...preferences, dailyMinutes },
          },
        }).success,
        false,
      );
  } finally {
    await connection.close();
  }
});

test("identity owns guarded pointer activation on the supplied study transaction", async () => {
  const calls: unknown[][] = [];
  let matched = 1;
  const connection = {
    models: {
      Profile: {
        updateOne: async (...args: unknown[]) => {
          calls.push(args);
          return { matchedCount: matched };
        },
      },
    },
  } as unknown as Connection;
  const session = { inTransaction: () => true } as ClientSession;
  const input = {
    userId: "owned-student",
    expectedStateRevision: 12,
    expectedPlanVersion: 3,
    previousPlanId: new Types.ObjectId(),
    nextPlanId: new Types.ObjectId(),
  };
  await activatePlanPointer(connection, session, input);
  assert.deepEqual(calls[0], [
    {
      userId: input.userId,
      lifecycle: "active",
      role: "student",
      stateRevision: 12,
      planVersion: 3,
      activePlanId: input.previousPlanId,
    },
    { $set: { activePlanId: input.nextPlanId }, $inc: { planVersion: 1 } },
    { session, runValidators: true },
  ]);
  await assert.rejects(
    activatePlanPointer(
      connection,
      { inTransaction: () => false } as ClientSession,
      input,
    ),
    /requires the study transaction/,
  );
  assert.equal(calls.length, 1);
  matched = 0;
  await assert.rejects(activatePlanPointer(connection, session, input), {
    code: "STALE_PREVIEW",
    status: 409,
  });
});
test("editorial configuration validates canonical mappings and rejects unknown topics/self/cycles", () => {
  validatePlanningConfiguration();
  assert.match(templateVersion, /^editorial-foundations-1-[a-f0-9]{16}$/);
  for (const graph of [
    { "dsa:arrays": ["dsa:arrays"] },
    { "dsa:arrays": ["dsa:unknown"] },
    { "dsa:arrays": ["dsa:trees"], "dsa:trees": ["dsa:arrays"] },
  ])
    assert.throws(() => validatePlanningConfiguration(graph));
  assert.throws(() =>
    validatePlanningConfiguration({}, { cognizant: { dsa: ["fake"] } }),
  );
});
test("planning is deterministic across input order; foundations and all subjects remain eligible", () => {
  const materials = [
    item("dsa"),
    item("cs", "cs", "dbms"),
    item("apt", "aptitude", "quantitative"),
  ];
  const plan = generatePlan({ ...base, materials });
  assert.deepEqual(
    plan,
    generatePlan({ ...base, materials: [...materials].reverse() }),
  );
  assert.equal(plan.tasks.length, 3);
  assert.equal(
    generatePlan({ ...base, materials: [...materials, ...materials] }).tasks
      .length,
    3,
  );
  assert.deepEqual(
    new Set(plan.tasks.map((task) => task.contentSnapshot.subject)),
    new Set(["dsa", "aptitude", "cs"]),
  );
});
test("prerequisites are scheduled first; absent prerequisites block rather than implying mastery", () => {
  const sorted = item("a-sort", "dsa", "sorting"),
    arrays = item("z-array");
  const blocked = generatePlan({ ...base, materials: [sorted] });
  assert.equal(blocked.tasks.length, 0);
  assert.equal(blocked.deferred[0]?.reasonCode, "PREREQUISITE_UNAVAILABLE");
  const plan = generatePlan({ ...base, materials: [sorted, arrays] });
  assert.equal(plan.tasks.length, 2);
  assert.ok(
    plan.tasks.findIndex((task) => task.contentId === arrays.id) <
      plan.tasks.findIndex((task) => task.contentId === sorted.id),
  );
  assert.ok(
    plan.tasks.find((task) => task.contentId === arrays.id)!.scheduledDate <=
      plan.tasks.find((task) => task.contentId === sorted.id)!.scheduledDate,
  );
  assert.equal(
    generatePlan({
      ...base,
      materials: [sorted, arrays],
      attemptedIds: [arrays.id],
    }).tasks.length,
    0,
  );
});
test("time budget never trimmed/exceeded; shorter tasks fit and excess is explicitly deferred", () => {
  const materials = Array.from({ length: 50 }, (_, index) =>
    item(String(index).padStart(3, "0"), "dsa", "arrays", index % 2 ? 30 : 45),
  );
  const plan = generatePlan({
    ...base,
    preferences: { ...preferences, dailyMinutes: 30, deadline: "2026-10-30" },
    materials,
  });
  assert.ok(plan.deferred.length > 0);
  for (const task of plan.tasks) assert.equal(task.estimatedMinutes, 30);
  for (const date of new Set(plan.tasks.map((task) => task.scheduledDate)))
    assert.ok(
      plan.tasks
        .filter((task) => task.scheduledDate === date)
        .reduce((sum, task) => sum + task.estimatedMinutes, 0) <= 30,
    );
});
test("allocation approximates documented 50/25/25 quotas", () => {
  const materials = [
    ...Array.from({ length: 20 }, (_, index) => item(`d${index}`)),
    ...Array.from({ length: 10 }, (_, index) =>
      item(`a${index}`, "aptitude", "quantitative"),
    ),
    ...Array.from({ length: 10 }, (_, index) =>
      item(`c${index}`, "cs", "dbms"),
    ),
  ];
  const plan = generatePlan({
    ...base,
    preferences: { ...preferences, deadline: "2026-10-30" },
    materials,
  });
  const totals = { dsa: 0, aptitude: 0, cs: 0 };
  for (const task of plan.tasks)
    totals[task.contentSnapshot.subject] += task.estimatedMinutes;
  assert.ok(Math.abs(totals.dsa - 210) <= 15);
  assert.ok(Math.abs(totals.aptitude - 105) <= 15);
  assert.ok(Math.abs(totals.cs - 105) <= 15);
});
test("revisions precede fresh work, require current cycle, preserve stable retained task IDs", () => {
  const first = generatePlan({
    ...base,
    materials: [item("revision"), item("fresh")],
    cycles: [
      { contentId: "revision", lastAttemptSequence: 1, dueDate: base.today },
    ],
  });
  const recall = first.tasks.find((task) => task.kind === "revision")!;
  const next = generatePlan({
    ...base,
    kind: "reschedule",
    active: first,
    materials: [item("revision"), item("fresh")],
    cycles: [
      { contentId: "revision", lastAttemptSequence: 1, dueDate: base.today },
    ],
  });
  assert.equal(
    next.tasks.find((task) => task.kind === "revision")!.taskId,
    recall.taskId,
  );
  assert.equal(
    new Set(
      next.tasks.map(
        (task) => `${task.contentId}:${task.revisionSourceSequence}`,
      ),
    ).size,
    next.tasks.length,
  );
});
test("completed work is immutable during replacement; today budget conflicts reject", () => {
  const completed: Task = {
    taskId: "retained",
    contentId: "done",
    contentSnapshot: item("done").snapshot,
    kind: "fresh",
    scheduledDate: base.today,
    estimatedMinutes: 60,
    priority: "fresh",
    status: "completed",
    completedAt: "2026-10-24T00:00:00.000Z",
    reasonCode: "FOUNDATION",
    reason: "Foundation.",
  };
  const active = {
    windowStart: base.today,
    windowEnd: "2026-10-30",
    tasks: [completed],
  };
  assert.deepEqual(
    generatePlan({ ...base, kind: "reschedule", active }).tasks,
    [completed],
  );
  assert.throws(
    () =>
      generatePlan({
        ...base,
        kind: "reschedule",
        active,
        preferences: { ...preferences, dailyMinutes: 30 },
      }),
    /PLAN_BUDGET_CONFLICT/,
  );
});
test("window/date boundaries, difficulty and honest shortages", () => {
  assert.equal(studyDate(new Date("2026-12-31T18:30:00Z")), "2027-01-01");
  assert.equal(addDays("2028-02-28", 1), "2028-02-29");
  assert.equal(generatePlan(base).windowEnd, "2026-11-22");
  assert.equal(generatePlan(base).tasks.length, 0);
  assert.throws(
    () =>
      generatePlan({
        ...base,
        preferences: { ...preferences, deadline: "2026-10-29" },
      }),
    /PLAN_WINDOW_INVALID/,
  );
  assert.equal(
    generatePlan({
      ...base,
      materials: [{ ...item("hard"), difficulty: "hard" }],
    }).tasks.length,
    0,
  );
  const unavailable = generatePlan({
    ...base,
    materials: [{ ...item("archived"), available: false }],
    cycles: [
      { contentId: "archived", lastAttemptSequence: 1, dueDate: base.today },
    ],
  });
  assert.equal(unavailable.deferred[0]!.reasonCode, "CONTENT_UNAVAILABLE");
  assert.equal(
    proposalValue.safeParse({
      ...generatePlan(base),
      tasks: [{ owner: "injected" }],
    }).success,
    false,
  );
});

test("oldest overdue revision wins even when its ID sorts last; never duplicate it as fresh", () => {
  const materials = [
    item("a-newer", "dsa", "arrays", 60),
    item("z-older", "dsa", "arrays", 60),
  ];
  const plan = generatePlan({
    ...base,
    materials,
    cycles: [
      { contentId: "a-newer", lastAttemptSequence: 2, dueDate: "2026-10-23" },
      { contentId: "z-older", lastAttemptSequence: 1, dueDate: "2026-10-22" },
    ],
  });
  assert.equal(
    plan.tasks.find((task) => task.contentId === "z-older")!.scheduledDate,
    base.today,
  );
  assert.equal(
    plan.tasks.find((task) => task.contentId === "a-newer")!.scheduledDate,
    addDays(base.today, 1),
  );
  assert.equal(plan.tasks.length, 2);
  assert.ok(plan.tasks.every((task) => task.kind === "revision"));
});

test("company configuration keeps foundations without claims inferred from missing associations", () => {
  const foundation = item("foundation", "cs", "dbms");
  const otherCompany = { ...item("ltm-only"), companies: ["ltm"] };
  const unknown = { ...item("unknown", "dsa", "not_canonical") };
  const plan = generatePlan({
    ...base,
    materials: [foundation, otherCompany, unknown],
  });
  assert.deepEqual(
    plan.tasks.map((task) => task.contentId),
    ["foundation"],
  );
  assert.throws(() =>
    validatePlanningConfiguration({}, { unknown: { dsa: ["arrays"] } }),
  );
  assert.throws(() =>
    validatePlanningConfiguration(
      {},
      { cognizant: { dsa: ["arrays", "arrays"] } },
    ),
  );
});

test("reduced future budget preserves prior-day completion without pretending it is new work", () => {
  const completed: Task = {
    taskId: "00000000-0000-4000-8000-000000000001",
    contentId: "000000000000000000000001",
    contentSnapshot: item("prior").snapshot,
    kind: "fresh",
    scheduledDate: "2026-10-23",
    estimatedMinutes: 60,
    priority: "fresh",
    status: "completed",
    completedAt: "2026-10-23T06:00:00.000Z",
    reasonCode: "FOUNDATION",
    reason: "Previously completed work.",
  };
  const plan = generatePlan({
    ...base,
    kind: "reschedule",
    preferences: { ...preferences, dailyMinutes: 30 },
    active: {
      windowStart: "2026-10-23",
      windowEnd: "2026-10-30",
      tasks: [completed],
    },
  });
  assert.deepEqual(plan.tasks, [completed]);
  assert.equal(proposalValue.safeParse(plan).success, true);
});

test("planning limits reject rather than truncating deferred work and do not reuse expired windows", () => {
  assert.throws(
    () =>
      generatePlan({
        ...base,
        preferences: {
          ...preferences,
          dailyMinutes: 30,
          deadline: "2026-10-30",
        },
        materials: Array.from({ length: 481 }, (_, index) =>
          item(String(index), "dsa", "arrays", 60),
        ),
      }),
    /PLAN_SCOPE_TOO_LARGE/,
  );
  assert.throws(
    () =>
      generatePlan({
        ...base,
        kind: "reschedule",
        active: {
          windowStart: "2026-10-01",
          windowEnd: "2026-10-23",
          tasks: [],
        },
      }),
    /PLAN_NOT_ACTIVE/,
  );
});
