import "server-only";
import { z } from "zod";
import { getDomainConnection } from "@/shared/server/db";
import { HttpError } from "@/shared/server/http";
import { domainId, safeCounter } from "@/modules/catalog/schemas";
import { contentSnapshot, parseStudyInput } from "@/modules/practice/schemas";
import {
  requirePracticeActor,
  lockStudyProfile,
} from "@/modules/practice/access";
import { studyTransaction, studyError } from "@/modules/practice/errors";
import {
  lockStudyCatalog,
  studyAvailability,
  requireStudyCatalog,
} from "@/modules/catalog/study-access";
import { profileModel } from "@/modules/identity/model";
import { studyDate } from "@/modules/identity/preferences-schema";
import { currentRevisionSequence } from "@/modules/revisions/current-cycle";
import { planTaskModel } from "./task-model";
const inputSchema = z.strictObject({
  status: z.enum(["pending", "completed"]),
  expectedStateRevision: safeCounter,
});
const taskSchema = z
  .object({
    taskId: z.uuid(),
    contentId: domainId,
    contentSnapshot,
    kind: z.enum(["fresh", "revision"]),
    revisionSourceSequence: safeCounter.min(1).optional(),
    scheduledDate: z.iso.date(),
    estimatedMinutes: z.number().int().min(15).max(60),
    priority: z.enum(["due_revision", "overdue", "fresh"]),
    status: z.enum(["pending", "completed"]),
    completedAt: z.date().nullable(),
    reasonCode: z.string().min(1),
    reason: z.string().min(1).max(280),
  })
  .refine(
    (value) =>
      (value.kind !== "revision" ||
        value.revisionSourceSequence !== undefined) &&
      (value.status === "completed") === (value.completedAt !== null),
  );
export async function completeTask(
  headers: Headers,
  planId: string,
  taskId: string,
  input: unknown,
) {
  try {
    const actor = await requirePracticeActor(headers);
    const userId = actor.session.user.id;
    const values = parseStudyInput(inputSchema, input);
    if (
      !domainId.safeParse(planId).success ||
      !z.uuid().safeParse(taskId).success
    )
      throw new HttpError(
        422,
        "VALIDATION_ERROR",
        "Use valid plan and task identifiers.",
      );
    const connection = await getDomainConnection();
    await requireStudyCatalog(connection);
    return await connection.transaction(async (session) => {
      const profile = await profileModel(connection)
        .findOne({ userId, lifecycle: "active", role: "student" })
        .session(session)
        .lean();
      if (!profile)
        throw new HttpError(
          403,
          "ACCOUNT_UNAVAILABLE",
          "Study access changed.",
        );
      const model = planTaskModel(connection);
      const plan = await model
        .findOne({ _id: planId, userId })
        .session(session)
        .lean();
      if (!plan)
        throw new HttpError(404, "RESOURCE_NOT_FOUND", "Plan was not found.");
      if (String(profile.activePlanId) !== planId)
        throw new HttpError(
          409,
          "PLAN_NOT_ACTIVE",
          "Only the current owned plan can change.",
        );
      if (profile.stateRevision !== values.expectedStateRevision)
        throw new HttpError(
          409,
          "STATE_CONFLICT",
          "Study state changed. Refetch before continuing.",
        );
      const matches = plan.tasks.filter((task) => task.taskId === taskId);
      if (!matches.length)
        throw new HttpError(404, "RESOURCE_NOT_FOUND", "Task was not found.");
      if (matches.length !== 1)
        throw new HttpError(
          500,
          "INTERNAL_ERROR",
          "Task identity needs repair.",
        );
      const parsed = taskSchema.safeParse({
        ...matches[0],
        contentId: String(matches[0]!.contentId),
      });
      if (!parsed.success)
        throw new HttpError(
          500,
          "INTERNAL_ERROR",
          "Stored task data needs repair.",
        );
      const task = parsed.data;
      let revision = profile.stateRevision;
      if (task.status !== values.status) {
        await lockStudyCatalog(connection, session);
        const updated = await lockStudyProfile(
          connection,
          session,
          userId,
          false,
          values.expectedStateRevision,
        );
        if (String(updated.activePlanId) !== planId)
          throw new HttpError(
            409,
            "PLAN_NOT_ACTIVE",
            "The current plan changed.",
          );
        const availability = await studyAvailability(connection, session, [
          task.contentId,
        ]);
        if (values.status === "completed" && !availability.get(task.contentId))
          throw new HttpError(
            409,
            "CONTENT_UNAVAILABLE",
            "Unavailable content cannot be marked completed. Undo remains allowed.",
          );
        const completedAt = values.status === "completed" ? new Date() : null;
        const result = await model.updateOne(
          {
            _id: planId,
            userId,
            tasks: { $elemMatch: { taskId, status: task.status } },
          },
          {
            $set: {
              "tasks.$.status": values.status,
              "tasks.$.completedAt": completedAt,
            },
          },
          { session, runValidators: true },
        );
        if (result.matchedCount !== 1)
          throw new HttpError(
            409,
            "STATE_CONFLICT",
            "The task changed. Refetch before continuing.",
          );
        task.status = values.status;
        task.completedAt = completedAt;
        revision = updated.stateRevision;
      }
      const availability = await studyAvailability(connection, session, [
        task.contentId,
      ]);
      const current =
        task.kind === "revision"
          ? await currentRevisionSequence(
              connection,
              session,
              userId,
              task.contentId,
            )
          : null;
      return {
        task: {
          ...task,
          revisionSourceSequence: task.revisionSourceSequence ?? null,
          completedAt: task.completedAt?.toISOString() ?? null,
          availability: availability.get(task.contentId)
            ? "available"
            : "unavailable",
          overdue:
            task.status === "pending" && task.scheduledDate < studyDate(),
          supersededRevision:
            task.kind === "revision" &&
            current !== null &&
            current > task.revisionSourceSequence!,
        },
        stateRevision: revision,
      };
    }, studyTransaction);
  } catch (error) {
    throw studyError(error);
  }
}
