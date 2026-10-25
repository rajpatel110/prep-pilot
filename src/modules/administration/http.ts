import "server-only";
import { randomUUID } from "node:crypto";
import { requireOwner } from "@/modules/identity/service";
import { requireCsrf } from "@/shared/server/csrf";
import { failure, HttpError, json, readJson } from "@/shared/server/http";
import { administration } from "./service";
export async function administrationHttp(
  request: Request,
  action: "list" | "lookup" | "read" | "reauthenticate" | "change",
  userId = "",
) {
  const requestId = randomUUID();
  try {
    const actor = await requireOwner(request.headers);
    if (request.method !== "GET")
      requireCsrf(request, actor.session.session.id);
    if (action !== "list" && new URL(request.url).search)
      throw new HttpError(
        422,
        "VALIDATION_ERROR",
        "Query parameters are not supported.",
      );
    if (action === "list")
      return Response.json(
        await administration.list(
          request.headers,
          new URL(request.url).searchParams,
        ),
        {
          headers: {
            "Cache-Control": "private, no-store",
            "X-Request-Id": requestId,
          },
        },
      );
    if (action === "read")
      return json(await administration.read(request.headers, userId), 200, {
        requestId,
      });
    const body = await readJson(request);
    const data =
      action === "change"
        ? await administration.change(request.headers, userId, body, requestId)
        : action === "lookup"
          ? await administration.lookup(request.headers, body)
          : await administration.reauthenticate(request.headers, body);
    return json(data, 200, { requestId });
  } catch (error) {
    return failure(error, requestId);
  }
}
