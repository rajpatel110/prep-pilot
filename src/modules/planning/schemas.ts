import { z } from "zod";
import { contentSnapshot } from "@/modules/practice/schemas";
import {
  contentEstimate,
  domainId,
  safeCounter,
} from "@/modules/catalog/schemas";
import { preferencesSchema } from "@/modules/identity/preferences-schema";
export const taskValue = z
  .strictObject({
    taskId: z.uuid(),
    contentId: domainId,
    contentSnapshot,
    kind: z.enum(["fresh", "revision"]),
    revisionSourceSequence: safeCounter.min(1).optional(),
    scheduledDate: z.iso.date(),
    estimatedMinutes: contentEstimate,
    priority: z.enum(["due_revision", "overdue", "fresh"]),
    status: z.enum(["pending", "completed"]),
    completedAt: z.iso.datetime().nullable(),
    reasonCode: z.enum(["FOUNDATION", "REVISION_DUE", "CARRIED_WORK"]),
    reason: z.string().min(1).max(280),
  })
  .refine(
    (task) =>
      (task.kind === "revision") ===
        (task.revisionSourceSequence !== undefined) &&
      (task.status === "completed") === (task.completedAt !== null),
  );
export const deferredValue = z.strictObject({
  taskId: z.uuid(),
  contentId: domainId,
  kind: z.enum(["fresh", "revision"]),
  revisionSourceSequence: safeCounter.min(1).optional(),
  estimatedMinutes: contentEstimate,
  reasonCode: z.enum([
    "CONTENT_UNAVAILABLE",
    "CAPACITY",
    "PREREQUISITE_UNAVAILABLE",
    "SUPERSEDED_REVISION",
    "REPLACED_FOR_SUPPORT",
  ]),
});
export const proposalValue = z
  .strictObject({
    windowStart: z.iso.date(),
    windowEnd: z.iso.date(),
    timezone: z.literal("Asia/Kolkata"),
    budgetSnapshot: z.strictObject({
      dailyMinutes: z.number().int().min(30).max(240).multipleOf(15),
      preferences: preferencesSchema,
    }),
    templateVersion: z.string().min(1).max(80),
    rulesVersion: z.string().min(1).max(80),
    tasks: z.array(taskValue).max(480),
    deferred: z.array(deferredValue).max(480),
  })
  .superRefine((proposal, context) => {
    const ids = [...proposal.tasks, ...proposal.deferred].map(
      (task) => task.taskId,
    );
    if (new Set(ids).size !== ids.length)
      context.addIssue({ code: "custom", message: "Duplicate task identity." });
    const totals = new Map<string, number>();
    const pendingDates = new Set(
      proposal.tasks
        .filter((task) => task.status === "pending")
        .map((task) => task.scheduledDate),
    );
    for (const task of proposal.tasks) {
      if (
        task.scheduledDate < proposal.windowStart ||
        task.scheduledDate > proposal.windowEnd
      )
        context.addIssue({ code: "custom", message: "Task outside window." });
      totals.set(
        task.scheduledDate,
        (totals.get(task.scheduledDate) ?? 0) + task.estimatedMinutes,
      );
    }
    if (
      proposal.windowStart > proposal.windowEnd ||
      proposal.budgetSnapshot.dailyMinutes !==
        proposal.budgetSnapshot.preferences.dailyMinutes ||
      (Date.parse(proposal.windowEnd) - Date.parse(proposal.windowStart)) /
        86400000 <
        6 ||
      (Date.parse(proposal.windowEnd) - Date.parse(proposal.windowStart)) /
        86400000 >
        29 ||
      [...totals.entries()].some(
        ([date, minutes]) =>
          pendingDates.has(date) &&
          minutes > proposal.budgetSnapshot.dailyMinutes,
      )
    )
      context.addIssue({
        code: "custom",
        message: "Invalid budget or window.",
      });
  });
export const previewInput = z.strictObject({
  kind: z.enum(["initial", "adapt", "reschedule"]),
  expectedStateRevision: safeCounter,
});
export const confirmInput = z.strictObject({
  acknowledgedDeferredIds: z.array(z.uuid()).max(480),
});
