import { generatePlan, type Material } from "./engine";
import {
  adjustmentEvidence,
  revisionEvidence,
  type AttemptEvidence,
  type Evidence,
  evidenceSummary,
} from "./adaptation";
import { companyTemplates } from "@/config/planning";

type Input = Parameters<typeof generatePlan>[0];
const rank = (difficulty: Material["difficulty"]) =>
  ["easy", "medium", "hard"].indexOf(difficulty);
export function proposeAdjustment(input: Input, attempts: AttemptEvidence[]) {
  const active = input.active;
  const evidence = [
    ...adjustmentEvidence(attempts),
    ...revisionEvidence(
      attempts,
      input.cycles,
      active?.tasks ?? [],
      input.today,
    ),
  ].slice(0, 100);
  if (input.kind !== "adapt" || !active)
    return { proposal: generatePlan(input), evidence: [] as Evidence[] };
  const attempted = new Set(input.attemptedIds);
  const materials = new Map(input.materials.map((item) => [item.id, item]));
  const choices = evidence
    .filter((entry) => entry.ruleCode === "LAST_THREE_SUPPORT")
    .flatMap((entry) => {
      const sources = attempts
        .filter(
          (attempt) =>
            entry.attemptIds.includes(attempt.id) &&
            attempt.outcome !== "independent",
        )
        .map((attempt) => materials.get(attempt.contentId));
      if (sources.some((item) => !item)) return [];
      const ceiling = Math.min(
        ...sources.map((item) => rank(item!.difficulty)),
      );
      const candidate = input.materials
        .filter(
          (item) =>
            item.available &&
            item.snapshot.type === "question" &&
            item.snapshot.subject === entry.subject &&
            item.snapshot.topic === entry.topic &&
            !attempted.has(item.id) &&
            !input.cycles.some((cycle) => cycle.contentId === item.id) &&
            !active.tasks.some(
              (task) =>
                task.contentId === item.id &&
                (task.status === "completed" || task.kind === "revision"),
            ) &&
            rank(item.difficulty) < ceiling &&
            rank(item.difficulty) <=
              (input.preferences.skills[entry.subject] <= 2
                ? 0
                : input.preferences.skills[entry.subject] === 3
                  ? 1
                  : 2) &&
            input.preferences.companies.some((company) =>
              (
                companyTemplates[company][entry.subject] as readonly string[]
              ).includes(entry.topic),
            ) &&
            (!item.companies.length ||
              item.companies.some((company) =>
                input.preferences.companies.includes(
                  company as "cognizant" | "ltm",
                ),
              )),
        )
        .sort(
          (left, right) =>
            rank(left.difficulty) - rank(right.difficulty) ||
            left.id.localeCompare(right.id),
        )[0];
      if (!candidate) return [];
      const replace = active.tasks
        .filter(
          (task) =>
            task.status === "pending" &&
            task.kind === "fresh" &&
            task.scheduledDate >= input.today &&
            task.contentSnapshot.subject === entry.subject &&
            task.contentSnapshot.topic === entry.topic &&
            rank(materials.get(task.contentId)?.difficulty ?? "easy") >
              rank(candidate.difficulty),
        )
        .sort(
          (left, right) =>
            left.scheduledDate.localeCompare(right.scheduledDate) ||
            left.taskId.localeCompare(right.taskId),
        )[0];
      return [{ preferredId: candidate.id, replacedId: replace?.taskId }];
    });
  let usable = choices;
  let proposal = generatePlan({
    ...input,
    support: {
      preferredIds: usable.map((choice) => choice.preferredId),
      replacedIds: usable.flatMap((choice) =>
        choice.replacedId ? [choice.replacedId] : [],
      ),
    },
  });
  while (
    usable.some(
      (choice) =>
        choice.replacedId &&
        !proposal.tasks.some((task) => task.contentId === choice.preferredId),
    )
  ) {
    usable = usable.filter(
      (choice) =>
        !choice.replacedId ||
        proposal.tasks.some((task) => task.contentId === choice.preferredId),
    );
    proposal = generatePlan({
      ...input,
      support: {
        preferredIds: usable.map((choice) => choice.preferredId),
        replacedIds: usable.flatMap((choice) =>
          choice.replacedId ? [choice.replacedId] : [],
        ),
      },
    });
  }
  for (const task of proposal.tasks)
    if (
      task.status === "pending" &&
      usable.some((choice) => choice.preferredId === task.contentId)
    )
      task.reason =
        "Easier catalog practice in a topic where you recorded help or not solved on at least two of the last three practice attempts.";
  return { proposal, evidence };
}
export function compareAdjustment(
  before: Input["active"],
  proposal: ReturnType<typeof generatePlan>,
  evidence: Evidence[],
  materials: Material[],
) {
  const previous = new Map(
    before?.tasks.map((task) => [task.taskId, task]) ?? [],
  );
  const next = new Map(proposal.tasks.map((task) => [task.taskId, task]));
  const changed =
    proposal.tasks.some(
      (task) =>
        !previous.has(task.taskId) ||
        previous.get(task.taskId)!.scheduledDate !== task.scheduledDate,
    ) || [...previous.keys()].some((taskId) => !next.has(taskId));
  const supportedChange = proposal.tasks.some(
    (task) =>
      task.status === "pending" &&
      (!previous.has(task.taskId) ||
        previous.get(task.taskId)!.scheduledDate !== task.scheduledDate) &&
      evidence.some(
        (entry) =>
          entry.subject === task.contentSnapshot.subject &&
          entry.topic === task.contentSnapshot.topic,
      ) &&
      (task.kind === "revision" || task.reason.startsWith("Easier catalog")),
  );
  return {
    useful: changed && supportedChange,
    summaries: evidence.map(evidenceSummary),
    limitations: evidence
      .filter((entry) => entry.ruleCode === "LAST_THREE_SUPPORT")
      .map(
        (entry) =>
          `${entry.subject.toUpperCase()} · ${entry.topic.replaceAll("_", " ")}: ${proposal.tasks.some((task) => task.status === "pending" && task.reason.startsWith("Easier catalog") && task.contentSnapshot.subject === entry.subject && task.contentSnapshot.topic === entry.topic) ? "Easier practice fits; due revisions and overdue work keep priority." : "No eligible strictly easier practice could be added or promoted within the prerequisites, window and budget. Review an existing item when its saved revision is due; no early repeat was invented."}`,
      ),
    contentAvailable: materials.some(
      (item) =>
        item.available &&
        (!item.companies.length ||
          item.companies.some((company) =>
            proposal.budgetSnapshot.preferences.companies.includes(
              company as "cognizant" | "ltm",
            ),
          )) &&
        rank(item.difficulty) <=
          (proposal.budgetSnapshot.preferences.skills[item.snapshot.subject] <=
          2
            ? 0
            : proposal.budgetSnapshot.preferences.skills[
                  item.snapshot.subject
                ] === 3
              ? 1
              : 2),
    ),
    changes: [
      ...(before?.tasks ?? [])
        .filter((task) => !next.has(task.taskId))
        .map((task) => ({
          taskId: task.taskId,
          title: task.contentSnapshot.title,
          change: "removed" as const,
          fromDate: task.scheduledDate,
          toDate: null as string | null,
        })),
      ...proposal.tasks
        .filter(
          (task) =>
            !previous.has(task.taskId) ||
            previous.get(task.taskId)!.scheduledDate !== task.scheduledDate,
        )
        .map((task) => ({
          taskId: task.taskId,
          title: task.contentSnapshot.title,
          change: previous.has(task.taskId)
            ? ("moved" as const)
            : ("added" as const),
          fromDate: previous.get(task.taskId)?.scheduledDate ?? null,
          toDate: task.scheduledDate,
        })),
    ],
  };
}
