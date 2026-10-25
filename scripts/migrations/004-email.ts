import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { emailIndexes } from "../../src/modules/notifications/indexes";
export const emailMigration = {
  id: "004_email",
  schemaVersion: 1,
  indexes: emailIndexes,
} as const;
export const emailChecksum = createHash("sha256")
  .update(readFileSync(__filename, "utf8").replace(/\r\n/g, "\n"))
  .update(JSON.stringify(emailMigration))
  .digest("hex");
