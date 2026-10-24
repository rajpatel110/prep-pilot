import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { Types, createConnection } from "mongoose";
import { attemptInput } from "../src/modules/practice/schemas";
import { attemptHash } from "../src/modules/practice/service";
import { revisionSchedule } from "../src/modules/revisions/rules";
import {
  issueStudyCursor,
  inspectStudyCursor,
} from "../src/modules/practice/cursor";
import {
  prepareSubmission,
  restoreSubmission,
} from "../src/modules/practice/submission";
import { attemptModel } from "../src/modules/practice/model";

const input = {
  submissionId: randomUUID(),
  contentId: new Types.ObjectId().toString(),
  kind: "practice" as const,
  outcome: "independent" as const,
};
test("all revision branches use 1/3/7-day precedence and Kolkata calendar boundaries", () => {
  for (const outcome of ["independent", "needed_help", "failed"] as const)
    for (const perceivedDifficulty of [
      undefined,
      "easy",
      "medium",
      "hard",
    ] as const) {
      const result = revisionSchedule(
        { outcome, ...(perceivedDifficulty ? { perceivedDifficulty } : {}) },
        new Date("2026-12-31T18:30:00Z"),
      );
      const expected =
        outcome === "failed" || perceivedDifficulty === "hard"
          ? 1
          : outcome === "needed_help" || perceivedDifficulty === "medium"
            ? 3
            : 7;
      assert.equal(result.intervalDays, expected);
      assert.equal(result.attemptDate, "2027-01-01");
      assert.equal(
        result.dueDate,
        `2027-01-${String(1 + expected).padStart(2, "0")}`,
      );
    }
  assert.equal(
    revisionSchedule({ outcome: "failed" }, new Date("2028-02-28T18:30:00Z"))
      .dueDate,
    "2028-03-01",
  );
  assert.equal(
    revisionSchedule({ outcome: "failed" }, new Date("2026-10-23T18:29:59Z"))
      .dueDate,
    "2026-10-24",
  );
});
test("attempt inputs reject invented outcomes, task context and authoritative fields; hashes are canonical", () => {
  assert.ok(attemptInput.safeParse(input).success);
  for (const patch of [
    { outcome: "solved" },
    { kind: "resource" },
    { submissionId: "bad" },
    { perceivedDifficulty: null },
    { planId: input.contentId },
    { taskId: randomUUID() },
    { userId: "other" },
    { createdAt: new Date().toISOString() },
    { attemptSequence: 7 },
    { dueDate: "2026-10-24" },
  ])
    assert.equal(attemptInput.safeParse({ ...input, ...patch }).success, false);
  assert.equal(
    attemptHash(input),
    attemptHash({ ...input, submissionId: randomUUID() }),
  );
  assert.notEqual(
    attemptHash(input),
    attemptHash({ ...input, outcome: "failed" }),
  );
});
test("study cursors bind owner, endpoint, filters, tuple and expiry", () => {
  const binding = JSON.stringify({
    userId: "student",
    endpoint: "attempts",
    limit: 20,
  });
  const secret = "unit-secret";
  const now = 1700000000000;
  const token = issueStudyCursor({ sequence: 8 }, binding, secret, now);
  assert.deepEqual(inspectStudyCursor(token, binding, secret, now), {
    sequence: 8,
  });
  for (const changed of [
    binding + "other",
    binding.replace("attempts", "revisions"),
    binding.replace("student", "other"),
  ])
    assert.equal(inspectStudyCursor(token, changed, secret, now), null);
  assert.equal(inspectStudyCursor(token, binding, secret, now + 1800000), null);
  assert.equal(inspectStudyCursor(token + "x", binding, secret, now), null);
});
test("submission retries and reload restoration keep the original frozen identity and payload", () => {
  let count = 0;
  const makeId = () => {
    count++;
    return randomUUID();
  };
  const pending = prepareSubmission(null, input, makeId);
  const retry = prepareSubmission(
    pending,
    { ...input, outcome: "failed" },
    makeId,
  );
  assert.deepEqual(retry, pending);
  assert.equal(count, 1);
  assert.deepEqual(
    restoreSubmission(JSON.stringify(pending), input.contentId),
    pending,
  );
  assert.equal(
    restoreSubmission(JSON.stringify(pending), new Types.ObjectId().toString()),
    null,
  );
  const next = prepareSubmission(null, input, makeId);
  assert.notEqual(next.submissionId, pending.submissionId);
});
test("attempt storage validates immutable complete snapshots without creating indexes or collections", async () => {
  const connection = createConnection();
  const model = attemptModel(connection);
  const now = new Date();
  const record = new model({
    ...input,
    userId: "student",
    requestHash: attemptHash(input),
    contentSnapshot: {
      title: "A question",
      subject: "dsa",
      topic: "arrays",
      type: "question",
      contentRevision: 1,
    },
    subject: "dsa",
    topic: "arrays",
    attemptSequence: 1,
    resultSnapshot: {
      revisionId: new Types.ObjectId(),
      dueDate: "2026-10-31",
      intervalDays: 7,
      resultingStateRevision: 1,
      attemptDate: "2026-10-24",
    },
    createdAt: now,
    updatedAt: now,
  });
  await record.validate();
  record.attemptSequence = 0;
  await assert.rejects(record.validate());
  assert.equal(model.collection.collectionName, "attempts");
  assert.equal(model.schema.get("autoIndex"), false);
  await connection.close();
});
