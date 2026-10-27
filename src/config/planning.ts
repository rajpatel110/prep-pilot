import { catalogTopics, type CatalogSubject } from "./catalog";
import { createHash } from "node:crypto";
export const rulesVersion = "deterministic-budget-3";
export const subjects: CatalogSubject[] = ["dsa", "aptitude", "cs"];
export const companyTemplates = {
  cognizant: catalogTopics,
  ltm: catalogTopics,
} as const;
export const prerequisites: Record<string, string[]> = {
  "dsa:sorting": ["dsa:arrays"],
  "dsa:searching": ["dsa:arrays"],
};
export const templateVersion = `editorial-foundations-1-${createHash("sha256").update(JSON.stringify({ subjects, companyTemplates, prerequisites })).digest("hex").slice(0, 16)}`;
export function validatePlanningConfiguration(
  edges = prerequisites,
  templates: Record<
    string,
    Record<string, readonly string[]>
  > = companyTemplates,
) {
  const known = new Set(
    subjects.flatMap((subject) =>
      catalogTopics[subject].map((topic) => `${subject}:${topic}`),
    ),
  );
  for (const [company, template] of Object.entries(templates)) {
    if (!["cognizant", "ltm"].includes(company))
      throw new Error("Unknown template company.");
    for (const [subject, topics] of Object.entries(template)) {
      if (
        !subjects.includes(subject as CatalogSubject) ||
        new Set(topics).size !== topics.length
      )
        throw new Error("Invalid template subject or duplicate topic.");
      for (const topic of topics)
        if (!known.has(`${subject}:${topic}`))
          throw new Error("Unknown template topic.");
    }
  }
  const active = new Set<string>(),
    visited = new Set<string>();
  function visit(topic: string) {
    if (!known.has(topic) || active.has(topic))
      throw new Error("Invalid prerequisite graph.");
    if (visited.has(topic)) return;
    active.add(topic);
    for (const parent of edges[topic] ?? []) visit(parent);
    active.delete(topic);
    visited.add(topic);
  }
  for (const topic of Object.keys(edges)) visit(topic);
}
