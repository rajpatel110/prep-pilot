# Coverage release: eight prepared items

29 October 2026. The owner authorized importing and publishing qualifying items
in this exact selection. Editorial checking is by Codex; no personal owner review
or measured learner timing is claimed. The shared database is `prep_pilot_dev`.

## Follow-up: reported sparse schedule (read-only diagnosis)

On 29 October, a narrow query matching 28 October start, 30-minute budget and
27/20/20/20-minute totals identified exactly one preview and its accepted plan.
Preview `6ae1d3ebfc68fd8ce816aa7f` was created 28 October at 10:52:27 UTC,
against catalog revision 23, and confirmed at 10:54:50 UTC. Its corresponding
plan remains active. No schedule or profile was modified during inspection.

Saved and current preferences match: Cognizant, deadline 15 November,
30 minutes/day, confidence DSA 1, aptitude 5, CS 3. The old catalog supplied
six eligible items totaling 87 minutes: running totals 15, mixture 7, DAG 5,
SQL 20, missing range 20 and OOP 20. These exactly explain the reported days.
Queue via two stacks was excluded by both LTM association and medium DSA
difficulty. DSA confidence 1 permits easy items; CS confidence 3 permits medium.
All six eligible items were scheduled; the proposal has no deferred items.
The 3-minute and 10-minute residual daily slots could not hold another remaining
20-minute item. No duplication or artificial duration inflation is appropriate.

The newly published catalog has 15 items. Under these same company/difficulty
preferences, 10 qualify before personal attempt/revision/carry-over handling,
totaling 114 minutes, not a full 19-day schedule. Five are excluded:
queue (company and difficulty), bubble sort (company), duplicate values
(company), longest unique window (difficulty), weak peak (difficulty).
The four newly eligible items are the two CS resources (10 and 12 minutes),
verbal agreement (2) and page offset (3). These counts are eligibility evidence,
not a newly generated proposal or a prediction of exact replacement dates.

The accepted snapshot predates publication and is intentionally not rewritten.
There is no demonstrated scheduling defect in this observation: finite eligible
coverage, residual capacity and the old snapshot explain it. User should open
`/plans/review` as the student, choose **Review my plan**, and inspect a fresh
proposal. Generating it does not replace the active plan; acceptance remains an
explicit separate action. Personal history and carry-over can affect that result.
No new preview, practice record or plan was created by this diagnostic.

## Starting snapshot and selection

The supported read-only coverage command at 04:17:47 UTC found catalog revision
23: seven published questions, zero drafts, zero resources and six covered topics.
The first six imports are all published. None of the previously prepared next-eight
slugs had been imported. The previous recommendations were proposals, not receipts.

The new exact selection is `coverage-release-eight.v1.json`, SHA-256
`8708a33b4915fff93cee424011a91367a90e3efa7bd3614447bb0f253a7b1b82`.
It includes four company-source adaptations and four original foundation items,
including two genuine learning resources. No question was relabelled as a resource.
The old company/starter packs and their historical review fields are unchanged.

| Slug                                | Title                                                    | Classification                            | Estimated minutes | Provenance                                    |
| ----------------------------------- | -------------------------------------------------------- | ----------------------------------------- | ----------------: | --------------------------------------------- |
| reported-bubble-sort-implementation | Bubble sort with stable duplicates                       | DSA / sorting / easy question             |                25 | LTM-035, student-reported                     |
| reported-longest-unique-window      | Longest substring without repeated ASCII characters      | DSA / strings / medium question           |                30 | COG-093, student-reported                     |
| reported-weak-peak-search           | Find a weak peak by binary search                        | DSA / searching / medium question         |                25 | COG-089, student-reported                     |
| reported-duplicate-integer-values   | Repeated integer values in first-occurrence order        | DSA / hashing / easy question             |                20 | LTM-028, student-reported                     |
| cs-os-process-thread-boundaries     | Compare processes, threads and shared state              | CS / operating_systems / easy resource    |                10 | Original foundation; no company claim         |
| cs-net-http-request-response        | Read HTTP as messages, not a persistent login guarantee  | CS / networking / easy resource           |                12 | Original foundation; attributed MDN reference |
| apt-verbal-subject-agreement        | Choose the verb that agrees with the grammatical subject | Aptitude / verbal_ability / easy question |                 2 | Original foundation; no company claim         |
| cs-os-page-offset                   | Split a logical address into page and offset             | CS / operating_systems / easy question    |                 3 | Original foundation; no company claim         |

