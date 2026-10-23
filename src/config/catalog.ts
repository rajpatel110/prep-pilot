export const catalogTopics = {
  dsa: [
    "arrays",
    "strings",
    "hashing",
    "sorting",
    "searching",
    "linked_lists",
    "stacks_queues",
    "trees",
    "graphs",
    "dynamic_programming",
  ],
  aptitude: ["quantitative", "logical_reasoning", "verbal_ability"],
  cs: ["dbms", "operating_systems", "networking", "oop"],
} as const;

export type CatalogSubject = keyof typeof catalogTopics;
export function isCatalogTopic(subject: CatalogSubject, topic: string) {
  return (catalogTopics[subject] as readonly string[]).includes(topic);
}
