# Proposed starter coverage and validation

Agent-run local checks, 25 October 2026. This assesses **proposals**, not records in
development/production. No database target, credentials, migration, seed or catalog
write was used. The existing CATALOG_COVERAGE.md remains a dated observation of the
real catalog; it was not refreshed or overwritten. All 50 publication dates remain
null and all editorial decisions remain pending.

## Editorial disposition after first-batch review

See [FIRST_BATCH_APPROVAL.md](FIRST_BATCH_APPROVAL.md). Of the selected 29, 14 are
candidates for owner review and **15 are timing-held**, not publication-ready.
Eight coding estimates were reduced; the sorting trace and 14 short recall/drill
questions were not padded to the 15-minute minimum. Nominal JSON times for held
items are retained solely to preserve the rejected proposal and schema alignment;
do not use them as approved admin-entry values. No review date or company label
changed. The counts and hypothetical planner scenarios below include these held
proposals; they are structural coverage, not approved learning capacity.

## Proposed counts

| Subject  | Items | Easy | Medium | Hard | Questions | Resources | Study minutes |
| -------- | ----- | ---- | ------ | ---- | --------- | --------- | ------------- |
| dsa      | 20    | 15   | 5      | 0    | 15        | 5         | 450           |
| aptitude | 15    | 12   | 3      | 0    | 15        | 0         | 270           |
| cs       | 15    | 11   | 4      | 0    | 11        | 4         | 285           |
| Total    | 50    | 38   | 12     | 0    | 41        | 9         | 1005          |

| Subject  | Canonical topic     | Items | Easy / medium | Question / resource |
| -------- | ------------------- | ----- | ------------- | ------------------- |
| dsa      | arrays              | 2     | 1 / 1         | 2 / 0               |
| dsa      | strings             | 2     | 2 / 0         | 1 / 1               |
| dsa      | hashing             | 2     | 1 / 1         | 2 / 0               |
| dsa      | sorting             | 2     | 2 / 0         | 1 / 1               |
| dsa      | searching           | 2     | 1 / 1         | 2 / 0               |
| dsa      | linked_lists        | 2     | 2 / 0         | 1 / 1               |
| dsa      | stacks_queues       | 2     | 2 / 0         | 1 / 1               |
| dsa      | trees               | 2     | 1 / 1         | 2 / 0               |
| dsa      | graphs              | 2     | 2 / 0         | 1 / 1               |
| dsa      | dynamic_programming | 2     | 1 / 1         | 2 / 0               |
| aptitude | quantitative        | 5     | 4 / 1         | 5 / 0               |
| aptitude | logical_reasoning   | 5     | 4 / 1         | 5 / 0               |
| aptitude | verbal_ability      | 5     | 4 / 1         | 5 / 0               |
| cs       | dbms                | 4     | 3 / 1         | 3 / 1               |
| cs       | operating_systems   | 4     | 3 / 1         | 3 / 1               |
| cs       | networking          | 4     | 3 / 1         | 3 / 1               |
| cs       | oop                 | 3     | 2 / 1         | 2 / 1               |

All 17 canonical topics have easy material. Existing edges arrays→sorting and
arrays→searching have an easy arrays question available in the proposal. No new
topics or prerequisite edges were introduced. No self-rating or missing practice
history was interpreted as mastery. Removing arrays in the pure fixture blocks
all four sorting/searching items with PREREQUISITE_UNAVAILABLE.

## Structural checks and honest publication gates

- 50/50 pass the exact current `draftInputSchema` and synthetic
  `storedContentSchema`; no duplicate proposed slugs, unknown topic/enum, privileged
  field, oversize text/request or attachment errors. Unknown fields remain rejected
  by the existing strict validator; no validator was relaxed.
- Markdown companion fields are compared with the JSON to catch copy drift.
- All 41 question prompts have explanations; all nine resources have useful bodies.
  Six external destinations were opened/inspected; their per-item log is in README.
- **50/50 currently fail publication solely on `reviewedAt`**, intentionally.
  An old valid review timestamp is supplied to clones only in process memory to
  confirm there are no other publication-rule blockers. It is not a review event,
  permission to publish, a persisted change or proof that editorial quality passes.
- Empty `companies` and `assetIds` arrays are deliberate. No company provenance,
  ready file, status/revision or acting admin is fabricated. All-draft/unavailable
  planner material produces zero tasks in the negative check.
- 38 independent numeric/algorithm assertions passed; the 50-row solution ledger
  separates executable examples from agent conceptual/language review. Human
  proofreading, source suitability and duration calibration remain pending.

