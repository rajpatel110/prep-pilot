import "server-only";
import type { ClientSession, Connection } from "mongoose";
import { fileModels } from "./model";
import { fileRecord, fileDto } from "./schemas";
import { HttpError } from "@/shared/server/http";

export async function attachmentMetadata(
  connection: Connection,
  ids: readonly string[],
  session?: ClientSession,
) {
  if (!ids.length) return [];
  const query = fileModels(connection)
    .asset.find({ _id: { $in: ids } })
    .lean();
  if (session) query.session(session);
  const records = await query;
  return ids.flatMap((id) => {
    const value = records.find((record) => String(record._id) === id);
    return value ? [fileDto(fileRecord.parse({ ...value, _id: id }))] : [];
  });
}
export async function validateAttachments(
  connection: Connection,
  ids: readonly string[],
  published: boolean,
  session: ClientSession,
) {
  const metadata = await attachmentMetadata(connection, ids, session);
  if (
    metadata.length !== ids.length ||
    metadata.some((asset) =>
      published
        ? asset.status !== "ready"
        : !["uploading", "validating", "ready"].includes(asset.status),
    )
  )
    throw new HttpError(
      422,
      published ? "PUBLISH_REQUIREMENTS_NOT_MET" : "VALIDATION_ERROR",
      "Check attachment availability.",
      {
        assetIds: [
          published
            ? "All attachments must exist and be ready."
            : "Attachments must exist and must not be rejected or deleting.",
        ],
      },
    );
  return metadata;
}
