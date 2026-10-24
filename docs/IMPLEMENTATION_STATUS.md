# PrepPilot implementation status

Updated: 24 October 2026 (Asia/Kolkata).

## Catalog coverage and evidence-based adjustment previews

### Implementation

The verified planning checkpoint below remains the baseline; its user-run build
and agent-run production regression evidence were not repeated before implementation.
No existing homepage/authentication behaviour or unrelated working-tree work was
replaced. No new dependencies, external setup, migrations or production services
were required.

Added a reproducible read-only catalog report using the existing explicit target
validation, a snapshot transaction and metadata/publication checks. Against the
already-authorized configured development database prep_pilot_dev it observed zero
records, zero eligible published items and all 17 canonical topic/foundation/company
coverage gaps. Arrays is missing for both sorting/searching prerequisites. This is
an actual observed content limitation, not a planner failure or a claim about
official company syllabuses. No real catalog records or singleton state were changed.
See CATALOG_COVERAGE.md for counts, impacts, command and provenance.

Dashboard recommendations now derive the documented last-three non-revision
attempt rule and unscheduled due revision evidence from a consistent read snapshot.
They use stable evidence keys and do not run plan generation or persist previews
on dashboard GET. Acceptance suppresses already-reviewed topic evidence until new
source activity. User-requested adapt previews persist bounded allowlisted evidence
with the existing proposal. Easier candidates respect published company/foundation
eligibility, preference ceilings, prerequisites, daily capacity and retained history.
Only harder pending fresh work can be replaced; never completed, overdue or revision
tasks. Unscheduled substitutes restore the original candidate rather than losing it.
Completed revision cycles are retained once, not duplicated as new pending work.

Rules version deterministic-budget-2 invalidates older pending configurations.
Selection details and the conservative editorial interpretation of easier are in
PLANNING_CONFIGURATION.md. No numeric score/mastery/readiness threshold was added.
Missing easier material produces a limitation and existing revision due dates,
not an invented early repeat. Adapt previews without a useful evidence-related
change remain readable but cannot activate another version (422 VALIDATION_ERROR).

The existing create/read/confirm services remain the sole preview/acceptance path:
ownership/CSRF, expiry/date/profile/plan/catalog/config guards, atomic catalog/profile/
plan/receipt writes, bounded retries and durable original confirmation receipts.
New practice invalidates a pending preview via stateRevision. Keep current plan is
navigation without a mutation. Accepted plans preserve previous history and task IDs.

Reviewed Stitch dashboard recommendation and plan-change review screenshot/HTML.
The student UI connects preparation, explanation, named task/date changes, daily
before/after budgets, explicit deferrals, keep/accept, no-useful/insufficient-evidence/
content and recoverable stale/error states. Prototype confidence scores, arbitrary
unlock thresholds and simulated retries are excluded. Mobile follows the existing
single-column design system; no unseen mobile reference is claimed.

### Verification

All 59 unit tests passed, including eight focused adjustment/coverage cases: exact trigger/non-trigger ordering, revision-only
evidence, deterministic replacements, budget/completion preservation, content/
prerequisite/company shortages, strict evidence, valid/invalid metadata coverage
and completed-cycle deduplication. Final full zero-warning lint and formatting
passed. After the browser fixture exited, final `npm.cmd run typecheck` passed
Next route generation and strict TypeScript, including the sequence watermark.

Direct MongoDB/Route Handler planning and connected student regression passed,
including the new adjustment evidence, no-useful rejection, review without mutation,
new-practice staleness, rollback, concurrent replay and completion/history cases.
An initial new-case run exposed missing admin PATCH support in the direct test
dispatcher, not an application endpoint failure; the dispatcher was corrected and
safe local-file diagnostic frames added without logging raw dependency errors.
The corrected integration exited 0 and cleaned up its disposable database.

The fresh Next development-server planning/connected-student suite also passed the
new cases, including acceptance watermark capture and proof that a new attempt
with a deliberately earlier fixture timestamp still produces evidence by sequence.
No timestamp is used to decide whether an outcome is new. New plans store the
internal attemptSequenceAtGeneration field; legacy absence reads as 0 without a
destructive backfill or index change. A connected run during schema editing returned
500 at acceptance and was not treated as passing; the fresh-server run is the
verification evidence. Interactive browser verification used that disposable
fixture, not the real development database.

The actual development browser journey passed active-plan dashboard → question →
keyboard-submitted help outcome → saved receipt → refreshed dashboard evidence →
request persisted adjustment. The first `/plan-previews/[id]/page` development
compilation then stalled: its Next development log showed the compilation start
but no completion or filesystem error; browser error/warning logs were empty.
At that development checkpoint, interactive preview → keep → review again → accept
→ historical-plan navigation was not verified, despite passing equivalent HTTP/domain
cases. Mobile recommendation layout and absence of horizontal overflow were
checked with a 390px viewport override (375px content capture); the override was
reset. Screenshot evidence is outside the repository. The browser fixture timed
out normally, the harness exited 0 and its disposable database cleanup completed.
Port 3104 was checked clear before type generation/build. Windows CIM process
inspection was unavailable; no arbitrary process was stopped or permission weakened.

The final agent-run `npm.cmd run build` failed during Webpack compilation with:

```text
EPERM: operation not permitted, mkdir 'C:\PROJECTS\prep-pilot\.next\static\chunks\app\(auth)\signup'
```

It was not retried unchanged. The precise Windows lock/ACL/sandbox cause is not
established; the stalled development compilation is not assumed to share that
cause. The user subsequently ran `npm.cmd run build` successfully in VS Code's
Git Bash terminal: Next 16.4.2 Webpack compiled, completed TypeScript, generated
13/13 static pages and finalized traces. This is user-run production-build evidence,
not an agent-run build. It was NOT a clean build: the preceding PowerShell PATH
and Remove-Item commands failed in Bash. Node/npm versions were not printed in
that run. The terminal was already in the correct repository directory.

The successful artifact is preserved without rebuilding, output cleanup or type
generation. Agent-run `npm.cmd run test:planning -- --browser --adjustment-browser`
passed its production HTTP/domain assertions against that artifact: evidence and
non-triggers, no-useful rejection, staleness, receipts/concurrent acceptance,
transaction rollback, history/completion preservation, routing and admin separation.
These are local verification, not deployment.
The preceding milestone's production results remain historical baseline evidence.

The remaining actual production browser journey also passed in the isolated
fixture: signed in to an active plan, keyboard-saved a new help outcome and saw
its receipt, opened the recommendation and saved comparison, chose Keep current
plan and verified the same active-plan ID, reviewed again, acknowledged the
deferral with Space and accepted with Enter. The new active version retained
completed work; its previous-version link opened the archived base with its
original completion, and attempt history retained all six submissions. Daily
comparisons stayed within budget. The preview/accepted-plan mobile layout had no
horizontal overflow with a 390px viewport override (375px content width); the
override was reset. Production preview navigation did not reproduce the earlier
development compilation stall. Screenshot evidence is outside the repository at
preppilot-adjustment-verified.png. No application source changed after the user's
successful build. The fixture reached its normal ten-minute timeout, the production
harness exited 0 and cleaned up its disposable database. No real development
catalog/account records were modified. The milestone's production and complete
interactive workflow verification are now complete; the earlier development
compilation stall's cause remains undiagnosed rather than attributed speculatively.
The build regenerated only the expected next-env.d.ts route imports from
`.next/dev/types` to `.next/types`; this generated change is not feature work.

### Limitations

The real development catalog remains empty: reviewed curation is required for a
useful real-user schedule or adjustment. Only isolated tests publish synthetic
material. Full progress analytics, R2, live email/verification/password recovery,
deployment and automatic plan changes remain out of scope. No commit, push or
deployment is authorized or performed.

Manual walkthrough after a successful current build: use the documented isolated
adjustment browser fixture (or explicitly curate real reviewed content first), open
an active plan, deliberately record relevant question outcomes, then review the
dashboard suggestion. Compare named task/date changes and daily minutes, choose
Keep current plan and verify the same active plan, review again, acknowledge any
deferrals and Accept updated plan. Check the previous-plan link and retained
completed work/history. Stale or expired proposals require fresh review. This full
interactive sequence is now verified against the production artifact using
disposable fixtures, not claimed as a real-user content-coverage demonstration.
With verification complete, the next useful product step is reviewed real catalog curation;
the measured empty catalog currently limits preparation usefulness more than adding
analytics or external integrations.

## Study planning, preview acceptance and dashboard

### Scope and implementation

The previous milestone's clean production build passed in the user's VS Code
PowerShell terminal with Node 24.22.1/npm 10.9.3. This is user-run evidence, not an
agent-run build. Existing uncommitted planning scaffolding was found at inspection,
preserved and reviewed rather than overwritten or attributed as newly created.

Editorial v1 configuration and its assumptions are documented in
`docs/PLANNING_CONFIGURATION.md`. Both companies retain every canonical foundation
topic. Only arrays-before-sorting/searching prerequisite edges are specified;
uncertain relationships remain unspecified. Configuration integrity is tested,
and persisted template/rules versions participate in preview staleness checks.

