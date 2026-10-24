import { z } from "zod";
import { domainId } from "@/modules/catalog/schemas";
import { isCatalogTopic } from "@/config/catalog";
export const pagination = {
  cursor: z.string().min(1).max(2048).optional(),
  limit: z
    .string()
    .regex(/^\d{1,2}$/)
    .transform(Number)
    .pipe(z.number().int().min(1).max(50))
    .default(20),
};
export const attemptQuery = z
  .strictObject({
    ...pagination,
    contentId: domainId.optional(),
    subject: z.enum(["dsa", "aptitude", "cs"]).optional(),
    topic: z.string().min(1).max(80).optional(),
    kind: z.enum(["practice", "revision"]).optional(),
  })
  .refine(
    (value) =>
      !value.topic ||
      (value.subject
        ? isCatalogTopic(value.subject, value.topic)
        : ["dsa", "aptitude", "cs"].some((subject) =>
            isCatalogTopic(subject as "dsa", value.topic!),
          )),
    { path: ["topic"], message: "Choose a configured topic." },
  );
export const revisionQuery = z.strictObject({
  ...pagination,
  dueOnly: z.enum(["true", "false"]).default("true"),
});
export function queryValues(params: URLSearchParams) {
  const result: Record<string, unknown> = Object.create(null);
  for (const [key, value] of params)
    result[key] = Object.hasOwn(result, key) ? null : value;
  return result;
}
