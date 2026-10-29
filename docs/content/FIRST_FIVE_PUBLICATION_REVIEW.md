# Authorized first-five editorial review

Final follow-up: after compatible hosted deployment and explicit authorization,
mixture and DAG were saved with 7/5-minute estimates and published at revision 4.
APTITUDE_PUBLICATION.md records actual audit and student-read evidence. All five
records covered by this review are now published. Earlier duration holds below
are retained as historical decisions under the former minimum, not current state.

Subsequent owner-approved duration policy: CONTENT_DURATION_POLICY.md documents
implemented 1–60 minute support and proposed mixture/DAG estimates of 7/5 minutes.
The 15-minute holds below describe the actual policy at publication time, not a
continuing product requirement. No shorter live values or further publications
are saved until compatible hosted/local validation is deployed. The user-run
production build for that source change passed on 27 October 2026; deployment
and short-duration compiled-app interaction checks remain pending.

27 October 2026. The owner explicitly authorized Codex to review, correct and
publish qualifying records in shared `prep_pilot_dev`. This is not a claim that
the owner personally solved, reviewed or timed them. No other catalog item or
next-batch candidate is in scope.

## Meaning of review

The API publication contract requires complete metadata and a non-future
`reviewedAt`; Database Design section 4 requires a non-null publication review
date. Neither contract restricts this field to human-only review or defines it
as a human attestation. The editor says "Review time" and "Mark reviewed now";
`publicationFields` checks date presence and publication content/attachments.
Earlier proposal documents intentionally retained pending human review because
publication was not authorized then. This session's owner authorization permits
Codex editorial checking; attribution must explicitly distinguish that checking
from human review and measured timing. No validator or policy was weakened.

## Initial saved-record snapshot

All five were read directly, read-only, from the explicitly selected shared
database at draft revision 1, with null content-review dates and no attachments.
Existing company associations have their own prior provenance-review timestamps;
preserve them unchanged. Original aptitude records have no company associations.

| Slug                             | Classification                        | Estimate | Editorial decision                                                                                 |
| -------------------------------- | ------------------------------------- | -------- | -------------------------------------------------------------------------------------------------- |
| reported-queue-via-two-stacks    | dsa / stacks_queues / medium          | 25 min   | Qualifies: implementation, trace and complexity analysis                                           |
| reported-sql-sales-join-lab      | cs / dbms / medium                    | 20 min   | Qualifies: query construction, NULL semantics and four joins                                       |
| reported-oop-four-pillars-design | cs / oop / easy                       | 20 min   | Qualifies: design sketch, four concepts and contract edge cases                                    |
| apt-original-mixture-replacement | aptitude / quantitative / medium      | 20 min   | Hold: correct capacity wording; 15-minute minimum not editorially justified by this short exercise |
| apt-original-paths-in-small-dag  | aptitude / logical_reasoning / medium | 20 min   | Hold: correct answer, but tiny enumeration does not justify the 15-minute publication minimum      |

Durations are estimates, not measurements. The three technical items plausibly
support 15–25 minutes when the requested implementation/query/design and
explanation are completed, not just reading an answer. The two aptitude tasks
have only a few short calculations/routes. No measured sub-15-minute claim is
made; instead their existing 20-minute estimates lack sufficient support to
approve publication conservatively. Do not pad prompts, inflate estimates or
lower the schema minimum. Retain null review dates while suitability is held.

## Independent executable checks

Run in a standalone Node process with only in-memory data, not study fixtures:

- Queue: specified trace gives `4,4,7,9,null`; 30 deterministic trials of 1,000
  operations each matched a reference FIFO, including negative/duplicate values,
  empty reads and interleaving. Each enqueued element transfers at most once,
  supporting amortized O(1), worst single transfer O(n), O(n) storage. Peek must
  inspect without popping; clarify that distinction in the saved explanation.
