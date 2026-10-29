# Company batch v1: preparation and draft import

## Review artifacts

29 October coverage release: four further company adaptations (bubble sort,
longest unique window, weak peak and duplicate values) are published at revision 3,
alongside two original resources and two short original questions selected from
the starter pack. `COVERAGE_RELEASE_EIGHT.md` records Codex editorial checking,
owner authorization, exact-selection dry-run/import, 24 atomic audit events and
student-read/resource-journey evidence. The other prepared next-batch items were
not imported. Older statements about no next batch below are historical.

Final first-six checkpoint: all six imported records are published. Mixture and
DAG were saved at 7/5 estimated minutes and published at revision 4 after the
compatible hosted duration release. See APTITUDE_PUBLICATION.md. No next batch
was imported. Earlier five-draft/timing-hold notes below are historical.

27 October authorized publication update: queue, SQL and OOP are now published
at revision 3 after Codex editorial checks and owner authorization. Mixture
capacity was corrected, but mixture and DAG remain drafts at revision 2 on
duration-suitability holds, with null review dates. See
FIRST_FIVE_PUBLICATION_REVIEW.md for actual checks, audit and student-read evidence.
The earlier read-only snapshots below are historical; no next batch was imported.

27 October read-only catalog refresh confirms one published first-six item
(missing-range, revision 3), five drafts (revision 1), and none of the next eight
slugs imported. See FIRST_BATCH_STUDENT_WALKTHROUGH.md. Finish those five reviews
before another import. MIXTURE_EDITORIAL_CORRECTION.md is a proposed manual edit,
not a replacement import or human approval; original batch files stay unchanged.

26 October follow-up: user reports six imported, missing-range-member published
at revision 3 and student practice passed. Interrupted-task read-only inspection
confirmed that revision and five remaining drafts. REVIEW_REMAINING_FIVE.md guides
review; NEXT_COMPANY_DRAFT_BATCH.md covers eight not-yet-imported candidates.

- `company-ltm-sources.md`: 144 original source entries.
- `company-cognizant-sources.md`: 102 original source entries.
- `company-source-ledger.v1.json`: every one of the 246 references classified,
  including 38 repeat references consolidated into their canonical interview
  intent (208 canonical source intents). Source wording is never deleted.
- `company-batch.v1.json`: 39 complete proposed question records: 19 company
  adaptations and 20 original aptitude sets. This proposal pack does not reflect
  subsequent live review/publication state.
- `COMPANY_BATCH_REVIEW.md`: exact prompts, answers, fields and concerns for review.

Provenance: **Candidate-reported interview question, confirmed by the contributor;
not an official company publication.** No interview year, hiring track, frequency,
official endorsement or syllabus is inferred. The two source lists deliberately
exclude chat sender names and messaging dates.

The ledger's canonical source means equivalent interview intent, not a complete
shared specification. Related components of a cohesive set retain distinct IDs:
highest/second-highest salary, counting/repeated characters, and SQL join variants
are not falsely collapsed as identical questions. First-N palindromes and
inclusive-range palindromes remain separate; ambiguous string/numeric palindrome
wording remains unresolved rather than merged.

## Coverage and gaps

| Subject             | Questions | Easy | Medium | Topics                                                                  |
| ------------------- | --------: | ---: | -----: | ----------------------------------------------------------------------- |
| DSA                 |        12 |    9 |      3 | arrays 2; strings 5; hashing 2; sorting 1; searching 1; stacks_queues 1 |
| CS                  |         7 |    4 |      3 | dbms 5; operating_systems 1; oop 1                                      |
| Aptitude (original) |        20 |    7 |     13 | quantitative 7; logical_reasoning 7; verbal_ability 6                   |

All are `question`; none is hard. Intended association counts overlap: LTM 13,
Cognizant 10, including 4 dual-company adaptations. Original aptitude has no
company association or PYQ claim. JSON company arrays remain empty until a human
actually reviews provenance; import materializes `student_reported` entries only
with an explicitly supplied real review time. Content `reviewedAt` stays null.

