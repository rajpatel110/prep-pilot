import "server-only";
import { randomUUID } from "node:crypto";
import { Types } from "mongoose";
import { requireAdmin } from "@/modules/identity/service";
import { lockAdminProfile } from "@/modules/identity/mutation-guard";
import { appendAudit } from "@/modules/administration/audit";
import { getDomainConnection } from "@/shared/server/db";
import { HttpError } from "@/shared/server/http";
import { catalogModels } from "./model";
import {
  draftInputSchema,
  draftPatchSchema,
  domainId,
  storedContentSchema,
} from "./schemas";
import { parseCatalogInput } from "./validation";
import { adminContentDto } from "./dto";
import { advanceCatalog, requireCatalogSetup } from "./repository";
import { catalogMutationError } from "./errors";
import {
  archiveSchema,
  lifecycleSchema,
  lifecycleStates,
  publicationFields,
  type LifecycleAction,
} from "./publication";

function requirePublication(content: Parameters<typeof publicationFields>[0]) {
  const fields = publicationFields(content);
  if (Object.keys(fields).length)
    throw new HttpError(
      422,
      "PUBLISH_REQUIREMENTS_NOT_MET",
      "Complete the required fields before publishing.",
      fields,
    );
}

const transactionOptions = {
  readPreference: "primary" as const,
  readConcern: { level: "snapshot" as const },
  writeConcern: { w: "majority" as const },
  timeoutMS: 15000,
  maxCommitTimeMS: 5000,
};
const clearable = new Set(["prompt", "body", "explanation", "externalUrl"]);

export async function createDraft(
  headers: Headers,
  input: unknown,
  requestId = randomUUID(),
) {
  try {
    const actor = await requireAdmin(headers);
    const values = parseCatalogInput(draftInputSchema, input);
    const connection = await getDomainConnection();
    await requireCatalogSetup(connection);
    const models = catalogModels(connection);
    const id = new Types.ObjectId();
    const now = new Date();
    return await connection.transaction(async (session) => {
      await advanceCatalog(connection, session);
      await lockAdminProfile(connection, session, actor);
      const document = new models.content({
        ...values,
        _id: id,
        status: "draft",
        revision: 1,
        createdBy: actor.session.user.id,
        updatedBy: actor.session.user.id,
        createdAt: now,
        updatedAt: now,
      });
      await document.save({ session });
      const content = storedContentSchema.parse({
        ...document.toObject(),
        _id: id.toString(),
        assetIds: [],
      });
      await appendAudit(connection, session, {
        actorUserId: actor.session.user.id,
        action: "create_content",
        entityType: "content",
        entityId: id.toString(),
        priorRevision: null,
        newRevision: 1,
        changedFields: Object.keys(values).sort(),
        requestId,
      });
      return adminContentDto(content);
    }, transactionOptions);
  } catch (error) {
    throw catalogMutationError(error);
  }
}