These add 127 estimated minutes. The four algorithm estimates include implementation,
traces and boundary explanations. The OS resource estimate includes drawing shared
and per-thread state and explaining synchronization; HTTP includes the relevant
linked message/state sections and an exchange sketch. The two micro-drills retain
honest 2/3-minute estimates under the deployed 1–60 whole-minute contract.
No waiting, repetition or extra question padding was added to satisfy a minimum.

## Independent editorial checks

- Bubble sort: checked all 3,280 arrays of length 0–7 over three integer values
  against sorted output, preserved input and original indices of equal keys.
  Checked the supplied pass trace, no-swap stopping and copying-space claim.
- Longest window: checked all 21,845 strings of length 0–7 over four characters,
  including a space and case distinction, against a separate brute-force oracle.
  Checked `abba`, `abcabcbb`, `aaaa`, empty input and the 2,000-character bound.
  Clarified absent last-seen indices and why the left bound cannot move backward.
- Weak peak: checked every nonempty enumerated integer array and 1,000-element
  increasing/decreasing/equal inputs. Corrected the explanation to state the
  retained-interval invariant; it must not assert both halves always contain peaks.
  Empty input remains outside this question's explicit contract.
- Duplicate integers: checked first-occurrence output against a separate counting
  oracle on all enumerated arrays. Added the discriminating example
  `[2,1,1,2] → [2,1]`, which duplicate-detection ordering gets wrong.
- OS resource: independently traced the lost update to 1 and synchronized execution
  to 2. Added why locking stores alone is insufficient and that the trace is a
  conceptual exercise, not a valid unsynchronized C/C++ data-race program.
- HTTP resource: checked the linked MDN page, request/response state distinctions,
  404 meaning and the separation of HTTPS transport protection from authorization.
  The external URL remains the prepared MDN reading; no copied exercise is claimed.
- Verbal agreement: the singular head is `list`, so the answer is `is`; the
  intervening plural noun does not control agreement. Original wording is retained.
- Paging: independently calculated page 2, offset 452, frame base 7168, physical
  address 7620. Zero-based bytes, mapping presence and access permission remain explicit.

All eight pass strict import/draft schemas. Their import review dates remain null;
the sole publication-field blocker at draft creation is `reviewedAt`. The existing
API/database contract requires an actual review date, without defining a human-only
attestation. The authenticated editor records the completed Codex review before
publication. `pending_human_review` is the import format's required historical
proposal label; it does not claim the owner personally reviewed these records.

Technical references checked on 29 October:

- [MDN: Overview of HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview)
- [MDN: 404 Not Found](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/404)
- [Linux man-pages: pthreads](https://man7.org/linux/man-pages/man7/pthreads.7.html)
- [POSIX mutex locking](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html)
- [Purdue OWL: Subject/verb agreement](https://owl.purdue.edu/owl/general_writing/grammar/subject_verb_agreement.html)
- [OSTEP: Paging, Introduction](https://pages.cs.wisc.edu/~remzi/OSTEP/vm-paging.pdf)

The company-source files and ledger contain LTM-028/035 and COG-089/093 with the
matching interview intent. Their original incomplete interview specifications are
not replaced by our editorial constraints. Provenance review occurred at
`2026-10-29T04:22:31Z`; associations remain `student_reported`, never official or
`verified`. All four originals retain empty company arrays.

## Duplicate check, dry-run and import

Read-only inspection at 04:21:46 UTC checked every current catalog record, including
all statuses. No selected slug, exact title, prompt or resource-body match was found.
Comparing complete prompts found no likely semantic duplicate: the existing array
tasks ask for running totals/missing values, not duplicate extraction or sorting;
the new grammar, paging and resources have different learning goals from current
mixture, path counting, SQL, OOP and queue work.

The supported importer dry-run returned eight `new` results. A hash check enforced
the identical eight-record file for apply, which returned eight `created_draft`
results. Explicit database/environment, shared-target confirmation and the exact
verified active owner ID/email were supplied. No all-39 import, overwrite, migration,
role change or direct catalog update was used. The importer owns transactional
creation/audits; the existing authenticated admin editor/actions own review saves
and publication with expected revisions, CSRF, validation and atomic audits.

## Publication and read receipts

All eight were saved at revision 2 after marking the completed editorial review,
then published at revision 3 using the existing authenticated admin confirmation.
There are **no unresolved drafts in this selection**. Review timestamps are real
29 October instants recorded by the editor, not a claim of personal owner review.

| Slug                                | Content ID               | Final revision | Review time UTC |
| ----------------------------------- | ------------------------ | -------------: | --------------- |
| reported-bubble-sort-implementation | 6ae2ca66aa427a1c2a0cf8c0 |              3 | 04:26           |
| reported-longest-unique-window      | 6ae2ca66aa427a1c2a0cf8c3 |              3 | 04:28           |
| reported-weak-peak-search           | 6ae2ca67aa427a1c2a0cf8c6 |              3 | 04:29           |
| reported-duplicate-integer-values   | 6ae2ca67aa427a1c2a0cf8c9 |              3 | 04:30           |
| cs-os-process-thread-boundaries     | 6ae2ca68aa427a1c2a0cf8cc |              3 | 04:31           |
| cs-net-http-request-response        | 6ae2ca68aa427a1c2a0cf8cf |              3 | 04:32           |
| apt-verbal-subject-agreement        | 6ae2ca69aa427a1c2a0cf8d2 |              3 | 04:33           |
| cs-os-page-offset                   | 6ae2ca69aa427a1c2a0cf8d5 |              3 | 04:34           |

Read-only receipt verification at 04:35:39 UTC confirmed all saved editable values
match the exact reviewed file, with only `reviewedAt` added by the editor. All
company sources, labels and provenance timestamps are preserved exactly. Each
record has three atomic audit transitions: create null→1, review edit 1→2, publish
2→3. The review edit's only changed field is `reviewedAt`. All 24 selected-record
audit events identify the authorized owner actor. The original seven records keep
their published statuses and revisions. A first receipt query ran before the last
publish response finished; the final check ran after its UI receipt and passed.

The final supported coverage command at 04:37:54 UTC reports revision 47, 15/15
eligible published items, zero drafts, 13 questions/two resources and 239 estimated
minutes over 13/17 topics. Four global DSA topics remain absent: linked lists,
trees, graphs and dynamic programming. Company-specific shortages remain as
reported in `../CATALOG_COVERAGE.md`; no unsupported associations were added.

Actual hosted `GET /api/v1/content?limit=50` returned all 15 summaries, including
the selected eight at revision 3 with correct durations/types/provenance and no
learning bodies/answers in list entries. All eight detail endpoints returned
available content and the Codex/owner authorization disclosure. This uses the
existing verified owner session through student-read endpoints, not a new shared
student fixture. An attempted owner navigation to a student page correctly routed
to Administration; the saved admin preview provides role-appropriate inspection.

## Disposable resource journey and cleanup

`tests/coverage-resource-journey.ts` reads only public fields from the two published
resources and running totals. It creates new content IDs and fixture creator values
in a randomly named disposable database; no real accounts, sessions, ownership,
audits or study history are copied. A fresh student account exercises the existing
production build `0Jz3fC5sSIhzG9AcBmLP4`, with terminal-only email-disabled/files-off
configuration and fresh test secrets. No application source changed or rebuild ran.

The passing run in `pp_resource_release_3b8443f6632c` verified three distinct tasks,
budgets no greater than 30 minutes/day, explicit acceptance, resource summaries/
details/page opening, and explicit reading completion of both resources. Dashboard
and Progress show readingCompleted=2, completed=2/3, distinctAttempted=0,
currentlySolved=0 and submissions=0; revisions and stored attempts remain empty.
The exact database was removed, its absence checked, and owned server PID 20180
stopped. Shared database writes were limited to the authorized eight catalog items
and their required guards/audits.

Two earlier isolated runs stopped at a test-harness error: it requested list limit
100, while the documented maximum is 50. The application correctly rejected the
query. After correcting only that test parameter, the connected journey passed.
Both failed-run databases (`pp_resource_release_41980edeef1e` and
`pp_resource_release_5cbade8d1d30`) also reported exact database/server cleanup.
An independent read-only reconciliation confirmed all three exact disposable
database names absent and port 3154 unreachable.
This is not a product defect or a reason to weaken pagination validation.

Focused schema/answer checks, ESLint, TypeScript and changed-file formatting passed.
No unrelated suite, provider delivery, migration against the shared database,
real role change, commit, push, deployment or EPERM investigation occurred.