## Pure planner checks

Actual calls use current `generatePlan`, rules `deterministic-budget-2` and template
`editorial-foundations-1-83b9d146d8912968`. No scheduling code changed. Fixed fixture
date: 2026-10-25, no active plan, no previous attempts or revisions. Availability is
**hypothetically published after review**, not a change to real catalog records.

All twelve scenarios were deterministic under reversed material input order,
respected original task durations, stayed within date/day budgets, had no duplicate
fresh IDs and scheduled prerequisites no later than dependent work. Cognizant-only,
LTM-only and both-company selections produced the same tasks because every item is
shared foundation. This does not prove any company-specific question coverage.

| Days | Minutes/day | Uniform skill | Tasks | Scheduled minutes | Unused budget | Capacity-deferred items | DSA / aptitude / CS minutes |
| ---- | ----------- | ------------- | ----- | ----------------- | ------------- | ----------------------- | --------------------------- |
| 7    | 30          | 1             | 12    | 200               | 10            | 26                      | 95 / 60 / 45                |
| 7    | 30          | 3             | 11    | 200               | 10            | 39                      | 95 / 60 / 45                |
| 7    | 60          | 1             | 23    | 390               | 30            | 15                      | 195 / 105 / 90              |
| 7    | 60          | 3             | 21    | 400               | 20            | 29                      | 190 / 105 / 105             |
| 7    | 240         | 1             | 38    | 645               | 1035          | 0                       | 300 / 180 / 165             |
| 7    | 240         | 3             | 50    | 1005              | 675           | 0                       | 450 / 270 / 285             |
| 30   | 30          | 1             | 38    | 645               | 255           | 0                       | 300 / 180 / 165             |
| 30   | 30          | 3             | 43    | 855               | 45            | 7                       | 420 / 225 / 210             |
| 30   | 60          | 1             | 38    | 645               | 1155          | 0                       | 300 / 180 / 165             |
| 30   | 60          | 3             | 50    | 1005              | 795           | 0                       | 450 / 270 / 285             |
| 30   | 240         | 1             | 38    | 645               | 6555          | 0                       | 300 / 180 / 165             |
| 30   | 240         | 3             | 50    | 1005              | 6195          | 0                       | 450 / 270 / 285             |

Skill 1 permits easy only (38 items / 645 nominal minutes). Skill 3 permits medium as well
(50 / 1005). Skills 2/4/5 and mixed subject ratings were not separately tested in
this content-only pass; no new difficulty-ceiling behavior is claimed. The 29-item
recommended easy batch fits a 7-day, 90-minute/day scenario: 510 nominal minutes, all topics,
zero deferrals. This is a hypothetical feasibility check, not production acceptance.
Actual ObjectId ordering, history, due recalls and preferences can alter selection.

## Remaining shortages and decisions

- **Company-specific:** zero supported associations for Cognizant and LTM. Supply
  the owner's attributable materials for separate review; never relabel generic
  practice just to fill that gap. Foundations remain eligible under both templates.
- **Depth:** two DSA items per topic are a starter, not interview-complete coverage.
  Many DSA topics have only one question; the second item is a reading resource.
  Resources cannot supply practice outcomes. Three _distinct_ questions per topic
  and a broad easier-substitute pool are not present. Deliberate repeated attempts
  are possible, but this pack does not claim a rich adaptation demonstration.
- **Easier alternatives:** no difficulty exists below easy. Even in a medium/easy
  pair, the easy item may already be attempted/consumed and thus ineligible as fresh
  support; the existing revision/limitation behavior must remain honest.
- **Capacity:** 16 hours 45 minutes nominal total (10 hours 45 minutes at the beginner ceiling) cannot fill 30 days of
  four hours/day without new content. Unused time is reported, never filled with
  invented repeats or shortened estimates. Due revisions may add future work;
  none were assumed merely to make these fresh-only tables look fuller.
- **External DSA:** only two original question variants have inspected related
  judge links. Other DSA material is self-contained code/pseudocode; clarify whether
  the pilot wants a matched judge destination for every question. No code runner,
  provider account flow or judge submission was verified.
- **Review:** proposed time/difficulty labels, conceptual/grammar answers, six links,
  rights/attribution and final wording need human approval before any review date
  or publication action. Current schema acceptance alone does not satisfy that gate.

## Check boundary

No Next compilation, server, production regression, database test or browser journey
was required for static catalog preparation. Existing application verification is
reused; the EPERM investigation stays paused. Repeat the local command in README
after any editorial change and inspect the resulting JSON report. Build status for
the application is not inferred from these content checks.
