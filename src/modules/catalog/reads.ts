import "server-only";
import { requireAdmin, requireStudyActor } from "@/modules/identity/service";
import { findAttemptContentSnapshot } from "@/modules/practice/history-read";
import { findPlanContentSnapshot } from "@/modules/planning/history-read";
import { z } from "zod";
import { getDomainConnection } from "@/shared/server/db";
import { serverConfig } from "@/shared/server/config";
import { HttpError } from "@/shared/server/http";
import {
  requireCatalogSetup,
  findCatalogPage,
  findCatalogDetail,
} from "./repository";
import { domainId } from "./schemas";
import {
  adminContentDto,
  adminContentSummaryDto,
  studentContentDto,
  studentContentSummaryDto,
} from "./dto";
import { catalogQuerySchema, cursorBinding, queryObject } from "./read-query";
import { inspectCatalogCursor, issueCatalogCursor } from "./cursor";
import { attachmentMetadata } from "@/modules/files/references";

function invalid(fields: Record<string, string[]>) {
  return new HttpError(
    422,
    "VALIDATION_ERROR",
    "Check the highlighted fields.",
    fields,
  );
}

function readError(error: unknown) {
  return error instanceof HttpError
    ? error
    : new HttpError(
        503,
        "DEPENDENCY_UNAVAILABLE",
        "Content could not be loaded. Please try again.",
      );
}

const queryMessages: Record<string, string> = {
  status: "Choose draft, published or archived; omit status for all items.",
  subject: "Choose dsa, aptitude or cs.",
  topic: "Choose a configured topic matching the selected subject.",
  company: "Choose cognizant or ltm.",
  difficulty: "Choose easy, medium or hard.",
  q: "Use 1–100 characters of keyword text.",
  cursor: "Supply a single bounded pagination cursor.",
  limit: "Supply a whole-number limit from 1 to 50.",
};

async function listContent(
  headers: Headers,
  params: URLSearchParams,
  student: boolean,
) {
  try {
    const actor = await (student
      ? requireStudyActor(headers)
      : requireAdmin(headers));
    if (student && params.has("status"))
      throw invalid({
        _form: [
          "Student lists only include published content; status is not a supported filter.",
        ],
      });
    const parsed = catalogQuerySchema.safeParse(queryObject(params));
    if (!parsed.success) {
      const fields: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const field =
          typeof issue.path[0] === "string" &&
          Object.hasOwn(catalogQuerySchema.shape, issue.path[0])
            ? issue.path[0]
            : "_form";
        fields[field] = [
          queryMessages[field] ??
            "Remove unsupported or repeated query parameters.",
        ];
      }
      throw invalid(fields);
    }
    const query = {
      ...parsed.data,
      ...(student ? { status: "published" as const } : {}),
    };
    const binding = cursorBinding(
      query,
      actor.session.user.id,
      student ? "/api/v1/content" : "/api/v1/admin/content",
    );
    const secret = serverConfig.BETTER_AUTH_SECRET!;
    const after = query.cursor
      ? inspectCatalogCursor(query.cursor, binding, secret)
      : null;
    if (query.cursor && !after)
      throw new HttpError(
        400,
        "INVALID_CURSOR",
        "Pagination expired or changed. Refresh from the first page.",
      );
    const connection = await getDomainConnection();
    await requireCatalogSetup(connection);
    const documents = await findCatalogPage(connection, query, after);
    const hasMore = documents.length > query.limit;
    const data = documents
      .slice(0, query.limit)
      .map((document) =>
        student
          ? studentContentSummaryDto(document)
          : adminContentSummaryDto(document),
      );
    return {
      data,
      meta: {
        page: {
          limit: query.limit,
          hasMore,
          nextCursor: hasMore
            ? issueCatalogCursor(data.at(-1)!.id, binding, secret)
            : null,
        },
      },
    };
  } catch (error) {
    throw readError(error);
  }
}

export async function getAdminContent(
  headers: Headers,
  id: string,
  params = new URLSearchParams(),
) {
  try {
    await requireAdmin(headers);
    if (!domainId.safeParse(id).success)
      throw invalid({ id: ["Use a 24-character hexadecimal content ID."] });
    if (params.size)
      throw invalid({ _form: ["Remove unsupported query parameters."] });
    const connection = await getDomainConnection();
    await requireCatalogSetup(connection);
    const document = await findCatalogDetail(connection, id);
    if (!document)
      throw new HttpError(404, "RESOURCE_NOT_FOUND", "Content was not found.");
    return adminContentDto(
      document,
      await attachmentMetadata(connection, document.assetIds),
    );
  } catch (error) {
    throw readError(error);
  }
}

export type AdminContentPage = Awaited<ReturnType<typeof listAdminContent>>;

export async function listAdminContent(
  headers: Headers,
  params: URLSearchParams,
) {
  const result = await listContent(headers, params, false);
  return result as {
    data: ReturnType<typeof adminContentSummaryDto>[];
    meta: typeof result.meta;
  };
}

export async function listStudentContent(
  headers: Headers,
  params: URLSearchParams,
) {
  const result = await listContent(headers, params, true);
  return result as {
    data: ReturnType<typeof studentContentSummaryDto>[];
    meta: typeof result.meta;
  };
}

const historySnapshot = z.object({
  title: z.string().min(1).max(160),
  subject: z.enum(["dsa", "aptitude", "cs"]),
  topic: z.string().min(1).max(80),
  type: z.enum(["question", "resource"]),
});

export async function getStudentContent(
  headers: Headers,
  id: string,
  params = new URLSearchParams(),
) {
  try {
    const actor = await requireStudyActor(headers);
    if (!domainId.safeParse(id).success)
      throw invalid({ id: ["Use a 24-character hexadecimal content ID."] });
    if (params.size)
      throw invalid({ _form: ["Remove unsupported query parameters."] });
    const connection = await getDomainConnection();
    await requireCatalogSetup(connection);
    const content = await findCatalogDetail(connection, id);
    if (content?.status === "published")
      return studentContentDto(
        content,
        await attachmentMetadata(connection, content.assetIds),
      );
    const attempt = historySnapshot.safeParse(
      await findAttemptContentSnapshot(actor.session.user.id, id),
    );
    const plan = attempt.success
      ? null
      : historySnapshot.safeParse(
          await findPlanContentSnapshot(actor.session.user.id, id),
        );
    const snapshot = attempt.success
      ? attempt.data
      : plan?.success
        ? plan.data
        : null;
    if (!snapshot)
      throw new HttpError(404, "RESOURCE_NOT_FOUND", "Content was not found.");
    return {
      id,
      availability: "unavailable" as const,
      reason: !content
        ? "missing"
        : content.status === "archived"
          ? "archived"
          : "not_published",
      snapshot,
    };
  } catch (error) {
    throw readError(error);
  }
}
