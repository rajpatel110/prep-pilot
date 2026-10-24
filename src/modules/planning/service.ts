import "server-only";
import { createHash } from "node:crypto";
import { BSON } from "mongodb";
import { z } from "zod";
import { Types, type ClientSession, type Connection } from "mongoose";
import { getDomainConnection } from "@/shared/server/db";
import { HttpError } from "@/shared/server/http";
import { rateLimit } from "@/shared/server/rate-limit";
import {
  requirePracticeActor,
  lockStudyProfile,
} from "@/modules/practice/access";
import { studyError, studyTransaction } from "@/modules/practice/errors";
import { parseStudyInput } from "@/modules/practice/schemas";
import { requirePracticeSetup } from "@/modules/practice/setup";
import { planningAttempts } from "@/modules/practice/history-read";
import { profileModel } from "@/modules/identity/model";
import { activatePlanPointer } from "@/modules/identity/plan-state";
import {
  preferencesSchema,
  studyDate,
} from "@/modules/identity/preferences-schema";
import {
  planningCatalog,
  confirmCatalog,
} from "@/modules/catalog/study-access";
import { domainId } from "@/modules/catalog/schemas";
import { planningCycles } from "@/modules/revisions/planning-read";
import { templateVersion, rulesVersion } from "@/config/planning";
import { serverConfig } from "@/shared/server/config";
import {
  issueStudyCursor,
  inspectStudyCursor,
} from "@/modules/practice/cursor";
import { pagination, queryValues } from "@/modules/practice/query";
import { planTaskModel, type PlanRecord } from "./task-model";
import { previewModel, type PreviewRecord } from "./preview-model";
import { planningIndexes } from "./indexes";
import { PlanningError, type Task, type Proposal } from "./engine";
import { previewInput, confirmInput, proposalValue } from "./schemas";
import {
  adjustmentEvidence,
  revisionEvidence,
  evidenceSummary,
  evidenceValue,
  type AttemptEvidence,
} from "./adaptation";
import { proposeAdjustment, compareAdjustment } from "./adjustment";

function attemptEvidence(
  attempts: Awaited<ReturnType<typeof planningAttempts>>,
): AttemptEvidence[] {
  return attempts.map((attempt) => ({
    id: String(attempt._id),
    contentId: String(attempt.contentId),
    subject: attempt.subject,
    topic: attempt.topic,
    kind: attempt.kind,
    outcome: attempt.outcome,
    attemptSequence: attempt.attemptSequence,
  }));
}

function id(value: string) {
  if (!domainId.safeParse(value).success)
    throw new HttpError(
      422,
      "VALIDATION_ERROR",
      "Use a valid planning identifier.",
    );
  return value;
}
function stableTaskId(identity: string) {
  const hex = createHash("sha256").update(identity).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}
