import type { IndexDescription } from "mongodb";
export const practiceIndexes: Record<string, IndexDescription[]> = {
  attempts: [
    {
      key: { userId: 1, submissionId: 1 },
      unique: true,
      name: "attempt_user_submission_unique",
    },
    {
      key: { userId: 1, attemptSequence: -1 },
      unique: true,
      name: "attempt_user_sequence_unique",
    },
    {
      key: { userId: 1, contentId: 1, attemptSequence: -1 },
      name: "attempt_content_history",
    },
    {
      key: { userId: 1, subject: 1, topic: 1, kind: 1, attemptSequence: -1 },
      name: "attempt_topic_history",
    },
  ],
  revisions: [
    {
      key: { userId: 1, contentId: 1 },
      unique: true,
      name: "revision_user_content_unique",
    },
    { key: { userId: 1, dueDate: 1, _id: 1 }, name: "revision_due_page" },
  ],
};
