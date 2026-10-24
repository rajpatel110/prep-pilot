import test from "node:test";
import assert from "node:assert/strict";
import {
  adjustmentEvidence,
  revisionEvidence,
  evidenceValue,
  type AttemptEvidence,
} from "../src/modules/planning/adaptation";
import {
  proposeAdjustment,
  compareAdjustment,
} from "../src/modules/planning/adjustment";
import { generatePlan, type Material } from "../src/modules/planning/engine";
import { assessCoverage } from "../src/modules/catalog/coverage";
const attempts: AttemptEvidence[] = [
  "failed",
  "needed_help",
  "independent",
].map((outcome, index) => ({
  id: String(index + 1).padStart(24, "0"),
  contentId: "source",
  subject: "dsa",
  topic: "arrays",
  kind: "practice",
  outcome: outcome as AttemptEvidence["outcome"],
  attemptSequence: index + 1,
}));
function material(
  id: string,
  difficulty: Material["difficulty"] = "easy",
  topic = "arrays",
): Material {
  return {
    id,
    difficulty,
    snapshot: {
      title: id,
      subject: "dsa",
      topic,
      type: "question",
      contentRevision: 1,
    },
    estimatedMinutes: 15,
    companies: [],
    available: true,
  };
}
const base = {
  today: "2026-10-24",
  preferences: {
    companies: ["cognizant" as const],
    deadline: "2026-10-30",
    dailyMinutes: 30,
    skills: { dsa: 3, aptitude: 2, cs: 2 },
  },
  kind: "initial" as const,
  active: null,
  materials: [material("source", "medium"), material("hard-pending", "medium")],
  cycles: [],
  attemptedIds: ["source"],
  idFor: (identity: string) => identity,
};
test("only the last three non-revision attempts per classification trigger support", () => {
  assert.equal(adjustmentEvidence(attempts.slice(0, 2)).length, 0);
  assert.equal(adjustmentEvidence(attempts).length, 1);
  assert.deepEqual(
    adjustmentEvidence([...attempts].reverse()),
    adjustmentEvidence(attempts),
  );
  assert.equal(
    adjustmentEvidence([
      ...attempts,
      {
        ...attempts[0]!,
        id: "000000000000000000000004",
        outcome: "independent",
        attemptSequence: 4,
      },
    ]).length,
    0,
  );
  assert.equal(
    adjustmentEvidence(
      attempts.map((attempt) => ({ ...attempt, kind: "revision" })),
    ).length,
    0,
  );
  assert.equal(
    adjustmentEvidence(
      attempts.map((attempt, index) => ({
        ...attempt,
        topic: index ? "arrays" : "strings",
      })),
    ).length,
    0,
  );
  assert.equal(
    evidenceValue.safeParse({
      subject: "dsa",
      topic: "arrays",
      attemptIds: [],
      ruleCode: "MASTERY",
    }).success,
    false,
  );
});
test("an individual due revision applies without three attempts, never early or duplicate", () => {
  const cycle = {
    contentId: "source",
    dueDate: base.today,
    lastAttemptSequence: 1,
  };
  assert.equal(
    revisionEvidence(attempts.slice(0, 1), [cycle], [], base.today).length,
    1,
  );
  assert.equal(
    revisionEvidence(
      attempts,
      [{ ...cycle, dueDate: "2026-10-25" }],
      [],
      base.today,
    ).length,
    0,
  );
});
test("easier proposal replaces only pending harder work and preserves completion/history/budget", () => {
  const active = generatePlan(base);
  const original = JSON.stringify(active);
  const input = {
    ...base,
    kind: "adapt" as const,
    active,
    materials: [...base.materials, material("easier")],
  };
  const result = proposeAdjustment(input, attempts);
  assert.equal(
    result.proposal.tasks.some((task) => task.contentId === "easier"),
    true,
  );
  assert.equal(
    result.proposal.tasks.some((task) => task.contentId === "hard-pending"),
    false,
  );
  assert.ok(
    result.proposal.deferred.some(
      (task) => task.reasonCode === "REPLACED_FOR_SUPPORT",
    ),
  );
  assert.equal(
    compareAdjustment(active, result.proposal, result.evidence, input.materials)
      .useful,
    true,
  );
  assert.deepEqual(
    result,
    proposeAdjustment(
      { ...input, materials: [...input.materials].reverse() },
      [...attempts].reverse(),
    ),
  );
  assert.equal(JSON.stringify(active), original);
  for (const date of new Set(
    result.proposal.tasks.map((task) => task.scheduledDate),
  ))
    assert.ok(
      result.proposal.tasks
        .filter((task) => task.scheduledDate === date)
        .reduce((sum, task) => sum + task.estimatedMinutes, 0) <= 30,
    );
  const completed = {
    ...active,
    tasks: active.tasks.map((task) => ({
      ...task,
      status: "completed" as const,
      completedAt: "2026-10-24T10:00:00.000Z",
    })),
  };
  const retained = proposeAdjustment({ ...input, active: completed }, attempts);
  assert.deepEqual(
    retained.proposal.tasks.filter((task) => task.status === "completed"),
    completed.tasks,
  );
});
test("missing easier content does not fabricate a repeat or a useful adjustment", () => {
  const active = generatePlan(base);
  const result = proposeAdjustment(
    { ...base, kind: "adapt", active },
    attempts,
  );
  const comparison = compareAdjustment(
    active,
    result.proposal,
    result.evidence,
    base.materials,
  );
  assert.equal(comparison.useful, false);
  assert.match(comparison.limitations[0]!, /No eligible strictly easier/);
  assert.equal(
    result.proposal.tasks.some((task) => task.contentId === "source"),
    false,
  );
  assert.equal(adjustmentEvidence([]).length, 0);
});
test("missing prerequisites and company mismatch cannot remove work for an unschedulable substitute", () => {
  const source = material("source", "medium", "sorting");
  const evidence = attempts.map((attempt) => ({
    ...attempt,
    topic: "sorting",
  }));
  const input = {
    ...base,
    materials: [source, material("hard-pending", "medium", "sorting")],
  };
  const active = generatePlan({
    ...input,
    materials: [...input.materials, material("arrays", "easy")],
  });
  const result = proposeAdjustment(
    {
      ...input,
      kind: "adapt",
      active: {
        ...active,
        tasks: active.tasks.filter((task) => task.contentId !== "arrays"),
      },
      materials: [...input.materials, material("easier", "easy", "sorting")],
    },
    evidence,
  );
  assert.equal(
    result.proposal.tasks.some((task) => task.contentId === "easier"),
    false,
  );
  assert.equal(
    result.proposal.deferred.some(
      (task) => task.reasonCode === "REPLACED_FOR_SUPPORT",
    ),
    false,
  );
  const mismatch = proposeAdjustment(
    {
      ...base,
      kind: "adapt",
      active: generatePlan(base),
      materials: [
        ...base.materials,
        { ...material("easier"), companies: ["ltm"] },
      ],
    },
    attempts,
  );
  assert.equal(
    mismatch.proposal.tasks.some((task) => task.contentId === "easier"),
    false,
  );
});
test("coverage reports empty catalog, all canonical gaps and both prerequisite edges", () => {
  const report = assessCoverage([]);
  assert.equal(report.topics.length, 17);
  assert.equal(report.missingTemplateTopics.length, 17);
  assert.equal(report.missingFoundationTopics.length, 17);
  assert.equal(report.prerequisiteGaps.length, 2);
  assert.equal(report.missingCompanyTopics.cognizant!.length, 17);
  const invalid = assessCoverage([
    {
      _id: "000000000000000000000001",
      status: "published",
      subject: "dsa",
      topic: "arrays",
    },
  ]);
  assert.equal(invalid.eligible, 0);
  assert.ok(invalid.rejected[0]!.fields.includes("difficulty"));
});

