import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { administrationIndexes } from "../../src/modules/administration/indexes";
export const ownerMigration = {
  id: "006_owner_administration",
  schemaVersion: 1,
  indexes: administrationIndexes,
} as const;
export const ownerChecksum = createHash("sha256")
  .update(readFileSync(__filename, "utf8").replace(/\r\n/g, "\n"))
  .update(JSON.stringify(ownerMigration))
  .digest("hex");
