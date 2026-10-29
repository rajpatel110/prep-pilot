import "server-only";
import { Types, type ClientSession, type Connection } from "mongoose";
import { z } from "zod";
import { appendAudit } from "@/modules/administration/audit";
import { validateAttachments } from "@/modules/files/references";
import { catalogModels } from "./model";
import { draftInputSchema, storedContentSchema } from "./schemas";
import { adminContentDto } from "./dto";

export async function writeDraft(
  connection: Connection,
  session: ClientSession,
  values: z.output<typeof draftInputSchema>,
  actorUserId: string,
  requestId: string,
  audit = appendAudit,
) {
  if (!session.inTransaction())
    throw new Error("Draft creation requires a transaction.");
  const attachments = await validateAttachments(
    connection,
    values.assetIds,
    false,
    session,
  );
  const id = new Types.ObjectId();
  const now = new Date();
  const document = new (catalogModels(connection).content)({
    ...values,
    _id: id,
    status: "draft",
    revision: 1,
    createdBy: actorUserId,
    updatedBy: actorUserId,
    createdAt: now,
    updatedAt: now,
  });
  await document.save({ session });
  const content = storedContentSchema.parse({
    ...document.toObject(),
    _id: id.toString(),
    assetIds: document.assetIds.map(String),
  });
  await audit(connection, session, {
    actorUserId,
    action: "create_content",
    entityType: "content",
    entityId: id.toString(),
    priorRevision: null,
    newRevision: 1,
    changedFields: Object.keys(values).sort(),
    requestId,
  });
  return adminContentDto(content, attachments);
}
