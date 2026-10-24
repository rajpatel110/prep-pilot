import { attemptInput, type AttemptInput } from "./schemas";
export function prepareSubmission(
  pending: AttemptInput | null,
  input: Omit<AttemptInput, "submissionId">,
  createId: () => string,
) {
  return pending ?? attemptInput.parse({ ...input, submissionId: createId() });
}
export function restoreSubmission(
  raw: string,
  contentId: string,
): AttemptInput | null {
  try {
    const parsed = attemptInput.safeParse(JSON.parse(raw));
    return parsed.success && parsed.data.contentId === contentId
      ? parsed.data
      : null;
  } catch {
    return null;
  }
}