The deterministic engine implements difficulty ceilings, current published company/
foundation eligibility, no repeated fresh attempts, revision-cycle deduplication,
oldest due/overdue priority and stable ties, 50/25/25 deficit allocation, unchanged
15–60 minute estimates, bounded windows/capacity and explicit deferrals. Adjustments
preserve completed task IDs and dates; a reduced budget cannot invalidate today's
already completed minutes. Earlier completed facts remain historical, not new work
against a reduced future budget. No self-assessment/history absence implies mastery.

Owned preview/create/confirm, current/detail/history plan reads and dashboard APIs
reuse the existing guards, CSRF, safe errors, transaction/session and migration
infrastructure. Acceptance conditionally writes catalog commitSerial, then profile
state, plan, pointer/version and preview receipt atomically. Replays resolve through
sourcePreviewId even after preview deletion; concurrent competing previews cannot
both activate. Generation itself never advances study state or activates a plan.

Dashboard, preview and Study Plan pages use real persisted data and explicit
generation/acceptance/task actions. Reloadable previews, daily totals, subject
coverage, deferral acknowledgement, stale/expired recovery and historical plan links
are connected. Owned task context is validated before showing completion actions
on question/resource details. Independent resources retain no completion control.
Task completion and outcomes remain separate. The dashboard deduplicates revision
cycles already scheduled today and shows no fake measured time/readiness charts.

Migration 003 is additive, validates existing planning proposals and creates the
documented plan uniqueness/preview retention indexes. No startup sync, destructive
conflict repair, new external account or dependency is introduced.

### Verification checkpoint

Direct planning integration passed ownership/CSRF, expiry/date/config/catalog/state
guards, complete acknowledgement, acceptance receipts/races, both plan-insert and
preview-receipt rollback, history preservation, task ownership, resource completion,
dashboard persistence and repeated migration preservation. A rate-limit assertion
crossed a ten-minute bucket boundary; its disposable fixture now deterministically
seeds only the current/next test buckets instead of assuming elapsed wall time.
Production rate limits were not weakened. The corrected integration passed.

Practice regression passed idempotency, races/sequences, transactional attempt and
revision rollback, owned history/cursors, recalls and resource task completion/undo.
Catalog/operational regression passed setup, migration repeatability/restart/checksum/
lock/conflict preservation, permissions and disposable admin provisioning/audit
rollback. Native-auth HTTP regression passed on the Next development server:
signup/duplicates, persistent/revoked sessions, role/lifecycle separation, profile
concurrency, CSRF, disabled email mode and durable rate limits.

All 50 unit tests, full formatting, zero-warning lint and Next route generation/
TypeScript checks passed before the blocked build. Initial lint caught JSX inside
try/catch in server pages; fetch error handling was moved outside rendering rather
than disabling the rule. A final identity-owned pointer service replaced the new
cross-module profile write, preserving the same transaction and guarded revision/
version/pointer match. Its focused 13-test planning suite, TypeScript and lint passed;
actual Next/MongoDB checks then proved pointer/receipt rollback and same-preview
confirmation races through that service. Duplicate deferral acknowledgements return
the documented DEFERRED_ACK_REQUIRED, also verified against the isolated Next server.

After the final ownership/error refinements, all 51 unit tests, full formatting,
zero-warning lint, TypeScript and git diff whitespace checks passed. The subsequent
user-run production build regenerated next-env.d.ts imports from `.next/dev/types`
to `.next/types`; this is Next-generated environment output, not a feature change.
Auth and browser harnesses completed successfully
and cleaned up their disposable databases; no test server is intentionally left up.

The connected development browser journey passed first-visit dashboard → preview →
reload saved preview → explicit acceptance → owned resource → explicit completion →
updated dashboard. Saving existing onboarding preferences returned to the dashboard
without rewriting the accepted plan. Keyboard Enter submission and 390px mobile
layout/no horizontal overflow were checked; compact navigation and persisted task
state were visually verified. Screenshot evidence is saved outside the repository.
Browser fixtures now accept Enter for early cleanup, otherwise expire in ten minutes.

Explicit setup verified migrations 001–003 in development database prep_pilot_dev,
preserving existing records and singleton state. No real practice/plan fixtures or
account promotions were performed; all test fixtures were guarded disposable data.

The earlier agent-run production build attempt failed with
`EPERM: operation not permitted, mkdir 'C:\PROJECTS\prep-pilot\.next\types\app\api'`.
It was not retried unchanged. The user subsequently removed only `.next` and ran
`npm.cmd run build` successfully in normal VS Code PowerShell against the latest
source: Next 16.4.2 Webpack compiled successfully, completed TypeScript, generated
13/13 static pages and finalized build traces. This is user-run production-build
evidence, not an agent-run build; the original EPERM cause remains unproven.

Against that existing production artifact, the agent sequentially ran
`npm.cmd run test:integration` and `npm.cmd run test:planning`; both exited 0.
Authentication covered signup, duplicates, sessions/revocation, role isolation,
profile concurrency, CSRF, disabled email mode and rate limits. Planning covered
ownership/CSRF, preview bounds and staleness, acceptance receipts/races, rollback,
history, owned resource completion, persisted dashboard, connected student routing,
admin separation and server pages. No rebuild or development server was interleaved.
The planning milestone now has successful production build and regression evidence;
development checks are recorded separately rather than substituted for production.

The first development browser run was blocked by
`EPERM mkdir C:\PROJECTS\prep-pilot\.next\dev\static\css\app`, not accepted as
a passing browser check. The harness cleaned up; Node 24 subsequently created and
removed an empty probe in that exact parent successfully. This does not establish
the earlier error's cause. One development retry follows that diagnostic finding.

### Remaining scope

Automatic adaptation recommendations, full analytics, R2, live verification/password
recovery, deployment and full reviewed content seeding remain outside this milestone.
No template-management UI, arbitrary task creation or drag-and-drop scheduling is
implemented. No commit, push or deployment is authorised in this task.

## Practice outcomes and revision tracking

### Starting point confirmed

The corrected previous student production regression and connected browser journey
had passed, including onboarding, filters, details, return context and mobile layouts.
The last small UI fixes had a later EPERM-blocked build, so that earlier success
was not called final-artifact verification. Existing uncommitted feature work is
preserved. This checkpoint supersedes the older reading-only scope where stated.

### Implemented

- Strict `POST /api/v1/attempts`, owned `GET /api/v1/attempts`, and
  `GET /api/v1/revisions`. Current student role/lifecycle, verification mode,
  session-bound CSRF and exact Origin are enforced. Submission admission uses the
  durable 60/minute limiter, including replays. No browser-supplied owner, timestamp,
  sequence, due date or plan/task context is accepted.
- Canonical payload hashes and unique owned submission IDs return original saved
  receipts on exact retries; conflicting payloads return IDEMPOTENCY_CONFLICT.
  Every new deliberate attempt allocates one server sequence and increments profile
  state once. Immutable attempt snapshots preserve historical classification.
- A bounded snapshot/majority transaction fences catalog availability before the
  profile write, then saves attempt and revision on the same Mongoose session.
  The catalog fence changes only its existing updatedAt metadata, not revision or
  commitSerial: those semantic counters remain reserved for their documented uses.
  This prevents an archive-versus-attempt write skew without inventing a counter.
- Revision records are unique per student/content and track the newest allocated
  sequence. Failed/hard → 1 day, otherwise help/medium → 3, independent → 7, using
  the server attempt date in Asia/Kolkata. Revision recall requires an owned cycle
  and writes a new immutable revision-kind attempt; it reschedules rather than
  deleting history or silently completing a plan task.
- Question UI has accessible outcome/difficulty selection, pending/validation/error
  states, frozen safe retry identity, persisted tab-local recovery, confirmed receipt,
  current-history refresh and an intentional later-attempt action. Replayed receipt
  dates are labelled historical rather than overwriting newer revision state.
- `/attempts` and `/revisions` are honest temporary student destinations, not a
  fabricated dashboard or plan. Pagination is signed and bound to owner/endpoint/
  filters/order/limit; revision cursors also bind the current study date. Unavailable
  entries expose saved history facts only. Library/queue/history return links survive
  reading and sign-in; opening content or external links records no attempt.
- Reusable owned active-plan task completion/undo uses profile concurrency and a
  transaction. Same-state/current-revision requests are no-ops; unavailable pending
  content cannot become completed, while undo remains allowed. Independently browsed
  resources have no completion button. No runtime plan/task creation is implemented.
- Versioned migration 002 adds attempt/revision indexes, validates existing study
  records and reuses the fenced migration runner. Migration 001's immutable manifest
  remains unchanged. No automatic startup indexing, deletes or conflicting-data repair.

### Verification evidence

- All 38 unit tests passed, including every 1/3/7 branch, Kolkata midnight/year/leap
  boundaries, strict input/authoritative-field rejection, canonical hashes, signed
  cursors, frozen submission/reload recovery, immutable storage and existing security/
  safe-rendering regressions.
- Focused direct Route Handler integration passed real auth/CSRF, duplicate and
  changed-payload submissions, concurrent sequences, original receipts after newer
  attempts, attempt/revision rollback, history isolation/cursors, revision recall
  and owned task completion/no-op/undo. The first rollback assertion included the
  existing auth lookup's updatedAt touch; it now excludes only that timestamp as
  existing admin tests do, while checking counters and transactional domain data.
