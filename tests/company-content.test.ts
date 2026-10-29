import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { DatabaseSync } from "node:sqlite";
import batch from "../docs/content/company-batch.v1.json";
import ledger from "../docs/content/company-source-ledger.v1.json";
import starter from "../docs/content/starter-catalog.v1.json";
import {
  importBatchSchema,
  prepareImport,
} from "../src/modules/catalog/import-schema";
import { publicationFields } from "../src/modules/catalog/publication";

test("batch schema, source accounting, review gates and existing pack identity", () => {
  const parsed = importBatchSchema.parse(batch);
  assert.equal(parsed.candidates.length, 39);
  const originals = parsed.candidates.filter((item) => !item.sourceRefs.length);
  assert.equal(originals.length, 20);
  assert.deepEqual(
    ["quantitative", "logical_reasoning", "verbal_ability"].map(
      (topic) =>
        originals.filter((item) => item.content.topic === topic).length,
    ),
    [7, 7, 6],
  );
  const sourceIds = ["ltm", "cognizant"].flatMap((company) =>
    [
      ...readFileSync(
        `docs/content/company-${company}-sources.md`,
        "utf8",
      ).matchAll(/\*\*((?:LTM|COG)-\d{3})\*\*/g),
    ].map((match) => match[1]!),
  );
  assert.equal(sourceIds.length, 246);
  assert.deepEqual(
    ledger.entries.map((entry) => entry.sourceRef).sort(),
    [...sourceIds].sort(),
  );
  for (const entry of ledger.entries)
    assert.ok(sourceIds.includes(entry.canonicalSource));
  for (const candidate of parsed.candidates) {
    for (const reference of candidate.sourceRefs)
      assert.ok(sourceIds.includes(reference));
    assert.ok(candidate.content.prompt?.trim());
    assert.ok(candidate.content.explanation?.trim());
    assert.deepEqual(Object.keys(publicationFields(candidate.content)), [
      "reviewedAt",
    ]);
  }
  const oldSlugs = new Set(JSON.stringify(starter).match(/"slug":"[^"]+"/g));
  for (const item of parsed.candidates)
    assert.ok(!oldSlugs.has('"slug":"' + item.content.slug + '"'));
  assert.equal(prepareImport(batch).filter((item) => item.blocked).length, 19);
  const reviewed = prepareImport(batch, "2026-01-01T00:00:00.000Z");
  assert.ok(reviewed.every((item) => item.values.reviewedAt === null));
  assert.ok(
    reviewed
      .flatMap((item) => item.values.companies)
      .every((association) => association.association === "student_reported"),
  );
  const bad = structuredClone(batch);
  Object.assign(bad.candidates[0]!.content, { status: "published" });
  assert.throws(() => prepareImport(bad));
  assert.throws(() => prepareImport(batch, "2999-01-01T00:00:00.000Z"));
});

test("coding worked outputs and edge cases", () => {
  function bubble(input: number[]) {
    const result = [...input];
    for (let end = result.length - 1; end > 0; end--) {
      let changed = false;
      for (let index = 0; index < end; index++)
        if (result[index]! > result[index + 1]!) {
          [result[index], result[index + 1]] = [
            result[index + 1]!,
            result[index]!,
          ];
          changed = true;
        }
      if (!changed) break;
    }
    return result;
  }
  const palindromes = Array.from(
    { length: 100001 },
    (_, index) => index,
  ).filter((value) => String(value) === [...String(value)].reverse().join(""));
  assert.deepEqual(
    palindromes.filter((value) => value >= 95 && value <= 105),
    [99, 101],
  );
  assert.deepEqual(
    palindromes.slice(0, 12),
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22],
  );
  assert.equal(
    "  prep\twith  care "
      .trim()
      .split(/[ \t]+/)
      .reverse()
      .join(" "),
    "care with prep",
  );
  assert.deepEqual(
    [..."A9 !\tb"].reduce(
      (counts, char) => {
        counts[
          /[A-Za-z]/.test(char)
            ? 0
            : /[0-9]/.test(char)
              ? 1
              : /[ \t\n]/.test(char)
                ? 2
                : 3
        ]!++;
        return counts;
      },
      [0, 0, 0, 0],
    ),
    [2, 1, 2, 1],
  );
  for (const input of [
    [],
    [7],
    [7, 7],
    [5, 5, 2, 4],
    [-2, -8, -3],
    [3, 1, 2, 1],
  ]) {
    const copy = [...input];
    assert.deepEqual(
      bubble(input),
      [...input].sort((left, right) => left - right),
    );
    assert.deepEqual(input, copy);
    let first: number | undefined;
    let second: number | undefined;
    for (const value of input)
      if (first === undefined || value > first) {
        second = first;
        first = value;
      } else if (value !== first && (second === undefined || value > second))
        second = value;
    assert.equal(
      second ?? null,
      [...new Set(input)].sort((left, right) => right - left)[1] ?? null,
    );
  }
  function uniqueWindow(input: string) {
    const last = new Map<string, number>();
    let left = 0;
    let length = 0;
    let start = 0;
    for (let index = 0; index < input.length; index++) {
      const char = input[index]!;
      left = Math.max(left, (last.get(char) ?? -1) + 1);
      last.set(char, index);
      if (index - left + 1 > length) {
        length = index - left + 1;
        start = left;
      }
    }
    return [length, start];
  }
  for (const [input, expected] of [
    ["abba", [2, 0]],
    ["abcabcbb", [3, 0]],
    ["aaaa", [1, 0]],
    ["", [0, 0]],
  ] as const)
    assert.deepEqual(uniqueWindow(input), expected);
  for (let size = 0; size <= 30; size++)
    for (let missing = 0; missing <= size; missing++) {
      const input = Array.from({ length: size + 1 }, (_, index) => index)
        .filter((value) => value !== missing)
        .reverse();
      let result = size;
      input.forEach((value, index) => {
        result ^= value ^ index;
      });
      assert.equal(result, missing);
    }
  for (let code = 0; code < 243; code++) {
    let current = code;
    const input = Array.from({ length: 5 }, () => {
      const value = current % 3;
      current = Math.floor(current / 3);
      return value;
    });
    let low = 0;
    let high = input.length - 1;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (input[mid]! < input[mid + 1]!) low = mid + 1;
      else high = mid;
    }
    assert.ok(
      (low === 0 || input[low]! >= input[low - 1]!) &&
        (low === input.length - 1 || input[low]! >= input[low + 1]!),
    );
  }
  const frequencies = new Map<string, number>();
  for (const char of "banana")
    frequencies.set(char, (frequencies.get(char) ?? 0) + 1);
  assert.deepEqual([...frequencies].sort(), [
    ["a", 3],
    ["b", 1],
    ["n", 2],
  ]);
  const input = [4, 2, 4, 4, 2, 7];
  assert.deepEqual(
    [...new Set(input)].filter(
      (value) => input.filter((other) => other === value).length > 1,
    ),
    [4, 2],
  );
  const incoming: number[] = [];
  const outgoing: number[] = [];
  function read(remove: boolean) {
    if (!outgoing.length)
      while (incoming.length) outgoing.push(incoming.pop()!);
    return remove ? (outgoing.pop() ?? null) : (outgoing.at(-1) ?? null);
  }
  incoming.push(4, 7);
  const outputs = [read(false), read(true)];
  incoming.push(9);
  outputs.push(read(true), read(true), read(true));
  assert.deepEqual(outputs, [4, 4, 7, 9, null]);
});

