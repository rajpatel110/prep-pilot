import "server-only";
import type { z } from "zod";
import type { storedContentSchema } from "./schemas";

function contentSummaryDto(content: z.output<typeof storedContentSchema>) {
  return {
    id: content._id,
    slug: content.slug,
    title: content.title,
    subject: content.subject,
    type: content.type,
    topic: content.topic,
    difficulty: content.difficulty,
    estimatedMinutes: content.estimatedMinutes,
    tags: [...content.tags],
    companies: content.companies.map((company) => ({
      companyId: company.companyId,
      association: company.association,
      source: company.source,
      reviewedAt: company.reviewedAt.toISOString(),
    })),
    revision: content.revision,
    reviewedAt: content.reviewedAt?.toISOString() ?? null,
  };
}

export function adminContentSummaryDto(
  content: z.output<typeof storedContentSchema>,
) {
  return {
    ...contentSummaryDto(content),
    status: content.status,
    createdAt: content.createdAt.toISOString(),
    updatedAt: content.updatedAt.toISOString(),
    attachmentCount: 0,
  };
}

export function adminContentDto(content: z.output<typeof storedContentSchema>) {
  return {
    ...adminContentSummaryDto(content),
    prompt: content.prompt ?? null,
    body: content.body ?? null,
    explanation: content.explanation ?? null,
    externalUrl: content.externalUrl ?? null,
    source: content.source,
    attribution: content.attribution,
    assetIds: [...content.assetIds],
    publishedAt: content.publishedAt?.toISOString() ?? null,
    archivedAt: content.archivedAt?.toISOString() ?? null,
    attachments: [],
  };
}

export type AdminContentSummary = ReturnType<typeof adminContentSummaryDto>;
export type AdminContentDetail = ReturnType<typeof adminContentDto>;

export function studentContentSummaryDto(
  content: z.output<typeof storedContentSchema>,
) {
  return { ...contentSummaryDto(content), availability: "available" as const };
}
export function studentContentDto(
  content: z.output<typeof storedContentSchema>,
) {
  return {
    ...studentContentSummaryDto(content),
    prompt: content.prompt ?? null,
    body: content.body ?? null,
    explanation: content.explanation ?? null,
    externalUrl: content.externalUrl ?? null,
    source: content.source,
    attribution: content.attribution,
    attachments: [],
  };
}