- Existing catalog/operational integration passed migration repeatability, restart,
  checksum/lease/conflict preservation, permissions and disposable admin audit rollback.
- Explicit setup verified migrations 001 and 002 in local development database
  `prep_pilot_dev`, preserving records and singleton state. Test fixtures use only
  random guarded `prep_pilot_student_test_*` databases; no real account was promoted
  and no practice or plan fixtures were inserted in the development database.
- Connected development HTTP/server-page integration passed, including existing
  student routing/admin separation and the practice assertions above. Browser checks
  passed outcome submission, an injected revision-write failure with unchanged data,
  retained selection/submission ID after reload, explicit safe retry and confirmation.
  A deterministic due revision opened in recall mode, saved a new historical attempt,
  rescheduled to seven days later and disappeared from the due-only queue. History
  retained the previous attempts. Keyboard radio/Tab controls and the 390px mobile
  history/receipt layout were checked without horizontal overflow. The first fixture
  expired during browser work; a fresh disposable fixture completed the remaining
  recall/mobile checks, rather than treating that expired-server page as a product bug.
  Both disposable harness runs completed successfully and cleaned up; port 3104 no
  longer responded afterward. next-env.d.ts has no final generated-only diff.
- Final formatting, zero-warning lint and route generation/TypeScript checks passed.
  The one final production build failed during Webpack compilation with
  `EPERM: operation not permitted, mkdir 'C:\PROJECTS\prep-pilot\.next\types\app\api\v1\identity'`.
  No unchanged build retry or security/ACL workaround was attempted. This is not
  evidence of a TypeScript failure, nor enough evidence to diagnose the Windows
  restriction. A current production artifact and production HTTP regressions remain
  unverified. Use README's normal VS Code clean-build fallback, then run the practice
  and authentication production regressions sequentially. Direct/development checks
  are not represented as production-build verification.

### Remaining scope

At this earlier checkpoint, resource completion UI and generation/acceptance were
deferred. The planning milestone above supersedes those limitations. Practice
outcomes never imply task completion. Analytics, R2 and live email remain deferred; verification and password
recovery remain explicitly incomplete. No external account or cron service was
introduced. No commit, push or deployment is part of this task.

## Student onboarding and published-content browsing

### Implemented

- Preserved the uncommitted admin editor/lifecycle/student API work present at the
  start. Creation, publication, archive/reopen and protected reads already existed;
  the missing dependencies were preference persistence and connected student UI.
- Strict complete preferences PATCH uses the current actor, exact Origin/session
  CSRF, allowlisted Zod fields and an atomic owned active-profile revision match.
  It increments stateRevision once; no plan, task, catalog or audit mutation occurs.
  Mongoose also validates stored preference structure without rejecting old deadlines
  merely because time passed. MeDTO projects validated preferences explicitly.
- Three-step onboarding retains entries, supports existing preferences, labelled
  keyboard-native choices, inline validation, pending/duplicate-submit protection,
  recoverable input preservation and explicit stale/uncertain-save reconciliation.
  Seven inclusive days and midnight boundaries use Asia/Kolkata; daily minutes are
  30–240 in 15-minute increments and all three ratings are 1–5.
- Current student/admin/verification/lifecycle guards control routing. Completed
  students skip onboarding unless explicitly editing preferences. Validated content
  return destinations survive sign-in/onboarding; external/privileged destinations
  are rejected. The unfinished dashboard temporarily redirects to the real library,
  which explains the limitation rather than showing invented progress.
- Published library uses URL filters/search, existing signed cursors, Load more,
  cancellation/stale-result protection, retained results after pagination failure,
  empty/no-match/error states and bounded page/scroll restoration. No content bodies
  or credentials are stored in the restoration hint, and restored data is refetched.
- Question/resource detail pages display real prompts/bodies, external HTTPS links,
  revealable explanations, source/attribution/review and honest company provenance.
  Historical unavailable responses show only the permitted snapshot, never archived
  bodies. No outcome/completion actions or implicit study writes are introduced.
- Generic request/unsaved-navigation mechanisms are shared between onboarding and
  the admin editor; compatibility exports preserve existing admin callers/tests.

### Design evidence and differences

Stitch project 7439735129249105516 now includes all three desktop onboarding steps,
student library, question and resource details, plus mobile schedule/library
references. Their screenshots and HTML were inspected. Existing ivory/forest/charcoal
tokens and typography are retained. Design adaptations are documented in
`docs/student/DESIGN.md`: no prototype state switchers, fabricated totals/predictions,
unsupported companies, bookmarks/sharing, outcomes, completion, uploads or plan
acceptance controls. Mobile details collapse the desktop reading/metadata columns;
the mobile filter drawer is an accessible native disclosure.

### Verification

- All 33 unit tests pass, including exact preference/date validation, safe field
  errors, return-path restrictions, list merging, existing auth/permission/CSRF rules,
  actual malicious-Markdown rendering and shared request error handling.
- Direct student Route Handler integration passed against a guarded disposable
  `prep_pilot_student_test_*` database: real auth sessions, preference persistence,
  privileged fields, CSRF/Origin, stale/concurrent writes, unchanged plans/catalog,
  real admin publication and published list pagination/filter isolation. This mode
  intentionally does not exercise Next server pages, redirect routing or browser UI.
- Initial development-server verification was blocked while compiling `/content`:
  `EPERM: operation not permitted, mkdir 'C:\PROJECTS\prep-pilot\.next\dev\static\css\app'`.
  The browser received Internal Server Error, not a working student page. The owned
  harness stopped and removed its disposable database; no unchanged dev retry ran.
- Generated-output clean-up was rejected by command policy, including after a
  narrow `.next` filesystem permission grant. Nothing was deleted. The subsequent
  normal production build passed (compile, TypeScript and page generation), with
  all new routes listed. This does not establish the cause of the earlier EPERM.
- Agent-run production admin/lifecycle/read regression and authentication regression
  passed sequentially against that successful build. The production student HTTP
  journey also passed, including redirects, admin separation and server-rendered
  library/question/resource pages. Its first routing assertion was corrected to
  recognise Next's documented streaming meta redirect as well as HTTP 307; the
  test still verifies the exact permitted destination.
- Browser verification on isolated production fixtures completed sign-in → three
  onboarding steps → saved preferences → library → URL filters → question and
  resource → filter-preserving return. It also verified required-company feedback,
  retained step entries, saved preferences on explicit edit, Load more and loaded-page
  restoration, explanation reveal, safe external destination labels, mobile
  schedule/ratings/library/resource layouts at 390px without horizontal overflow,
  and unsaved-dialog focus/Escape/input preservation/discard. Network failure and
  uncertain-save UI branches are covered by shared request/unit tests and backend
  concurrency checks, not claimed as exhaustively browser-injected failures.
- Final small UI fixes add safe query-field error messages, fresh first-page cursor
  recovery, new-tab sign-in recovery without losing preference input, and generic
  unsaved-dialog wording. ESLint passed after these changes. The subsequent latest
  production build failed with `EPERM: operation not permitted, mkdir
'C:\PROJECTS\prep-pilot\.next\server\app\api'`; no unchanged retry was made.
  Therefore the earlier production pass is not a claim of final-artifact verification
  for those last UI changes. A normal-terminal production build is still required.
- At the user's request, the actual configured application was started in development
  mode on port 3000 (not the disposable test server). `http://localhost:3000/login`
  returned HTTP 200 with the real login form and was opened in the browser. The dev
  server remains running for user review; no build/type-generation or integration
  server should be run alongside it. Final TypeScript/format checks and the latest
  clean production build should be completed after that review using README's sequence.

### Boundaries / next milestone

No student practice submissions, resource completion, scheduling/revisions, plan
generation/acceptance, analytics, R2 or live email are implemented here. Verification
and password recovery remain unavailable, and configuration cannot turn incomplete
flows into operational services. No new external setup is required. Test fixtures
are explicit and isolated; runtime has no sample-content fallback. No commit, push
or deployment is part of this task. Next recommended feature: idempotent practice
outcomes and revision persistence, before planning and progress UI.

## Steps 4–5: editor, safe preview and publication lifecycle

The approved feature is implemented; production verification remains blocked by
the Windows build-output EPERM described below. No production success is inferred from Step 3.
All subsequent milestone sections are historical checkpoints. No commit, push,
deployment, student onboarding/submissions/scheduling, R2 or live-email work is
included in this milestone.

### Completed implementation

- Admin creation/edit routes expose every documented editable field with strict
  draft/patch validation, safe server field feedback, pending states and preserved
  input. PATCH contains only changed fields, null-clears optional text/review dates
  and replaces changed arrays. Slugs lock after publication, including reopened
  drafts. Save routing goes to the actual saved editor resource.
- Unsaved internal navigation/back actions require confirmation; tab close/reload
  retains native beforeunload protection. Stale/unknown outcomes block further saves
  pending explicit read/compare/adopt/rebase. Changed-field rebasing preserves newer
  unrelated remote edits; it is an explicit operator choice, never automatic.
  Ambiguous creates reconcile against the original attempted unique slug using
  existing paginated reads, not a new filter or an idempotency claim.
