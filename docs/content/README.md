# Starter catalog v1 — review only

Current catalog/release evidence is in [COVERAGE_RELEASE_EIGHT.md](COVERAGE_RELEASE_EIGHT.md)
and [the coverage assessment](../CATALOG_COVERAGE.md). The proposal history below
does not describe the current live publication count. Do not reimport published
items from historical source packs. The next-release sheet remains separate,
unreviewed preparation, not authorization for another release.

Prepared 25 October 2026 (Asia/Kolkata). **Nothing in this pack has been inserted,
published or human-reviewed.** All proposed `reviewedAt` values are null. AI-assisted
authoring and an agent's solution checks are not editorial sign-off.

## Editorial gate — read before using the JSON

For the next small review session, use [the 10-candidate release sheet](NEXT_RELEASE_REVIEW.md).
It excludes running totals and timing holds, covers six DSA and all four CS
topics, and leaves aptitude absent rather than padding the held questions.
This is a review shortlist, not an approved or published release.

The [first-batch approval sheet](FIRST_BATCH_APPROVAL.md) supersedes the initial
blanket timing recommendation. It contains all 29 full items, provisional timing,
source checks and per-item decisions: **14 candidates for owner review and 15 timing
holds; zero approvals**. Do not enter/publish held items using their rejected nominal
JSON duration. Their actual effort appears below the schema minimum; resolve that
editorially, not by padding time or changing validators. JSON schema validity is
not editorial suitability. All review dates remain null.

## Requirements and files

PRD v2 section 6 explicitly requires **50 items: 20 DSA, 15 aptitude, 15 CS**,
including all four CS topics. Those counts are not a new allocation proposal.
The topic-level allocation is editorial: two per DSA topic, five per aptitude
topic, and DBMS/OS/networking four each plus OOP three. Existing canonical IDs,
company templates, prerequisite edges, difficulty ceilings, 50/25/25 minute
allocation, priorities and tie-breaking are unchanged.

- [DSA review](dsa-review.md): 20 items, all ten canonical DSA topics.
- [Aptitude review](aptitude-review.md): 15 items, five per canonical topic.
- [CS review](cs-review.md): 15 items, all four canonical CS topics.
- [Exact DraftInput companion](starter-catalog.v1.json): 50 strict schema-aligned
  proposed create bodies, not a database dump or seed/import command.
- [Recommended first batch](first-publication-batch.v1.json): ordered review list
  of 29 slugs, not permission to publish.
- [Coverage and validation](VALIDATION.md): actual local outcomes and limitations.
- [Solution review ledger](SOLUTION_CHECKS.md): per-item checks and human review gaps.
- [Read-only validator](validate-starter.ts): uses existing schemas/publication
  rules and pure planner, never database connections or environment credentials.

The JSON is authoritative for exact values. Each Markdown item reproduces its
fields and separates the learner prompt/body from the hidden explanation. Metadata,
the sign-off checklist and review ledger must not be pasted into learning bodies.
There are no client-controlled status, revision, ownership, audit or seedKey fields.
The application assigns persistence fields; files remain `assetIds: []`.

Questions use original PrepPilot wording, examples and solutions about standard
concepts. They are not attributed to an invented external author or company.
Resource notes include their own short learning activity rather than a bare link.
Duration includes reading, independent work, edge-case tests and explanation:
The original coding estimates vary from 15 to 30 minutes in the first batch.
The current approved duration contract is 1–60 whole minutes per item, separate
from the daily budget. Short useful questions need not be padded to 15 minutes.
Historical minimum-duration holds in older review sheets are not current policy;
reassess estimates honestly after the updated application is deployed, without
automatically changing frozen source/import packs or live records. See
CONTENT_DURATION_POLICY.md for the staged rollout and the two aptitude proposals.
All remaining estimates are proposed budgets, not measured completion times.

## Source checks

The agent opened the actual six pages below on 25 October 2026. Inspection confirms
topic relevance and visible page content, **not** ownership, company provenance,
future availability, successful judge submission, absence of login requirements
or human approval. Reopen at editorial review; providers may change URLs/content.
No question-bank text, editorial solution or sample was copied into this pack.