export async function editDraft(
  headers: Headers,
  id: string,
  input: unknown,
  requestId = randomUUID(),
) {
  try {
    const actor = await requireAdmin(headers);
    if (!domainId.safeParse(id).success)
      throw new HttpError(
        422,
        "VALIDATION_ERROR",
        "Check the highlighted fields.",
        { id: ["Use a 24-character hexadecimal content ID."] },
      );
    const { expectedRevision, ...patch } = parseCatalogInput(
      draftPatchSchema,
      input,
    );
    const connection = await getDomainConnection();
    await requireCatalogSetup(connection);
    const models = catalogModels(connection);
    return await connection.transaction(async (session) => {
      await advanceCatalog(connection, session);
      await lockAdminProfile(connection, session, actor);
      const document = await models.content.findById(id).session(session);
      if (!document)
        throw new HttpError(
          404,
          "RESOURCE_NOT_FOUND",
          "Content was not found.",
        );
      if (document.revision !== expectedRevision)
        throw new HttpError(
          409,
          "CONTENT_CONFLICT",
          "Content changed. Refetch and reconcile before editing.",
        );
      if (document.status === "archived")
        throw new HttpError(
          409,
          "INVALID_CONTENT_STATE",
          "Reopen archived content before editing.",
        );
      if (
        patch.slug !== undefined &&
        patch.slug !== document.slug &&
        (document.status === "published" ||
          document.publishedAt !== null ||
          document.archivedAt !== null)
      )
        throw new HttpError(
          422,
          "VALIDATION_ERROR",
          "Check the highlighted fields.",
          { slug: ["A previously published slug cannot be changed."] },
        );
      if (document.revision >= Number.MAX_SAFE_INTEGER)
        throw new HttpError(
          409,
          "CONTENT_CONFLICT",
          "The content revision cannot advance.",
        );
      const changedFields: string[] = [];
      const priorStatus = document.status;
      for (const [field, value] of Object.entries(patch)) {
        if (value === undefined) continue;
        document.set(
          field,
          value === null && clearable.has(field) ? undefined : value,
        );
        if (document.isModified(field)) changedFields.push(field);
      }
      document.revision = expectedRevision + 1;
      document.updatedBy = actor.session.user.id;
      const candidate = parseCatalogInput(storedContentSchema, {
        ...document.toObject(),
        _id: id,
        assetIds: document.assetIds.map(String),
      });
      if (document.status === "published") requirePublication(candidate);
      document.$where = { revision: expectedRevision, status: priorStatus };
      await document.save({ session });
      const content = storedContentSchema.parse({
        ...document.toObject(),
        _id: id,
        assetIds: [],
      });
      await appendAudit(connection, session, {
        actorUserId: actor.session.user.id,
        action: "edit_content",
        entityType: "content",
        entityId: id,
        priorRevision: expectedRevision,
        newRevision: document.revision,
        changedFields: changedFields.sort(),
        requestId,
      });
      return adminContentDto(content);
    }, transactionOptions);
  } catch (error) {
    throw catalogMutationError(error);
  }
}

export async function transitionContent(
  headers: Headers,
  id: string,
  action: LifecycleAction,
  input: unknown,
  requestId = randomUUID(),
) {
  try {
    const actor = await requireAdmin(headers);
    if (!domainId.safeParse(id).success)
      throw new HttpError(422, "VALIDATION_ERROR", "Invalid content ID.", {
        id: ["Use a 24-character hexadecimal content ID."],
      });
    const values =
      action === "archive"
        ? parseCatalogInput(archiveSchema, input)
        : parseCatalogInput(lifecycleSchema, input);
    const connection = await getDomainConnection();
    await requireCatalogSetup(connection);
    return await connection.transaction(async (session) => {
      await advanceCatalog(connection, session);
      await lockAdminProfile(connection, session, actor);
      const document = await catalogModels(connection)
        .content.findById(id)
        .session(session);
      if (!document)
        throw new HttpError(
          404,
          "RESOURCE_NOT_FOUND",
          "Content was not found.",
        );
      if (document.revision !== values.expectedRevision)
        throw new HttpError(
          409,
          "CONTENT_CONFLICT",
          "Content changed. Refetch and reconcile before continuing.",
        );
      const [from, to] = lifecycleStates[action];
      if (document.status !== from)
        throw new HttpError(
          409,
          "INVALID_CONTENT_STATE",
          "This action is not available in the current content state.",
        );
      if (document.revision >= Number.MAX_SAFE_INTEGER)
        throw new HttpError(
          409,
          "CONTENT_CONFLICT",
          "The content revision cannot advance.",
        );
      const candidate = parseCatalogInput(storedContentSchema, {
        ...document.toObject(),
        _id: id,
        assetIds: document.assetIds.map(String),
      });
      if (action === "publish") requirePublication(candidate);
      document.status = to;
      document.revision += 1;
      document.updatedBy = actor.session.user.id;
      const changedFields = ["status"];
      if (action === "publish") {
        document.publishedAt = new Date();
        changedFields.push("publishedAt");
      }
      if (action === "archive") {
        document.archivedAt = new Date();
        changedFields.push("archivedAt");
      }
      document.$where = { revision: values.expectedRevision, status: from };
      await document.save({ session });
      await appendAudit(connection, session, {
        actorUserId: actor.session.user.id,
        action: `${action}_content`,
        entityType: "content",
        entityId: id,
        priorRevision: values.expectedRevision,
        newRevision: document.revision,
        changedFields,
        requestId,
        ...("reason" in values && typeof values.reason === "string"
          ? { reason: values.reason }
          : {}),
      });
      return adminContentDto(
        storedContentSchema.parse({
          ...document.toObject(),
          _id: id,
          assetIds: [],
        }),
      );
    }, transactionOptions);
  } catch (error) {
    throw catalogMutationError(error);
  }
}
