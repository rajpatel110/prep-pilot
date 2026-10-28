import type { Task } from "./engine";

export function subjectMix(
  tasks: Pick<Task, "contentSnapshot" | "estimatedMinutes">[],
) {
  const total = tasks.reduce((sum, task) => sum + task.estimatedMinutes, 0);
  return {
    total,
    subjects: (["dsa", "aptitude", "cs"] as const).map((subject) => {
      const selected = tasks.filter(
        (task) => task.contentSnapshot.subject === subject,
      );
      const minutes = selected.reduce(
        (sum, task) => sum + task.estimatedMinutes,
        0,
      );
      return {
        subject,
        count: selected.length,
        minutes,
        percent: total ? Math.round((1000 * minutes) / total) / 10 : null,
      };
    }),
  };
}

export function comparisonDays<
  T extends { beforeMinutes: number; afterMinutes: number },
>(days: T[], initial: boolean) {
  return initial
    ? days
    : days.filter((day) => day.beforeMinutes !== day.afterMinutes);
}
