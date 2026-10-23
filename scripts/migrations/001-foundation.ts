import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { identityIndexes } from "../database-indexes";
import { catalogIndexes } from "../../src/modules/catalog/indexes";

export const foundationMigration = {
  id: "001_identity_catalog_foundation",
  schemaVersion: 1,
  catalogState: { id: "catalog", revision: 0, commitSerial: 0 },
  contentRevision: { initial: 1, maximum: Number.MAX_SAFE_INTEGER },
  attachmentPolicy: "empty-only",
  indexes: { ...identityIndexes, ...catalogIndexes },
} as const;

export const foundationChecksum = createHash("sha256")
  .update(readFileSync(__filename, "utf8").replace(/\r\n/g, "\n"))
  .update(JSON.stringify(foundationMigration))
  .digest("hex");
