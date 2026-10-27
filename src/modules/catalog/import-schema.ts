import { z } from "zod";
import { draftInputSchema } from "./schemas";

export const importBatchSchema = z
  .strictObject({
    version: z.literal(1),
    candidates: z
      .array(
        z.strictObject({
          sourceRefs: z.array(z.string().regex(/^(LTM|COG)-\d{3}$/)).max(30),
          reportedCompanies: z.array(z.enum(["ltm", "cognizant"])).max(2),
          editorialStatus: z.literal("pending_human_review"),
          concerns: z.array(z.string().min(1).max(1000)).max(20),
          content: draftInputSchema.refine(
            (value) =>
              value.reviewedAt === null &&
              value.assetIds.length === 0 &&
              value.companies.length === 0,
            "Imports must retain pending review and have no attachments or prefilled associations.",
          ),
        }),
      )
      .min(1)
      .max(250),
  })
  .superRefine((batch, context) => {
    const slugs = new Set<string>();
    for (const [index, candidate] of batch.candidates.entries()) {
      const expected = [
        ...new Set(
          candidate.sourceRefs.map((reference) =>
            reference.startsWith("LTM") ? "ltm" : "cognizant",
          ),
        ),
      ].sort();
      if (
        new Set(candidate.reportedCompanies).size !==
          candidate.reportedCompanies.length ||
        JSON.stringify([...candidate.reportedCompanies].sort()) !==
          JSON.stringify(expected) ||
        new Set(candidate.sourceRefs).size !== candidate.sourceRefs.length
      )
        context.addIssue({
          code: "custom",
          path: ["candidates", index],
          message: "Source references and unique company labels must agree.",
        });
      if (slugs.has(candidate.content.slug))
        context.addIssue({
          code: "custom",
          path: ["candidates", index, "content", "slug"],
          message: "Duplicate slug in batch.",
        });
      slugs.add(candidate.content.slug);
    }
  });

export function prepareImport(input: unknown, associationReviewedAt?: string) {
  const batch = importBatchSchema.parse(input);
  if (associationReviewedAt !== undefined)
    z.iso
      .datetime()
      .refine((value) => Date.parse(value) <= Date.now())
      .parse(associationReviewedAt);
  return batch.candidates.map((candidate) => ({
    slug: candidate.content.slug,
    blocked: candidate.reportedCompanies.length > 0 && !associationReviewedAt,
    values: draftInputSchema.parse({
      ...candidate.content,
      companies: associationReviewedAt
        ? candidate.reportedCompanies.map((companyId) => ({
            companyId,
            association: "student_reported",
            source:
              "Candidate-reported interview question, confirmed by the contributor; not an official company publication. References: " +
              candidate.sourceRefs.join(", "),
            reviewedAt: associationReviewedAt,
          }))
        : [],
    }),
  }));
}
