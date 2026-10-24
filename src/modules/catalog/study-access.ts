import "server-only";
import type { Connection, ClientSession } from "mongoose";
import { catalogModels } from "./model";
import { requireCatalogSetup } from "./repository";
import { HttpError } from "@/shared/server/http";
import type { Material } from "@/modules/planning/engine";

export async function planningCatalog(
  connection: Connection,
  session: ClientSession,
) {
  const state = await catalogModels(connection)
    .state.findById("catalog")
    .session(session)
    .lean();
  if (!state)
    throw new HttpError(
      503,
      "DEPENDENCY_UNAVAILABLE",
      "Catalog setup is incomplete.",
    );
  const records = await catalogModels(connection)
    .content.find({})
    .select(
      "title subject topic type revision estimatedMinutes difficulty companies status",
    )
    .sort({ _id: 1 })
    .limit(2001)
    .session(session)
    .lean();
  if (records.length > 2000)
    throw new HttpError(
      422,
      "PLAN_SCOPE_TOO_LARGE",
      "The planning catalog exceeds the supported snapshot size.",
    );
  const materials: Material[] = records.map((record) => ({
    id: String(record._id),
    snapshot: {
      title: record.title,
      subject: record.subject,
      topic: record.topic,
      type: record.type,
      contentRevision: record.revision,
    },
    estimatedMinutes: record.estimatedMinutes,
    difficulty: record.difficulty,
    companies: record.companies.map((company) => company.companyId),
    available: record.status === "published",
  }));
  return { revision: state.revision, materials };
}
export async function confirmCatalog(
  connection: Connection,
  session: ClientSession,
  revision: number,
) {
  const result = await catalogModels(connection).state.updateOne(
    {
      _id: "catalog",
      revision,
      commitSerial: { $lt: Number.MAX_SAFE_INTEGER },
    },
    { $inc: { commitSerial: 1 } },
    { session, runValidators: true },
  );
  if (result.matchedCount !== 1)
    throw new HttpError(
      409,
      "STALE_PREVIEW",
      "Catalog changed. Generate a new preview.",
    );
}

export async function lockStudyCatalog(
  connection: Connection,
  session: ClientSession,
) {
  if (!session.inTransaction())
    throw new Error("Study catalog locking requires a transaction.");
  const model = catalogModels(connection).state;
  const current = await model.findById("catalog").session(session).lean();
  if (!current)
    throw new HttpError(
      503,
      "DEPENDENCY_UNAVAILABLE",
      "Catalog setup is incomplete.",
    );
  const updatedAt = new Date(
    Math.max(Date.now(), current.updatedAt.getTime() + 1),
  );
  const result = await model.updateOne(
    {
      _id: "catalog",
      revision: current.revision,
      commitSerial: current.commitSerial,
    },
    { $set: { updatedAt } },
    { session, timestamps: false },
  );
  if (result.matchedCount !== 1)
    throw new HttpError(
      409,
      "CONTENT_CONFLICT",
      "Content availability changed. Retry the same submission.",
    );
}
export async function requireStudyCatalog(connection: Connection) {
  await requireCatalogSetup(connection);
}
export async function attemptableContent(
  connection: Connection,
  session: ClientSession,
  id: string,
) {
  const content = await catalogModels(connection)
    .content.findById(id)
    .select("title subject topic type revision status")
    .session(session)
    .lean();
  if (!content || content.status !== "published")
    throw new HttpError(
      409,
      "CONTENT_UNAVAILABLE",
      "This content is unavailable for a new study write.",
    );
  if (content.type !== "question")
    throw new HttpError(
      422,
      "CONTENT_NOT_ATTEMPTABLE",
      "Resources do not accept question outcomes.",
    );
  return {
    title: content.title,
    subject: content.subject,
    topic: content.topic,
    type: content.type,
    contentRevision: content.revision,
  };
}
export function publishedAvailabilityLookup(localField: string) {
  return {
    $lookup: {
      from: "contentItems",
      let: { contentId: `$${localField}` },
      pipeline: [
        { $match: { $expr: { $eq: ["$_id", "$$contentId"] } } },
        { $project: { _id: 0, status: 1 } },
      ],
      as: "availability",
    },
  };
}

export async function studyAvailability(
  connection: Connection,
  session: ClientSession,
  ids: string[],
) {
  const records = await catalogModels(connection)
    .content.find({ _id: { $in: ids } })
    .select("status")
    .session(session)
    .lean();
  return new Map(
    records.map((record) => [
      String(record._id),
      record.status === "published",
    ]),
  );
}
