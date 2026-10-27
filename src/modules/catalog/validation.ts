import "server-only";
import { z } from "zod";
import { HttpError } from "@/shared/server/http";

const messages: Record<string, string> = {
  id: "Use a 24-character hexadecimal content ID.",
  slug: "Use a lowercase hyphenated slug of at most 120 characters.",
  title: "Enter a nonblank title of at most 160 characters.",
  subject: "Choose dsa, aptitude or cs.",
  topic: "Choose a configured topic for this subject.",
  type: "Choose question or resource.",
  difficulty: "Choose easy, medium or hard.",
  estimatedMinutes: "Use a whole number from 1 to 60.",
  source: "Enter nonblank provenance of at most 2048 characters.",
  attribution:
    "Supply attribution text of at most 2000 characters; empty is allowed.",
  tags: "Use at most 20 unique nonblank tags, each at most 40 characters.",
  companies:
    "Use at most two unique supported companies with provenance and valid UTC review dates.",
  assetIds: "Use at most five unique valid attachment IDs.",
  reviewedAt:
    "Use null or a valid UTC review instant that is not in the future.",
  expectedRevision: "Supply a positive safe-integer expected revision.",
  reason: "Supply a nonblank archive reason of at most 500 characters.",
  prompt:
    "Use at most 12000 characters of Markdown without HTML or unsafe links.",
  body: "Use at most 12000 characters of Markdown without HTML or unsafe links.",
  explanation:
    "Use at most 12000 characters of Markdown without HTML or unsafe links.",
  externalUrl: "Use an HTTPS URL without credentials, at most 2048 characters.",
};

export function parseCatalogInput<Schema extends z.ZodType>(
  schema: Schema,
  input: unknown,
): z.output<Schema> {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  const fields: Record<string, string[]> = Object.create(null) as Record<
    string,
    string[]
  >;
  for (const issue of result.error.issues) {
    const key =
      typeof issue.path[0] === "string" &&
      Object.hasOwn(messages, issue.path[0])
        ? issue.path[0]
        : "_form";
    fields[key] = [
      key === "_form"
        ? "Remove unsupported fields and supply a valid object."
        : messages[key]!,
    ];
  }
  throw new HttpError(
    422,
    "VALIDATION_ERROR",
    "Check the highlighted fields.",
    fields,
  );
}
