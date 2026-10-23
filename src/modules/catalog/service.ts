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
      if (document.status !== "draft")
        throw new HttpError(
          409,
          "INVALID_CONTENT_STATE",
          "Only drafts can be edited in this milestone.",
        );
      if (
        patch.slug !== undefined &&
        patch.slug !== document.slug &&
        (document.publishedAt !== null || document.archivedAt !== null)
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
      parseCatalogInput(storedContentSchema, {
        ...document.toObject(),
        _id: id,
        assetIds: document.assetIds.map(String),
      });
      document.$where = { revision: expectedRevision, status: "draft" };
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
