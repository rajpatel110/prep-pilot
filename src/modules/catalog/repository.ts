import "server-only";
import type { Connection, ClientSession } from "mongoose";
import { catalogModels } from "./model";
import { catalogStateSchema } from "./schemas";
import { HttpError } from "@/shared/server/http";

export async function requireCatalogSetup(connection: Connection) {
  const migration = await connection
    .db!.collection<{ _id: string; state: string }>("schemaMigrations")
    .findOne({ _id: "001_identity_catalog_foundation", state: "applied" });
  if (!migration)
    throw new HttpError(
      503,
      "DEPENDENCY_UNAVAILABLE",
      "Catalog setup is incomplete. Run the explicitly targeted database setup command.",
    );
  let indexes;
  try {
    indexes = await catalogModels(connection)
      .content.collection.listIndexes()
      .toArray();
  } catch (error) {
    if ((error as { code?: number }).code === 26)
      throw new HttpError(
        503,
        "DEPENDENCY_UNAVAILABLE",
        "The catalog collection is unavailable. Run database setup explicitly.",
      );
    throw error;
  }
  if (
    !indexes.some(
      (index) =>
        index.name === "content_slug_unique" &&
        index.unique === true &&
        JSON.stringify(index.key) === JSON.stringify({ slug: 1 }) &&
        !index.partialFilterExpression &&
        !index.sparse &&
        !index.collation,
    )
  )
    throw new HttpError(
      503,
      "DEPENDENCY_UNAVAILABLE",
      "The required catalog uniqueness index is unavailable.",
    );
}

export async function advanceCatalog(
  connection: Connection,
  session: ClientSession,
) {
  const model = catalogModels(connection).state;
  const state = await model.findById("catalog").session(session).lean();
  if (!state || !catalogStateSchema.safeParse(state).success)
    throw new HttpError(
      503,
      "DEPENDENCY_UNAVAILABLE",
      "The catalog singleton is missing or invalid. Run database setup explicitly.",
    );
  if (state.revision >= Number.MAX_SAFE_INTEGER)
    throw new HttpError(
      409,
      "CONTENT_CONFLICT",
      "The catalog revision cannot advance.",
    );
  const result = await model.updateOne(
    {
      _id: "catalog",
      revision: state.revision,
      commitSerial: state.commitSerial,
    },
    { $inc: { revision: 1 } },
    { session, runValidators: true },
  );
  if (result.matchedCount !== 1)
    throw new HttpError(
      409,
      "CONTENT_CONFLICT",
      "The catalog changed during the save.",
    );
}
