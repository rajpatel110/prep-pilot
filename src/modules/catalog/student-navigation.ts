import { studentReturn } from "@/modules/identity/student-routing";

export function libraryReturn(value: unknown) {
  const safe = studentReturn(value);
  return safe && safe.split("?")[0] === "/content" ? safe : "/content";
}
export function studyReturn(value: unknown) {
  const safe = studentReturn(value);
  return safe &&
    (["/content", "/revisions", "/attempts", "/dashboard"].includes(
      safe.split("?")[0]!,
    ) ||
      /^\/plans\/[a-f0-9]{24}$/.test(safe))
    ? safe
    : "/content";
}
export function catalogParams(
  values: Record<string, string | string[] | undefined>,
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (Array.isArray(value))
      value.forEach((entry) => params.append(key, entry));
    else if (value !== undefined && value !== "") params.set(key, value);
  }
  return params;
}
export function mergeContent<Item extends { id: string }>(
  current: Item[],
  incoming: Item[],
) {
  const seen = new Set(current.map((item) => item.id));
  return [
    ...current,
    ...incoming.filter((item) => !seen.has(item.id) && !!seen.add(item.id)),
  ];
}