test("all quantitative sets and logical enumerations", () => {
  const close = (actual: number, expected: number) =>
    assert.ok(Math.abs(actual - expected) < 1e-8);
  close(1000 * 0.88 * 1.05 + 30, 954);
  close(954 - 250 * 0.88 * 1.05, 723);
  close(3 * (1 / 12 + 1 / 18), 5 / 12);
  close(3 + (1 - 5 / 12) * 18, 13.5);
  close(12 * 0.75 ** 2, 6.75);
  close((6.75 + 7.5) / (40 + 7.5), 0.3);
  close(60 + 60 * 0.9, 114);
  close(40 * 1.65, 66);
  close(20000 * 1.1 * 0.8 * 1.05, 18480);
  assert.equal(((1520 / 18480) * 100).toFixed(2), "8.23");
  close(((5 / 8) * 4) / 7, 5 / 14);
  close(5 / 14 + 15 / 28 + 3 / 28, 1);
  const feasible: { a: number; b: number; value: number }[] = [];
  for (let a = 0; a <= 6; a++)
    for (let b = 0; b <= 6; b++)
      if (3 * a + 2 * b <= 18 && 2 * a + 4 * b <= 24)
        feasible.push({ a, b, value: 40 * a + 50 * b });
  assert.deepEqual(
    feasible.sort((left, right) => right.value - left.value)[0],
    { a: 2, b: 5, value: 330 },
  );
  function permutations(values: string[]): string[][] {
    return values.length
      ? values.flatMap((value, index) =>
          permutations(values.filter((_, other) => other !== index)).map(
            (rest) => [value, ...rest],
          ),
        )
      : [[]];
  }
  const orders = permutations(["A", "B", "C", "D"])
    .filter(
      (order) =>
        order.indexOf("A") < order.indexOf("C") &&
        order.indexOf("D") === order.indexOf("B") + 1,
    )
    .map((order) => order.join(""));
  assert.deepEqual(orders.sort(), ["ABDC", "ACBD", "BDAC"]);
  assert.deepEqual(
    ["A", "B", "C"].filter(
      (who) =>
        [who === "B", who === "C", who !== "B"].filter(Boolean).length === 1,
    ),
    ["A", "B"],
  );
  assert.deepEqual(
    permutations(["API", "DB", "UI", "QA"]).filter(
      ([ana, ben, chen, divya]) =>
        ana !== "DB" &&
        ana !== "QA" &&
        (ben === "DB" || ben === "QA") &&
        chen === "UI" &&
        divya !== "DB",
    ),
    [["API", "DB", "UI", "QA"]],
  );
  let value = 2;
  const sequence = [];
  for (let index = 0; index < 6; index++) {
    sequence.push(value);
    value = 2 * value + 1;
  }
  assert.deepEqual(sequence, [2, 5, 11, 23, 47, 95]);
  const fibonacci = [1, 3];
  while (fibonacci.length < 6)
    fibonacci.push(fibonacci.at(-1)! + fibonacci.at(-2)!);
  assert.deepEqual(fibonacci, [1, 3, 4, 7, 11, 18]);
  const edges: Record<string, string[]> = {
    S: ["A", "B"],
    A: ["C", "D"],
    B: ["D"],
    C: ["T"],
    D: ["T"],
  };
  const routes = (node: string): number =>
    node === "T"
      ? 1
      : edges[node]!.reduce((sum, next) => sum + routes(next), 0);
  assert.equal(routes("S"), 3);
  edges.C!.push("D");
  assert.equal(routes("S"), 4);
  assert.deepEqual(
    [35 - 12, 28 - 12, 35 + 28 - 12, 60 - (35 + 28 - 12)],
    [23, 16, 51, 9],
  );
  close((20 / 25) * 100 - (30 / 50) * 100, 20);
  for (const approved of [false, true])
    for (const reviewed of [false, true])
      assert.equal(!approved || reviewed, reviewed || !approved);
});

