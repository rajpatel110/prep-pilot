import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { MongoClient } from "mongodb";
import { databaseTarget } from "../../scripts/database-target";
import { prepareImport } from "../../src/modules/catalog/import-schema";

async function main() {
  const target = databaseTarget(process.argv.slice(2), process.env);
  assert.equal(target.database, "prep_pilot_dev");
  const batch = JSON.parse(
    await readFile("docs/content/coverage-release-eight.v1.json", "utf8"),
  );
  const prepared = prepareImport(batch, "2026-10-29T04:22:31Z");
  const client = new MongoClient(target.uri, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 15000,
    maxPoolSize: 1,
  });
  try {
    await client.connect();
    const database = client.db(target.database);
    const results = [];
    for (const { slug, values } of prepared) {
      const item = await database.collection("contentItems").findOne({ slug });
      assert.ok(item);
      assert.equal(item.status, "published");
      assert.equal(item.revision, 3);
      assert.ok(
        item.reviewedAt instanceof Date &&
          item.reviewedAt.getTime() <= Date.now(),
      );
      for (const [field, value] of Object.entries(values)) {
        if (field !== "reviewedAt")
          assert.deepEqual(item[field], value, `${slug}: ${field} changed`);
      }
      const audit = await database
        .collection("adminAudit")
        .find({ entityType: "content", entityId: String(item._id) })
        .sort({ newRevision: 1 })
        .toArray();
      assert.equal(audit.length, 3);
      assert.deepEqual(
        audit.map((entry) => [
          entry.action,
          entry.priorRevision,
          entry.newRevision,
        ]),
        [
          ["create_content", null, 1],
          ["edit_content", 1, 2],
          ["publish_content", 2, 3],
        ],
      );
      assert.ok(
        audit.every(
          (entry) => entry.actorUserId === "6add2b2321b86687febca6ac",
        ),
      );
      assert.deepEqual(audit[1]!.changedFields, ["reviewedAt"]);
      results.push({
        id: String(item._id),
        slug,
        status: item.status,
        revision: item.revision,
        estimatedMinutes: item.estimatedMinutes,
        type: item.type,
        reviewedAt: item.reviewedAt.toISOString(),
        auditTransitions: 3,
      });
    }
    const originalRevisions = new Map([
      ["dsa-arrays-running-totals", 3],
      ["reported-missing-range-member", 3],
      ["reported-queue-via-two-stacks", 3],
      ["reported-sql-sales-join-lab", 3],
      ["reported-oop-four-pillars-design", 3],
      ["apt-original-mixture-replacement", 4],
      ["apt-original-paths-in-small-dag", 4],
    ]);
    for (const [slug, revision] of originalRevisions) {
      const original = await database
        .collection("contentItems")
        .findOne({ slug }, { projection: { revision: 1, status: 1 } });
      assert.equal(original?.revision, revision);
      assert.equal(original?.status, "published");
    }
    const records = await database
      .collection("contentItems")
      .find(
        {},
        {
          projection: {
            status: 1,
            subject: 1,
            topic: 1,
            type: 1,
            estimatedMinutes: 1,
          },
        },
      )
      .toArray();
    const published = records.filter((item) => item.status === "published");
    const state = await database
      .collection("catalogState")
      .findOne({ _id: "catalog" as never });
    console.log(
      JSON.stringify(
        {
          database: target.database,
          asOf: new Date().toISOString(),
          catalogRevision: state?.revision,
          records: records.length,
          published: published.length,
          resources: published.filter((item) => item.type === "resource")
            .length,
          coveredTopics: [
            ...new Set(
              published.map((item) => `${item.subject}:${item.topic}`),
            ),
          ].sort(),
          estimatedMinutes: published.reduce(
            (sum, item) => sum + item.estimatedMinutes,
            0,
          ),
          results,
          originalSevenRevisionsUnchanged: true,
        },
        null,
        2,
      ),
    );
  } finally {
    await client.close();
  }
}
main().catch((error) => {
  console.error(
    error instanceof assert.AssertionError
      ? `Publication verification failed: ${error.message}; no raw records logged.`
      : "Read-only publication verification unavailable; details withheld.",
  );
  process.exitCode = 1;
});