- Local form preview is clearly distinct from the saved Admin preview page. It
  shows draft/archived availability, question/resource Markdown, labelled external
  HTTPS links, source/association provenance and revealable explanations. Preview
  writes no attempts or completion. New dependency react-markdown 10.1.0 uses its
  AST renderer with skipHtml, disabled images, HTTPS-only credential-free links
  and external-tab isolation; no unsafe HTML plugin is installed.
- Publish/archive/reopen endpoints use current admin + CSRF, strict action bodies,
  expectedRevision and the existing catalog→profile→content→audit transaction.
  Content/catalog/profile revisions advance exactly once per committed mutation;
  commitSerial and task snapshots remain unchanged. Failed audit insertion rolls
  back all domain changes. Archive reasons are required and audited. Reopening
  preserves prior transition timestamps and never makes content student-visible.
- PATCH now edits drafts and publication-valid published content. Archived content
  must reopen first. Publication rejects missing usable learning content/review;
  published edits cannot invalidate those requirements. Nonempty attachments remain
  rejected throughout. There is no hard-delete or R2 integration.
- Student GET list/detail endpoints use study access and explicit DTOs, published
  filtering, existing bounded text search, company foundations and stable signed
  cursors scoped separately to endpoint/actor/filters/limit/order. Explanations are
  omitted from summaries. Unavailable details return only an owned historical
  attempt/plan-task snapshot; absent ownership yields 404. History queries are
  public read services in their owning modules, not competing models or writes.
- Stitch currently lists a Content Library screen but no editor or preview screen.
  These screens intentionally extend the established design, not an unseen mockup.
  No new service account/configuration was needed. Migration manifests, indexes,
  homepage and authentication infrastructure are preserved.

### Verification results

- All 30 unit tests pass, including publication, editor PATCH/rebase, failed/ambiguous
  client saves and actual malicious-Markdown rendering. Initial renderer-fixture failure was Markdown's HTML block consuming
  following lines; the fixture now separates blocks so valid links are tested too.
- Expanded development integration completed successfully, reusing all Step 2/3
  coverage and exercising lifecycle, published edits, audit rollback, student
  projections and owned historical availability. Fixtures use only guarded random
  test databases; real accounts and the configured development database are untouched.
- Browser review verified create/edit, missing-review publish feedback, explicit
  review and publish, required archive reason, archive/reopen and retained slug lock;
  local Markdown/explanation preview; and two-tab stale-save input preservation
  with explicit current-revision reconciliation. It caught create routing reverting
  after a native history update; the fix uses router.replace and was verified by
  reaching the real saved `/edit` URL. Escape/focus return worked in lifecycle
  confirmation. Subsequent browser CDP navigation/focus timeouts blocked final
  mobile editor and replacement unsaved-navigation dialog acceptance checks;
  those are not claimed as passed. Responsive CSS and native modal focus trapping
  are implemented, but need the remaining interactive review.
- Formatting, zero-warning ESLint, Next route type generation and strict TypeScript
  checks passed with the project Node 24.22.1 runtime. Authentication regression
  passed in development mode, including persistent/revoked sessions, isolation,
  Origin/CSRF, concurrency, email-disabled mode and durable rate limits.
- The single production build attempt failed with `EPERM: operation not permitted,
mkdir 'C:\\PROJECTS\\prep-pilot\\.next\\static\\chunks\\app\\api\\v1\\admin'`.
  Ports 3000, 3101 and 3103 were not responding before the build. This identifies
  the failing operation, not whether Windows ACLs, a lock or sandbox enforcement
  caused it. No security/permission weakening, dependency reinstall or unchanged
  build retry was performed. Production integration checks have not run for this
  milestone because there is no successful current production artifact.
- A second development lifecycle/read run completed the lifecycle assertions but
  failed a later unsupported-DELETE check (500 rather than 405) after its browser
  pause and hot source edits. That observation is not labelled a pass or assumed
  to share the build cause. The focused development lifecycle/read rerun without
  browser pause or intervening source edits passed, including that DELETE=405
  assertion and final empty-library rendering/cleanup. No application workaround
  was added for the non-reproduced 500.
- No real development database setup or account promotion was performed. Test
  harnesses migrate guarded random `prep_pilot_s2_test_*` / `prep_pilot_auth_test_*`
  databases on the configured cluster and remove their own fixtures/database.
  Generated `next-env.d.ts` currently matches Git; no generated churn is included.

### Finish verification / next milestone

Use README's normal VS Code terminal clean-build fallback (not deployment), with
all project dev/test servers stopped. Report the build output; after a successful
current build, run production admin-content and authentication regressions
sequentially. Complete mobile editor and unsaved-navigation keyboard review.
Only then call this milestone fully production-verified. The next feature milestone
is student catalog browsing/detail UI using these published-only endpoints; practice
and planning remain separate approvals.

### Remaining boundaries

No student catalog UI, practice submissions, task completion, planning, R2/uploads,
full seed collection, live verification or password recovery is implemented here.
History lookup supports the documented persisted snapshots but does not create
study history. Saved published edits intentionally become visible immediately.
An uncertain create cannot generally be proven absent just by a failed connection;
operators must reconcile, compare and explicitly decide whether to retry.

## Step 3: guarded admin reads and Content Library

Step 3 is verified for its approved scope: a user-run clean production build and
agent-run production draft/read and authentication regressions have passed.
This is current Step 3 evidence, not inferred from the prior Step 2 build.
Step 2's committed feature work is preserved.
The sections below this Step 3 checkpoint describe historical verification.
The user authorised committing and pushing Step 3 after successful verification.
No Step 4 work or deployment is performed here.

### Implemented scope

- `GET /api/v1/admin/content` and `GET /api/v1/admin/content/:id` enforce current
  canonical admin access in services, not just routes or UI. Explicit summary and
  detail DTOs omit internal authorship/schema fields, answers in lists, storage
  keys and signed URLs. Responses are no-store and carry request IDs. Unknown or
  repeated parameters, invalid IDs and invalid classifications return safe 422
  field feedback; missing details return 404.
- Allowlisted status/subject/topic/company/difficulty and trimmed 1–100 character
  keyword filters combine with AND; company includes empty-company foundations.
  Search uses the existing title/topic/tags MongoDB text index with quoted word
  terms, not regex or client search operators. Punctuation-only searches return
  no results. Limit defaults to 20 and caps at 50; all results sort by ID ascending.
  Repository reads are lean, bounded to limit+1 and have a five-second query cap.
  No relevance ordering, arbitrary sorting or total counts were invented.
- Purpose-separated HMAC cursors use the existing server auth secret. Signed
  payloads bind a digest of endpoint, ordering, normalised filters, limit and
  current actor, plus last ID and a 30-minute expiry. Signature checks precede
  payload use; altered/expired/mismatched cursors return 400 INVALID_CURSOR.
  Reads do not advance content, catalog, audit or study revisions. Existing identity
  profile provisioning/updatedAt bookkeeping is unchanged.
- `/admin/content` uses the existing Workspace/SignOut shell, server page guards,
  warm ivory, forest green, charcoal and existing typography. The approved Stitch
  Content Library HTML and screenshot were accessible and inspected. Its illustrative
  metrics, mock totals, service claims, editor/lifecycle/file controls and unrelated
  navigation were deliberately omitted. No design was modified in Stitch.
- All/Draft/Published/Archived views, keyword search, configured filters and clear
  filters persist in the URL. Navigation resets pagination; keyed server results
  and aborted client requests prevent older pages replacing newer filters. Desktop
  tables become mobile cards. Loading, honest empty/no-results and recoverable
  error states are present; loaded-item counts are not catalog totals.
- A native modal uses the guarded detail endpoint for saved metadata, text,
  provenance and lifecycle inspection. Text is escaped plain text, not raw HTML
  or a student preview. Keyboard activation, Escape and return focus are supported.
  Attachments remain empty and explicitly unavailable.

### Verification evidence

- User-run clean build in normal VS Code PowerShell: removed generated `.next`,
  selected the existing local Node runtime and ran `npm.cmd run build`. Supplied
  Next.js 16.4.2 output reports compilation in 13.7s, TypeScript in 4.3s, static
  generation 5/5 and completed traces/optimisation in 7.6s. The route table includes
  `/admin/content` and both admin content API routes. This is user-run verification,
  not an agent-run successful build; Node/npm versions were not printed in that paste.
- Agent-run production follow-up used that artifact without rebuilding or starting
  a development server. The full `tests/integration/admin-content.ts` suite passed,
  followed sequentially by `tests/auth-integration.ts`; the command returned exit 0.
  This includes transactional draft and audit-rollback regressions, guarded reads,
  strict filters/DTOs, text-index execution plan, pagination/cursor scope/expiry,
  empty-library server rendering, homepage and authentication/session checks.
  Only guarded disposable test databases were used; no real account was promoted.
- Agent-run pure tests: 25 passed (including three new query/cursor/search cases).
  The three read tests were rerun successfully after adding explicit endpoint/order
  mismatch assertions. Final full formatting, zero-warning lint, type checking and
  Git whitespace checks passed after the development servers finished.
