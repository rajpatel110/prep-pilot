"use client";
export class ApiRequestError extends Error {
  constructor(
    public code: string,
    message: string,
    public fields: Record<string, string[]> = {},
    public uncertain = false,
  ) {
    super(message);
  }
}
export async function apiRequest(path: string, method = "GET", body?: unknown) {
  let dispatched = false;
  try {
    let token: string | undefined;
    if (method !== "GET") {
      const protection = await fetch("/api/v1/security/csrf", {
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
      });
      if (!protection.ok)
        throw new ApiRequestError(
          "ACCESS_UNAVAILABLE",
          "Refresh your session before saving.",
        );
      token = (await protection.json()).data.token;
    }
    dispatched = true;
    const response = await fetch(path, {
      method,
      cache: "no-store",
      signal: AbortSignal.timeout(25000),
      headers:
        method === "GET"
          ? {}
          : { "Content-Type": "application/json", "X-CSRF-Token": token! },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    let value;
    try {
      value = await response.json();
    } catch {
      throw new ApiRequestError(
        "UNKNOWN_OUTCOME",
        "The server response could not be confirmed. Reconcile the saved record before retrying.",
        {},
        method !== "GET",
      );
    }
    if (!response.ok)
      throw new ApiRequestError(
        value.error?.code ?? "UNKNOWN_OUTCOME",
        `${value.error?.message ?? "The request failed."} Request ID: ${value.requestId ?? response.headers.get("x-request-id") ?? "unavailable"}`,
        value.error?.fields ?? {},
        method !== "GET" && response.status >= 500,
      );
    return value;
  } catch (error) {
    if (error instanceof ApiRequestError) throw error;
    throw new ApiRequestError(
      "CONNECTION_FAILED",
      method === "GET"
        ? "Unable to read saved content. Try again."
        : "The save could not be confirmed. Reconcile before retrying.",
      {},
      method !== "GET" && dispatched,
    );
  }
}
