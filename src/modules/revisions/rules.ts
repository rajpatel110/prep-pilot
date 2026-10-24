import type { AttemptInput } from "@/modules/practice/schemas";
import { studyDate } from "@/modules/identity/preferences-schema";

export function revisionSchedule(
  input: Pick<AttemptInput, "outcome" | "perceivedDifficulty">,
  now: Date,
) {
  const intervalDays =
    input.outcome === "failed" || input.perceivedDifficulty === "hard"
      ? 1
      : input.outcome === "needed_help" ||
          input.perceivedDifficulty === "medium"
        ? 3
        : 7;
  const reason =
    intervalDays === 1
      ? "failed_or_hard"
      : intervalDays === 3
        ? "help_or_medium"
        : "independent_easy_or_unrated";
  const attemptDate = studyDate(now);
  const dueDate = new Date(
    Date.parse(`${attemptDate}T00:00:00Z`) + intervalDays * 86400000,
  )
    .toISOString()
    .slice(0, 10);
  return { intervalDays, reason, dueDate, attemptDate } as const;
}
