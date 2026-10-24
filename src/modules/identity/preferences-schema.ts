import { z } from "zod";

export const studyTimezone = "Asia/Kolkata";
export function studyDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: studyTimezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function minimumDeadline(now = new Date()) {
  return new Date(Date.parse(`${studyDate(now)}T00:00:00Z`) + 6 * 86400000)
    .toISOString()
    .slice(0, 10);
}
export const preferencesSchema = z.strictObject({
  companies: z
    .array(z.enum(["cognizant", "ltm"]))
    .min(1)
    .max(2)
    .refine(
      (values) => new Set(values).size === values.length,
      "Choose each company once.",
    ),
  deadline: z.iso.date(),
  dailyMinutes: z.number().int().min(30).max(240).multipleOf(15),
  skills: z.strictObject({
    dsa: z.number().int().min(1).max(5),
    aptitude: z.number().int().min(1).max(5),
    cs: z.number().int().min(1).max(5),
  }),
});
export const preferencesInputSchema = preferencesSchema
  .extend({
    expectedStateRevision: z
      .number()
      .int()
      .min(0)
      .max(Number.MAX_SAFE_INTEGER - 1),
  })
  .refine((values) => values.deadline >= minimumDeadline(), {
    path: ["deadline"],
    message: "Allow at least seven inclusive study days in Asia/Kolkata.",
  });
export type Preferences = z.infer<typeof preferencesSchema>;

export function preferenceFields(error: z.ZodError) {
  const fields: Record<string, string[]> = {};
  const messages: Record<string, string> = {
    companies: "Choose Cognizant, LTM, or both without duplicates.",
    deadline:
      "Choose a real date allowing at least seven inclusive study days in Asia/Kolkata.",
    dailyMinutes: "Choose 30–240 minutes in 15-minute increments.",
    skills: "Rate DSA, aptitude and CS fundamentals from 1 to 5.",
    expectedStateRevision: "Reload your current preferences before saving.",
  };
  for (const issue of error.issues) {
    const field =
      typeof issue.path[0] === "string" &&
      Object.hasOwn(messages, issue.path[0])
        ? issue.path[0]
        : "_form";
    fields[field] = [
      messages[field] ??
        "Remove unsupported fields and provide complete preferences.",
    ];
  }
  return fields;
}
