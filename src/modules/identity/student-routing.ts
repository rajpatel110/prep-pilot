export function studentReturn(value: unknown): string | null {
  if (
    typeof value !== "string" ||
    value.length > 1800 ||
    /[\\\u0000-\u001f\u007f]/.test(value)
  )
    return null;
  try {
    if (value === "/account?view=settings") return value;
    const url = new URL(value, "https://preppilot.invalid");
    if (
      url.origin !== "https://preppilot.invalid" ||
      !value.startsWith("/") ||
      !/^(?:\/content(?:\/[a-f0-9]{24})?|\/revisions|\/attempts|\/dashboard|\/progress|\/plans(?:\/[a-f0-9]{24})?|\/plan-previews\/[a-f0-9]{24})$/.test(
        url.pathname,
      ) ||
      url.hash
    )
      return null;
    if (url.searchParams.size > 6) return null;
    for (const key of url.searchParams.keys())
      if (
        ![
          "subject",
          "topic",
          "company",
          "difficulty",
          "q",
          "limit",
          "returnTo",
          "dueOnly",
          "kind",
          "contentId",
          "planId",
          "taskId",
        ].includes(key)
      )
        return null;
    if (
      ["/content", "/revisions", "/attempts"].includes(url.pathname) &&
      url.searchParams.has("returnTo")
    )
      return null;
    return url.pathname + url.search;
  } catch {
    return null;
  }
}
