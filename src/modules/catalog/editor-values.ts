import type { AdminContentDetail } from "./dto";

export const editorTextFields = [
  "title",
  "slug",
  "source",
  "attribution",
  "prompt",
  "body",
  "explanation",
  "externalUrl",
] as const;
export type EditorValues = Record<(typeof editorTextFields)[number], string> & {
  subject: "dsa" | "aptitude" | "cs";
  topic: string;
  type: "question" | "resource";
  difficulty: "easy" | "medium" | "hard";
  estimatedMinutes: string;
  tags: string;
  reviewedAt: string;
  assetIds: string[];
  companies: {
    companyId: "cognizant" | "ltm";
    association: "verified" | "student_reported";
    source: string;
    reviewedAt: string;
  }[];
};
export function localDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
export function editorValues(item: AdminContentDetail | null): EditorValues {
  return {
    title: item?.title ?? "",
    slug: item?.slug ?? "",
    source: item?.source ?? "",
    attribution: item?.attribution ?? "",
    prompt: item?.prompt ?? "",
    body: item?.body ?? "",
    explanation: item?.explanation ?? "",
    externalUrl: item?.externalUrl ?? "",
    subject: item?.subject ?? "dsa",
    topic: item?.topic ?? "arrays",
    type: item?.type ?? "question",
    difficulty: item?.difficulty ?? "easy",
    estimatedMinutes: String(item?.estimatedMinutes ?? 15),
    tags: item?.tags.join(", ") ?? "",
    reviewedAt: localDate(item?.reviewedAt ?? null),
    assetIds: [...(item?.assetIds ?? [])],
    companies:
      item?.companies.map((company) => ({
        ...company,
        reviewedAt: localDate(company.reviewedAt),
      })) ?? [],
  };
}
function instant(value: string) {
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : value;
}
export function editorPayload(values: EditorValues) {
  return {
    ...values,
    estimatedMinutes: Number(values.estimatedMinutes),
    tags: values.tags
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    reviewedAt: values.reviewedAt ? instant(values.reviewedAt) : null,
    companies: values.companies.map((company) => ({
      ...company,
      reviewedAt: instant(company.reviewedAt),
    })),
    assetIds: values.assetIds,
    prompt: values.prompt || null,
    body: values.body || null,
    explanation: values.explanation || null,
    externalUrl: values.externalUrl || null,
  };
}
export function editorPatch(
  values: EditorValues,
  baseline: EditorValues,
  expectedRevision: number,
) {
  const current = editorPayload(values);
  const previous = editorPayload(baseline);
  const patch: Record<string, unknown> = { expectedRevision };
  for (const key of Object.keys(current) as (keyof typeof current)[])
    if (JSON.stringify(current[key]) !== JSON.stringify(previous[key]))
      patch[key] = current[key];
  return patch;
}
export function rebaseEditor(
  values: EditorValues,
  baseline: EditorValues,
  remote: EditorValues,
): EditorValues {
  const changes = Object.fromEntries(
    Object.entries(values).filter(
      ([key, value]) =>
        JSON.stringify(value) !==
        JSON.stringify(baseline[key as keyof EditorValues]),
    ),
  );
  return { ...remote, ...changes };
}
