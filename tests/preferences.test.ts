import assert from "node:assert/strict";
import test from "node:test";
import {
  minimumDeadline,
  preferenceFields,
  preferencesInputSchema,
  preferencesSchema,
  studyDate,
} from "../src/modules/identity/preferences-schema";
import { studentReturn } from "../src/modules/identity/student-routing";
import {
  libraryReturn,
  mergeContent,
} from "../src/modules/catalog/student-navigation";

const preferences = () => ({
  companies: ["cognizant", "ltm"],
  deadline: minimumDeadline(),
  dailyMinutes: 90,
  skills: { dsa: 1, aptitude: 3, cs: 5 },
  expectedStateRevision: 0,
});
test("preferences validate exact complete fields, safe revisions and inclusive Kolkata dates", () => {
  assert.ok(preferencesInputSchema.safeParse(preferences()).success);
  for (const patch of [
    { companies: [] },
    { companies: ["ltm", "ltm"] },
    { companies: ["tcs"] },
    { deadline: "2026-02-30" },
    { deadline: studyDate() },
    { dailyMinutes: 31 },
    { dailyMinutes: 245 },
    { skills: { dsa: 0, aptitude: 3, cs: 2 } },
    { expectedStateRevision: Number.MAX_SAFE_INTEGER },
    { role: "admin" },
    { timezone: "UTC" },
    { userId: "other" },
    { stateRevision: 0 },
    { skills: { dsa: 1, aptitude: 1, cs: 1, role: "admin" } },
  ])
    assert.equal(
      preferencesInputSchema.safeParse({ ...preferences(), ...patch }).success,
      false,
    );
  const { expectedStateRevision: _revision, ...stored } = preferences();
  assert.equal(_revision, 0);
  assert.ok(
    preferencesSchema.safeParse({ ...stored, deadline: "2020-01-01" }).success,
  );
  assert.equal(studyDate(new Date("2026-10-23T18:29:59Z")), "2026-10-23");
  assert.equal(studyDate(new Date("2026-10-23T18:30:00Z")), "2026-10-24");
  assert.equal(minimumDeadline(new Date("2028-02-25T18:30:00Z")), "2028-03-03");
});
test("safe preference errors never echo privileged field names or values", () => {
  const result = preferencesInputSchema.safeParse({
    ...preferences(),
    private_token: "do-not-echo",
  });
  assert.equal(result.success, false);
  if (!result.success) {
    const fields = preferenceFields(result.error);
    assert.ok(fields._form);
    assert.ok(!JSON.stringify(fields).includes("do-not-echo"));
    assert.ok(!JSON.stringify(fields).includes("private_token"));
  }
});
test("student return paths reject external, encoded, privileged and malformed destinations", () => {
  for (const value of [
    "https://evil.example/content",
    "//evil.example/content",
    "/\\evil.example/content",
    "/admin",
    "/content#fragment",
    "/%63ontent",
    "/content?callback=https://evil.example",
    "/content\n",
    ["/content"],
  ])
    assert.equal(studentReturn(value), null);
  assert.equal(
    studentReturn("/content?company=ltm&subject=dsa"),
    "/content?company=ltm&subject=dsa",
  );
  assert.equal(libraryReturn("/content/507f1f77bcf86cd799439011"), "/content");
  assert.deepEqual(
    mergeContent([{ id: "a" }], [{ id: "a" }, { id: "b" }, { id: "b" }]),
    [{ id: "a" }, { id: "b" }],
  );
});
