import { z } from "zod";
import { isCatalogTopic } from "@/config/catalog";

export const safeCounter = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
export const contentRevision = safeCounter.min(1);
export const domainId = z.string().regex(/^[a-f0-9]{24}$/);
const notFuture = z
  .date()
  .refine(
    (value) => value.getTime() <= Date.now(),
    "Review date cannot be in the future.",
  );
const instant = z.iso
  .datetime()
  .transform((value) => new Date(value))
  .pipe(notFuture);
const boundedText = (maximum: number, minimum = 1) =>
  z
    .string()
    .min(minimum)
    .max(maximum)
    .refine(
      (value) => minimum === 0 || value.trim().length > 0,
      "Enter a nonblank value.",
    );
export function safeMarkdown(value: string) {
  const decoded = value
    .replace(
      /&#(?:x([\da-f]+)|(\d+));?/gi,
      (_, hex: string | undefined, decimal: string | undefined) => {
        const code = Number.parseInt(hex ?? decimal!, hex ? 16 : 10);
        return code <= 0x10ffff ? String.fromCodePoint(code) : "";
      },
    )
    .replace(/&(?:colon|Tab|NewLine);/g, (entity) =>
      entity === "&colon;" ? ":" : "",
    )
    .replace(/[\s\\\u0000-\u001f\u007f]/g, "");
  return (
    !value.includes("<") &&
    !decoded.includes("<") &&
    !/(?:javascript|vbscript|data):/i.test(decoded)
  );
}
const markdown = boundedText(12000, 0).refine(
  safeMarkdown,
  "Use Markdown without HTML or unsafe links.",
);
const externalUrl = z
  .url()
  .max(2048)
  .refine((value) => {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  }, "Use an HTTPS URL without credentials.");
const tags = z
  .array(boundedText(40))
  .max(20)
  .refine(
    (values) => new Set(values).size === values.length,
    "Tags must be unique.",
  );
const companyFields = {
  companyId: z.enum(["cognizant", "ltm"]),
  association: z.enum(["verified", "student_reported"]),
  source: boundedText(2048),
};
const association = z.strictObject({ ...companyFields, reviewedAt: instant });
const storedAssociation = z.strictObject({
  ...companyFields,
  reviewedAt: notFuture,
});
const uniqueCompanies = (values: { companyId: string }[]) =>
  new Set(values.map((value) => value.companyId)).size === values.length;
const companies = z
  .array(association)
  .max(2)
  .refine(uniqueCompanies, "Companies must be unique.");
const assets = z
  .array(domainId)
  .max(5)
  .refine(
    (values) => new Set(values).size === values.length,
    "Attachment IDs must be unique.",
  );
const editable = {
  slug: boundedText(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: boundedText(160),
  subject: z.enum(["dsa", "aptitude", "cs"]),
  topic: boundedText(80),
  type: z.enum(["question", "resource"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  estimatedMinutes: z.number().int().min(15).max(60),
  source: boundedText(2048),
  attribution: boundedText(2000, 0),
  tags: tags.default([]),
  companies: companies.default([]),
  assetIds: assets.default([]),
  reviewedAt: instant.nullable().default(null),
  prompt: markdown.optional(),
  body: markdown.optional(),
  explanation: markdown.optional(),
  externalUrl: externalUrl.optional(),
};
export const draftInputSchema = z
  .strictObject(editable)
  .refine((value) => isCatalogTopic(value.subject, value.topic), {
    path: ["topic"],
    message: "Choose a configured topic for this subject.",
  });

export const draftPatchSchema = z.strictObject({
  ...z.strictObject(editable).partial().shape,
  tags: tags.optional(),
  companies: companies.optional(),
  assetIds: assets.optional(),
  reviewedAt: instant.nullable().optional(),
  prompt: markdown.nullable().optional(),
  body: markdown.nullable().optional(),
  explanation: markdown.nullable().optional(),
  externalUrl: externalUrl.nullable().optional(),
  expectedRevision: contentRevision,
});

export const storedContentSchema = z
  .strictObject({
    ...editable,
    _id: domainId,
    tags,
    assetIds: assets,
    companies: z.array(storedAssociation).max(2).refine(uniqueCompanies),
    reviewedAt: notFuture.nullable(),
    seedKey: boundedText(120).optional(),
    status: z.enum(["draft", "published", "archived"]),
    revision: contentRevision,
    createdBy: boundedText(200),
    updatedBy: boundedText(200),
    publishedAt: z.date().nullable(),
    archivedAt: z.date().nullable(),
    schemaVersion: z.literal(1),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .refine((value) => isCatalogTopic(value.subject, value.topic), {
    path: ["topic"],
    message: "Choose a configured topic for this subject.",
  });

export const catalogStateSchema = z.strictObject({
  _id: z.literal("catalog"),
  revision: safeCounter,
  commitSerial: safeCounter,
  schemaVersion: z.literal(1),
  createdAt: z.date(),
  updatedAt: z.date(),
});