- The expanded development draft/read suite completed successfully, including
  permissions, strict filters, search, company inclusion, stable pagination,
  cursor scope/expiry, DTO and read-only snapshot assertions plus all existing
  draft mutation, concurrency, CSRF and audit-rollback regressions.
  The first run exposed a test assumption about redirects: Next may stream a
  redirect in an HTTP 200 response. The corrected assertion requires either 307 or
  a streamed NEXT_REDIRECT marker and verifies no fixture content leaks.
- A subsequent targeted `--dev --reads-only` run passed against the final read
  implementation, including an executionStats check confirming the existing
  content_search text index and true empty-library API/server rendering. It
  deliberately skipped repeating successful draft writes, and also exercised
  current downgraded/deleting actors and direct service denial checks.
- The existing authentication integration suite then passed in development mode,
  including homepage/health, signup/login, session persistence/revocation,
  student/admin separation, profile concurrency, CSRF, disabled email capabilities
  and durable rate limits. These are agent-run development results, not production
  acceptance. Both harness commands returned exit 0; disposable databases were
  dropped. After cleanup, known ports 3000/3101/3103 gave no HTTP response and no
  Node process was visible to Get-Process. No competing server was started.
- Agent browser checks against isolated fixtures: desktop at 1440px and mobile at
  390px/320px; table/card switching, readable controls and no horizontal document
  overflow; load-more 20→40 then filter reset to 20; saved filters after refresh;
  rapid All/load-more/Draft/Archived navigation leaves only archived results;
  no-results, invalid-cursor feedback and first-page recovery; plain-text detail,
  Enter activation, Escape dismissal and return focus to the invoking title.
  Browser viewport overrides were reset after review. This is manual browser
  evidence, not an automated accessibility audit or a production browser claim.
- One agent production build attempt, Node 24.22.1 / npm 10.9.3, using the existing
  `next build --webpack`, failed with the exact error:
  `EPERM: operation not permitted, mkdir 'C:\PROJECTS\prep-pilot\.next\server\app\onboarding'`.
  No unchanged retry, dependency reinstall, speculative configuration/security fix
  or competing build was attempted. The original Windows EPERM cause remains
  unproven. The later successful user-run clean build supersedes that failed
  artifact; changing both output state and execution context does not prove the
  original cause. The production follow-up above verifies the successful artifact.
- Next's dev/build/type-generation tools switch next-env imports between
  `.next/dev/types` and `.next/types`. Final type generation naturally restored
  this task's initial production-path imports; the pre-existing generated diff
  remains separate from Step 3 and no generated directory is added to the patch.

### Limits and next gate

Only disposable, randomly named `prep_pilot_s2_test_*` databases are used by the
integration fixture harness, with the existing migration tooling. No configured
development database is migrated, seeded or promoted for this milestone; no new
external account, service, credentials or dependencies are required. Optional
`--browser` uses an intentionally public disposable login only in that isolated
database and has bounded automatic cleanup. `--reads-only` permits targeted read
regressions without repeating already passing draft mutation cases.

Keep the existing POST/PATCH draft restrictions. Create/edit UI, student preview,
publishing/archive/reopen, student catalogs, R2/uploads, analytics, full seeds,
live email verification and password recovery remain incomplete. Follow README's
sequential clean-build/production-suite procedure in normal VS Code PowerShell.
The production verification gate is now satisfied. Step 4 is ready to begin only
after separate implementation approval; it was not started in this milestone.

## Step 2: transactional admin draft creation and editing

Step 2 is verified for the approved scope: the user supplied a successful current
clean production build including both draft routes, and the agent subsequently ran
both production regression suites successfully against that artifact. The original
EPERM cause remains unproven; passing after changing both output state and execution
context does not isolate its cause. All sections after this one are historical
evidence for prior milestones, not separate current Step 2 build claims.
No commit, push, deployment or Step 3 work was performed. Existing homepage/auth UI,
auth behaviour, configuration, dependencies and original design documents remain
unchanged. The pre-existing generated next-env imports are managed by Next's tools,
not manually edited as part of this feature.

### Production follow-up and output-directory evidence

- User-run verification in normal VS Code PowerShell: removed only generated
  `.next`, then ran `npm.cmd run build`. Supplied output reports Next.js 16.4.2,
  successful compilation in 6.3s, TypeScript in 3.8s, static generation 5/5 and
  completed traces/optimisation in 7.0s. Both `/api/v1/admin/content` and its `[id]`
  route appear in the route table. No cleanup/build error was shown. This build was
  performed by the user, not the agent. The new paste does not report Node/npm
  versions; do not infer a fresh version check from earlier terminal setup.
- Agent-run verification with the existing Node 24.22.1 runtime, sequentially and
  without `--dev`: `tests/integration/admin-content.ts`, then
  `tests/auth-integration.ts`, each using `--env-file=.env.local --import tsx`
  (the admin suite also uses `--conditions=react-server`). Both exited 0. The first
  passed production draft/DTO/validation/permission/CSRF, concurrency, clearing,
  state/slug, counter and audit-rollback cases; the second passed production
  homepage/health and authentication/session/role/CSRF/email-disabled/rate cases.
  Only their guarded disposable databases were used and dropped.
- The production build was not rerun by the agent; unrelated passing unit/catalog/
  lint/type checks were not rerun without reason. Those earlier Step 2 results
  remain recorded below. Only documentation changed during this follow-up.
- Actual installed Next source confirms default `distDirRoot=.next`, with development
  phase output changed to `.next/dev`. Interactive `npm run dev` and both `--dev`
  integration suites share that same dev directory; their different ports do not
  isolate their output. Production `next build` writes `.next`, while both normal
  integration suites use `next start` to consume that same production artifact.
- Development and production are not one identical leaf output directory. The
  installed build cleanup explicitly preserves `dev`, `cache`, `diagnostics`,
  `lock` and `trace`. They still share the `.next` parent and generated root
  `next-env.d.ts`; deleting all of `.next` removes the dev subtree too. Type generation
  also writes generated route metadata. This supports sequential verification,
  not a claim that dev/build overlap caused the observed EPERM.
- Before and after these production suites: no visible Node processes, no Next
  dev/build lock files, and no reachable health server on 3000/3101/3103. Afterward
  `.next/BUILD_ID` remained present and `.next/dev` absent, consistent with consuming
  rather than rebuilding the production artifact. Full command-line/process-tree
  inspection via CIM was denied in this sandbox. No residual project server was
  observed, but these checks do not identify every possible Windows file-handle
  holder, nor does a missing lock file by itself prove a server is absent.
- The current user-cleaned `.next`, server/app directories (including admin) and
  types directory are owned by the normal Windows user. Their inspected ACLs are
  inherited, include Modify for Codex sandbox identities, and show no explicit deny.
  Earlier observations included a sandbox-owned output root with similar inherited
  Modify grants. Owner identity can differ across creators; that alone does not
  establish different effective access or an EPERM cause. No ACL/security settings
  were changed and no controlled cross-identity permission experiment was performed.
- Source inspection identifies a cleanup-observability limitation: the harnesses
  signal their owned child and wait for exit or a five-second timeout; timeout
  resolution does not itself assert that the process tree or port is gone. Next's
  dev CLI has its own child/shutdown handling. No leftover was observed here, so
  neither an orphan process nor a cleanup defect causing EPERM is established.
  Do not treat the printed PASS line before finally/cleanup as process completion;
  wait for terminal return and check the known ports. No speculative test-harness,
  configuration, dependency or filesystem-permission correction was made.

Repeatable sequence is now documented in README: finish relevant dev suites one at
a time, stop only positively identified project servers, run needed quality/type
checks before final output preparation, clean only `.next` and build in one normal
Node-24 VS Code terminal, then run the two production suites sequentially without
interleaving dev/type-generation/build commands. The current successful artifact
does not need another unchanged rebuild. No Step 3 work, commit, push or deployment.

### Implemented operations and files

- `POST /api/v1/admin/content`: strict DraftInput, server-owned draft status,
  revision 1 and trusted authorship, incomplete learning bodies permitted, explicit
  AdminContentDTO, 201 and a detail Location. No client role/owner/status/revision/
  audit values are accepted. Real unique-index collisions return 409 SLUG_TAKEN.
- `PATCH /api/v1/admin/content/:id`: required expectedRevision, allowlisted partial
  fields, omission preservation, complete merged-candidate validation, array
  replacement, optional text/URL removal via null and reviewedAt:null clearing.
  Malformed IDs return 422, absent records 404 RESOURCE_NOT_FOUND and stale saves
  409 CONTENT_CONFLICT. Successful edits increment the content revision exactly once.
- Both routes use canonical admin cookies and the existing live verification gate,
  exact Origin/session-bound CSRF and 64 KiB JSON handling. The public catalog
  mutation services independently enforce admin access for non-HTTP callers.
  Thin Node Route Handlers live under `src/app/api/v1/admin/content/`.
- `src/modules/catalog/service.ts` implements both use cases. `repository.ts`
  checks existing migration/index readiness without automatic setup and owns the
  catalog guard. `schemas.ts`, `validation.ts`, `dto.ts` and `errors.ts` provide
  strict PATCH validation, safe field feedback, allowlisted DTOs and finite error
  translation. Unknown request keys/values, raw Mongo/Zod errors and secrets are
  not reflected into error messages. Unknown commit outcomes are dependency errors
  requiring reconciliation, not falsely reported as definite stale-write failures.
