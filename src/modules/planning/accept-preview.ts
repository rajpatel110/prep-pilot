import { apiRequest } from "@/shared/ui/api-client";

export async function acceptPreview(
  previewId: string,
  acknowledgedDeferredIds: string[],
  confirmed: (planId: string) => void,
  request = apiRequest,
) {
  const result = await request(
    `/api/v1/plan-previews/${previewId}/confirm`,
    "POST",
    { acknowledgedDeferredIds },
  );
  confirmed(result.data.plan.id);
  try {
    await request("/api/v1/plans/current");
    return { refreshed: true };
  } catch {
    return { refreshed: false };
  }
}