Classification of all source entries (including repeat references): DSA 39;
CS 41; HR/project 72; language/framework/AI/tooling/outside-taxonomy 84;
incomplete/ambiguous 10. Adaptations use 30 source references. Remaining supported
sources are editorial backlog, not silently represented as complete records.
The ledger's CS bucket denotes a broad CS interview family, not proof of a
supported canonical topic or publication readiness.

Incomplete examples: LTM-048 (missing comparison target), LTM-042/043 (no exact
pattern), LTM-047 (unspecified language/vector contract), LTM-033/COG-083
(palindrome variants), COG-094 (no broken code), COG-095/096/097 (no actual
problem/sequence/puzzle). Ask the contributor for specifics. Language/framework,
AI, communications, personal HR/project and tooling material needs separate
approved product scope, not new topics invented in this milestone.

Standalone factorial, parity, swapping, maximum-of-three, short SQL updates and
other micro-questions are held for honest timing/cohesive-set review. Existing
starter packs already cover all ten DSA topics; the new company variants add
specific contracts. **Zero additional original DSA questions** are added merely
to reach a quota. Linked lists, trees, graphs and DP remain in the existing pack,
not claimed as new company evidence. Related old palindrome/frequency/binary
search candidates need editorial comparison before publishing both versions.

Arrays foundations are present for the existing arrays→sorting/searching
prerequisites. No prerequisite mastery is inferred from self-assessment. Missing
published content and unanswered prerequisites can still produce shortages.
Nothing here changes the foundation allocation, planner eligibility or tie-breaks.
Candidate counts are not live usable catalog capacity. Shared-catalog slug and
semantic duplicate checking remains pending; no real account was selected for a
shared read/import in this task. The known running-totals slug is not included.

Existing library/company filters include shared foundations alongside matching
company associations. These labels inform discovery and the existing planner;
absence of an associated question does not remove foundation topics or establish
that a company never asks them. No frontend/backend company configuration changed.

## Review and technical evidence

All examples, constraints, solutions and study estimates are editorial additions.
Contributor confirmation covers interview provenance only. Difficulty and
15–30 minute estimates are uncalibrated novice study-set proposals; hold any
item that proves too short rather than padding it. Human publication approval
and actual timing are pending for every record.

Focused checks: strict current draft schema, canonical topics, source accounting,
publication blocked only by null content-review dates, company-review gating,
worked coding outputs/edge cases, quantitative arithmetic and logical enumeration.
SQL examples are evaluated with Node's built-in SQLite for overlapping query
semantics; **not** a PostgreSQL execution claim. Verbal answers are exemplar
rubrics allowing equivalent accurate responses, not machine-graded single wording.

Primary pages opened on 26 October 2026 to check explanations (links, not copied
question banks; these are supporting references, not original company sources):