test("SQL example semantics on SQLite, not PostgreSQL engine certification", () => {
  const db = new DatabaseSync(":memory:");
  try {
    db.exec(
      "CREATE TABLE employees(id INTEGER PRIMARY KEY,name TEXT,salary INTEGER);INSERT INTO employees VALUES(1,'A',100),(2,'B',200),(3,'C',200),(4,'D',NULL),(5,'E',150);CREATE TABLE a(id INTEGER PRIMARY KEY);INSERT INTO a VALUES(1),(2),(3);CREATE TABLE b(id INTEGER);INSERT INTO b VALUES(2),(2),(NULL);CREATE TABLE products(id INTEGER PRIMARY KEY,name TEXT);INSERT INTO products VALUES(1,'Pen'),(2,'Book'),(3,'Bag');CREATE TABLE sales(id INTEGER PRIMARY KEY,product_id INTEGER,amount INTEGER);INSERT INTO sales VALUES(10,1,20),(11,1,30),(12,2,NULL),(13,NULL,40);CREATE TABLE registrations(id INTEGER PRIMARY KEY,email TEXT);INSERT INTO registrations VALUES(1,'a@x'),(2,'a@x'),(3,'b@x'),(4,NULL),(5,NULL);",
    );
    const rows = (sql: string) =>
      db
        .prepare(sql)
        .all()
        .map((row) => Object.values(row));
    assert.deepEqual(
      rows(
        "SELECT id FROM employees WHERE salary=(SELECT MAX(salary) FROM employees) ORDER BY id",
      ),
      [[2], [3]],
    );
    assert.deepEqual(
      rows(
        "WITH ranked AS (SELECT *,DENSE_RANK() OVER(ORDER BY salary DESC) r FROM employees WHERE salary IS NOT NULL) SELECT id FROM ranked WHERE r=2",
      ),
      [[5]],
    );
    assert.deepEqual(
      rows(
        "SELECT a.id FROM a WHERE NOT EXISTS(SELECT 1 FROM b WHERE b.id=a.id) ORDER BY a.id",
      ),
      [[1], [3]],
    );
    assert.deepEqual(
      rows("SELECT id FROM a WHERE id NOT IN(SELECT id FROM b)"),
      [],
    );
    assert.deepEqual(
      rows(
        "SELECT p.id,COALESCE(SUM(s.amount),0),COUNT(s.id),COUNT(s.amount) FROM products p LEFT JOIN sales s ON p.id=s.product_id GROUP BY p.id ORDER BY p.id",
      ),
      [
        [1, 50, 2, 2],
        [2, 0, 1, 0],
        [3, 0, 0, 0],
      ],
    );
    assert.deepEqual(
      rows(
        "SELECT email,COUNT(*) FROM registrations WHERE email IS NOT NULL GROUP BY email HAVING COUNT(*)>1",
      ),
      [["a@x", 2]],
    );
    assert.deepEqual(
      rows(
        "SELECT COUNT(email),COUNT(*),COUNT(DISTINCT email) FROM registrations",
      ),
      [[3, 5, 2]],
    );
    db.exec(
      "DELETE FROM employees WHERE salary<>200;UPDATE employees SET salary=NULL;",
    );
    assert.deepEqual(
      rows(
        "SELECT id FROM employees WHERE salary=(SELECT MAX(salary) FROM employees)",
      ),
      [],
    );
  } finally {
    db.close();
  }
});
