import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { practiceIndexes } from "../../src/modules/practice/indexes";
export const practiceMigration = {
  id: "002_practice_revisions",
  schemaVersion: 1,
  indexes: practiceIndexes,
} as const;
export const practiceChecksum = createHash("sha256")
  .update(readFileSync(__filename, "utf8").replace(/\r\n/g, "\n"))
  .update(JSON.stringify(practiceMigration))
  .digest("hex");
