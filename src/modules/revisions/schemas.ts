import { z } from "zod";
import { domainId, safeCounter } from "@/modules/catalog/schemas";
export const storedRevision = z
  .strictObject({
    _id: domainId,
    userId: z.string().min(1),
    contentId: domainId,
    lastAttemptId: domainId,
    lastAttemptSequence: safeCounter.min(1),
    dueDate: z.iso.date(),
    timezone: z.literal("Asia/Kolkata"),
    intervalDays: z.union([z.literal(1), z.literal(3), z.literal(7)]),
    reason: z.enum([
      "failed_or_hard",
      "help_or_medium",
      "independent_easy_or_unrated",
    ]),
    createdAt: z.date(),
    updatedAt: z.date(),
    schemaVersion: z.literal(1),
  })
  .refine(
    (value) =>
      ({
        failed_or_hard: 1,
        help_or_medium: 3,
        independent_easy_or_unrated: 7,
      })[value.reason] === value.intervalDays,
    "Revision interval and reason must agree.",
  );
