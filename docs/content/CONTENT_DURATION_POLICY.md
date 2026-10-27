# Honest content durations and rollout

27 October 2026: owner-approved policy is **1–60 positive whole minutes** per
content item, including fresh/revision tasks and deferred work. Zero, negative,
fractional, nonnumeric and over-60 inputs are invalid. Daily-budget preferences
remain **30–240 minutes in 15-minute steps**. They do not impose a task quantum.

Verification checkpoint: 56 focused/relevant agent-run tests plus formatting,
lint and type checking passed. The user supplied a successful current production
build on 27 October 2026 (compilation, TypeScript, all 21 static pages and final
optimization completed). The agent then reused that build for focused HTTP and
browser verification with a disposable database: short admin saves, invalid input
rejection, exact student-card estimates and a 14/30-minute UI preview passed.
Fixture cleanup completed; no shared drafts or estimates changed. This does not
claim a successful Codex build or hosted deployment.

Repeat only the focused compiled checks when needed, without rebuilding:

```bash
cd /c/PROJECTS/prep-pilot
export PATH="$PWD/.tools/node_modules/node/bin:$PATH"
node.exe --env-file=.env.local --import tsx tests/short-duration-release.ts
```

The harness generates and checks an exclusive disposable database target, keeps
email/files disabled, uses fresh test secrets, and cleans its owned server/data.
It requires an existing build and an available port 3123. Optional `--browser`
keeps fixtures available until Enter (or a ten-minute timeout); browser actions
must use those fixtures only. Interrupted processes can require explicit cleanup
of that exact printed disposable database, never the shared database.

## Why 15 existed; actual dependencies

The original PRD and API/database contracts explicitly specified 15–60 minute
task/content estimates; schemas, models and the editor mirrored that choice.
No documented research or measured timing justified it as a learning minimum.
Inspection found no scheduler dependency on a 15-minute item quantum: the engine
uses integer addition against each day's budget and preserves actual task minutes.
Original content-review holds followed that now-replaced product contract.

All validation consumers must change together: catalog create/PATCH/stored values,
Mongoose content, shared importer schemas, admin input/help/error text, proposal
scheduled/deferred values, saved-plan model and task-completion reads. Import and
migration tooling reuse these schemas; no replacement importer is needed. Existing
migrations do not install a MongoDB duration validator or duration-dependent index.
This is backward-compatible application validation, requiring no data migration,
index change or automatic rewrite. No migration is run against shared data.

Planner allocation remains 50/25/25 by exact minutes, with due-revision/overdue/
fresh priorities and prerequisite/company/difficulty rules unchanged. Positive
minutes avoid zero-cost tasks, while the finite material-ID map, removal from the
candidate queue, 30-day window and existing 480-task/480-deferral caps bound work.
Excess deferred scope returns PLAN_SCOPE_TOO_LARGE. Unused capacity does not
generate duplicate practice tasks. Saved tasks keep their copied estimates even
if a content estimate is later revised. Neither completed nor pending historical
estimates are silently rebased to catalog values.

`deterministic-budget-3` versions the newly supported duration domain. Existing
pending previews require regeneration after deployment; accepted plans remain
readable and unchanged. Preview confirmation's existing version/catalog/state
checks still apply. No scheduling algorithm or priority rewrite was necessary.

## Proposed aptitude estimates (not saved or measured)

| Slug                             | Proposed minutes | Editorial basis                                                                                                                                  |
| -------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| apt-original-mixture-replacement | 7                | Read the replacement assumptions, compute two retained quantities/concentration, solve the final-volume equation, and check capacity/denominator |
| apt-original-paths-in-small-dag  | 5                | Sketch the small graph, enumerate routes, apply two constraints, then inspect the added edge                                                     |

These are unmeasured editorial estimates, not stopwatch observations or claims
about every student's speed. Correctness checks and the saved mixture capacity
correction remain valid. The former 15-minute policy alone no longer disqualifies
them, but no live estimate, review timestamp, attribution or publication is changed
in this implementation task. Existing published durations remain untouched.

## Required deployment/publication sequence

1. Finish local validation and a successful current production build. If Codex
   hits the known Windows EPERM, use README's Git Bash manual-build fallback;
   do not diagnose it again. A user-run build must be labelled user-run.
2. In a separately authorized checkpoint, commit/push the source and deploy it to
   the hosted production branch (`dev`). This task does none of those actions.
3. Confirm Vercel Ready/source commit matches that checkpoint, hosted APP_URL is
   unchanged, and **both hosted and any running local application** use the new
   validation. Stop/restart stale local servers; do not save short durations while
   any writer still runs old code. Local and hosted share prep_pilot_dev.
4. Open the two existing drafts through the authenticated admin editor. Re-read
   their actual revisions (last observed 2); compare to the editorial ledger.
   Set estimates to 7 and 5 respectively, retaining corrected prompt, source and
   company-free original labels. Do not reimport them or overwrite conflicts.
5. Under explicit publication authorization, finish the review record honestly
   (Codex checking versus human authorization, unmeasured timing), save with the
   current revision, then publish through the existing confirmation action.
6. Verify student list/detail reads show the exact estimates and publication.
   A new plan preview should preserve 7/5 minutes, respect daily totals and show
   genuine remaining shortages. Viewing reads is not a practice submission;
   generating/accepting a preview and completing practice create study records
   and need their own authorized walkthrough. Old accepted plans keep snapshots.

Code rollback does not reverse stored estimates/publication. Once short records
exist, do not roll back to a pre-support build that rejects them: redeploy a
compatible fix or plan an explicitly authorized guarded remediation first.
