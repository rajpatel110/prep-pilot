import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileIndexes } from "../../src/modules/files/indexes";
export const filesMigration = {
  id: "005_files",
  schemaVersion: 1,
  indexes: fileIndexes,
} as const;
export const filesChecksum = createHash("sha256")
  .update(readFileSync(__filename, "utf8").replace(/\r\n/g, "\n"))
  .update(JSON.stringify(filesMigration))
  .digest("hex");