- Domain writes share one Mongoose connection/session: catalogState first, the
  identity-owned admin profile fence next, then content and administration-owned
  append-only audit. Catalog revision, content revision and the profile stateRevision
  fence advance once per accepted mutation; commitSerial is unchanged. Transactions
  use primary/snapshot/majority, a 15-second overall deadline and bounded commit
  time. Aborted callbacks may retry but recheck canonical profile role/lifecycle and
  content revision/state. No parallel callback writes or external provider calls.
- `src/modules/identity/mutation-guard.ts` owns the profile fence, rechecking current
  active/admin state under the same transaction; catalog does not write identity's
  collection directly. Downgrades/deletion cannot be authorised solely by a stale
  resolved actor. Audit uses the existing administration service and records trusted
  actor, prior/new content revisions, changed field names and the same request ID
  returned in X-Request-Id. Shared HTTP helpers retain old defaults while supporting
  an explicit server-generated request ID and Location for these mutations.
- Existing migration 001, schemas/collections/indexes and connection infrastructure
  are reused. Requests fail closed with 503 DEPENDENCY_UNAVAILABLE if migration,
  singleton or uniqueness prerequisites are missing; they do not seed state, create
  indexes or synchronise migrations on startup. README covers setup and restrictions.

### Verification: actual outcomes

- Node 24.22.1 / npm 10.9.3: all 22 unit tests passed, including PATCH omission and
  privilege rejection, safe field errors, DTO omission/null/date contracts, request-ID
  propagation and duplicate/concurrency/uncertain-commit error classification.
- `tests/integration/admin-content.ts --dev` passed against a dedicated Next dev
  server on port 3103 and random `prep_pilot_s2_test_*` Atlas databases. It proves
  permitted admin create/edit and denied anonymous/student calls, direct-service
  permission enforcement, POST/PATCH CSRF rejection and signed expiry distinction,
  strict inputs, transport limits, required setup, duplicate/missing/malformed/stale
  cases, partial subject/topic validation, null removal, array replacement, unsupported
  statuses, historical slug protection, safe DTOs/headers, real unique-key and edit
  races, transactional profile-role/lifecycle fencing and counter overflow protection.
  Actual MongoDB audit-validator rejection rolls back both create and edit, preserving
  content/catalog/audit and profile revision state. Successful mutations advance
  revisions once and produce one audit event with the response request ID.
- The first integration attempt identified that existing authentication's Profile
  upsert updates profile.updatedAt even when merely resolving an actor. Auth code was
  intentionally left unchanged. Atomicity snapshots compare every content/catalog/
  audit field and all profile fields except that existing auth-bookkeeping timestamp;
  no assertion excludes content timestamps or revision/role/lifecycle checks.
- Existing authentication regressions passed in development mode against a separate
  owned server and disposable `prep_pilot_auth_test_*` database, including homepage/
  health, signup/login, session persistence/revocation/expiry, role/lifecycle isolation,
  CSRF, disabled email flows and durable rate limits.
- Existing `npm run test:catalog` integration passed again, including migration
  repeatability/checksum/lease/conflict preservation, canonical test/live guards and
  disposable admin-provisioning/audit rollback. Migration 001 was not replaced or
  changed. No real account was promoted and no long-lived database was migrated.
- ESLint with zero warnings and `npm run typecheck` passed. Formatting and Git diff
  whitespace checks passed for the changed implementation. No dependencies installed.
- At implementation time, production `npm run build` was attempted once after type checking, with the owned
  dev suite stopped. It failed during generated output creation with exactly
  `EPERM: operation not permitted, mkdir 'C:\PROJECTS\prep-pilot\.next\server\app\admin'`.
  No unchanged failing build command was repeated. This filesystem error does not
  establish the underlying Windows lock/ACL/sandbox cause. This historical acceptance
  blocker is now superseded by the current user-run clean build and agent-run
  production integrations recorded in the follow-up above.

All database setup, role/state fixtures, synthetic lifecycle records and audit
failure injection were restricted to guarded disposable database names; successful
suites stopped their owned servers and dropped their test databases. Environment
files/credentials were not changed or printed. Git pushing was not investigated or
attempted. Scope has no visual UI changes; no new browser visual acceptance is claimed.

### Temporary restrictions and next step

Only drafts are editable; published/archived records return 409 INVALID_CONTENT_STATE
until lifecycle handling exists. Previously published drafts retain immutable slugs
through publication-history timestamps; future reopen logic must retain those fields.
Accepted same-value/metadata-only patches still advance revisions and audit once.
There is no blind creation/PATCH retry guarantee; reconcile uncertain outcomes.

Only empty assetIds are accepted. DTOs contain empty assetIds/attachments and zero
attachmentCount, never invented ready assets, signed URLs or upload capabilities.
Live verification and password recovery remain incomplete/disabled in all configuration
modes; their flags and native-route protections are unchanged. No R2 or email work.

The Location identifies the future detail resource; GET/list/search/pagination,
content-library/editor UI, student content, preview, publishing/archive/reopen and
reviewed seeds are not implemented by Step 2. Guarded reads are needed for normal
API-based recovery after an uncertain save; no recovery UI is claimed yet.

Step 2's approved scope is now fully verified by the combined functional checks,
user-run current clean production build and agent-run production integrations.
Step 3's service/DTO foundation is ready, but Step 3 requires separate explicit
approval and should implement guarded content
reads and the content-library UI only; it was not started here. Before using the
new endpoints on a long-lived development database, explicitly select that database
and apply existing migration 001 through the documented setup command if not already
applied. This task only performed setup in disposable test databases.

## Build troubleshooting follow-up: clean build and production regression pass

Production-build acceptance is now satisfied by the user-supplied VS Code clean
build output and the subsequent agent-run production-server regression. The exact
underlying cause of the earlier Windows EPERM remains unproven. No Step 2 work, commit, push, deployment,
dependency upgrade, application/configuration change or permission/Windows-security
weakening was performed during this troubleshooting follow-up.

- Inspected the working tree and preserved all Step 1 edits/untracked files plus
  the pre-existing generated `next-env.d.ts` diff. The actual build script is
  `next build --webpack`, Next.js 16.4.2, with the default `.next` output directory;
  next.config.ts only validates server configuration and disables poweredByHeader.
- System Node is 22.20.0; the project requires Node 24. The reproduced build used
  the existing local Node 24.22.1 runtime and npm 10.9.3, so this reproduction was
  not running on the wrong major version. No runtime/dependency installation occurred.
- During the earlier Codex attempt, narrowly scoped `.next` write approval did not
  prevent the build from failing during
  compilation with exactly: `EPERM: operation not permitted, mkdir
'C:\PROJECTS\prep-pilot\.next\server\app\dashboard'`.
- `.next` is an ordinary directory, not a reparse point. Inspected root/server/app
  ACLs show inherited Modify permissions for the Codex sandbox identities and no
  explicit deny in those inspected ACLs. A Node mkdir/write/removal probe in the
  same `.next/server/app` parent succeeded. This argues against blanket write denial,
  but does not establish the cause of the build-time failure or rule out a transient
  Windows lock, security-policy interaction or a build-time filesystem race.
- No Node processes were visible through Get-Process and neither Next production
  nor development lock file existed. Full process command-line inspection was
  unavailable: CIM access was denied, and tasklist failed with an OS identity error.
  No processes were stopped. These observations do not positively exclude every
  external process/lock; concurrency and Windows file locking remain unconfirmed.
- Cleanup was restricted to a guarded, absolute `.next` target, but Codex rejected
  the entire cleanup/build command before execution with:
  `approval required by policy, but AskForApproval::Granular.sandbox_approval is false`.
  Therefore no Codex clean build was run and no Codex output deletion occurred. The policy block
  on cleanup is confirmed; it is not proof that the original mkdir error has the
  same cause. Application/build configuration defects are not established either.

The user subsequently ran the following in the VS Code **PowerShell** terminal in
`C:\PROJECTS\prep-pilot` and supplied successful production-build output:

```powershell
Set-Location -LiteralPath 'C:\PROJECTS\prep-pilot'
$env:PATH = (Join-Path $PWD '.tools\node_modules\node\bin') + ';' + $env:PATH
node --version
npm.cmd --version
if (Test-Path -LiteralPath 'C:\PROJECTS\prep-pilot\.next') {
  Remove-Item -LiteralPath 'C:\PROJECTS\prep-pilot\.next' -Recurse -Force -ErrorAction Stop
}
npm.cmd run build
```

User-supplied result: Node 24.22.1 / npm 10.9.3; Next.js 16.4.2 compiled in 11.7s,
TypeScript finished successfully, all four static pages generated, and build traces
and page optimisation completed. No cleanup error was shown. The agent did not run
or independently reproduce that clean build; this is explicitly user-provided build
evidence, not an agent-run build or a deployment. It demonstrates that the same
application/configuration can build in VS Code after generated-output cleanup; it
does not isolate whether stale output, a transient lock or the Codex environment
caused the original EPERM.