| Proposed item                    | Inspected page                                                                                        | Scope supported                                                                                                                                       |
| -------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| dsa-strings-indexing-and-unicode | [MDN String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) | UTF-16 units, code-point iteration and immutability; original tracing exercise.                                                                       |
| dsa-sorting-stable-keys          | [Python Sorting Techniques](https://docs.python.org/3/howto/sorting.html)                             | Key sorting, new versus in-place lists and equal-key stability; independently written records/example.                                                |
| cs-dbms-transaction-boundaries   | [PostgreSQL Transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html)         | Transaction grouping, commit/rollback; original inventory example, not the source's worked example.                                                   |
| cs-net-http-request-response     | [MDN HTTP overview](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview)                | Message structure and stateless semantics with application sessions. The older /Overview URL redirects here.                                          |
| dsa-hashing-complement-pair      | [LeetCode Two Sum](https://leetcode.com/problems/two-sum/description/)                                | Related complement-pair practice. PrepPilot's own variant permits no solution and empty inputs; use the provider's constraints when submitting there. |
| dsa-searching-binary-exact-index | [LeetCode Binary Search](https://leetcode.com/problems/binary-search/description/)                    | Related ascending exact-match logarithmic search. PrepPilot additionally specifies empty input; provider constraints differ.                          |

The four resource URLs are references, not evidence that visiting them completes a
task. The two question URLs are optional related external practice, not copies of
the original PrepPilot variants. An external judge may require its own account;
PrepPilot does not execute or automatically grade code. Other DSA exercises are
self-contained code/pseudocode practice. The current publication validator permits
that format. If the owner wants **every** DSA question to have a matched external
judge (beyond the PRD's external-practice path), curate/inspect more links separately;
do not invent destinations or describe a reading reference as a judge problem.

## Recommended first publication batch — only after review

Review the 29 slugs in `first-publication-batch.v1.json` first. They contain one
easy question for every DSA topic, nine easy aptitude questions (three per topic)
and ten easy CS items, including all four CS topics. Proposed study minutes are
DSA 225, aptitude 135, CS 150: 510 nominal total after correcting coding estimates.
Those totals include 15 timing-held proposals and are not an approved capacity or
balanced allocation claim. The 14 remaining candidates total 270 proposed minutes,
but omit aptitude and sorting coverage; the full first batch cannot be approved as-is.
The pure planner structurally fits all 29 into a hypothetical 7-day, 90-minute/day window at
the beginner ceiling, with no practice history or fabricated prerequisite mastery.
Shorter budgets select a subset. Arrays must be entered/reviewed before sorting
and searching as a practical authoring order; the engine still enforces its own
scheduled prerequisite, independent of publication order.

For a smaller initial review session, take the first ten DSA slugs, one aptitude
item per topic and one CS resource per topic (17 topic-covering items), then finish
the balanced 29. That smaller subset is not claimed to match the minute allocation
or fill a full schedule. Resolve the first-batch holds before publication; review the remaining 21 separately. They add
worked medium questions and focused resource notes, not superficial duplicates.

## Decisions/material needed from the owner

1. Confirm or revise the proposed difficulty/time labels after attempting a sample
   yourself. All 38 easy and 12 medium labels are editorial; no hard-item coverage
   or calibrated learning-effectiveness claim is made.
2. Check every prompt/answer against SOLUTION_CHECKS, particularly the deliberately
   underdetermined four-day assignment (two solutions, not a unique timetable),
   empty-route staircase convention, edge-count tree height and ambiguous pronouns.
3. Supply Cognizant/LTM source materials separately with origin, date, permission to
   reuse/link and whether association is verified or student-reported. All 50 have
   `companies: []`; no generic exercise is company-branded. Unsupported reported
   claims must not be upgraded to verified associations. Source material may replace
   a proposed unpublished item only after preserving the required count/topic mix.
4. Reopen all six external pages and decide whether their constraints, account needs
   and language-specific scope are suitable for the pilot. Approve any additional
   matched DSA external-practice sources before adding them.
5. Approve attribution and final wording, then record actual review time yourself.
   Do not bulk-set a review date just to make publication validation pass.

## Enter and publish through the existing admin workflow

These are instructions for a later, explicitly authorized editorial session. No
catalog writes were performed while preparing this pack.

1. Sign in with an already provisioned admin account; open `/admin/content`, then
   **Create draft** (`/admin/content/new`). Do not create another admin or share
   credentials. Check the intended development/production environment first.
2. Copy one JSON entry's fields into the form. Subject/topic/type/difficulty must
   use the exact enums/IDs. Enter `estimatedMinutes` as the integer shown, comma
   separate tags, leave companies/attachments empty, and leave review time blank
   until the actual review. Omit absent prompt/body/URL fields. Do not paste JSON
   arrays into unrelated text inputs or supply status/revision/ownership fields.
3. Save draft. Record its returned ID, slug and revision privately in your editorial
   workflow; this pack does not assign database IDs. On ambiguous network failure,
   search the slug and compare the saved item before creating again. Never blindly
   retry creation or overwrite a changed revision.
4. Open **Admin preview** for the saved item. Compare prompt/body against this pack,
   reveal and verify the explanation, check links separately, and test desktop,
   keyboard and mobile reading. A preview must not count as a student attempt.
5. After genuine review/corrections, update any pending-review wording in attribution
   honestly while retaining the AI-assisted authorship disclosure. Use **Mark reviewed now** (or the actual local
   review timestamp), save, refetch if necessary, then **Publish** and explicitly
   confirm. Keep the reviewed slug stable thereafter. The server guards the revision,
   checks publication rules and writes audit/catalog changes transactionally.
6. Verify the item as a student in `/content`; answers must not leak in list cards.
   Resource visits are not question outcomes or automatic task completion. Review
   a new plan preview explicitly; publication does not rewrite saved plans.
7. If material becomes incorrect, archive with a reason rather than deleting it.
   Historical references survive; reopen as a draft for correction when appropriate.

## Repeat local validation (Git Bash)

```bash
cd /c/PROJECTS/prep-pilot
export PATH="$PWD/.tools/node_modules/node/bin:$PATH"
node --import tsx docs/content/validate-starter.ts
```

No `.env.local`, database, migrations, seed writes, dependencies, compilation or
external service changes are needed for this command. Hypothetical publication
checks supply an old valid date **only in memory**; they never change the null dates
in the pack. Planner IDs and dates are synthetic and do not predict actual ObjectId
tie order or real students' schedules. Do not use the validator as an import tool.