- [PostgreSQL window functions](https://www.postgresql.org/docs/current/functions-window.html)
- [PostgreSQL aggregates](https://www.postgresql.org/docs/current/functions-aggregate.html)
- [PostgreSQL joins/grouping](https://www.postgresql.org/docs/current/queries-table-expressions.html)
- [PostgreSQL multicolumn indexes](https://www.postgresql.org/docs/current/indexes-multicolumn.html)
- [Oracle deadlock tutorial](https://docs.oracle.com/javase/tutorial/essential/concurrency/deadlock.html)
  (legacy JDK8 example used for lock-cycle concept only, not modern API guidance).

## Import contract

`npm.cmd run content:import -- ...` defaults to **read-only dry-run**. Requires an
explicit database/environment, exact existing verified active admin/owner ID and
email, and existing migrations/indexes. It never provisions roles or runs setup.
Connection `dbName` is the explicit CLI target, not the URI's default database.
Shared `prep_pilot_dev` requires `HOSTED_DATABASE_CONFIRMATION=prep_pilot_dev`;
test mode refuses that database. No sessions/accounts/catalog are copied.

The wrapper accepts only strict pending-review candidates; client status,
revisions, ownership, seed identity, prefilled review/association fields and
nonempty attachments are rejected. Company labels require
`--association-reviewed-at` with the genuine human provenance-review instant.
**Do not use the current date merely to satisfy validation.** That date is not
content review; imported draft content-review dates remain null.

Each new item uses catalog→profile→content/audit transaction order and the same
shared draft writer as the HTTP authoring service. Content revision starts at 1;
catalog and acting profile each advance once; one create audit is inserted.
An audit failure rolls back that item's writes. There are no provider calls.

Identical editable fields under an existing slug yield `identical` and zero
writes. Changed records yield `conflict`; matching title or prompt under another
slug yields `possible_duplicate`. No overwrite, publish, delete or auto-merge.
Checks cannot detect all semantic duplicates. Concurrent collisions reconcile
against committed records. Different association review dates are differences:
retain the same genuinely recorded date for retries. An administrator's later
edit/review can intentionally turn an old import retry into a conflict.

The batch is **not** one all-or-nothing transaction: successful earlier drafts
may remain if a later item fails or the process stops. Per-item report and
idempotent reruns are the recovery path; unknown commit results are not claimed
as failure-free or retried into overwrites. Exit 0 means new/identical/created
only; exit 2 requires reviewing reported conflicts/gates; exit 1 means validation,
configuration, connection or operator failure. Domain failures stop further
creates and report `failed_*` (exit 2). No raw provider errors or credentials log.

## Later shared import — operator performs this, not run now

1. Review the sheet. Confirm provenance separately and record its actual UTC
   review instant. Compare existing catalog questions before importing duplicates.
2. In the signed-in admin account, inspect `/api/v1/me` for the exact existing
   verified administrator ID/email; do not assume a historical account ID.
3. Use the already configured local URI to the intentionally shared database.
   Do not paste credentials, passwords or token-bearing links into chat.
4. Replace the three placeholders below; dry-run first. Keep the same provenance
   date for subsequent retries. No new migration is introduced by this milestone.

```bash
cd /c/PROJECTS/prep-pilot
export PATH="$PWD/.tools/node_modules/node/bin:$PATH"
unset NODE_OPTIONS
export HOSTED_DATABASE_CONFIRMATION=prep_pilot_dev
ADMIN_ID='REPLACE_WITH_EXISTING_VERIFIED_ADMIN_ID'
ADMIN_EMAIL='REPLACE_WITH_THAT_ACCOUNTS_EMAIL'
PROVENANCE_REVIEWED_AT='REPLACE_WITH_ACTUAL_PROVENANCE_REVIEW_UTC_ISO'
NODE_ENV=development npm.cmd run content:import -- --file docs/content/company-batch.v1.json --database prep_pilot_dev --environment development --admin-user-id "$ADMIN_ID" --admin-email "$ADMIN_EMAIL" --association-reviewed-at "$PROVENANCE_REVIEWED_AT"
```

Only after checking the report and deciding to import these drafts:

```bash
NODE_ENV=development npm.cmd run content:import -- --file docs/content/company-batch.v1.json --database prep_pilot_dev --environment development --admin-user-id "$ADMIN_ID" --admin-email "$ADMIN_EMAIL" --association-reviewed-at "$PROVENANCE_REVIEWED_AT" --apply
unset HOSTED_DATABASE_CONFIRMATION ADMIN_ID ADMIN_EMAIL PROVENANCE_REVIEWED_AT
```

These commands intentionally affect the shared hosted catalog only if you run
apply. They create drafts invisible to students, not a content release.

## Existing admin review workflow

Open `/admin/content`, filter Draft, search the stable slug/title, open Edit and
compare every field against the review sheet. Try examples independently; check
duration/difficulty, company provenance and safe preview. Resolve any concern,
record the actual content-review date in the existing form, save, inspect the
saved preview and only then explicitly Publish. Never use an automatic review
date as a substitute for reading the material. Start with missing-range-member,
sales-join-lab and mixture-replacement; no approval is presumed here.
