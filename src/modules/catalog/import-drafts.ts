import "server-only";
import { randomUUID } from "node:crypto";
import type { Connection } from "mongoose";
import { appendAudit } from "@/modules/administration/audit";
import { requireImportOperator } from "@/modules/identity/import-operator";
import { lockAdminUser } from "@/modules/identity/mutation-guard";
import { HttpError } from "@/shared/server/http";
import { prepareImport } from "./import-schema";
import { catalogModels } from "./model";
import { advanceCatalog, requireCatalogSetup } from "./repository";
import { writeDraft } from "./write-draft";
import { catalogMutationError } from "./errors";
import { draftInputSchema } from "./schemas";

const transactionOptions = {
  readPreference: "primary" as const,
  readConcern: { level: "snapshot" as const },
  writeConcern: { w: "majority" as const },
  timeoutMS: 15000,
  maxCommitTimeMS: 5000,
};

function canonical(value: unknown): string {
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value && typeof value === "object")
    return (
      "{" +
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => JSON.stringify(key) + ":" + canonical(item))
        .join(",") +
      "}"
    );
  return JSON.stringify(value);
}

export async function importDrafts(
  connection: Connection,
  operator: { userId: string; email: string },
  input: unknown,
  options: {
    apply?: boolean;
    associationReviewedAt?: string;
    audit?: typeof appendAudit;
  } = {},
) {
  const prepared = prepareImport(input, options.associationReviewedAt);
  if (options.apply && prepared.some((item) => item.blocked))
    throw new HttpError(
      422,
      "VALIDATION_ERROR",
      "Supply a genuine association review time before applying company labels.",
    );
  await requireImportOperator(connection, operator);
  await requireCatalogSetup(connection);
  const model = catalogModels(connection).content;
  const inspect = async (item: (typeof prepared)[number]) => {
    const existing = await model
      .findOne({ slug: item.slug })
      .maxTimeMS(5000)
      .lean();
    if (existing) {
      const comparable = Object.fromEntries(
        Object.keys(draftInputSchema.shape).map((key) => [
          key,
          existing[key as keyof typeof existing],
        ]),
      );
      return canonical(comparable) === canonical(item.values)
        ? "identical"
        : "conflict";
    }
    const duplicate = await model.exists({
      $or: [
        { title: item.values.title },
        ...(item.values.prompt ? [{ prompt: item.values.prompt }] : []),
      ],
    });
    return duplicate ? "possible_duplicate" : "new";
  };
  const report: { slug: string; outcome: string }[] = [];
  for (const item of prepared) {
    const initial = await inspect(item);
    if (!options.apply || initial !== "new") {
      report.push({
        slug: item.slug,
        outcome: item.blocked ? "provenance_review_required" : initial,
      });
      continue;
    }
    try {
      const outcome = await connection.transaction(async (session) => {
        await advanceCatalog(connection, session);
        await requireImportOperator(connection, operator, session);
        await lockAdminUser(connection, session, operator.userId);
        const existing = await model
          .findOne({ slug: item.slug })
          .session(session)
          .lean();
        const duplicate = await model
          .exists({
            $or: [
              { title: item.values.title },
              ...(item.values.prompt ? [{ prompt: item.values.prompt }] : []),
            ],
          })
          .session(session);
        if (existing || duplicate)
          throw new HttpError(
            409,
            "SLUG_TAKEN",
            "Reconcile the existing item without overwriting it.",
          );
        await writeDraft(
          connection,
          session,
          item.values,
          operator.userId,
          randomUUID(),
          options.audit,
        );
        return "created_draft";
      }, transactionOptions);
      report.push({ slug: item.slug, outcome });
    } catch (error) {
      const mapped = catalogMutationError(error);
      if (mapped.code === "SLUG_TAKEN") {
        report.push({ slug: item.slug, outcome: await inspect(item) });
        continue;
      }
      report.push({ slug: item.slug, outcome: "failed_" + mapped.code });
      break;
    }
  }
  return report;
}