Agent-run verification after receiving that output: Node 24.22.1 invoked
`node --env-file=.env.local --import tsx tests/auth-integration.ts` without `--dev`,
so the suite used `next start` against the production artifact. It exited 0 and
passed homepage/health, signup/login, duplicate/input/Origin checks, persistent,
revoked and expired sessions, current role/lifecycle guards, profile concurrency,
CSRF codes/session binding, disabled email paths and durable rate limits. Only a
disposable `prep_pilot_auth_test_*` database was used; it was dropped and the owned
test server stopped. Prior Step 1 unit/catalog integration/lint/type-check results
remain as recorded below; they were not all rerun during this build follow-up.

Git readiness was checked without writing Git state: branch `dev`, upstream
`origin/dev`, intended remote `https://github.com/rajpatel110/prep-pilot.git`.
A fresh read-only `git ls-remote --heads origin dev` succeeded and returned
`b5525f80efd213597d6d134f809b515e8dbb4402`, matching local HEAD. Step 1 changes
remain uncommitted, with no new local commit to push. No push was attempted during
Step 1 or this follow-up, consistent with the explicit prohibition. An exact error
from an older push attempt is not available in the inspected evidence; reflogs do
not prove that a push was attempted. Read access succeeding does not verify write
permission, and no push/dry-run push was used to test it. Build acceptance is now
met. Step 1 is ready for a scoped, reviewed commit when explicitly authorised;
exclude the unrelated pre-existing generated next-env diff and real environment
files. Commit/push approval has not been granted, and neither action was performed.

## Step 1: permission/security and catalog persistence foundation

This section is the current milestone result; older verification notes below are
historical and do not establish a passing production build for this source state.
Only Step 1 is implemented. No content CRUD endpoints, forms, publishing workflows,
student content pages, R2 integration, commit, push or deployment are included.
Homepage, authentication UI and the existing design system are unchanged.

### Completed

- Extracted the existing service guards into a directly testable implementation,
  retaining canonical uncached session lookup and current profile lookup on every
  call. Anonymous/student/admin/downgraded/deleting actors, live unverified actors
  and verified permitted actors are covered by direct unit and real-session service
  tests. Browser-supplied identity/role headers do not grant access.
- CSRF now returns `CSRF_INVALID` for missing/invalid protection and rejected
  Origin, and `CSRF_TOKEN_EXPIRED` only after verifying the signature and session
  binding. Tampered expired tokens remain invalid. Existing auth regression checks
  also exercise these application response codes and request IDs over HTTP.
- `HttpError` supports trusted safe field-level string-array messages under
  `error.fields`. Existing no-field responses, status codes, no-store headers,
  request-ID matching, rate-limit headers and unknown-error redaction are retained.
- Added strict Zod draft/document schemas, explicit Mongoose `contentItems` and
  `catalogState` models, bounded provenance/company fields, safe-integer revision
  constraints, configured subject/topic IDs and conservative Markdown validation.
  Unknown/server-owned input fields and every nonempty attachment array are rejected.
  Draft content bodies can remain incomplete; no publication service is implemented.
- Administration owns the append-only audit insertion interface. It requires the
  caller's domain transaction. Restricted provisioning now uses the identity-owned
  profile model and the same Mongoose connection/session for promotion plus audit,
  with prior/new revisions, current active-state checks and idempotent admin handling.
- Added explicit development/test database selection and versioned migration 001,
  immutable checksum verification, a fenced runner lease, restart-safe index creation
  and verification, duplicate/invalid-record preflight and singleton `$setOnInsert`.
  Existing content, singleton counters/timestamps and unrelated indexes are retained.
  An applied migration with a missing singleton fails rather than resetting it.
  Conflicts fail for operator review; no automatic index synchronisation or deletion.
- README documents explicit setup/provisioning flags, ownership, indexes, migration
  recovery, isolated tests and the deferred feature boundaries. Starter topic IDs
  are configuration defaults to review before curation, not a completed planner
  template or an assertion about reviewed/available content.

### Verification and environment

- Node 24.22.1 / npm 10.9.3: all 17 unit tests, formatting, zero-warning ESLint and
  `npm run typecheck` passed. No dependencies were installed.
- The catalog integration suite passed against randomly selected disposable
  `prep_pilot_step1_test_*` Atlas databases using development credentials. It ran
  the actual setup and provisioning commands; proved unique slug/partial seed
  indexes, preservation on rerun, checksum/lock/restart/conflict handling, and
  real test/live canonical guards. Audit rejection rolled back the complete profile
  change, including role/revision/timestamps. Successful promotion was audited once.
  Unknown identities, deleting profiles and live unverified identities were denied.
  Only disposable test identities were promoted; disposable databases were removed.
- Existing authentication regressions passed against an isolated development server
  and disposable `prep_pilot_auth_test_*` database: homepage/health, signup/login,
  duplicates, persistence, revocation/expiration, current role/lifecycle guards,
  profile concurrency, CSRF, disabled email paths and durable rate limits. The owned
  test server was stopped and its database removed.
- Production `npm run build` was attempted three times, including after explicit
  `.next` write permission and with the development test server stopped. All were
  blocked by Windows `EPERM` creating generated `.next/server/app` directories
  (dashboard, verify-email, api/v1/security). Those historical failures are now
  superseded for acceptance by the user-supplied clean VS Code production build
  and agent-run production-server regression detailed above. Application protections
  and dependency/configuration settings were not weakened to bypass the sandbox.
- The pre-existing `next-env.d.ts` diff changes generated imports from
  `.next/dev/types` to `.next/types`. Next's development and production generators
  select different output paths; this is not an application behaviour change.
  The file was not manually edited or staged. Any such generated diff is excluded
  from the Step 1 source change scope; no unrelated generated files are added.

No setup was performed against the configured long-lived development database.
No production database, real account or credentials were changed. Operators must
select their actual development target explicitly and run the documented migration
before enabling future catalog writes. Secrets remain in ignored local settings
and are never included in test output or documentation.

### Limitations and next step

Live verification and password recovery remain **incomplete**. Test/live capability
flags stay false for these flows, and wrappers continue returning `EMAIL_DISABLED`;
changing email mode does not make unimplemented flows operational. R2 and attachment
activation, publication checks/transitions, content services/DTOs/UI and reviewed
seed content are deferred. A future Markdown preview needs a sanitising renderer.
Raw model/query updates are not an approved content mutation interface: Step 2 must
validate full candidate documents and enforce revisions transactionally, not rely
on update validators for `$inc` or multi-field invariants.

The Step 2 foundation is implemented and its targeted security/persistence checks
pass. The clean production build and production-server authentication regression
also pass, with evidence ownership distinguished above. Before starting transactional
draft creation/editing, obtain explicit Step 2 approval. Step 2 should add authorised services with catalog/profile lock order,
content/catalog revision guards, atomic content/audit writes, strict field validation
and stale-edit/duplicate-slug/rollback tests. Do not start forms or publishing yet.

## Scope

Pre-commit verification: formatting, lint, TypeScript and all six unit tests pass.
The user confirmed sign-in works from the VS Code terminal after the Codex-hosted
server hit generated-file EPERM. HTTP checks of that server's login and health
routes returned 200. No build was rerun alongside the user's active dev server.
Prior production build and account integration evidence is recorded below; the
latest warning-only rebuild remains subject to the documented sandbox limitation.
Local credentials remain ignored and are excluded from the commit.

Auth warning fix: profile provisioning uses Mongoose's returnDocument="after"
instead of deprecated new=true. Root HTML declares smooth-scroll behaviour for
Next.js route transitions. Observed signup/login requests succeeded; the initial
signup included development compilation and database/authentication startup time.
All six unit tests and the isolated development authentication suite passed after
the warning fix. Production compilation and TypeScript passed, but prerendering
again hit the sandbox's intermittent EPERM on generated _not-found output.

Latest resolution: local auth setup now replaces AUTH_ENABLED=false with true,
fills blank secrets (including quoted empties), preserves existing credentials
and email mode, and is idempotent. Two regression tests cover copied-example
Windows line endings and preservation. All six unit tests, formatting and lint
pass. The production build and its TypeScript check now pass with the development
server stopped; this supersedes the earlier final-build permission limitation.
The production-server disposable-database authentication suite also passed after
this build, including expired/revoked sessions and student/admin isolation.

Final verification note: the latest source passed formatting, lint, TypeScript
and all four unit tests. Isolated development-server integration also passed,
including rejecting expired sessions before TTL cleanup. An earlier production
build/integration run passed; final rebuild attempts were blocked by Windows EPERM
on generated output directories, including a fresh temporary verification copy.
The cleanup command was rejected by environment approval policy. No successful
final production rebuild is claimed; rerun `npm run build` outside this sandbox
before release. No application security settings were weakened to work around it.

Authentication foundation (current): signup/login/logout, Better Auth 1.7.12 with
its official MongoDB adapter, Mongoose profiles, bounded connections, unique
indexes, persistent cookies, current role/lifecycle guards, HMAC CSRF bootstrap,
durable account/shared rate buckets and protected placeholder destinations.
Local secrets were generated only when absent; existing URI credentials preserved.
The setup command verified indexes against the configured development database.
Homepage account links now lead to working signup/login pages matching its palette.

