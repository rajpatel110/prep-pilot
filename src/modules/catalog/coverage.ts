import { catalogTopics } from "@/config/catalog";
import {
  companyTemplates,
  prerequisites,
  templateVersion,
  rulesVersion,
} from "@/config/planning";
import { storedContentSchema } from "./schemas";
import { publicationFields } from "./publication";

export function assessCoverage(records: Record<string, unknown>[]) {
  const rejected: { id: string; fields: string[] }[] = [];
  const eligible = records.flatMap((record) => {
    if (record.status !== "published") return [];
    const parsed = storedContentSchema.safeParse({
      ...record,
      _id: String(record._id),
      assetIds: Array.isArray(record.assetIds)
        ? record.assetIds.map(String)
        : record.assetIds,
    });
    if (!parsed.success) {
      rejected.push({
        id: String(record._id),
        fields: [
          ...new Set(
            parsed.error.issues.map((issue) =>
              String(issue.path[0] ?? "record"),
            ),
          ),
        ].sort(),
      });
      return [];
    }
    const fields = Object.keys(publicationFields(parsed.data));
    if (fields.length) {
      rejected.push({ id: parsed.data._id, fields });
      return [];
    }
    return [parsed.data];
  });
  const topics = Object.entries(catalogTopics).flatMap(([subject, values]) =>
    values.map((topic) => {
      const items = eligible.filter(
        (item) => item.subject === subject && item.topic === topic,
      );
      const foundation = items.filter((item) => !item.companies.length);
      return {
        subject,
        topic,
        eligible: items.length,
        foundation: foundation.length,
        questions: items.filter((item) => item.type === "question").length,
        resources: items.filter((item) => item.type === "resource").length,
        difficulty: Object.fromEntries(
          ["easy", "medium", "hard"].map((difficulty) => [
            difficulty,
            items.filter((item) => item.difficulty === difficulty).length,
          ]),
        ),
        companies: Object.fromEntries(
          Object.keys(companyTemplates).map((company) => [
            company,
            {
              associated: items.filter((item) =>
                item.companies.some(
                  (association) => association.companyId === company,
                ),
              ).length,
              eligibleIncludingFoundation: items.filter(
                (item) =>
                  !item.companies.length ||
                  item.companies.some(
                    (association) => association.companyId === company,
                  ),
              ).length,
            },
          ]),
        ),
      };
    }),
  );
  return {
    templateVersion,
    rulesVersion,
    totalRecords: records.length,
    published: records.filter((record) => record.status === "published").length,
    eligible: eligible.length,
    rejected,
    topics,
    subjects: Object.keys(catalogTopics).map((subject) => ({
      subject,
      eligible: topics
        .filter((topic) => topic.subject === subject)
        .reduce((sum, topic) => sum + topic.eligible, 0),
      missingTopics: topics
        .filter((topic) => topic.subject === subject && !topic.eligible)
        .map((topic) => topic.topic),
    })),
    missingTemplateTopics: topics
      .filter((topic) => !topic.eligible)
      .map((topic) => `${topic.subject}:${topic.topic}`),
    missingFoundationTopics: topics
      .filter((topic) => !topic.foundation)
      .map((topic) => `${topic.subject}:${topic.topic}`),
    missingCompanyTopics: Object.fromEntries(
      Object.keys(companyTemplates).map((company) => [
        company,
        topics
          .filter(
            (topic) => !topic.companies[company]!.eligibleIncludingFoundation,
          )
          .map((topic) => `${topic.subject}:${topic.topic}`),
      ]),
    ),
    prerequisiteGaps: Object.entries(prerequisites).flatMap(
      ([dependent, parents]) =>
        parents
          .filter(
            (parent) =>
              !topics.find(
                (topic) => `${topic.subject}:${topic.topic}` === parent,
              )?.eligible,
          )
          .map((parent) => ({ dependent, missingPrerequisite: parent })),
    ),
    limitations: [
      "Counts describe editorial configuration, not official company syllabus coverage.",
      "Company association absence does not establish topic irrelevance; unassociated foundation material remains eligible.",
      "Per-student skill ceilings, attempts, retained prerequisites and daily capacity can further reduce usable content.",
      "No fresh task can be invented for a missing topic. Missing prerequisite content can block dependent fresh tasks. Easy-only shortages affect low-ceiling learners and easier-item adjustments.",
    ],
  };
}