test("coverage includes valid shared foundations for both companies and reports metadata defects", () => {
  const now = new Date();
  const record = {
    _id: "000000000000000000000001",
    title: "Reviewed arrays",
    slug: "reviewed-arrays",
    subject: "dsa",
    topic: "arrays",
    type: "question",
    difficulty: "easy",
    estimatedMinutes: 15,
    source: "Original fixture",
    attribution: "",
    tags: [],
    companies: [],
    assetIds: [],
    reviewedAt: now,
    prompt: "Compare two arrays.",
    status: "published",
    revision: 1,
    createdBy: "fixture",
    updatedBy: "fixture",
    publishedAt: now,
    archivedAt: null,
    schemaVersion: 1,
    createdAt: now,
    updatedAt: now,
  };
  const report = assessCoverage([record]);
  assert.equal(report.eligible, 1);
  assert.equal(report.prerequisiteGaps.length, 0);
  const arrays = report.topics.find((topic) => topic.topic === "arrays")!;
  assert.equal(arrays.foundation, 1);
  assert.equal(arrays.companies.cognizant!.associated, 0);
  assert.equal(arrays.companies.cognizant!.eligibleIncludingFoundation, 1);
  assert.equal(arrays.companies.ltm!.eligibleIncludingFoundation, 1);
  const broken = assessCoverage([{ ...record, prompt: "", reviewedAt: null }]);
  assert.equal(broken.eligible, 0);
  assert.ok(broken.rejected[0]!.fields.includes("reviewedAt"));
});

test("completed revision cycles are retained exactly once during adjustment", () => {
  const cycle = {
    contentId: "source",
    dueDate: base.today,
    lastAttemptSequence: 1,
  };
  const initial = generatePlan({ ...base, cycles: [cycle] });
  const active = {
    ...initial,
    tasks: initial.tasks.map((task) =>
      task.kind === "revision"
        ? {
            ...task,
            status: "completed" as const,
            completedAt: "2026-10-24T10:00:00.000Z",
          }
        : task,
    ),
  };
  const result = generatePlan({
    ...base,
    kind: "adapt",
    active,
    cycles: [cycle],
  });
  assert.equal(
    result.tasks.filter(
      (task) => task.kind === "revision" && task.contentId === "source",
    ).length,
    1,
  );
  assert.deepEqual(
    result.tasks.find((task) => task.kind === "revision"),
    active.tasks.find((task) => task.kind === "revision"),
  );
});
