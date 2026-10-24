import type { CatalogSubject } from "@/config/catalog";
import {
  companyTemplates,
  prerequisites,
  subjects,
  templateVersion,
  rulesVersion,
  validatePlanningConfiguration,
} from "@/config/planning";
import type { Preferences } from "@/modules/identity/preferences-schema";
export type Snapshot = {
  title: string;
  subject: CatalogSubject;
  topic: string;
  type: "question" | "resource";
  contentRevision: number;
};
export type Task = {
  taskId: string;
  contentId: string;
  contentSnapshot: Snapshot;
  kind: "fresh" | "revision";
  revisionSourceSequence?: number | undefined;
  scheduledDate: string;
  estimatedMinutes: number;
  priority: "due_revision" | "overdue" | "fresh";
  status: "pending" | "completed";
  completedAt: string | null;
  reasonCode: "FOUNDATION" | "REVISION_DUE" | "CARRIED_WORK";
  reason: string;
};
export type Deferred = Pick<
  Task,
  | "taskId"
  | "contentId"
  | "kind"
  | "revisionSourceSequence"
  | "estimatedMinutes"
> & { reasonCode: string };
export type Material = {
  id: string;
  snapshot: Snapshot;
  estimatedMinutes: number;
  difficulty: "easy" | "medium" | "hard";
  companies: string[];
  available: boolean;
};
export type Cycle = {
  contentId: string;
  dueDate: string;
  lastAttemptSequence: number;
};
export class PlanningError extends Error {
  constructor(public code: string) {
    super(code);
  }
}
export function addDays(date: string, days: number) {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86400000)
    .toISOString()
    .slice(0, 10);
}
export function generatePlan(input: {
  today: string;
  preferences: Preferences;
  kind: "initial" | "adapt" | "reschedule";
  active: { windowStart: string; windowEnd: string; tasks: Task[] } | null;
  materials: Material[];
  cycles: Cycle[];
  attemptedIds: string[];
  idFor: (identity: string) => string;
  support?: { preferredIds: string[]; replacedIds: string[] };
}) {
  validatePlanningConfiguration();
  const { today, preferences, kind, active, idFor } = input;
  if (kind === "initial" && active && active.windowEnd >= today)
    throw new PlanningError("ACTIVE_PLAN_EXISTS");
  if (kind !== "initial" && (!active || active.windowEnd < today))
    throw new PlanningError("PLAN_NOT_ACTIVE");
  const end =
    kind === "initial"
      ? [preferences.deadline, addDays(today, 29)].sort()[0]!
      : active!.windowEnd;
  const start = kind === "initial" ? today : active!.windowStart;
  if (end < today || (kind === "initial" && end < addDays(today, 6)))
    throw new PlanningError("PLAN_WINDOW_INVALID");
  const dates: string[] = [];
  for (let date = today; date <= end; date = addDays(date, 1)) dates.push(date);
  const tasks =
    kind === "initial"
      ? []
      : active!.tasks
          .filter((task) => task.status === "completed")
          .map((task) => ({ ...task }));
  const totals = new Map(dates.map((date) => [date, 0]));
  const allocation = { dsa: 0, aptitude: 0, cs: 0 };
  for (const task of tasks) {
    if (task.scheduledDate >= today)
      totals.set(
        task.scheduledDate,
        (totals.get(task.scheduledDate) ?? 0) + task.estimatedMinutes,
      );
    allocation[task.contentSnapshot.subject] += task.estimatedMinutes;
  }
  if (
    [...totals.values()].some((minutes) => minutes > preferences.dailyMinutes)
  )
    throw new PlanningError("PLAN_BUDGET_CONFLICT");
  const materials = new Map(input.materials.map((item) => [item.id, item]));
  const deferred: Deferred[] = [];
  function defer(
    task: Pick<
      Task,
      | "taskId"
      | "contentId"
      | "kind"
      | "revisionSourceSequence"
      | "estimatedMinutes"
    >,
    reasonCode: string,
  ) {
    deferred.push({
      taskId: task.taskId,
      contentId: task.contentId,
      kind: task.kind,
      ...(task.revisionSourceSequence
        ? { revisionSourceSequence: task.revisionSourceSequence }
        : {}),
      estimatedMinutes: task.estimatedMinutes,
      reasonCode,
    });
    if (deferred.length > 480) throw new PlanningError("PLAN_SCOPE_TOO_LARGE");
  }
  function fresh(item: Material): Task {
    return {
      taskId: idFor(`fresh:${item.id}`),
      contentId: item.id,
      contentSnapshot: item.snapshot,
      kind: "fresh",
      scheduledDate: today,
      estimatedMinutes: item.estimatedMinutes,
      priority: "fresh",
      status: "pending",
      completedAt: null,
      reasonCode: "FOUNDATION",
      reason:
        "Foundation coverage within your selected difficulty ceiling and daily budget.",
    };
  }
  const pending =
    kind === "initial"
      ? []
      : active!.tasks.filter((task) => task.status === "pending");
  const consumed = new Set([
    ...input.attemptedIds,
    ...input.cycles.map((cycle) => cycle.contentId),
    ...(active?.tasks.map((task) => task.contentId) ?? []),
  ]);
  const queue: Task[] = [];
  const usedCycles = new Set<string>();
  for (const cycle of [...input.cycles].sort(
    (left, right) =>
      left.dueDate.localeCompare(right.dueDate) ||
      left.contentId.localeCompare(right.contentId),
  )) {
    if (cycle.dueDate > end) continue;
    if (
      tasks.some(
        (task) =>
          task.kind === "revision" &&
          task.contentId === cycle.contentId &&
          task.revisionSourceSequence === cycle.lastAttemptSequence,
      )
    )
      continue;
    const item = materials.get(cycle.contentId);
    if (!item) throw new PlanningError("INTERNAL_ERROR");
    const retained = pending.find(
      (task) =>
        task.kind === "revision" &&
        task.contentId === cycle.contentId &&
        task.revisionSourceSequence === cycle.lastAttemptSequence,
    );
    const task: Task = retained
      ? { ...retained }
      : {
          ...fresh(item),
          taskId: idFor(
            `revision:${cycle.contentId}:${cycle.lastAttemptSequence}`,
          ),
          kind: "revision",
          revisionSourceSequence: cycle.lastAttemptSequence,
          scheduledDate: cycle.dueDate,
          priority: "due_revision",
          status: "pending",
          completedAt: null,
          reasonCode: "REVISION_DUE",
          reason: "Recall scheduled from your latest recorded outcome.",
        };
    task.scheduledDate = cycle.dueDate;
    task.priority = "due_revision";
    usedCycles.add(`${task.contentId}:${task.revisionSourceSequence}`);
    if (!item.available) defer(task, "CONTENT_UNAVAILABLE");
    else queue.push(task);
  }
  for (const task of [...pending].sort(
    (left, right) =>
      left.scheduledDate.localeCompare(right.scheduledDate) ||
      left.taskId.localeCompare(right.taskId),
  )) {
    if (input.support?.replacedIds.includes(task.taskId)) {
      defer(task, "REPLACED_FOR_SUPPORT");
      continue;
    }
    if (
      task.kind === "revision" &&
      usedCycles.has(`${task.contentId}:${task.revisionSourceSequence}`)
    )
      continue;
    if (task.kind === "revision") {
      defer(task, "SUPERSEDED_REVISION");
      continue;
    }
    if (!materials.get(task.contentId)?.available) {
      defer(task, "CONTENT_UNAVAILABLE");
      continue;
    }
    queue.push({
      ...task,
      scheduledDate: input.support?.preferredIds.includes(task.contentId)
        ? today
        : task.scheduledDate,
      priority: task.scheduledDate < today ? "overdue" : "fresh",
      reasonCode: "CARRIED_WORK",
      reason:
        "Retained pending work; completion still requires your explicit action.",
    });
  }
  const ceilings = ["easy", "easy", "medium", "hard", "hard"];
  const freshItems = [...materials.values()].filter(
    (item) =>
      item.available &&
      !consumed.has(item.id) &&
      preferences.companies.some((company) =>
        (
          companyTemplates[company][item.snapshot.subject] as readonly string[]
        ).includes(item.snapshot.topic),
      ) &&
      (!item.companies.length ||
        item.companies.some((company) =>
          preferences.companies.includes(company as "cognizant" | "ltm"),
        )) &&
      ["easy", "medium", "hard"].indexOf(item.difficulty) <=
        ["easy", "medium", "hard"].indexOf(
          ceilings[preferences.skills[item.snapshot.subject] - 1]!,
        ),
  );
  queue.push(
    ...freshItems
      .sort((left, right) => left.id.localeCompare(right.id))
      .map(fresh),
  );
  const scheduledTopics = new Map<string, string>();
  for (const task of tasks) {
    const key = `${task.contentSnapshot.subject}:${task.contentSnapshot.topic}`;
    const previous = scheduledTopics.get(key);
    if (!previous || task.scheduledDate < previous)
      scheduledTopics.set(key, task.scheduledDate);
  }
  function place(task: Task) {
    const parents =
      task.kind === "fresh"
        ? (prerequisites[
            `${task.contentSnapshot.subject}:${task.contentSnapshot.topic}`
          ] ?? [])
        : [];
    if (parents.some((parent) => !scheduledTopics.has(parent))) return false;
    const earliest = [
      today,
      task.scheduledDate,
      ...parents.map((parent) => scheduledTopics.get(parent)!),
    ]
      .sort()
      .at(-1)!;
    const date = dates.find(
      (date) =>
        date >= earliest &&
        (totals.get(date) ?? 0) + task.estimatedMinutes <=
          preferences.dailyMinutes,
    );
    if (!date || tasks.length >= 480) {
      defer(task, "CAPACITY");
      return true;
    }
    const saved = { ...task, scheduledDate: date };
    tasks.push(saved);
    totals.set(date, totals.get(date)! + task.estimatedMinutes);
    allocation[task.contentSnapshot.subject] += task.estimatedMinutes;
    const key = `${task.contentSnapshot.subject}:${task.contentSnapshot.topic}`;
    if (!scheduledTopics.has(key)) scheduledTopics.set(key, date);
    return true;
  }
  for (const priority of ["due_revision", "overdue", "fresh"] as const) {
    const remaining = queue.filter((task) => task.priority === priority);
    while (remaining.length) {
      const total = Object.values(allocation).reduce(
        (sum, minutes) => sum + minutes,
        0,
      );
      const weights = { dsa: 0.5, aptitude: 0.25, cs: 0.25 };
      const order = [...subjects].sort(
        (left, right) =>
          weights[right] * total -
            allocation[right] -
            (weights[left] * total - allocation[left]) ||
          subjects.indexOf(left) - subjects.indexOf(right),
      );
      remaining.sort((left, right) =>
        priority === "fresh"
          ? Number(
              input.support?.preferredIds.includes(right.contentId) ?? false,
            ) -
              Number(
                input.support?.preferredIds.includes(left.contentId) ?? false,
              ) ||
            order.indexOf(left.contentSnapshot.subject) -
              order.indexOf(right.contentSnapshot.subject) ||
            left.scheduledDate.localeCompare(right.scheduledDate) ||
            left.contentId.localeCompare(right.contentId)
          : left.scheduledDate.localeCompare(right.scheduledDate) ||
            left.taskId.localeCompare(right.taskId),
      );
      const index = remaining.findIndex((task) => place(task));
      if (index < 0) {
        for (const task of remaining) defer(task, "PREREQUISITE_UNAVAILABLE");
        break;
      }
      remaining.splice(index, 1);
    }
  }
  tasks.sort((left, right) =>
    left.scheduledDate.localeCompare(right.scheduledDate),
  );
  return {
    windowStart: start,
    windowEnd: end,
    timezone: "Asia/Kolkata" as const,
    budgetSnapshot: { dailyMinutes: preferences.dailyMinutes, preferences },
    templateVersion,
    rulesVersion,
    tasks,
    deferred,
  };
}
export type Proposal = ReturnType<typeof generatePlan>;