- SQL: the exact saved SELECT ran on in-memory SQLite with the stated rows and
  returned Pen `(50,2,2)`, Book `(0,1,0)`, Bag `(0,0,0)`. INNER/RIGHT/FULL unmatched
  behavior checked separately. This is semantic cross-checking, **not PostgreSQL
  execution**. PostgreSQL 18 official [join documentation](https://www.postgresql.org/docs/18/queries-table-expressions.html)
  and [aggregate documentation](https://www.postgresql.org/docs/18/functions-aggregate.html)
  independently confirm outer joins, COUNT(*) versus COUNT(expression), and SUM
  NULL behavior. No live query or table was created in PostgreSQL/MongoDB.
- OOP: an isolated test-double/checkout implementation recorded `[100]`, zero
  recorded nothing, and negative/fractional values failed before recording.
  Reviewed abstraction/encapsulation, substitutable interface implementations,
  composition versus inherited implementation. Oracle's [interface explanation](https://docs.oracle.com/javase/tutorial/java/concepts/interface.html)
  supports the contract distinction; its JDK 8 tutorial is used only for this
  stable concept, not current API/version guidance. No real payment is involved.
- Mixture: independently checked 12 → 9 → 6.75 L syrup, 16.875%, added 7.5 L,
  final 14.25/47.5 = 30%; final volume fits the proposed 50 L capacity. Adding
  5.25 L does not restore 30%. Correction must also say replace with 10 L water
  and mix each time, leaving total volume 40 L before the final addition.
- DAG: exhaustive directed path enumeration yielded exactly the three named
  routes, two visiting A and one avoiding D; adding C→D yields four, three and
  one respectively. Correctness passes; duration suitability remains held.

## Provenance check

Compared saved source descriptions with preserved contributor source lines:
queue LTM-085/134; SQL LTM-074/077 and COG-075; OOP LTM-081 and COG-016.
These are editorial adaptations of candidate-reported intent, not exact company
specifications or official company publications. Existing `student_reported`
associations must not be upgraded. Both aptitude items remain original PrepPilot
practice with no company claim. No external copyrighted question text is added.

## Completed execution and final state

Initial unverified-test-session access was correctly blocked. After the owner
authorized signing in, the existing verified owner session was used through the
hosted editor, Save changes and Confirm publish controls. Every draft was re-read
at revision 1 before editing; each save produced revision 2. No database write
was issued directly, and no role/session guard was bypassed.

| Slug                             | Actual correction                                                                                         | Final state                        |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| reported-queue-via-two-stacks    | Clarified peek versus dequeue; transparent Codex/owner-authorization attribution and actual review time   | Published, revision 3              |
| reported-sql-sales-join-lab      | Answer unchanged; documented Codex checks, their SQLite/PostgreSQL distinction and actual review time     | Published, revision 3              |
| reported-oop-four-pillars-design | Answer unchanged; documented Codex rubric checking, owner authorization and actual review time            | Published, revision 3              |
| apt-original-mixture-replacement | Explicit 50 L capacity, initial 40 L, 10 L water replacements and mixing; attribution records timing hold | Draft, revision 2; reviewedAt null |
| apt-original-paths-in-small-dag  | Correct answer unchanged; attribution records Codex enumeration and timing hold                           | Draft, revision 2; reviewedAt null |

Exact saved mixture prompt:

> A container with a capacity of at least 50 L initially holds 40 L of a well-mixed solution containing 30% syrup by volume. Remove 10 L of the mixture and replace it with 10 L of water. Mix thoroughly, then repeat this replacement once. Find the amount of syrup remaining after each replacement and the concentration after the second replacement. How much pure syrup must then be added, without removing any liquid, to restore a 30% syrup concentration? Assume volumes add.

Read-only postchecks confirmed eight audit events: five `edit_content` events
from revision 1 to 2, and three `publish_content` events from 2 to 3, each with a
request ID. Company provenance sources, student_reported labels and exact prior
association review timestamps remain unchanged. Durations/classifications were
not inflated or changed. No conflict/retry mutation was needed; a slow response
was reconciled by reading its result, not blindly resubmitting.

Actual hosted GET `/api/v1/content` returned the three newly published items,
revision 3, as available, with no prompt/explanation bodies in list summaries.
Their student detail endpoints returned available prompts at revision 3. Both
held drafts returned RESOURCE_NOT_FOUND with no body. These are the actual student
read endpoints called with the verified owner's eligible session, not a separate
student-account login or a new practice journey. No attempt, task, preference or
plan mutation was submitted. Current catalog is five published questions and two
drafts; published aptitude/resources are still missing. No other content was edited.

Focused Node checks and formatting passed. No application source changed, no
build/unrelated suite was rerun, no further batch was imported, and no commit,
push or deployment occurred. Git status could not be established because Git
reported a working-tree access error; no files were reset or discarded.
