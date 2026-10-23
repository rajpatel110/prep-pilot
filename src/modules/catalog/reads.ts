import "server-only";
import { requireAdmin } from "@/modules/identity/service";
import { getDomainConnection } from "@/shared/server/db";
import { serverConfig } from "@/shared/server/config";
import { HttpError } from "@/shared/server/http";
import {
  requireCatalogSetup,
  findCatalogPage,
  findCatalogDetail,
} from "./repository";
import { domainId } from "./schemas";
import { adminContentDto, adminContentSummaryDto } from "./dto";
import { catalogQuerySchema, cursorBinding, queryObject } from "./read-query";
import { inspectCatalogCursor, issueCatalogCursor } from "./cursor";

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

export async function listAdminContent(
  headers: Headers,
  params: URLSearchParams,
) {
  try {
    const actor = await requireAdmin(headers);
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
    const query = parsed.data;
    const binding = cursorBinding(query, actor.session.user.id);
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
    const data = documents.slice(0, query.limit).map(adminContentSummaryDto);
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
    return adminContentDto(document);
  } catch (error) {
    throw readError(error);
  }
}

export type AdminContentPage = Awaited<ReturnType<typeof listAdminContent>>;
