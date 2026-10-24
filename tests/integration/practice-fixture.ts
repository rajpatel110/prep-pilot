import { MongoClient } from "mongodb";
async function main() {
  const [database, operation] = process.argv.slice(2);
  if (
    !database ||
    !/^prep_pilot_student_test_[a-f0-9]{12}$/.test(database) ||
    !["inspect", "fail-revisions", "allow-revisions"].includes(operation ?? "")
  )
    throw new Error(
      "Select an exact disposable student fixture database and a supported operation.",
    );
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required.");
  const client = await new MongoClient(process.env.MONGODB_URI, {
    maxPoolSize: 1,
    serverSelectionTimeoutMS: 10000,
  }).connect();
  try {
    const db = client.db(database);
    if (operation !== "inspect") {
      await db.command({
        collMod: "revisions",
        validator:
          operation === "fail-revisions" ? { $expr: { $eq: [1, 0] } } : {},
        validationLevel: "strict",
      });
      console.log(
        operation === "fail-revisions"
          ? "Disposable revision writes deliberately rejected for browser failure testing."
          : "Disposable revision writes restored.",
      );
    }
    const attempts = await db
      .collection("attempts")
      .find(
        {},
        {
          projection: {
            submissionId: 1,
            kind: 1,
            outcome: 1,
            attemptSequence: 1,
          },
        },
      )
      .sort({ attemptSequence: -1 })
      .limit(5)
      .toArray();
    console.log(
      JSON.stringify({
        attemptCount: await db.collection("attempts").countDocuments(),
        revisionCount: await db.collection("revisions").countDocuments(),
        recent: attempts.map(
          ({ submissionId, kind, outcome, attemptSequence }) => ({
            submissionId,
            kind,
            outcome,
            attemptSequence,
          }),
        ),
      }),
    );
  } finally {
    await client.close();
  }
}
main().catch(() => {
  console.error(
    "Disposable fixture inspection failed. No credentials are logged.",
  );
  process.exitCode = 1;
});