function storedProposal(plan: PlanRecord): Proposal {
  return proposalValue.parse(
    JSON.parse(
      JSON.stringify({
        windowStart: plan.windowStart,
        windowEnd: plan.windowEnd,
        timezone: plan.timezone,
        budgetSnapshot: plan.budgetSnapshot,
        templateVersion: plan.templateVersion,
        rulesVersion: plan.rulesVersion,
        tasks: plan.tasks,
        deferred: plan.deferred,
      }),
    ),
  );
}
async function context(headers: Headers) {
  const actor = await requirePracticeActor(headers);
  const connection = await getDomainConnection();
  await requirePracticeSetup(connection);
  const migration = await connection
    .db!.collection<{ _id: string; state: string }>("schemaMigrations")
    .findOne({ _id: "003_planning", state: "applied" });
  if (!migration)
    throw new HttpError(
      503,
      "DEPENDENCY_UNAVAILABLE",
      "Planning database migration 003 is required.",
    );
  for (const expected of planningIndexes.plans!.filter(
    (index) => index.unique,
  )) {
    const indexes = await connection
      .db!.collection("plans")
      .listIndexes()
      .toArray();
    if (
      !indexes.some(
        (index) =>
          index.name === expected.name &&
          index.unique &&
          JSON.stringify(index.key) === JSON.stringify(expected.key) &&
          !index.sparse &&
          !index.partialFilterExpression &&
          !index.collation,
      )
    )
      throw new HttpError(
        503,
        "DEPENDENCY_UNAVAILABLE",
        "Planning uniqueness indexes are unavailable.",
      );
  }
  return { connection, userId: actor.session.user.id };
}
async function profileAt(
  connection: Connection,
  session: ClientSession,
  userId: string,
) {
  const profile = await profileModel(connection)
    .findOne({ userId, role: "student", lifecycle: "active" })
    .session(session)
    .lean();
  if (!profile)
    throw new HttpError(403, "ACCOUNT_UNAVAILABLE", "Study access changed.");
  return profile;
}
async function activeAt(
  connection: Connection,
  session: ClientSession,
  userId: string,
  pointer: Types.ObjectId | null | undefined,
) {
  if (!pointer) return null;
  const plan = await planTaskModel(connection)
    .findOne({ _id: pointer, userId })
    .session(session)
    .lean();
  if (!plan)
    throw new HttpError(
      500,
      "INTERNAL_ERROR",
      "The active plan reference needs repair.",
    );
  return plan;
}
async function decorate(
  connection: Connection,
  session: ClientSession,
  userId: string,
  tasks: Task[],
) {
  const catalog = await planningCatalog(connection, session);
  const materials = new Map(catalog.materials.map((item) => [item.id, item]));
  const cycles = new Map(
    (await planningCycles(connection, session, userId)).map((cycle) => [
      cycle.contentId,
      cycle.lastAttemptSequence,
    ]),
  );
  return tasks.map((task) => ({
    ...task,
    revisionSourceSequence: task.revisionSourceSequence ?? null,
    availability: materials.get(task.contentId)?.available
      ? ("available" as const)
      : ("unavailable" as const),
    overdue: task.status === "pending" && task.scheduledDate < studyDate(),
    supersededRevision:
      task.kind === "revision" &&
      (cycles.get(task.contentId) ?? 0) > task.revisionSourceSequence!,
  }));
}
async function planDto(
  connection: Connection,
  session: ClientSession,
  userId: string,
  plan: PlanRecord,
  profile: Awaited<ReturnType<typeof profileAt>>,
) {
  const proposal = storedProposal(plan);
  return {
    ...proposal,
    id: String(plan._id),
    version: plan.version,
    previousPlanId: plan.previousPlanId ? String(plan.previousPlanId) : null,
    sourcePreviewId: String(plan.sourcePreviewId),
    status:
      String(profile.activePlanId) === String(plan._id)
        ? ("active" as const)
        : ("archived" as const),
    generatedAt: plan.generatedAt.toISOString(),
    stateRevision: profile.stateRevision,
    tasks: await decorate(connection, session, userId, proposal.tasks),
    deferred: proposal.deferred.map((task) => ({
      ...task,
      revisionSourceSequence: task.revisionSourceSequence ?? null,
    })),
  };
}
function previewValidity(
  preview: PreviewRecord,
  profile: Awaited<ReturnType<typeof profileAt>>,
  catalogRevision: number,
) {
  if (preview.state === "confirmed") return;
  if (preview.expiresAt <= new Date())
    throw new HttpError(
      409,
      "PREVIEW_EXPIRED",
      "This preview expired. Generate another.",
    );
  if (
    preview.localDateAtCreation !== studyDate() ||
    preview.baseStateRevision !== profile.stateRevision ||
    String(preview.basePlanId) !== String(profile.activePlanId) ||
    preview.catalogRevision !== catalogRevision ||
    preview.templateVersion !== templateVersion ||
    preview.rulesVersion !== rulesVersion
  )
    throw new HttpError(
      409,
      "STALE_PREVIEW",
      "Study state changed. Generate a new preview.",
    );
}
async function previewDto(
  connection: Connection,
  session: ClientSession,
  userId: string,
  preview: PreviewRecord,
) {
  const proposal = proposalValue.parse(preview.proposal);
  const base = preview.basePlanId
    ? await planTaskModel(connection)
        .findOne({ _id: preview.basePlanId, userId })
        .session(session)
        .lean()
    : null;
  const before = base ? storedProposal(base).tasks : [];
  const previous = new Map(before.map((task) => [task.taskId, task]));
  const next = new Map(proposal.tasks.map((task) => [task.taskId, task]));
  const dailyTotals = [];
  for (
    let date = preview.localDateAtCreation;
    date <= proposal.windowEnd;
    date = new Date(Date.parse(`${date}T00:00:00Z`) + 86400000)
      .toISOString()
      .slice(0, 10)
  )
    dailyTotals.push({
      date,
      beforeMinutes: before
        .filter((task) => task.scheduledDate === date)
        .reduce((sum, task) => sum + task.estimatedMinutes, 0),
      afterMinutes: proposal.tasks
        .filter((task) => task.scheduledDate === date)
        .reduce((sum, task) => sum + task.estimatedMinutes, 0),
      budgetMinutes: proposal.budgetSnapshot.dailyMinutes,
    });
  return {
    id: String(preview._id),
    kind: preview.kind,
    state: preview.state,
    basePlanId: preview.basePlanId ? String(preview.basePlanId) : null,
    baseStateRevision: preview.baseStateRevision,
    catalogRevision: preview.catalogRevision,
    localDateAtCreation: preview.localDateAtCreation,
    expiresAt: preview.expiresAt.toISOString(),
    confirmedPlanId: preview.confirmedPlanId
      ? String(preview.confirmedPlanId)
      : null,
    proposal: {
      ...proposal,
      tasks: await decorate(connection, session, userId, proposal.tasks),
    },
    evidence: preview.evidence.map((entry) => evidenceValue.parse(entry)),
    adjustment:
      preview.kind === "adapt"
        ? compareAdjustment(
            base ? storedProposal(base) : null,
            proposal,
            preview.evidence.map((entry) => evidenceValue.parse(entry)),
            (await planningCatalog(connection, session)).materials,
          )
        : null,
    diff: {
      addedTaskIds: proposal.tasks
        .filter((task) => !previous.has(task.taskId))
        .map((task) => task.taskId),
      removedTaskIds: before
        .filter((task) => !next.has(task.taskId))
        .map((task) => task.taskId),
      moved: proposal.tasks
        .filter(
          (task) =>
            previous.has(task.taskId) &&
            previous.get(task.taskId)!.scheduledDate !== task.scheduledDate,
        )
        .map((task) => ({
          taskId: task.taskId,
          fromDate: previous.get(task.taskId)!.scheduledDate,
          toDate: task.scheduledDate,
        })),
    },
    dailyTotals,
  };
}
function planningError(error: unknown) {
  const messages: Record<string, string> = {
    ACTIVE_PLAN_EXISTS:
      "You already have an active planning window. Review a replacement schedule instead.",
    PLAN_NOT_ACTIVE:
      "There is no current planning window to adjust. Generate a new initial proposal.",
    PLAN_WINDOW_INVALID:
      "Allow at least seven inclusive study days in Asia/Kolkata for a new plan. Review your target date.",
    PLAN_BUDGET_CONFLICT:
      "Already completed work exceeds the new daily budget. Choose a compatible budget or try again tomorrow; completed work cannot be moved.",
    PLAN_SCOPE_TOO_LARGE:
      "This proposal exceeds supported planning limits. Review the selected scope and available catalog; no work has been silently truncated.",
    INTERNAL_ERROR:
      "A stored study reference needs repair. No plan was activated.",
  };
  if (error instanceof PlanningError)
    return new HttpError(
      error.code === "ACTIVE_PLAN_EXISTS" || error.code === "PLAN_NOT_ACTIVE"
        ? 409
        : error.code === "INTERNAL_ERROR"
          ? 500
          : 422,
      error.code,
      messages[error.code] ??
        "The proposal could not be generated. Review your preferences and available content.",
    );
  return studyError(error);
}
export async function createPreview(headers: Headers, input: unknown) {
  try {
    const { connection, userId } = await context(headers);
    const values = parseStudyInput(previewInput, input);
    await rateLimit("plan-previews", userId, 10, 600);
    return await connection.transaction(async (session) => {
      const profile = await profileAt(connection, session, userId);
      if (profile.stateRevision !== values.expectedStateRevision)
        throw new HttpError(
          409,
          "STATE_CONFLICT",
          "Refetch current study state before generating.",
        );
      const preferences = preferencesSchema.safeParse(profile.preferences);
      if (!preferences.success)
        throw new HttpError(
          422,
          "PREFERENCES_REQUIRED",
          "Complete your preparation preferences first.",
        );
      const catalog = await planningCatalog(connection, session);
      const active = await activeAt(
        connection,
        session,
        userId,
        profile.activePlanId,
      );
      const attempts = await planningAttempts(connection, session, userId);
      const cycles = await planningCycles(connection, session, userId);
      const { proposal, evidence } = proposeAdjustment(
        {
          today: studyDate(),
          preferences: preferences.data,
          kind: values.kind,
          active: active ? storedProposal(active) : null,
          materials: catalog.materials,
          cycles,
          attemptedIds: attempts.map((attempt) => String(attempt.contentId)),
          idFor: (identity) =>
            stableTaskId(`${userId}:${profile.planVersion + 1}:${identity}`),
        },
        attemptEvidence(attempts),
      );
      proposalValue.parse(proposal);
      if (BSON.calculateObjectSize(proposal) > 2 * 1024 * 1024)
        throw new PlanningError("PLAN_SCOPE_TOO_LARGE");
      const now = new Date();
      const preview = new (previewModel(connection))({
        userId,
        kind: values.kind,
        basePlanId: profile.activePlanId ?? null,
        baseStateRevision: profile.stateRevision,
        catalogRevision: catalog.revision,
        templateVersion,
        rulesVersion,
        localDateAtCreation: studyDate(now),
        proposal,
        evidence,
        expiresAt: new Date(now.getTime() + 600000),
        purgeAt: new Date(now.getTime() + 86400000),
      });
      await preview.save({ session });
      return await previewDto(connection, session, userId, preview!.toObject());
    }, studyTransaction);
  } catch (error) {
    throw planningError(error);
  }
}
export async function readPreview(headers: Headers, previewId: string) {
  try {
    const { connection, userId } = await context(headers);
    id(previewId);
    return await connection.transaction(async (session) => {
      const preview = await previewModel(connection)
        .findOne({ _id: previewId, userId })
        .session(session)
        .lean();
      if (!preview)
        throw new HttpError(
          404,
          "RESOURCE_NOT_FOUND",
          "Preview was not found.",
        );
      const profile = await profileAt(connection, session, userId);
      previewValidity(
        preview,
        profile,
        (await planningCatalog(connection, session)).revision,
      );
      return await previewDto(connection, session, userId, preview);
    }, studyTransaction);
  } catch (error) {
    throw planningError(error);
  }
}
export async function confirmPreview(
  headers: Headers,
  previewId: string,
  input: unknown,
) {
  const { connection, userId } = await context(headers);
  id(previewId);
  const values = parseStudyInput(confirmInput, input);
  if (
    new Set(values.acknowledgedDeferredIds).size !==
    values.acknowledgedDeferredIds.length
  )
    throw new HttpError(
      422,
      "DEFERRED_ACK_REQUIRED",
      "Acknowledge each deferred item exactly once.",
    );
  async function replay() {
    return await connection.transaction(async (session) => {
      const plan = await planTaskModel(connection)
        .findOne({ sourcePreviewId: previewId, userId })
        .session(session)
        .lean();
      if (!plan) return null;
      return {
        data: {
          plan: await planDto(
            connection,
            session,
            userId,
            plan,
            await profileAt(connection, session, userId),
          ),
        },
        meta: { replayed: true },
      };
    }, studyTransaction);
  }
  try {
    const original = await replay();
    if (original) return original;
    return await connection.transaction(async (session) => {
      const existing = await planTaskModel(connection)
        .findOne({ sourcePreviewId: previewId, userId })
        .session(session)
        .lean();
      if (existing)
        return {
          data: {
            plan: await planDto(
              connection,
              session,
              userId,
              existing,
              await profileAt(connection, session, userId),
            ),
          },
          meta: { replayed: true },
        };
      const preview = await previewModel(connection)
        .findOne({ _id: previewId, userId })
        .session(session)
        .lean();
      if (!preview)
        throw new HttpError(
          404,
          "RESOURCE_NOT_FOUND",
          "Preview was not found.",
        );
      const profile = await profileAt(connection, session, userId);
      const catalog = await planningCatalog(connection, session);
      previewValidity(preview, profile, catalog.revision);
      const proposal = proposalValue.parse(preview.proposal);
      if (preview.kind === "adapt") {
        const base = await activeAt(
          connection,
          session,
          userId,
          profile.activePlanId,
        );
        if (
          !compareAdjustment(
            base ? storedProposal(base) : null,
            proposal,
            preview.evidence.map((entry) => evidenceValue.parse(entry)),
            catalog.materials,
          ).useful
        )
          throw new HttpError(
            422,
            "VALIDATION_ERROR",
            "No useful evidence-based adjustment is available. Keep your current plan; due revisions remain in the revision queue.",
          );
      }
      if (
        proposal.templateVersion !== templateVersion ||
        proposal.rulesVersion !== rulesVersion
      )
        throw new HttpError(
          409,
          "STALE_PREVIEW",
          "Planning configuration changed. Generate a new preview.",
        );
      const currentTotals = new Map<string, number>();
      for (const task of proposal.tasks)
        if (task.scheduledDate >= studyDate())
          currentTotals.set(
            task.scheduledDate,
            (currentTotals.get(task.scheduledDate) ?? 0) +
              task.estimatedMinutes,
          );
      if (
        [...currentTotals.values()].some(
          (minutes) => minutes > proposal.budgetSnapshot.dailyMinutes,
        )
      )
        throw new HttpError(
          422,
          "PLAN_BUDGET_CONFLICT",
          "The proposed current-day budget is invalid. Generate a new preview.",
        );
      const expected = proposal.deferred.map((task) => task.taskId).sort();
      if (
        JSON.stringify([...values.acknowledgedDeferredIds].sort()) !==
        JSON.stringify(expected)
      )
        throw new HttpError(
          422,
          "DEFERRED_ACK_REQUIRED",
          "Acknowledge every deferred item before accepting.",
        );
      const available = new Map(
        catalog.materials.map((item) => [item.id, item.available]),
      );
      if (
        proposal.tasks.some(
          (task) =>
            task.status !== "completed" && !available.get(task.contentId),
        )
      )
        throw new HttpError(
          409,
          "STALE_PREVIEW",
          "A proposed item is unavailable. Generate another preview.",
        );
      if (
        !Number.isSafeInteger(profile.planVersion) ||
        profile.planVersion >= Number.MAX_SAFE_INTEGER ||
        profile.planVersion < 0
      )
        throw new HttpError(
          409,
          "STATE_CONFLICT",
          "The plan version cannot advance.",
        );
      await confirmCatalog(connection, session, preview.catalogRevision);
      const updated = await lockStudyProfile(
        connection,
        session,
        userId,
        false,
        preview.baseStateRevision,
      );
      if (String(updated.activePlanId) !== String(preview.basePlanId))
        throw new HttpError(409, "STALE_PREVIEW", "The active plan changed.");
      const planId = new Types.ObjectId();
      const plan = new (planTaskModel(connection))({
        _id: planId,
        userId,
        version: profile.planVersion + 1,
        previousPlanId: profile.activePlanId ?? null,
        sourcePreviewId: preview._id,
        generatedAt: new Date(),
        attemptSequenceAtGeneration: profile.attemptSequence,
        ...proposal,
      });
      await plan.save({ session });
      await activatePlanPointer(connection, session, {
        userId,
        expectedStateRevision: updated.stateRevision,
        expectedPlanVersion: profile.planVersion,
        previousPlanId: profile.activePlanId ?? null,
        nextPlanId: planId,
      });
      const receipt = await previewModel(connection).updateOne(
        { _id: preview._id, userId, state: "pending" },
        {
          $set: {
            state: "confirmed",
            confirmedPlanId: planId,
            confirmedAt: new Date(),
          },
        },
        { session, runValidators: true },
      );
      if (receipt.matchedCount !== 1)
        throw new HttpError(
          409,
          "STALE_PREVIEW",
          "Preview was already resolved.",
        );
      return {
        data: {
          plan: await planDto(
            connection,
            session,
            userId,
            plan!.toObject(),
            await profileAt(connection, session, userId),
          ),
        },
        meta: { replayed: false },
      };
    }, studyTransaction);
  } catch (error) {
    try {
      const original = await replay();
      if (original) return original;
    } catch {}
    const mapped = planningError(error);
    if (mapped.code === "STATE_CONFLICT")
      throw new HttpError(
        409,
        "STALE_PREVIEW",
        "Study state changed. Generate a new preview.",
      );
    throw mapped;
  }
}
export async function readPlan(headers: Headers, planId?: string) {
  try {
    const { connection, userId } = await context(headers);
    if (planId) id(planId);
    return await connection.transaction(async (session) => {
      const profile = await profileAt(connection, session, userId);
      const plan = planId
        ? await planTaskModel(connection)
            .findOne({ _id: planId, userId })
            .session(session)
            .lean()
        : await activeAt(connection, session, userId, profile.activePlanId);
      if (planId && !plan)
        throw new HttpError(404, "RESOURCE_NOT_FOUND", "Plan was not found.");
      return {
        plan: plan
          ? await planDto(connection, session, userId, plan, profile)
          : null,
        stateRevision: profile.stateRevision,
      };
    }, studyTransaction);
  } catch (error) {
    throw planningError(error);
  }
}
export async function planHistory(headers: Headers, params: URLSearchParams) {
  try {
    const { connection, userId } = await context(headers);
    const query = parseStudyInput(
      z.strictObject(pagination),
      queryValues(params),
    );
    const binding = JSON.stringify({
      endpoint: "plans",
      userId,
      limit: query.limit,
    });
    const after = query.cursor
      ? inspectStudyCursor(
          query.cursor,
          binding,
          serverConfig.BETTER_AUTH_SECRET!,
        )
      : null;
    if (query.cursor && (!after || !("sequence" in after)))
      throw new HttpError(
        400,
        "INVALID_CURSOR",
        "Restart plan history from page one.",
      );
    return await connection.transaction(async (session) => {
      const profile = await profileAt(connection, session, userId);
      const plans = await planTaskModel(connection)
        .find({
          userId,
          ...(after && "sequence" in after
            ? { version: { $lt: after.sequence } }
            : {}),
        })
        .sort({ version: -1 })
        .limit(query.limit + 1)
        .session(session)
        .lean();
      const selected = plans.slice(0, query.limit);
      return {
        data: selected.map((plan) => ({
          id: String(plan._id),
          version: plan.version,
          status:
            String(profile.activePlanId) === String(plan._id)
              ? "active"
              : "archived",
          windowStart: plan.windowStart,
          windowEnd: plan.windowEnd,
          generatedAt: plan.generatedAt.toISOString(),
          completedCount: plan.tasks.filter(
            (task) => task.status === "completed",
          ).length,
          taskCount: plan.tasks.length,
        })),
        meta: {
          page: {
            limit: query.limit,
            hasMore: plans.length > query.limit,
            nextCursor:
              plans.length > query.limit
                ? issueStudyCursor(
                    { sequence: selected.at(-1)!.version },
                    binding,
                    serverConfig.BETTER_AUTH_SECRET!,
                  )
                : null,
          },
        },
      };
    }, studyTransaction);
  } catch (error) {
    throw planningError(error);
  }
}
export async function dashboard(headers: Headers) {
  try {
    const { connection, userId } = await context(headers);
    return await connection.transaction(async (session) => {
      const profile = await profileAt(connection, session, userId);
      const plan = await activeAt(
        connection,
        session,
        userId,
        profile.activePlanId,
      );
      const tasks = plan
        ? await decorate(
            connection,
            session,
            userId,
            storedProposal(plan).tasks,
          )
        : [];
      const attempts = await planningAttempts(connection, session, userId);
      const latest = new Map<string, (typeof attempts)[number]>();
      for (const attempt of attempts)
        if (!latest.has(String(attempt.contentId)))
          latest.set(String(attempt.contentId), attempt);
      const date = studyDate();
      const cycles = (await planningCycles(connection, session, userId)).filter(
        (cycle) => cycle.dueDate <= date,
      );
      const catalog = await planningCatalog(connection, session);
      const material = new Map(
        catalog.materials.map((item) => [item.id, item]),
      );
      const completed = tasks.filter((task) => task.status === "completed");
      const todayTasks = tasks.filter((task) => task.scheduledDate === date);
      const overdue = tasks.filter(
        (task) => task.status === "pending" && task.scheduledDate < date,
      );
      const revisions = cycles.map((cycle) => ({
        ...cycle,
        title:
          attempts.find(
            (attempt) => String(attempt._id) === cycle.lastAttemptId,
          )?.contentSnapshot.title ?? "Unavailable material",
        availability: material.get(cycle.contentId)?.available
          ? "available"
          : "unavailable",
        outsidePlan: plan ? cycle.dueDate > plan.windowEnd : null,
      }));
      const topics = new Map<
        string,
        {
          subject: string;
          topic: string;
          distinctAttempted: number;
          currentlySolved: number;
          readingCompleted: number;
        }
      >();
      for (const attempt of latest.values()) {
        const key = `${attempt.subject}:${attempt.topic}`;
        const entry = topics.get(key) ?? {
          subject: attempt.subject,
          topic: attempt.topic,
          distinctAttempted: 0,
          currentlySolved: 0,
          readingCompleted: 0,
        };
        entry.distinctAttempted++;
        if (attempt.outcome === "independent") entry.currentlySolved++;
        topics.set(key, entry);
      }
      for (const task of completed.filter(
        (task) => task.contentSnapshot.type === "resource",
      )) {
        const { subject, topic } = task.contentSnapshot;
        const key = `${subject}:${topic}`;
        const entry = topics.get(key) ?? {
          subject,
          topic,
          distinctAttempted: 0,
          currentlySolved: 0,
          readingCompleted: 0,
        };
        entry.readingCompleted++;
        topics.set(key, entry);
      }
      return {
        asOf: new Date().toISOString(),
        studyDate: date,
        timezone: "Asia/Kolkata",
        stateRevision: profile.stateRevision,
        activePlanId: profile.activePlanId
          ? String(profile.activePlanId)
          : null,
        progress: {
          distinctAttempted: latest.size,
          currentlySolved: [...latest.values()].filter(
            (attempt) => attempt.outcome === "independent",
          ).length,
          planCompleted: completed.length,
          planTotal: tasks.length,
          planCompletionPercent: tasks.length
            ? Math.round((1000 * completed.length) / tasks.length) / 10
            : null,
          readingCompleted: completed.filter(
            (task) => task.contentSnapshot.type === "resource",
          ).length,
        },
        todayTasks,
        upcomingTasks: tasks
          .filter(
            (task) => task.status === "pending" && task.scheduledDate > date,
          )
          .slice(0, 5),
        overdue: { count: overdue.length, items: overdue.slice(0, 5) },
        revisions: {
          dueCount: revisions.length,
          unavailableDueCount: revisions.filter(
            (cycle) => cycle.availability === "unavailable",
          ).length,
          items: revisions
            .filter(
              (cycle) =>
                !todayTasks.some(
                  (task) =>
                    task.kind === "revision" &&
                    task.contentId === cycle.contentId &&
                    task.revisionSourceSequence === cycle.lastAttemptSequence,
                ),
            )
            .slice(0, 5),
        },
        topics: [...topics.values()],
        suggestions:
          plan && plan.windowEnd >= date
            ? [
                ...adjustmentEvidence(attemptEvidence(attempts)).filter(
                  (entry) =>
                    entry.attemptIds.some((attemptId) =>
                      attempts.some(
                        (attempt) =>
                          String(attempt._id) === attemptId &&
                          attempt.attemptSequence >
                            (plan.attemptSequenceAtGeneration ?? 0),
                      ),
                    ),
                ),
                ...revisionEvidence(
                  attemptEvidence(attempts),
                  cycles,
                  storedProposal(plan).tasks,
                  date,
                ),
              ]
                .slice(0, 10)
                .map((entry) => ({
                  ...entry,
                  key: `${entry.ruleCode}:${entry.subject}:${entry.topic}:${entry.attemptIds.join(":")}`,
                  summary: evidenceSummary(entry),
                }))
            : [],
      };
    }, studyTransaction);
  } catch (error) {
    throw planningError(error);
  }
}
