import { z } from "zod";
import { domainId, safeCounter } from "@/modules/catalog/schemas";

export const attemptInput = z.strictObject({
  submissionId: z.uuid().refine((value) => value === value.toLowerCase()),
  contentId: domainId,
  kind: z.enum(["practice", "revision"]),
  outcome: z.enum(["independent", "needed_help", "failed"]),
  perceivedDifficulty: z.enum(["easy", "medium", "hard"]).optional(),
});
export type AttemptInput = z.infer<typeof attemptInput>;
export const contentSnapshot = z.strictObject({
  title: z.string().min(1).max(160),
  subject: z.enum(["dsa", "aptitude", "cs"]),
  topic: z.string().min(1).max(80),
  type: z.enum(["question", "resource"]),
  contentRevision: safeCounter.min(1),
});
export const storedAttempt = attemptInput
  .extend({
    _id: domainId,
    userId: z.string().min(1),
    requestHash: z.string().regex(/^[a-f0-9]{64}$/),
    contentSnapshot,
    subject: z.enum(["dsa", "aptitude", "cs"]),
    topic: z.string().min(1).max(80),
    attemptSequence: safeCounter.min(1),
    createdAt: z.date(),
    updatedAt: z.date(),
    schemaVersion: z.literal(1),
    resultSnapshot: z.strictObject({
      revisionId: domainId,
      dueDate: z.iso.date(),
      intervalDays: z.union([z.literal(1), z.literal(3), z.literal(7)]),
      resultingStateRevision: safeCounter.min(1),
      attemptDate: z.iso.date(),
    }),
  })
  .refine(
    (value) =>
      value.contentSnapshot.type === "question" &&
      value.subject === value.contentSnapshot.subject &&
      value.topic === value.contentSnapshot.topic &&
      value.createdAt.getTime() === value.updatedAt.getTime(),
    "Invalid attempt snapshot.",
  );

export function parseStudyInput<Schema extends z.ZodType>(
  schema: Schema,
  input: unknown,
): z.output<Schema> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) throw new StudyValidationError(parsed.error);
  return parsed.data;
}
export class StudyValidationError extends Error {
  fields: Record<string, string[]> = {};
  constructor(error: z.ZodError) {
    super("Check your practice input.");
    const messages: Record<string, string> = {
      submissionId: "Use a canonical submission UUID.",
      contentId: "Use a valid content ID.",
      kind: "Choose practice or revision.",
      outcome: "Choose independent, needed_help or failed.",
      perceivedDifficulty: "Choose easy, medium or hard, or omit this field.",
      status: "Choose pending or completed.",
      expectedStateRevision: "Use the current state revision.",
    };
    for (const issue of error.issues) {
      const field =
        typeof issue.path[0] === "string" &&
        Object.hasOwn(messages, issue.path[0])
          ? issue.path[0]
          : "_form";
      this.fields[field] = [
        messages[field] ?? "Remove unsupported fields and check the request.",
      ];
    }
  }
}
