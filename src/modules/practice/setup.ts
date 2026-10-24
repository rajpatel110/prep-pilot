import "server-only";
import type { Connection } from "mongoose";
import { HttpError } from "@/shared/server/http";
import { practiceIndexes } from "./indexes";
export async function requirePracticeSetup(connection: Connection) {
  const migration = await connection
    .db!.collection<{ _id: string; state: string }>("schemaMigrations")
    .findOne({ _id: "002_practice_revisions", state: "applied" });
  if (!migration)
    throw new HttpError(
      503,
      "DEPENDENCY_UNAVAILABLE",
      "Study database setup is incomplete. Run the explicitly targeted database migration.",
    );
  for (const collection of ["attempts", "revisions"] as const) {
    const indexes = await connection
      .db!.collection(collection)
      .listIndexes()
      .toArray();
    for (const expected of practiceIndexes[collection]!.filter(
      (index) => index.unique,
    ))
      if (
        !indexes.some(
          (index) =>
            index.name === expected.name &&
            index.unique === true &&
            JSON.stringify(index.key) === JSON.stringify(expected.key) &&
            !index.sparse &&
            !index.partialFilterExpression &&
            !index.collation,
        )
      )
        throw new HttpError(
          503,
          "DEPENDENCY_UNAVAILABLE",
          "Required study uniqueness indexes are unavailable.",
        );
  }
}
