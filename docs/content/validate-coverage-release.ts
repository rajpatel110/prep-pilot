import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  importBatchSchema,
  prepareImport,
} from "../../src/modules/catalog/import-schema";
import { draftInputSchema } from "../../src/modules/catalog/schemas";
import { publicationFields } from "../../src/modules/catalog/publication";

async function main() {
  const batch = importBatchSchema.parse(
    JSON.parse(
      await readFile("docs/content/coverage-release-eight.v1.json", "utf8"),
    ),
  );
  const company = importBatchSchema.parse(
    JSON.parse(await readFile("docs/content/company-batch.v1.json", "utf8")),
  );
  const starter = JSON.parse(
    await readFile("docs/content/starter-catalog.v1.json", "utf8"),
  );
  assert.equal(batch.candidates.length, 8);
  assert.equal(
    batch.candidates.filter(({ content }) => content.type === "resource")
      .length,
    2,
  );
  assert.equal(
    batch.candidates.reduce(
      (sum, { content }) => sum + content.estimatedMinutes,
      0,
    ),
    127,
  );
  const source = new Map(
    [...company.candidates.map(({ content }) => content), ...starter].map(
      (content) => [content.slug, content],
    ),
  );
  for (const candidate of batch.candidates) {
    const original = source.get(candidate.content.slug);
    assert.ok(original);
    for (const field of [
      "title",
      "subject",
      "topic",
      "type",
      "difficulty",
      "prompt",
      "source",
      "externalUrl",
    ] as const) {
      assert.deepEqual(candidate.content[field], original[field]);
    }
    assert.equal(candidate.content.reviewedAt, null);
    assert.deepEqual(candidate.content.companies, []);
    assert.match(candidate.content.attribution, /Codex/);
    assert.match(
      candidate.content.attribution,
      /publication authorized by the owner/,
    );
    assert.match(candidate.content.attribution, /editorial estimate/);
    assert.deepEqual(Object.keys(publicationFields(candidate.content)), [
      "reviewedAt",
    ]);
  }
  assert.equal(prepareImport(batch).filter((item) => item.blocked).length, 4);
  const prepared = prepareImport(batch, new Date().toISOString());
  assert.equal(prepared.filter((item) => item.blocked).length, 0);
  for (const { values } of prepared) {
    for (const association of values.companies)
      assert.equal(association.association, "student_reported");
  }
  const short = batch.candidates.find(
    ({ content }) => content.slug === "apt-verbal-subject-agreement",
  )!.content;
  for (const minutes of [1, 2, 3, 60])
    assert.equal(
      draftInputSchema.safeParse({ ...short, estimatedMinutes: minutes })
        .success,
      true,
    );
  for (const minutes of [0, -1, 1.5, 61])
    assert.equal(
      draftInputSchema.safeParse({ ...short, estimatedMinutes: minutes })
        .success,
      false,
    );

  function* arrays<T>(alphabet: T[], maximum: number): Generator<T[]> {
    yield [];
    let level: T[][] = [[]];
    for (let length = 1; length <= maximum; length++) {
      level = level.flatMap((prefix) =>
        alphabet.map((value) => [...prefix, value]),
      );
      yield* level;
    }
  }
  function bubble(input: number[]) {
    const result = input.map((value, index) => ({ value, index }));
    for (let end = result.length - 1; end > 0; end--) {
      let swapped = false;
      for (let index = 0; index < end; index++) {
        if (result[index]!.value > result[index + 1]!.value) {
          [result[index], result[index + 1]] = [
            result[index + 1]!,
            result[index]!,
          ];
          swapped = true;
        }
      }
      if (!swapped) break;
    }
    return result;
  }
  function peak(input: number[]) {
    let low = 0;
    let high = input.length - 1;
    while (low < high) {
      const middle = low + Math.floor((high - low) / 2);
      if (input[middle + 1]! > input[middle]!) low = middle + 1;
      else high = middle;
    }
    return low;
  }
  function duplicates(input: number[]) {
    const counts = new Map<number, number>();
    for (const value of input) counts.set(value, (counts.get(value) ?? 0) + 1);
    const emitted = new Set<number>();
    return input.filter((value) => {
      if (counts.get(value)! < 2 || emitted.has(value)) return false;
      emitted.add(value);
      return true;
    });
  }
  let integerCases = 0;
  for (const input of arrays([-1, 0, 1], 7)) {
    const original = [...input];
    const sorted = bubble(input);
    assert.deepEqual(
      sorted.map((item) => item.value),
      [...input].sort((left, right) => left - right),
    );
    assert.deepEqual(input, original);
    for (let index = 1; index < sorted.length; index++) {
      if (sorted[index]!.value === sorted[index - 1]!.value)
        assert.ok(sorted[index]!.index > sorted[index - 1]!.index);
    }
    if (input.length) {
      const index = peak(input);
      assert.ok(index === 0 || input[index]! >= input[index - 1]!);
      assert.ok(
        index === input.length - 1 || input[index]! >= input[index + 1]!,
      );
    }
    const expected = [...new Set(input)].filter(
      (value) => input.filter((item) => item === value).length >= 2,
    );
    assert.deepEqual(duplicates(input), expected);
    integerCases++;
  }
  assert.deepEqual(duplicates([2, 1, 1, 2]), [2, 1]);
  assert.deepEqual(duplicates([4, 2, 4, 4, 2, 7]), [4, 2]);
  assert.deepEqual(
    bubble([3, 1, 2, 1]).map((item) => item.value),
    [1, 1, 2, 3],
  );
  for (const input of [
    Array.from({ length: 1000 }, (_, index) => index),
    Array.from({ length: 1000 }, (_, index) => -index),
    Array(1000).fill(4),
  ]) {
    const index = peak(input);
    assert.ok(index === 0 || input[index]! >= input[index - 1]!);
    assert.ok(index === input.length - 1 || input[index]! >= input[index + 1]!);
  }
  function windowResult(input: string) {
    const last = new Map<string, number>();
    let left = 0;
    let answer = [0, 0];
    for (let right = 0; right < input.length; right++) {
      const character = input[right]!;
      left = Math.max(left, (last.get(character) ?? -1) + 1);
      last.set(character, right);
      if (right - left + 1 > answer[0]!) answer = [right - left + 1, left];
    }
    return answer;
  }
  function bruteWindow(input: string) {
    let answer = [0, 0];
    for (let start = 0; start < input.length; start++) {
      const seen = new Set<string>();
      for (let end = start; end < input.length; end++) {
        if (seen.has(input[end]!)) break;
        seen.add(input[end]!);
        if (seen.size > answer[0]!) answer = [seen.size, start];
      }
    }
    return answer;
  }
  let stringCases = 0;
  for (const characters of arrays(["a", "A", " ", "b"], 7)) {
    const input = characters.join("");
    assert.deepEqual(windowResult(input), bruteWindow(input));
    stringCases++;
  }
  assert.deepEqual(windowResult("abba"), [2, 0]);
  assert.deepEqual(windowResult("abcabcbb"), [3, 0]);
  assert.deepEqual(windowResult("aaaa"), [1, 0]);
  assert.deepEqual(windowResult(""), [0, 0]);
  assert.deepEqual(windowResult("a".repeat(2000)), [1, 0]);
  const page = Math.floor(2500 / 1024);
  const offset = 2500 % 1024;
  assert.deepEqual([page, offset, 7 * 1024 + offset], [2, 452, 7620]);
  const initial = 0;
  const firstRead = initial;
  const secondRead = initial;
  let lostCounter = firstRead + 1;
  lostCounter = secondRead + 1;
  assert.equal(lostCounter, 1);
  let protectedCounter = 0;
  protectedCounter++;
  protectedCounter++;
  assert.equal(protectedCounter, 2);
  console.log(
    JSON.stringify({
      candidates: 8,
      resources: 2,
      estimatedMinutes: 127,
      integerCases,
      stringCases,
      publicationFieldPending: "reviewedAt",
      result: "passed",
    }),
  );
}
void main();
