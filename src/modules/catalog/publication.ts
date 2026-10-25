import { z } from "zod";
import { contentRevision } from "./schemas";

export const lifecycleSchema = z.strictObject({
  expectedRevision: contentRevision,
});
export const archiveSchema = z.strictObject({
  expectedRevision: contentRevision,
  reason: z.string().trim().min(1).max(500),
});
export type LifecycleAction = "publish" | "archive" | "reopen";
export const lifecycleStates = {
  publish: ["draft", "published"],
  archive: ["published", "archived"],
  reopen: ["archived", "draft"],
} as const;

export function publicationFields(content: {
  type: string;
  prompt?: string | null | undefined;
  body?: string | null | undefined;
  externalUrl?: string | null | undefined;
  reviewedAt: Date | string | null;
  assetIds: unknown[];
  readyAssets?: number;
}) {
  const fields: Record<string, string[]> = {};
  if (
    !content.reviewedAt ||
    new Date(content.reviewedAt).getTime() > Date.now()
  )
    fields.reviewedAt = ["Review this content before publication."];
  if (
    content.type === "question" &&
    !content.prompt?.trim() &&
    !content.externalUrl
  )
    fields.prompt = [
      "A question needs a nonblank prompt or HTTPS practice URL.",
    ];
  if (
    content.type === "resource" &&
    !content.body?.trim() &&
    !content.externalUrl &&
    !(content.readyAssets && content.readyAssets > 0)
  )
    fields.body = [
      "A resource needs nonblank body text, an HTTPS URL or a ready attachment.",
    ];
  if (
    content.assetIds.length &&
    content.readyAssets !== content.assetIds.length
  )
    fields.assetIds = ["All attachments must be ready before publication."];
  return fields;
}
