import { z } from "zod";
import { domainId } from "@/modules/catalog/schemas";
import { isCatalogTopic } from "@/config/catalog";
import type { Material, Task, Cycle } from "./engine";

export const evidenceValue = z
  .strictObject({
    subject: z.enum(["dsa", "aptitude", "cs"]),
    topic: z.string().max(80),
    attemptIds: z.array(domainId).min(1).max(3),
    ruleCode: z.enum(["LAST_THREE_SUPPORT", "REVISION_DUE"]),
  })
  .refine(
    (value) =>
      isCatalogTopic(value.subject, value.topic) &&
      new Set(value.attemptIds).size === value.attemptIds.length,
  );
export type Evidence = z.infer<typeof evidenceValue>;
export type AttemptEvidence = {
  id: string;
  contentId: string;
  subject: Material["snapshot"]["subject"];
  topic: string;
  kind: "practice" | "revision";
  outcome: "independent" | "needed_help" | "failed";
  attemptSequence: number;
};
export function adjustmentEvidence(attempts: AttemptEvidence[]): Evidence[] {
  const topics = new Map<string, AttemptEvidence[]>();
  for (const attempt of [...attempts].sort(
    (left, right) =>
      right.attemptSequence - left.attemptSequence ||
      left.id.localeCompare(right.id),
  )) {
    if (attempt.kind === "revision") continue;
    const key = `${attempt.subject}:${attempt.topic}`;
    const group = topics.get(key) ?? [];
    if (group.length < 3) group.push(attempt);
    topics.set(key, group);
  }
  return [...topics.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .flatMap(([, group]) => {
      if (
        group.length !== 3 ||
        group.filter((attempt) => attempt.outcome !== "independent").length < 2
      )
        return [];
      return [
        evidenceValue.parse({
          subject: group[0]!.subject,
          topic: group[0]!.topic,
          attemptIds: group.map((attempt) => attempt.id),
          ruleCode: "LAST_THREE_SUPPORT",
        }),
      ];
    });
}
export function evidenceSummary(evidence: Evidence) {
  const topic = evidence.topic.replaceAll("_", " ");
  return evidence.ruleCode === "LAST_THREE_SUPPORT"
    ? `${evidence.subject.toUpperCase()} · ${topic}: you recorded help or not solved on at least two of your last three practice attempts. Review easier practice or the saved revision schedule; these are self-reported outcomes, not an ability assessment.`
    : `${evidence.subject.toUpperCase()} · ${topic}: a revision from your recorded outcome is due and is not yet scheduled in the current plan.`;
}
export function revisionEvidence(
  attempts: AttemptEvidence[],
  cycles: Cycle[],
  tasks: Task[],
  today: string,
): Evidence[] {
  return [...cycles]
    .sort(
      (left, right) =>
        left.dueDate.localeCompare(right.dueDate) ||
        left.contentId.localeCompare(right.contentId),
    )
    .flatMap((cycle) => {
      if (
        cycle.dueDate > today ||
        tasks.some(
          (task) =>
            task.kind === "revision" &&
            task.contentId === cycle.contentId &&
            task.revisionSourceSequence === cycle.lastAttemptSequence,
        )
      )
        return [];
      const attempt = attempts.find(
        (entry) =>
          entry.attemptSequence === cycle.lastAttemptSequence &&
          entry.contentId === cycle.contentId,
      );
      return attempt
        ? [
            evidenceValue.parse({
              subject: attempt.subject,
              topic: attempt.topic,
              attemptIds: [attempt.id],
              ruleCode: "REVISION_DUE",
            }),
          ]
        : [];
    });
}
