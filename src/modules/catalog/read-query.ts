import { z } from "zod";
import { catalogTopics, isCatalogTopic } from "@/config/catalog";

const topics = Object.values(catalogTopics).flat() as string[];
export const catalogQuerySchema = z
  .strictObject({
    status: z.enum(["draft", "published", "archived"]).optional(),
    subject: z.enum(["dsa", "aptitude", "cs"]).optional(),
    topic: z
      .string()
      .max(80)
      .refine((value) => topics.includes(value))
      .optional(),
    company: z.enum(["cognizant", "ltm"]).optional(),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    q: z.string().trim().min(1).max(100).optional(),
    cursor: z.string().min(1).max(2048).optional(),
    limit: z
      .string()
      .regex(/^[1-9]\d?$/)
      .transform(Number)
      .pipe(z.number().max(50))
      .default(20),
  })
  .refine(
    (value) =>
      !value.subject ||
      !value.topic ||
      isCatalogTopic(value.subject, value.topic),
    { path: ["topic"] },
  );

export type CatalogQuery = z.output<typeof catalogQuerySchema>;

export function queryObject(params: URLSearchParams) {
  const values: Record<string, unknown> = Object.create(null) as Record<
    string,
    unknown
  >;
  for (const [key, value] of params) {
    values[key] = Object.hasOwn(values, key) ? null : value;
  }
  return values;
}

export function cursorBinding(query: CatalogQuery, actor: string) {
  return JSON.stringify({
    endpoint: "/api/v1/admin/content",
    order: "id:asc",
    actor,
    limit: query.limit,
    status: query.status ?? null,
    subject: query.subject ?? null,
    topic: query.topic ?? null,
    company: query.company ?? null,
    difficulty: query.difficulty ?? null,
    q: query.q ?? null,
  });
}

export function keywordSearch(value: string) {
  return (value.match(/[\p{L}\p{N}_]+/gu) ?? [])
    .map((word) => `"${word}"`)
    .join(" ");
}
