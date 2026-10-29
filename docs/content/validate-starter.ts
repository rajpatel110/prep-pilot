import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  draftInputSchema,
  storedContentSchema,
} from "../../src/modules/catalog/schemas";
import { publicationFields } from "../../src/modules/catalog/publication";
import {
  generatePlan,
  addDays,
  type Material,
} from "../../src/modules/planning/engine";
import { catalogTopics } from "../../src/config/catalog";
import {
  prerequisites,
  templateVersion,
  rulesVersion,
} from "../../src/config/planning";

const input: unknown = JSON.parse(
  readFileSync("docs/content/starter-catalog.v1.json", "utf8"),
);
assert.ok(Array.isArray(input));
assert.equal(input.length, 50);
const records = input.map((record) => draftInputSchema.parse(record));
assert.equal(new Set(records.map((record) => record.slug)).size, 50);
const counts = (keys: string[]) =>
  Object.fromEntries(
    [...new Set(keys)]
      .sort()
      .map((key) => [key, keys.filter((value) => value === key).length]),
  );
assert.deepEqual(counts(records.map((record) => record.subject)), {
  aptitude: 15,
  cs: 15,
  dsa: 20,
});
for (const record of records) {
  const markdown = readFileSync(
    `docs/content/${record.subject}-review.md`,
    "utf8",
  ).replace(/\s+/g, " ");
  for (const value of [
    record.slug,
    record.title,
    record.source,
    record.attribution,
    record.prompt,
    record.body,
    record.explanation,
  ].filter((value): value is string => typeof value === "string"))
    assert.ok(
      markdown.includes(value.replace(/\s+/g, " ")),
      `Review companion mismatch: ${record.slug}`,
    );
  assert.equal(record.reviewedAt, null);
  assert.deepEqual(record.companies, []);
  assert.deepEqual(record.assetIds, []);
  assert.ok(
    record.type === "question"
      ? record.prompt?.trim() && record.explanation?.trim()
      : record.body?.trim(),
  );
  assert.deepEqual(Object.keys(publicationFields(record)), ["reviewedAt"]);
  assert.deepEqual(
    publicationFields({
      ...record,
      reviewedAt: new Date("2000-01-01T00:00:00Z"),
    }),
    {},
  );
  assert.ok(Buffer.byteLength(JSON.stringify(record)) < 65536);
  storedContentSchema.parse({
    ...record,
    _id: "000000000000000000000001",
    status: "draft",
    revision: 1,
    createdBy: "validation-only",
    updatedBy: "validation-only",
    publishedAt: null,
    archivedAt: null,
    schemaVersion: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}
for (const [subject, topics] of Object.entries(catalogTopics)) {
  for (const topic of topics)
    assert.ok(
      records.some(
        (record) =>
          record.subject === subject &&
          record.topic === topic &&
          record.difficulty === "easy",
      ),
    );
}
const today = "2026-10-25";
const materials: Material[] = records.map((record, index) => ({
  id: (index + 1).toString(16).padStart(24, "0"),
  snapshot: {
    title: record.title,
    subject: record.subject,
    topic: record.topic,
    type: record.type,
    contentRevision: 1,
  },
  estimatedMinutes: record.estimatedMinutes,
  difficulty: record.difficulty,
  companies: [],
  available: true,
}));
function plan(
  days: number,
  dailyMinutes: number,
  skill: number,
  companies: ("cognizant" | "ltm")[],
  candidates = materials,
) {
  return generatePlan({
    today,
    preferences: {
      companies,
      dailyMinutes,
      deadline: addDays(today, days - 1),
      skills: { dsa: skill, aptitude: skill, cs: skill },
    },
    kind: "initial",
    active: null,
    materials: candidates,
    cycles: [],
    attemptedIds: [],
    idFor: (identity) => identity,
  });
}
const scenarios = [];
for (const days of [7, 30])
  for (const dailyMinutes of [30, 60, 240])
    for (const skill of [1, 3]) {
      const result = plan(days, dailyMinutes, skill, ["cognizant", "ltm"]);
      assert.deepEqual(
        result,
        plan(
          days,
          dailyMinutes,
          skill,
          ["cognizant", "ltm"],
          [...materials].reverse(),
        ),
      );
      assert.deepEqual(
        result.tasks,
        plan(days, dailyMinutes, skill, ["cognizant"]).tasks,
      );
      assert.deepEqual(
        result.tasks,
        plan(days, dailyMinutes, skill, ["ltm"]).tasks,
      );
      assert.equal(
        new Set(result.tasks.map((task) => task.contentId)).size,
        result.tasks.length,
      );
      const used = new Map<string, number>();
      for (const task of result.tasks) {
        assert.ok(
          task.scheduledDate >= today && task.scheduledDate <= result.windowEnd,
        );
        assert.equal(
          task.estimatedMinutes,
          materials.find((item) => item.id === task.contentId)!
            .estimatedMinutes,
        );
        used.set(
          task.scheduledDate,
          (used.get(task.scheduledDate) ?? 0) + task.estimatedMinutes,
        );
        for (const parent of prerequisites[
          `${task.contentSnapshot.subject}:${task.contentSnapshot.topic}`
        ] ?? []) {
          assert.ok(
            result.tasks.some(
              (candidate) =>
                `${candidate.contentSnapshot.subject}:${candidate.contentSnapshot.topic}` ===
                  parent && candidate.scheduledDate <= task.scheduledDate,
            ),
          );
        }
      }
      assert.ok([...used.values()].every((minutes) => minutes <= dailyMinutes));
      assert.equal(
        new Set(result.tasks.map((task) => task.contentSnapshot.subject)).size,
        3,
      );
      scenarios.push({
        days,
        dailyMinutes,
        skill,
        tasks: result.tasks.length,
        scheduledMinutes: [...used.values()].reduce(
          (sum, value) => sum + value,
          0,
        ),
        unusedMinutes:
          days * dailyMinutes -
          [...used.values()].reduce((sum, value) => sum + value, 0),
        deferred: counts(result.deferred.map((task) => task.reasonCode)),
        subjects: Object.fromEntries(
          ["dsa", "aptitude", "cs"].map((subject) => [
            subject,
            result.tasks
              .filter((task) => task.contentSnapshot.subject === subject)
              .reduce((sum, task) => sum + task.estimatedMinutes, 0),
          ]),
        ),
      });
    }
const noArrays = plan(
  30,
  240,
  3,
  ["cognizant"],
  materials.filter((item) => item.snapshot.topic !== "arrays"),
);
assert.ok(
  !noArrays.tasks.some((task) =>
    ["sorting", "searching"].includes(task.contentSnapshot.topic),
  ),
);
assert.equal(
  noArrays.deferred.filter(
    (task) => task.reasonCode === "PREREQUISITE_UNAVAILABLE",
  ).length,
  4,
);
assert.equal(
  plan(
    7,
    60,
    3,
    ["cognizant"],
    materials.map((item) => ({ ...item, available: false })),
  ).tasks.length,
  0,
);
const firstBatchSlugs: string[] = JSON.parse(
  readFileSync("docs/content/first-publication-batch.v1.json", "utf8"),
);
assert.equal(firstBatchSlugs.length, 29);
assert.equal(new Set(firstBatchSlugs).size, 29);
const firstBatch = records.filter((record) =>
  firstBatchSlugs.includes(record.slug),
);
assert.equal(firstBatch.length, 29);
assert.ok(firstBatch.every((record) => record.difficulty === "easy"));
assert.equal(
  new Set(firstBatch.map((record) => `${record.subject}:${record.topic}`)).size,
  17,
);
const batchPlan = plan(
  7,
  90,
  1,
  ["cognizant", "ltm"],
  materials.filter((_, index) =>
    firstBatchSlugs.includes(records[index]!.slug),
  ),
);
assert.equal(batchPlan.tasks.length, 29);
assert.equal(batchPlan.deferred.length, 0);
assert.equal(
  batchPlan.tasks.reduce((sum, task) => sum + task.estimatedMinutes, 0),
  510,
);
console.log(
  "First batch STRUCTURAL PASS: 29 easy proposals; 510 nominal minutes; 7 days at 90 min/day; all 17 topics. Editorial timing holds still prohibit treating this as an approved publication batch.",
);

let workedChecks = 0;
function check(actual: unknown, expected: unknown) {
  assert.deepEqual(actual, expected);
  workedChecks++;
}
check(
  [4, -2, 5, 0].map((_, index, values) =>
    values.slice(0, index + 1).reduce((sum, value) => sum + value, 0),
  ),
  [4, 2, 7, 7],
);
check(
  (
    [
      [0, 2],
      [1, 3],
      [2, 2],
    ] as const
  ).map(([left, right]) =>
    [6, -2, 4, 3].slice(left, right + 1).reduce((sum, value) => sum + value, 0),
  ),
  [8, 5, 4],
);
for (const [text, expected] of [
  ["Step on no pets!", true],
  ["Prep 42", false],
  ["", true],
  ["!!!", true],
] as const) {
  const normalized = text.toLowerCase().replace(/[^a-z0-9]/g, "");
  check(normalized === [...normalized].reverse().join(""), expected);
}
check(["CAT".length, "😄".length, "".length, [..."😄"].length], [3, 2, 0, 1]);
check(
  Object.fromEntries(
    ["red", "blue", "green"].map((word) => [
      word,
      ["red", "blue", "red", "green", "blue", "red"].filter(
        (value) => value === word,
      ).length,
    ]),
  ),
  { red: 3, blue: 2, green: 1 },
);
function pairs(values: number[], target: number) {
  return values.flatMap((value, left) =>
    values.flatMap((other, right) =>
      right > left && value + other === target ? [[left, right]] : [],
    ),
  );
}
check(pairs([-3, 4, 8, 12], 9), [[0, 3]]);
check(pairs([5, 5], 10), [[0, 1]]);
check(pairs([5], 10), []);
const insertion = [7, 3, 5, 3],
  trace: number[][] = [];
for (let index = 1; index < insertion.length; index++) {
  const key = insertion[index]!;
  let cursor = index - 1;
  while (cursor >= 0 && insertion[cursor]! > key) {
    insertion[cursor + 1] = insertion[cursor]!;
    cursor--;
  }
  insertion[cursor + 1] = key;
  trace.push([...insertion]);
}
check(trace, [
  [3, 7, 5, 3],
  [3, 5, 7, 3],
  [3, 3, 5, 7],
]);
check(
  [
    ["Mira", 2],
    ["Omar", 1],
    ["Nia", 2],
  ]
    .sort((left, right) => Number(left[1]) - Number(right[1]))
    .map((value) => value[0]),
  ["Omar", "Mira", "Nia"],
);
check(
  [9, 2].map((target) => [-8, -1, 3, 9, 14].indexOf(target)),
  [3, -1],
);
check(
  [2, 6, 4].map((target) => [1, 2, 2, 2, 6].indexOf(target)),
  [1, 4, -1],
);
function reverse(values: string[]) {
  let head: { value: string; next: typeof head } | null = null;
  for (const value of [...values].reverse()) head = { value, next: head };
  let previous: typeof head = null;
  while (head) {
    const next = head.next;
    head.next = previous;
    previous = head;
    head = next;
  }
  const output = [];
  while (previous) {
    output.push(previous.value);
    previous = previous.next;
  }
  return output;
}
check(reverse(["A", "B", "C"]), ["C", "B", "A"]);
check(reverse([]), []);
check(reverse(["A"]), ["A"]);
function balanced(text: string) {
  const stack: string[] = [],
    closing: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
  for (const symbol of text) {
    if ("([{ ".trim().includes(symbol)) stack.push(symbol);
    else if (stack.pop() !== closing[symbol]) return false;
  }
  return !stack.length;
}
check(["([]{})", "([)]", "]", "", "("].map(balanced), [
  true,
  false,
  false,
  true,
  false,
]);
type Tree = { value: number; left?: Tree; right?: Tree };
const tree: Tree = {
  value: 20,
  left: { value: 10, right: { value: 25 } },
  right: { value: 30 },
};
function height(node?: Tree): number {
  return node ? 1 + Math.max(height(node.left), height(node.right)) : -1;
}
check([height(tree), height(), height({ value: 1 })], [2, -1, 0]);
function inorder(node?: Tree): number[] {
  return node
    ? [...inorder(node.left), node.value, ...inorder(node.right)]
    : [];
}
const traversal = inorder(tree);
check(
  traversal.every((value, index) => !index || traversal[index - 1]! < value),
  false,
);
const graph: Record<string, string[]> = {
  A: ["B", "C"],
  B: ["A", "D"],
  C: ["A", "D"],
  D: ["B", "C"],
  E: [],
};
const distance: Record<string, number | null> = {
    A: 0,
    B: null,
    C: null,
    D: null,
    E: null,
  },
  queue = ["A"];
while (queue.length) {
  const current = queue.shift()!;
  for (const neighbor of graph[current]!)
    if (distance[neighbor] === null) {
      distance[neighbor] = distance[current]! + 1;
      queue.push(neighbor);
    }
}
check(distance, { A: 0, B: 1, C: 1, D: 2, E: null });
function routes(steps: number): string[] {
  return steps === 0
    ? [""]
    : steps < 0
      ? []
      : [
          ...routes(steps - 1).map((route) => `1${route}`),
          ...routes(steps - 2).map((route) => `2${route}`),
        ];
}
check(
  [0, 1, 2, 4].map((steps) => routes(steps).length),
  [1, 1, 2, 5],
);
check(routes(4).sort(), ["1111", "112", "121", "211", "22"].sort());
function exhaustiveReward(values: number[]) {
  let best = 0;
  for (let mask = 0; mask < 2 ** values.length; mask++)
    if (!(mask & (mask << 1)))
      best = Math.max(
        best,
        values.reduce(
          (sum, value, index) => sum + (mask & (1 << index) ? value : 0),
          0,
        ),
      );
  return best;
}
check(
  [[5, 1, 2, 10, 6], [-4, -2], [], [4, 5, 4]].map(exhaustiveReward),
  [15, 0, 0, 8],
);
check(
  [800 * 0.85 * 0.9, (1 - 0.85 * 0.9) * 100].map(
    (value) => Math.round(value * 100) / 100,
  ),
  [612, 23.5],
);
check(
  [3 * (1 / 12 + 1 / 18), (1 - 3 * (1 / 12 + 1 / 18)) * 12].map((value) =>
    Math.round(value * 1e6),
  ),
  [416667, 7000000],
);
check((8 * 70 + 12 * 80) / 20, 76);
check([(45 / (12 + 18)) * 60, (12 * 45) / (12 + 18)], [90, 18]);
check([((3 / 5) * 2) / 4, 2 / 4], [0.3, 0.5]);
function permutations(values: string[]): string[][] {
  return values.length
    ? values.flatMap((value, index) =>
        permutations(values.filter((_, position) => position !== index)).map(
          (rest) => [value, ...rest],
        ),
      )
    : [[]];
}
check(
  permutations(["Asha", "Bina", "Chen", "Dev"]).filter(
    (order) =>
      order[3] === "Dev" &&
      order.indexOf("Bina") === order.indexOf("Asha") + 1 &&
      order.indexOf("Chen") < order.indexOf("Asha"),
  ),
  [["Chen", "Asha", "Bina", "Dev"]],
);
check(
  permutations(["Arun", "Bela", "Cora", "Deep"])
    .filter(
      (order) =>
        order.indexOf("Cora") === order.indexOf("Arun") + 1 &&
        order.indexOf("Bela") < order.indexOf("Arun") &&
        order[0] !== "Deep",
    )
    .sort(),
  [
    ["Bela", "Arun", "Cora", "Deep"],
    ["Bela", "Deep", "Arun", "Cora"],
  ].sort(),
);
check([25 + 11, 25 + 11 + 13], [36, 49]);
const filtered = [
  ["East", 40],
  ["East", 70],
  ["West", 90],
  ["West", 20],
  ["North", 30],
].filter((row) => Number(row[1]) >= 40);
check(
  ["East", "West", "North"]
    .map((region) => [
      region,
      filtered
        .filter((row) => row[0] === region)
        .reduce((sum, row) => sum + Number(row[1]), 0),
    ])
    .filter((row) => Number(row[1]) >= 100),
  [["East", 110]],
);
const remaining = [5, 3, 1],
  roundQueue = [0, 1, 2],
  completion = [0, 0, 0];
let clock = 0;
while (roundQueue.length) {
  const job = roundQueue.shift()!;
  const duration = Math.min(2, remaining[job]!);
  remaining[job] = remaining[job]! - duration;
  clock += duration;
  if (remaining[job]) roundQueue.push(job);
  else completion[job] = clock;
}
check(completion, [9, 8, 5]);
check(
  completion.map((value, index) => value - [5, 3, 1][index]!),
  [4, 5, 4],
);
check(
  [Math.floor(2500 / 1024), 2500 % 1024, 7 * 1024 + (2500 % 1024)],
  [2, 452, 7620],
);
check(
  [
    256 - 2 ** (32 - 27),
    Math.floor(77 / 32) * 32,
    Math.floor(77 / 32) * 32 + 31,
    2 ** (32 - 27) - 2,
  ],
  [224, 64, 95, 30],
);

console.log(
  JSON.stringify(
    {
      result: "PASS",
      records: records.length,
      subject: counts(records.map((record) => record.subject)),
      topic: counts(
        records.map((record) => `${record.subject}:${record.topic}`),
      ),
      difficulty: counts(records.map((record) => record.difficulty)),
      type: counts(records.map((record) => record.type)),
      totalMinutes: records.reduce(
        (sum, record) => sum + record.estimatedMinutes,
        0,
      ),
      subjectMinutes: Object.fromEntries(
        ["dsa", "aptitude", "cs"].map((subject) => [
          subject,
          records
            .filter((record) => record.subject === subject)
            .reduce((sum, record) => sum + record.estimatedMinutes, 0),
        ]),
      ),
      pendingPublication:
        "50/50 blocked only by reviewedAt; hypothetical date checks are in memory only",
      numericAndAlgorithmAssertions: workedChecks,
      plannerConfiguration: { templateVersion, rulesVersion },
      scenarios,
      negativePrerequisiteAndUnpublishedChecks: "PASS",
      databaseAccess: "none",
    },
    null,
    2,
  ),
);
