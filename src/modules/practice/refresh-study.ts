import { apiRequest } from "@/shared/ui/api-client";

export async function refreshStudyAfterAttempt(
  contentId: string,
  request = apiRequest,
) {
  const results = await Promise.allSettled(
    [
      `/api/v1/attempts?contentId=${contentId}&limit=1`,
      "/api/v1/revisions?dueOnly=false",
      "/api/v1/plans/current",
      "/api/v1/dashboard",
    ].map((path) => request(path)),
  );
  const history = results[0];
  return {
    latest:
      history?.status === "fulfilled"
        ? (history.value.data[0]?.attemptSequence ?? null)
        : null,
    failed: results.some((result) => result.status === "rejected"),
  };
}
