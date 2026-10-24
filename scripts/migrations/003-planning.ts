import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { planningIndexes } from "../../src/modules/planning/indexes";
export const planningMigration = {
  id: "003_planning",
  schemaVersion: 1,
  indexes: planningIndexes,
} as const;
export const planningChecksum = createHash("sha256")
  .update(readFileSync(__filename, "utf8").replace(/\r\n/g, "\n"))
  .update(JSON.stringify(planningMigration))
  .digest("hex");