Unit checks pass for routing, input allowlists, enabled-config requirements and
session-bound CSRF expiry/tampering. A disposable Atlas database integration run
passed signup, duplicates, wrong credentials, persistence/revocation, role changes,
student/admin isolation, concurrent profile provisioning, CSRF gates, disabled
email paths and rate limits. The disposable database/server were cleaned up.
Strict types, lint and the production build passed during implementation.
Desktop and 390px login rendering, password visibility, pending submission and
generic invalid-credential feedback were checked in the browser. Production
dependency audit returned zero findings; existing development-only findings remain.

This is a test-email-mode foundation, not completion of the entire identity PRD.
Resend verification/recovery, delivery metadata and single-use token guards remain
unimplemented; wrappers return EMAIL_DISABLED and native email routes are blocked.
Live mode gates study access without disabling verification during outages.
The local rate policy uses account/global buckets pending verified deployment-IP
extraction; see README for explicit policies. Full onboarding/dashboard/content
features are not included. Existing original design documents remain unchanged.

Mobile navigation fix: extracted a small Client Component while keeping the
homepage server-rendered. Selecting a navigation link closes the disclosure;
Escape closes it and returns focus to the Menu summary. Production-browser
checks at 390px verified Enter activation, Escape from a menu link with focus
restoration, and Subjects navigation with the menu collapsed. Format check,
lint, TypeScript and production build passed. Preview server stopped afterward.

Build resolution: `dev` and `build` now explicitly select the supported Webpack
bundler, avoiding the sandbox-specific Turbopack PostCSS worker connection failure.
The standard format check, lint, typecheck and `npm run build` passed. The build
needed explicit write permission to the generated `.next` directory after an EPERM
error; no permissions were weakened in application configuration. Development
preview returned HTTP 200. Browser checks confirmed 390px and 320px hero reflow
and mobile menu open/close with Enter. Prior production HTTP and FAQ checks also
passed. This is targeted verification, not a complete accessibility audit.
The owned development server was stopped after verification.

Homepage verification follow-up: format check, lint and TypeScript passed again.
The diagnostic `next build --webpack` production build passed, including static
homepage generation. Production HTTP checks returned 200 for `/` and `/api/health`,
with the expected health JSON. Browser inspection confirmed the homepage renders
and the automatic-plan-change FAQ expands to its answer. Full responsive and
keyboard acceptance remains outstanding. The standard Turbopack build still fails
connecting to its spawned CSS worker; no successful default build is claimed.
The production preview server was stopped after checks.

Homepage follow-up: approved local implementation of the reviewed Stitch landing
direction. Includes an ivory/forest responsive homepage, sample plan, workflow,
subjects, illustrative progress and adjustment examples, native FAQ disclosures,
mobile navigation and availability messaging instead of unavailable signup routes.
No authentication, persistence, provider integration or deployment is included.
Existing design documents are unchanged.

Homepage validation: format check, lint and TypeScript passed. Git diff whitespace
check passed. The default production build failed when Turbopack could not connect
to its spawned CSS worker. A diagnostic Webpack build failed with EPERM creating
.next/server/app/_not-found. Neither build is claimed successful. The local dev
server reported ready, but browser and HTTP requests could not reach it in this
environment; desktop/mobile rendering and keyboard acceptance remain unverified.
The preview server was stopped. No dependencies were installed and no commit,
push or deployment was performed.

Approved: a local, credential-free scaffold. No commit, push or deployment is
authorised for this milestone. The four existing design documents remain unchanged.

Implemented: Next.js App Router, strict TypeScript, Tailwind visual foundation,
public liveness Route Handler, separated public/server configuration, npm lockfile,
lint/format commands, CI definition, README and AGENTS.md.

This is a checkpoint within PRD Foundation. Foundation's Atlas service-layer read
and Vercel deployment acceptance gates are **not complete**.

## Future module boundaries

Create modules only when implementing a real slice. Do not add empty models,
repositories or services merely to populate the tree.

| Future location              | Ownership                                                                                     |
| ---------------------------- | --------------------------------------------------------------------------------------------- |
| `src/modules/identity`       | Better Auth adapter, trusted actors, current roles, verification gate and Profile preferences |
| `src/modules/catalog`        | Content, publication invariants and catalog revision                                          |
| `src/modules/practice`       | Immutable attempts, submission idempotency and history                                        |
| `src/modules/revisions`      | Revision collection, interval rules, cycle identity and due queries                           |
| `src/modules/planning`       | Pure deterministic engine, previews, transactional confirmation and task state                |
| `src/modules/progress`       | Read-only saved-record aggregations                                                           |
| `src/modules/files`          | Private R2 grants, byte validation, leases, quota and cleanup                                 |
| `src/modules/notifications`  | Resend adapter, email modes and delivery metadata                                             |
| `src/modules/administration` | Admin use cases and audit orchestration via owning services                                   |

Routes and UI call services; repositories own queries. Services enforce ownership
even when called directly by Server Components. Cross-module writes go through
public services that participate in the same domain transaction where required.
No R2/Resend calls inside retried MongoDB transaction callbacks.

Keep shared server mechanisms in `src/shared/server`, reusable UI in
`src/shared/ui`, and versioned company/topic templates in `src/config`.
Operational scripts belong in `scripts` and use TypeScript. Future integration
tests use `tests/integration` with a replica set; browser journeys use `tests/e2e`.

## Design clarifications and defaults

- The System Design's separate revisions module owns revision persistence. The
  Database Design groups attempts/revisions logically under Practice; practice
  coordinates an atomic attempt/revision write through the revisions service.
- GET does not mutate study state. Lazy idempotent Profile provisioning is the
  documented exception, to be implemented with identity.
- Better Auth remains the documented recommended library; pin and verify its
  supported adapter, native routes and once-only flows during identity work.
- Public constants contain no secrets. Only optional APP_URL is validated now;
  no database/auth/provider credentials are required by the scaffold. Add gated,
  fail-closed integration schemas when implementing their features.
- Node 24 LTS and npm 10.9.3 are the chosen toolchain. CI reads `.nvmrc` and invokes
  the package scripts. No component library, external font download or feature
  infrastructure is included.
- Original Markdown documents are the supplied implementation references. The
  database document's `.docx` source note does not authorise inventing missing content.

## Verification evidence

Validated locally with workspace-local Node 24.22.1 and npm 10.9.3. The system-wide
Node 22 installation was not changed. `.tools/` holds the ignored local runtime.

- `npm ci`: passed with the final lockfile (ESLint support warning noted below).
- `npm run format:check`, `npm run lint`, `npm run typecheck` and
  `npm run build`: passed. Build required no service credentials.
- Development and production HTTP smoke checks: home page and health endpoint
  returned 200; health envelope, request ID and no-store header matched the contract.
  Production stylesheet loaded and included the ivory/forest palette.
- Environment checks: empty environment uses localhost; malformed, non-HTTP,
  credential-bearing and path-bearing origins are rejected without echoing values.
- `npm audit --omit=dev`: zero production vulnerabilities. Full audit has the
  development-only findings below; no forced fixes were applied.
- Original SHA-256 hashes for all four design documents are unchanged.
- Both smoke-check servers were stopped. No cloud connections, commit, push or deployment.

No browser surface was available to the session. Visual mobile/desktop rendering,
keyboard interactions and computed contrast remain manual verification items.
Semantic headings, a skip link, visible focus styles and responsive classes are
present, but HTTP/source checks do not constitute browser acceptance evidence.
GitHub Actions was configured, not remotely executed. No feature test suite was
added for this scaffold; rule/security/persistence tests arrive with those features.

### Toolchain limitations

ESLint 9.39.5 is pinned because the React/import/accessibility plugins bundled
with eslint-config-next 16.4.2 declare ESLint support only through version 9.
npm marks ESLint 9 unsupported; ESLint 10 was evaluated and rejected because
it produces incompatible peer ranges. Revisit when the Next config's plugins
support ESLint 10. Do not hide this with legacy-peer-deps or forced installation.

npm audit reports five high-severity development-only findings through
eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces.
The registry's latest braces is 3.0.3, within the reported affected range.
No compatible patch was available in the checked dependency chain. The suggested
Next ESLint configuration downgrade to 14.2.35 was not applied. These findings
must be revisited before release; no clean full audit is claimed.

## Next milestones

1. Persistence foundation: bounded Mongoose connection, explicit collections,
   migration/index tooling and reviewed sample Atlas read through services.
2. Identity/preferences: library-owned auth collections, sessions, role guards,
   Profiles, CSRF, durable rate limits and explicit email capabilities.
3. Catalog/admin: published discovery, DTOs, audit transactions and reviewed seeds.
4. R2 files: activation, private direct transfer, immutable final objects, quota
   and guarded cleanup.
5. Attempts/revisions/progress: atomic writes, retry receipts and known-data metrics.
6. Planning: pure rules, persisted previews, guarded confirmation and adaptation.
7. Email/release: delivery, replay-safe flows, session revocation, complete journeys,
   reviewed content, recovery and separately authorised deployment.

Live email needs a verified sending domain. R2 activation, provider accounts,
regions/network policy and content provenance remain release dependencies.
