# PrepPilot

## Hosted checkpoint: temporarily shared database

Hosted app: <https://prep-pilot-theta-tan.vercel.app>. The existing hosted database
is still named `prep_pilot_dev`; it contains real owner/account/content state and
must not be treated as disposable. By the owner's current decision, local and
hosted continue sharing this database. Separation to `prep_pilot_local` is
deferred; no Atlas or real environment configuration was changed.
See [deployment notes](docs/DEPLOYMENT.md) for current safety rules.

Local runtime accepts the shared target without an extra flag. Operator scripts
still require exact `HOSTED_DATABASE_CONFIRMATION` for shared-target operations
and always reject it as a test target. Preview refuses hosted/local targets.
Use disposable databases for all automated/browser fixture writes and cleanup.
Keep EPERM diagnosis paused and use the established user-run build fallback.

A modular monolith for placement preparation across DSA, aptitude and CS fundamentals.
This repository implements the homepage, authentication, owner/admin catalog
workflows, student practice, planning, Progress and Settings.
The homepage follows the reviewed Stitch landing direction, with responsive sections,
native FAQ disclosures and explicitly illustrative plan/progress examples. Accounts,
persistent database sessions and protected account destinations are implemented.
Attachment integration is mock-verified; real R2 and hosted email remain disabled.
The sample-plan links show illustrative data only.

## Run locally

Light/dark appearance follows the system initially and remembers an explicit
choice in localStorage only. See [theme implementation and focused verification](docs/THEMING.md).
No account/database setting, external service or additional dependency is needed.

Use Node **24 LTS** (see `.nvmrc`) and npm **10.9.3**. With a Node version manager,
select Node 24, then select the recorded npm version if necessary.

```sh
npm ci
npm run dev
```

Open <http://localhost:3000>. On Windows PowerShell, use `npm.cmd` if `npm.ps1`
is blocked; no execution-policy change is needed. Do not initialise a new repository.

The scaffold runs with **no environment file and no external-service credentials**.
Optionally copy `.env.example` to `.env.local` to change `APP_URL`, which must be an
HTTP(S) origin without credentials, a path, query or fragment. The default is
`http://localhost:3000`. It supplies metadata and, when authentication is enabled,
the exact trusted Origin for account/application writes.

## Commands

## Authentication setup

Use a development Atlas replica set and an ignored `.env.local` with `APP_URL`,
`MONGODB_URI` and `MONGODB_DB_NAME`. Run `npm run auth:setup` to add independent,
random authentication, CSRF and rate-limit secrets without printing them, and to
enable test-mode auth. This command preserves existing nonempty credentials.
Before enabling signup, explicitly select a development database and run:

```sh
npm run db:setup -- --database <development-db-name> --environment development
```

Use your actual development database name, not the literal placeholder. The command
requires `MONGODB_URI` and both selection flags; it never infers a target from the
URI or `MONGODB_DB_NAME`. Production mode and system databases are rejected. It
creates/verifies auth/profile, rate-bucket, catalog and audit indexes using the
versioned migration described below. It does not delete records or drop indexes.
Restart the server after setup. Applications never run index synchronisation.
Use the exact configured origin in your browser (normally `http://localhost:3000`);
switching between localhost and 127.0.0.1 is a different origin and is rejected.

`AUTH_ENABLED=false` permits credential-free builds and disables account APIs.
Enabled auth requires a MongoDB URI/database and three independent secrets of at
least 32 characters: `BETTER_AUTH_SECRET`, `CSRF_SECRET`, `RATE_LIMIT_SECRET`.
Never place secrets in public configuration or commit `.env.local`.

Better Auth 1.7.12 and its MongoDB adapter own `user`, `account`, `session` and
`verification`. Mongoose owns `profiles` and rate-limit infrastructure. Default
sessions last seven days with once-daily refresh; the unchecked remember option
uses a browser-session cookie. Protected requests consult canonical sessions and
the current profile role/lifecycle without cookie authorisation caching.

Signup always creates students. After sign-in, `/account` sends students without
preferences to `/onboarding`, otherwise `/dashboard`; admins go to `/admin`
without student preferences. These are protected placeholders, not complete study
screens. Live-mode unverified actors go to `/verify-email` before study access.
`GET /api/v1/me` returns capabilities and a derived `destination`; admins retain
the documented `open_dashboard` nextAction, with destination selecting `/admin`.

Email verification and password recovery use Better Auth server methods and a
server-only explicitly selected Resend or Brevo transport. Sending is separately opt-in and disabled by default;
existing credentials alone do not change demo behavior. `EMAIL_MODE=test` still
allows unverified study access. `EMAIL_MODE=live` gates study/admin access but does
not activate mail. Native public token routes remain blocked.

See [email operations](docs/email/OPERATIONS.md) for exact owner-inbox opt-in,
additive migration 004, single-use/expiry/privacy/retry rules and a disposable-account
walkthrough. Resend's testing sender is **owner-inbox only**, not general-user live
delivery and not the application's EMAIL_MODE. No sending domain was verified or
purchased. For the approved verified-mailbox Brevo rollout without a purchased
domain, use [Brevo setup and staged enforcement](docs/email/BREVO.md); sender
verification is not domain authentication. Single-inbox Brevo verification/recovery
passed according to the user; second-inbox and hosted delivery remain unverified. Automated
delivery tests use mocks (`npm.cmd run test:email`), never real account credentials.

Rate limits are MongoDB-backed and fail closed. This initial local foundation
uses HMAC account buckets (10 login requests / 15 minutes; 5 signups / 15 minutes)
plus shared deployment caps (200 logins / 15 minutes; 30 signups / 15 minutes),
rather than trusting arbitrary forwarded IP headers. Tune and add verified
hosting-IP policies before deployment; shared caps can affect unrelated users.
Application authenticated mutations use session-bound HMAC CSRF tokens from
`/api/v1/security/csrf`, in addition to exact Origin and JSON checks. Native auth
mutations retain Better Auth origin checks plus the route wrapper's checks.

Owner-controlled administration replaces direct operator admin grants. Register,
sign in and verify the intended owner's existing account first. Follow
[owner setup and management](docs/admin/OPERATIONS.md) for exact Git Bash commands:
explicit development/test database migration 006, read-only account preview, then
revision-guarded owner provisioning. Nothing promotes the first signup or a name.
Only the owner may grant/remove admin access through `/admin/administrators`.
New admin grants require target verification even in demo mode. The legacy
`admin:provision` command cannot grant access or overwrite an owner; existing
admin/owner records are read-only no-ops. Tests use disposable accounts only.

`npm test` exercises routing, strict content validation, direct permission guards,
CSRF classification and safe error envelopes without a database. The React-server
condition lets Node import the same server-only modules used by the application;
it does not remove their client-import protection.
`npm run test:integration` requires a successful build and local MongoDB settings;
it starts a server on port 3101, creates a uniquely named `prep_pilot_auth_test_*`
database, tests real account/session/role flows, then drops **only that test
database** and stops its server. Use a development database user allowed to create
and remove this disposable database. It never drops your configured database.
CI runs the pure tests; database integration is a separate local check.
If generated production output is unavailable in a restricted local environment,
`node --env-file=.env.local --import tsx tests/auth-integration.ts --dev` runs the
same isolated checks against the development server. This does not replace a
successful production build for release acceptance.

## Catalog persistence foundation (Step 1)

Step 1 provides models and validation; Step 2 adds only the draft mutations documented
below, not forms, publishing, student discovery or file integration. `contentItems` has strict classification,
provenance, company associations, draft/published/archived enum values, trusted
author fields and safe-integer revisions starting at 1. The starter subject/topic
allowlist lives in `src/config/catalog.ts`; review these IDs before curation. It is
not the complete scheduling template or prerequisite graph. Draft text may be
incomplete. Markdown validation conservatively rejects HTML and unsafe link schemes;
a future rendering/preview slice still needs a sanitised Markdown renderer.

The original foundation rejected all nonempty `assetIds`; the attachment milestone
now permits up to five validated references and publishes only ready assets.
Files remain disabled by default; see [attachment operations](docs/files/OPERATIONS.md).
Lifecycle transitions and publication checks now use the existing service guards.
Step 2 introduced atomic
draft revisions and content/audit orchestration; raw query updates are not an approved write API.
Mutation services validate complete candidate documents and use revision guards;
Mongoose update validators alone do not validate `$inc` or cross-field invariants.

`catalogState` uses `_id="catalog"`, initial `revision=0` and `commitSerial=0`.
Setup inserts it only when absent during initial migration; reruns preserve existing
counters/timestamps and content. An applied migration with a missing singleton fails
rather than resetting it. Invalid existing catalog data, duplicate unique keys and
incompatible indexes fail for operator review; nothing is silently repaired/deleted.
Resolve conflicts explicitly after reviewing/backing up the selected database.

`scripts/migrations/001-foundation.ts` records the versioned manifest and checksum.
Do not edit an applied migration or its index definitions: add a new versioned
migration for future persistence changes. `schemaMigrations` records running,
applied and failed attempts. A database-wide fenced five-minute lease prevents
concurrent runners; transactional fencing protects migration state and singleton
insertion. Index operations have a shorter bounded execution time and are
restart-safe. A crashed/failed run can resume after the lock expires; checksum
mismatches are rejected. Successful reruns verify required indexes again. Extra
unrelated indexes are retained. No `syncIndexes`, index drops or startup migration.

Required named indexes are declared in `scripts/database-indexes.ts` and
`src/modules/catalog/indexes.ts`: unique auth/profile identities, rate expiry,
unique content slug, partial-unique string seedKey, status/ID, classification,
company, asset reference, title/topic/tags text search and both audit history indexes.
Mongoose owns domain models. Administration owns the append-only audit insertion
service, which requires the caller's domain transaction; provisioning goes through
the identity service using the same Mongoose connection/session.
Historical audit events remain untouched; future readers must tolerate absent
prior/new revisions on legacy provisioning events rather than rewriting history.

```sh
npm run test:catalog
```

This requires development replica-set credentials in `.env.local`. It explicitly
selects randomly named `prep_pilot_step1_test_*` databases, invokes the actual setup
and provisioning commands, tests native service guards in both email modes, unique
indexes, migration preservation/recovery/conflicts and real audit-rejection rollback,
then drops only its guarded disposable targets. It does not migrate the configured
development database or promote a real account. It needs permission to create/drop
these test databases and change a validator in a disposable collection. Configuration
or replica-set access failures are reported, not treated as passing tests.

CSRF failures use `CSRF_INVALID`; only a correctly signed, session-bound expired
token with the correct Origin receives `CSRF_TOKEN_EXPIRED`. Application errors may
include a safe `error.fields` map supplied by trusted server code; raw Zod/Mongo/provider
errors are not exposed. Request IDs and existing no-field envelopes are retained.
Live verification and password recovery remain **incomplete** in every configuration.

## Transactional admin drafts (Step 2)

- `POST /api/v1/admin/content` accepts strict DraftInput, returns `201` with an
  allowlisted AdminContentDTO, `status=draft`, `revision=1` and a detail Location.
- `PATCH /api/v1/admin/content/:id` requires a positive safe-integer
  `expectedRevision`. It preserves omitted fields, replaces supplied arrays and
  removes optional prompt/body/explanation/externalUrl fields when null is supplied.
  `reviewedAt:null` remains stored null. Required classification fields cannot be null.
- Both routes require canonical admin cookies, live-mode verification when applicable,
  exact Origin, a session-bound CSRF token and JSON within 64 KiB. Services also
  enforce current admin access independently of the HTTP caller. Browser-supplied
  role, author, revision, lifecycle and audit fields are rejected, not ignored.
- Complete candidate validation checks subject/topic consistency after merging a
  partial edit. Field errors use `422 VALIDATION_ERROR` with safe `error.fields`.
  Unknown keys/values are not reflected into error messages. Malformed IDs return
  422, missing records 404 RESOURCE_NOT_FOUND, stale revisions 409 CONTENT_CONFLICT
  and unique-index slug collisions 409 SLUG_TAKEN.
- Editing **only drafts** is supported. Published/archived items return
  `409 INVALID_CONTENT_STATE`; there is no lifecycle transition endpoint. Previously
  published drafts retain their slug: changing it returns 422 field feedback.
  Future reopen handling must preserve publication history timestamps.
- Every accepted create/edit advances catalog.revision and the admin profile's
  stateRevision once, writes content at revision 1 or expectedRevision+1, and appends
  one audit event in the same Mongoose transaction. The profile revision is an
  authorisation fence against role/lifecycle changes, not a change to student plans.
  Lock order is catalogState, profile, content, audit; commitSerial is unchanged.
  The transaction uses primary/snapshot/majority, a 15-second overall deadline and
  bounded commit time. Retried aborted callbacks revalidate state; stale client
  revisions never auto-merge. Audit requestId equals the response X-Request-Id.
- Failure rolls back catalog/content/audit and the profile revision fence. Existing
  authentication's profile updatedAt touch is separate bookkeeping and is unchanged.
  Atomicity tests compare all content/catalog/audit fields and profile state except
  that existing auth timestamp. No-op/same-value accepted patches still advance
  revisions and audit once; PATCH/create are not generic idempotent operations.
- Migration 001 must already be applied and the real unique slug index present.
  Missing setup fails closed with 503 DEPENDENCY_UNAVAILABLE; requests never seed
  singleton state, create indexes or run migrations automatically. Use the existing
  explicitly targeted setup command. No migration beyond Step 1's version 001 is
  added; this task does not apply setup to a long-lived database.
- That earlier draft-only slice accepted empty assetIds. Current file-aware DTOs
  return actual metadata/counts; no provider readiness is fabricated.

```sh
npm run test:admin-content
```

Run this only after a successful current production build. It starts its own server
on port 3103 and uses guarded, randomly named `prep_pilot_s2_test_*` databases; all
identities/roles/content/state fixtures and validator failures are disposable.
It exercises HTTP contracts, real cookies/CSRF, services, MongoDB races/uniqueness,
audit rollback and exact counter changes, then removes its database and server.
For development-only verification use `npm run test:admin-content -- --dev`; this
does not prove production-build acceptance. Do not run two Next dev suites at once.

The Location points to the documented detail resource; Step 3 now supplies its
guarded GET route, library reads, search/pagination and read-only UI. Creation has no blind retry guarantee;
unknown commit outcomes return safe dependency errors and must be reconciled, not
automatically resubmitted. Reconcile uncertain saves through guarded lists/details:
search title/topic/tags or paginate, then compare the returned slug and saved fields.
There is no undocumented slug filter or automatic creation retry.

## Guarded Content Library (Step 3)

`/admin/content` is a server-guarded, read-only admin library. Open Administration
after signing in as the owner or an owner-granted admin, then select **Open content
library**. No account is automatically promoted. Existing database setup and
authentication are required; no new service or credential is needed.

`GET /api/v1/admin/content` supports status, subject, configured topic, company,
difficulty, q, cursor and limit (20 default, 50 maximum). Unknown/repeated scalar
parameters are rejected. Company filters also include shared foundations. Search
uses the existing MongoDB title/topic/tags text index: bounded, quoted keyword
terms (MongoDB English text-index matching), not regex, client operators or
relevance ordering. Punctuation-only searches return no results. IDs ascend for
all lists, including search. No total count is returned.

Thirty-minute HMAC cursors are purpose-separated using the existing server auth
secret and bind the endpoint, ordering, normalised filters, limit and current user.
Expired/tampered/mismatched cursors return `400 INVALID_CURSOR`; restart from page
one. Pagination is not a frozen snapshot. Reads do not modify content, catalog,
audit or study state; existing identity profile bookkeeping remains unchanged.
Private responses are no-store. `GET /api/v1/admin/content/:id` returns the explicit
admin detail DTO for any saved lifecycle state; no provider keys or signed URLs.

Filters and selected status persist in the URL; load-more state resets on navigation.
Desktop rows become mobile cards. Select a title for keyboard-accessible saved
record inspection, not a student preview. Detail text is escaped plain text.
No create/edit forms, lifecycle actions, uploads, analytics or student pages exist
in this milestone. Empty databases display an honest empty state, not demo metrics.

The existing `test:admin-content` suite now also verifies read permissions, filters,
search, pagination and cursor binding with 55 disposable fixtures. Optional
`npm run test:admin-content -- --browser` pauses the isolated production test server
on port 3103 for browser review; its disposable login is `library-browser@example.com`
with the deliberately public fixture password `Disposable-library-browser-only-481!`.
Use these only on that isolated server, never as a real account. Press Enter in
the test terminal to finish (automatic cleanup after ten minutes). No reusable
fixture command writes to the configured development database.

For focused read regressions during iteration use
`npm run test:admin-content -- --dev --reads-only`; this still uses an isolated
test database and never establishes production-build acceptance. The default
suite retains the full transactional draft regression coverage.

## Editor, safe preview and publication (Steps 4–5)

The Content Library now offers **Create draft**. Select a saved title for
**Edit content**, **Admin preview** and the state-appropriate lifecycle action.
Routes are `/admin/content/new`, `/admin/content/:id/edit` and
`/admin/content/:id/preview`; all require current server-side admin access.
The new editor/preview screens extend the existing ivory/forest/charcoal style;
Stitch currently provides only the Content Library reference for this workflow.

1. Create a draft with identity/classification, source and optional learning text.
2. Edit metadata, tags, Markdown, HTTPS links, attribution, review date and optional
   Cognizant/LTM associations with their own provenance and review dates.
3. Preview the local form without saving, or open the saved revision's Admin preview.
   Explanations are revealed explicitly; external practice/resource links are labelled.
4. Save, review and publish through confirmation. A question requires a prompt or
   HTTPS URL; a resource requires a body or HTTPS URL. Review metadata must be valid.
5. Published edits must remain publishable. Archive requires a reason; reopening
   returns to draft without changing the slug or clearing publication history.

The documented publish/archive/reopen POST endpoints require JSON, Origin,
session-bound CSRF and expectedRevision. They use the existing catalog/profile/
content/audit transaction and revision fencing. Stale revisions never auto-merge.
PATCH now supports drafts and publication-valid published records; archived records
must reopen first. This supersedes the earlier Step 2 draft-only restriction.
Historical plans/attempts and saved task estimates are not rewritten.

Unchanged editor fields are omitted from PATCH, optional cleared text becomes null,
and changed arrays replace their previous values. Recoverable errors retain input.
Stale or uncertain saves block further saves until explicit reconciliation: read
the saved record and compare, discard local input, or explicitly rebase changed
fields onto the observed revision. For uncertain creates, reconciliation searches
paginated admin summaries for the attempted unique slug and loads its detail.
There is no general create idempotency guarantee or silent retry. Review the
comparison before choosing to retry or adopt a saved record. Unsaved link/back
navigation uses a confirmation dialog; tab close/reload uses the browser warning.

`react-markdown` 10.1.0 is the sole new direct dependency. It supports the installed
React version and provides a real Markdown AST renderer instead of ad-hoc HTML
substitution. Our wrapper disables raw HTML and images, allows only absolute HTTPS
links without credentials, and uses noopener/noreferrer for external tabs. No raw
HTML plugin or remote image fetching is enabled. The existing strict input safety
rules remain. See the [maintainer's security guidance](https://github.com/remarkjs/react-markdown#security).
No preview writes attempts, revisions or task completions.

`GET /api/v1/content` and `/api/v1/content/:id` require study access and expose only
published learning data through explicit student DTOs. Status is not a student
filter; all other documented filters and signed pagination rules apply, with cursor
scope separated from admin lists. Unpublished/missing detail is 404 unless an owned
attempt or plan task contains a saved snapshot; then only the unavailable reason
and that snapshot are returned, never the draft/archived body. The owning practice
and planning modules provide read-only history lookup; this does not implement
submissions, scheduling or the full student catalog UI.

The earlier empty-attachment restriction is superseded by the attachment milestone.
Real R2 activation/acceptance and reviewed seed content remain external gates;
see attachment operations and the email section for current capability limits.

The existing admin integration suite now also exercises the full lifecycle,
publication-valid edits, history isolation, revision races and lifecycle audit
rollback against disposable records. `--lifecycle-only` skips old draft cases during
focused iteration; `--reads-only` skips lifecycle writes. Browser review may add
`--browser-ms=180000` to shorten the optional fixture pause (30 seconds–10 minutes).
These flags do not replace final full regression/build verification.

## Student onboarding and reading

Students without saved preferences are directed to `/onboarding`: choose Cognizant,
LTM or both, a study budget/deadline, and three 1–5 self-assessments. The final save
uses `PATCH /api/v1/me/preferences` with CSRF and `expectedStateRevision`; it replaces
the complete preferences object, not individual nested values. A saved deadline
must allow seven inclusive days in Asia/Kolkata. Existing past deadlines remain
readable; a later edit must meet the current save rule.

Completed students continue to the functional `/dashboard`. The content library
remains independently browsable. `/onboarding?edit=1` edits existing preferences without
generating or accepting a plan. Admins continue to their admin workspace.

The library uses real published-content list/detail services and API pagination,
URL search/subject/topic/company/difficulty filters, and Load more. Detail back
links preserve filters. Tab-local storage keeps only a page-count/scroll hint,
never content bodies or credentials; returning refetches up to 20 pages from the
real API. Cursor expiry offers a fresh first-page read. No total count is invented.
Question/resource pages reuse the safe Markdown renderer and clearly label HTTPS
destinations; neither reading nor link clicks records completion or outcomes.

Reviewed Stitch desktop onboarding/library/question/resource screens and mobile
schedule/library references guide the layout. Prototype state switchers, unsupported
companies, bookmarking/sharing, fake totals and plan/outcome/completion controls are
intentionally omitted. See `docs/student/DESIGN.md` for the adaptation decisions.
No new dependency, service account or credential is required.

`npm.cmd run test:student -- --dev` runs the connected HTTP/server-page integration
against its own migrated `prep_pilot_student_test_*` database and port 3104.
`--browser` holds disposable fixtures for ten minutes, or until Enter, then cleans up. Its explicit
test login is `student-browser@example.com` / `Disposable-student-browser-only-481!`,
not a real account. Never reuse that password for real credentials. `--direct`
exercises actual Route Handlers/auth/MongoDB without a Next server when compiler
output is blocked; it explicitly skips browser/pages/routing assertions and does
not substitute for production verification. Omit `--dev` for a successful current
production artifact. Run all suites sequentially, never alongside interactive dev.

## Practice outcomes, history and revisions

Published questions now support explicit practice outcomes: Solved independently
(`independent`), Solved with help (`needed_help`), and Not solved yet (`failed`).
Perceived difficulty is optional. `POST /api/v1/attempts` accepts only the documented
submission UUID, content ID, kind, outcome and optional difficulty. Plan/task context
fields are not part of that request contract and are rejected, not trusted.

The browser freezes a submission's payload and identifier before sending it and
keeps it in user/content-scoped tab storage until success. After a lost response,
retry the same identifier; a deliberate later attempt starts a new one. If tab
storage is disabled, keep the page open to retain the in-memory identity. A replay
returns the original persisted receipt even after later attempts; refreshed history
and revisions are authoritative for current state.

`/attempts` is immutable owned history; `/revisions` is the temporary due-work entry
point alongside the dashboard. Include upcoming revisions to see future work.
Opening a revision records nothing; saving a `revision` recall outcome writes a new
attempt and reschedules that owned cycle. Intervals use Asia/Kolkata calendar days:
failed or hard → 1; otherwise help or medium → 3; otherwise independent → 7.
Archived material stays unavailable while saved historical facts remain readable.

The reusable `PATCH /api/v1/plans/:id/tasks/:taskId` supports completion/undo only
for an existing owned active-plan task with the current state revision. No plan
records are generated by task completion itself. Independently browsed resources have **no** completion
button, and recording a question outcome never completes a task.

### Database migration and checks

Migration 002 adds the documented attempt/revision indexes and validates existing
study records. Migration 001's manifest/checksum is unchanged. Setup is explicit,
preserves records/singletons, fails on invalid/conflicting data and never drops
indexes or synchronises them at startup. For the local development database:

```powershell
npm.cmd run db:setup -- --database prep_pilot_dev --environment development
```

Select your own exact development/test database if using another configuration;
never infer a target from the URI. No new account, service or credential is needed.

`npm.cmd run test:practice -- --direct` reuses the disposable student harness and
exercises actual auth, Route Handlers and MongoDB transactions without a Next
server. Omit `--direct` after a successful current production build, or use `--dev`
for focused development checks. `--browser` pauses on isolated deterministic due
fixtures; no real days need to pass. Explicit test plan/task records exist only in
that disposable database. Run suites sequentially; port 3104 is shared with the
student suite. No fixtures are a production fallback.

## Study plans and dashboard

Students now land on `/dashboard` after completing preferences. With no active
plan, review saved preferences and explicitly generate a proposal. Review dated
tasks, actual subject minutes, daily budgets and every deferred item before
accepting. Generation and page views never activate or complete anything.

`POST /api/v1/plan-previews` captures a consistent study snapshot; owned previews
can be reloaded at `/plan-previews/:id`. They are valid for ten minutes and retained
for 24 hours. Confirmation uses `/api/v1/plan-previews/:id/confirm`; retry the same
preview ID after an uncertain response. A successful replay returns its original
plan, which may now be archived. Date, preferences/activity/task state, catalog,
template or rules changes require regeneration. All deferrals must be acknowledged.

The Study Plan navigation opens the active plan; saved versions remain accessible
by ID and the previous-version link. Explicit replacement preserves completed work
and historical versions. Attempts never auto-complete tasks. Resource completion
is available only in an owned active task context; independently browsed resources
still have no completion control. After uncertain task writes, refresh saved state
before trying another action. Dashboard minutes are estimates, not measured time.

Editorial mappings, minimal prerequisites, assumptions and update/version policy
are in `docs/PLANNING_CONFIGURATION.md`. They are not official company syllabuses.
The planner aims for 50/25/25 subject minutes without shortening estimates, repeating
fresh work, inventing missing content or bypassing prerequisites. Windows are
7–30 days; task/deferred arrays are each capped at 480 and proposals at 2 MiB.
Catalog snapshots are bounded to 2,000 records and fail explicitly if exceeded.
Automatic adaptation recommendations and full analytics remain deferred.

Migration 003 adds unique plan-version/source-preview indexes and preview retention
indexes through the existing explicit migration runner. Use Node 24 and an exact
development/test target, for example:

```powershell
npm.cmd run db:setup -- --database prep_pilot_dev --environment development
```

`npm.cmd run test:planning -- --direct` tests real Route Handlers and disposable
MongoDB transactions, not server/browser rendering. Use `--dev --browser` for an
isolated interactive fixture on port 3104 (same public test login as the student
suite), or omit both flags to verify a successful current production artifact.
Run sequentially, never alongside another project server. Include
`npm.cmd run test:planning` after the existing production checks below.

## Private attachment operations

The R2 attachment workflow has server-side models/services, guarded routes and
connected admin authoring/download UI. Files remain **disabled by default**;
provider credentials are not configured or activated by implementation tests.
See [the single attachment operations/setup checklist](docs/files/OPERATIONS.md)
for exact environment names, private Standard bucket settings, scoped credentials,
browser CORS, `staging/` expiration, quota limitations and real-provider acceptance.
`npm.cmd run test:files` uses explicit mocked storage and a disposable database;
it does not verify real bucket privacy, credentials, CORS or signed transfers.
`npm.cmd run files:accounting -- --database NAME --environment test` is read-only.
Migration 005 is explicit and additive; no normal database was migrated by tests.

After a successful production build, the optional compiled-browser fixture runs
with `node --env-file=.env.local --import tsx tests/files-browser-fixture.ts`.
Use the repository's Node 24 executable. It creates only a generated
`pp_files_ui_<12 hex>` database and serves the app on `127.0.0.1:3134`, mock
transfers on port 3135 and disposable session links on port 3136. It requires these
ports to be free and must not run alongside another Next dev/build/test command.
The test-only preload replaces the external SDK client with loopback/in-memory
storage; it is never imported by application code. Mock signatures/transfers do
not validate R2 permissions, CORS, expiry enforcement or provider behaviour.
Finish with a local POST to `http://127.0.0.1:3136/finish`; otherwise the fixture
automatically stops and drops only its database after 15 minutes. `--smoke` checks
fixture startup/account preparation and immediate cleanup without browser work.

## Repeatable local build and integration sequence

### Catalog coverage and suggested changes

Run the read-only report against the explicitly authorized configured development
database (never a guessed target):

```powershell
node --env-file=.env.local --import tsx scripts/catalog-coverage.ts --database prep_pilot_dev --environment development
```

See `docs/CATALOG_COVERAGE.md` for observed gaps and
`docs/PLANNING_CONFIGURATION.md` for the transparent last-three adjustment rule.
Dashboard recommendations use recorded outcomes and unscheduled due revisions;
they do not generate plans on page views. Choose Review suggested changes to
persist a proposal, compare tasks/daily minutes, then Keep current plan or Accept
updated plan. No-useful/insufficient-content previews cannot create a new version.
New practice/task/preferences/catalog changes require fresh review. No live email,
R2, full analytics or automated ability assessment is enabled by this feature.
The existing `test:planning` suite includes focused adjustment transaction cases.
For an isolated interactive adjustment fixture after a successful current build,
use `npm.cmd run test:planning -- --browser --adjustment-browser`; the harness
prints a disposable question path and retains an active plan for the review flow.
The fixture expires after ten minutes and cleans up its database. Do not test with
real-account fixtures or start another server/build during that window. Restart a
development server after Mongoose schema changes because cached model definitions
can outlive a source-module refresh.

### Sequential checks

**EPERM investigation is paused by user request.** No further probes, diagnostic
builds, Process Monitor comparisons or permission/security changes are authorised.
Confirmed: Codex compilation hit Windows ACCESS DENIED/EPERM; the failing worker
ran at Low integrity; filesystem probes passed. Root cause remains unproven.
Diagnostic scripts are historical evidence, not normal build prerequisites.

Temporary workflow:

1. Finish source changes and applicable static/unit checks in Codex.
2. When compilation is necessary, provide one ordinary Git Bash build block (no
   diagnostic preload). The user runs it and supplies the result. This is not deploy.
3. After success, run only justified production regressions sequentially, then reuse
   that artifact for browser checks. Do not compile again between those checks.
4. Avoid competing dev/build/test/typegen/cleanup processes sharing .next. Preserve
   passing artifacts rather than deleting them merely to repeat verification.
5. Record user-run versus agent-run evidence separately. Already-passed checks are
   not repeated without a new reason, such as changed source or an expired fixture
   needed specifically for a remaining browser check.

Production planning/Progress/auth regressions and the desktop practice → Progress →
Settings → unchanged plan → preview → acceptance journey already passed. Keyboard
save, acknowledgement and unsaved-dialog focus also passed. These checks were not
rerun for the documentation-only pause update.

After an initial blank-page viewport check, actual application mobile verification
completed at **390x844** against the user's successful ordinary production build.
Both Progress and Settings measured innerWidth 390 and document scrollWidth 375,
with no horizontal overflow. Stacked metrics/history, load-more, form validation,
unsaved-input protection, visible keyboard focus and saving without changing the
active plan were checked using disposable data. The old fixture had expired; only
its existing constructor was rerun to prepare this remaining check. No Codex build,
diagnostic or repeat of the completed desktop browser/authentication journey ran.
The viewport was reset and temporary tab closed. The fixture harness exited
successfully after its timed hold, cleaning its disposable database and shutting
down its owned server. See the status document for counts and verification provenance.

Known minor visual polish: the unsaved dialog opens flush at the top-left rather
than centered/padded. It fits within the measured viewport and its keyboard controls
work. No source fix was made during verification-only work. Mobile evidence applies
to this viewport/browser, not all devices or an exhaustive accessibility audit.

If the app's actual viewport cannot be set, use this short manual fallback in Chrome
DevTools with a live disposable fixture (never save test changes on a real account):

1. Open DevTools, toggle the device toolbar, select Responsive, set width **390**
   and height 844. Confirm window.innerWidth is 390 in the Console.
2. On /progress, check stacked metric cards, readable counts/bar labels, history,
   refresh/loading states and no horizontal scrolling.
3. On /account?view=settings, check company controls, budget/date inputs, ratings,
   account panel and Cancel/Save fit without clipping. Tab through controls and
   verify visible focus and readable validation feedback.
4. With disposable data only, edit a preference, Cancel → keep editing, then save.
   Verify the active plan stays unchanged until a preview is explicitly accepted.
5. Report actual width and pass/fail per page, plus screenshots of any clipping or
   inaccessible control. Record this as user-run mobile evidence, not agent-run.

Use Node 24 and npm 10.9.3 in one normal VS Code PowerShell terminal. During active
iteration, run only the relevant development suites and run them sequentially;
wait for the terminal command to finish, not just its printed PASS line. Do not
run an interactive PrepPilot dev server alongside a `--dev` suite: all use
`.next/dev`, regardless of their different ports.

The commands in the final sequence below are PowerShell, not Git Bash. A prompt
containing `MINGW64` uses Bash: select PowerShell in VS Code's terminal dropdown,
or use `cd /c/PROJECTS/prep-pilot` and
`export PATH="$PWD/.tools/node_modules/node/bin:$PATH"` for Bash setup. Do not paste
PowerShell `Set-Location`, `$env:PATH`, `Test-Path` or `Remove-Item` syntax into Bash.
If `npm.cmd run build` nevertheless succeeds, record it as a successful build,
not a clean build when the cleanup command failed; do not delete a passing artifact
merely to repeat verification.

For final verification:

1. Finish the relevant dev suites and stop only your positively identified PrepPilot
   `dev`, `start` or test terminals with Ctrl+C. Never kill all Node processes.
   Check known ports 3000 (interactive), 3101 (auth tests), 3103 (draft tests)
   and 3104 (student journey tests).
   Absence of a Next lock file alone is not a process/handle check.
2. Run any needed unit/lint/format/type checks before preparing the final build;
   `typecheck` generates Next route types. Already passing checks need not be
   repeated when only verification documentation changes.
3. If a clean build is needed, remove only the confirmed generated `.next` directory
   from the project root and build using the same normal Windows terminal identity.
4. After a successful current build, run production draft and authentication suites
   sequentially, without `--dev`. Do not interleave another dev server, type
   generation, output cleanup or build. On failure, stop and diagnose the actual
   error rather than repeatedly rerunning the same failed command.
5. Wait for each command to return, and verify its owned test port no longer responds.
   Harness cleanup currently has a bounded wait, not a full Windows process-tree
   audit. If a port remains occupied, identify the project process/terminal before
   stopping it; do not assume it is safe to terminate an arbitrary process.

Example final sequence, **only when a fresh clean build is actually needed**:

```powershell
Set-Location -LiteralPath 'C:\PROJECTS\prep-pilot'
$env:PATH = (Join-Path $PWD '.tools\node_modules\node\bin') + ';' + $env:PATH
node --version
npm.cmd --version
if (Test-Path -LiteralPath '.next') {
  Remove-Item -LiteralPath '.next' -Recurse -Force -ErrorAction Stop
}
npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw 'Build failed; stop and inspect the exact error.' }
npm.cmd run test:admin-content
if ($LASTEXITCODE -ne 0) { throw 'Draft regression failed; stop and inspect.' }
npm.cmd run test:integration
if ($LASTEXITCODE -ne 0) { throw 'Authentication regression failed; inspect.' }
npm.cmd run test:student
if ($LASTEXITCODE -ne 0) { throw 'Student regression failed; inspect.' }
npm.cmd run test:practice
if ($LASTEXITCODE -ne 0) { throw 'Practice regression failed; inspect.' }
```

These are local build/test operations, not deployment. Keep credentials in ignored
settings; do not paste environment contents. A successful manual build is recorded
as user-run evidence, separately from agent-run regressions.

Next 16.4.2 places dev output under `.next/dev` and production output under `.next`;
its normal build cleanup preserves the dev subtree. Nevertheless they share the
parent and generated `next-env.d.ts`, and manually deleting `.next` removes both.
The production suites consume the existing artifact; they do not compile a new one.
Observed creator/owner differences and inherited ACLs do not by themselves diagnose
the recurring Windows EPERM. Do not change `distDir`, broadly alter ACLs, disable
Windows protections or upgrade dependencies without evidence supporting that fix.

Development and production builds explicitly use Next.js's supported Webpack
bundler. Turbopack's PostCSS worker could not connect in the current Windows
sandbox; Webpack successfully compiles the same application without changing
dependencies or weakening sandbox protections.

| Command                | Purpose                                                 |
| ---------------------- | ------------------------------------------------------- |
| `npm run dev`          | Development server                                      |
| `npm run typecheck`    | Generate Next route types, then strict TypeScript check |
| `npm run lint`         | ESLint with zero warnings                               |
| `npm run format:check` | Check formatting of scaffold-owned files                |
| `npm run format`       | Format scaffold-owned files                             |
| `npm run build`        | Production build                                        |
| `npm start`            | Serve the production build                              |

`GET /api/health` returns `{"data":{"status":"ok"}}`, `X-Request-Id` and
`Cache-Control: no-store`. It checks liveness only, without contacting providers.

CI uses `.nvmrc`, npm 10.9.3, `npm ci`, format check, lint, typecheck, pure tests
and build on pull requests and pushes to main/dev. It does not deploy or use cloud
secrets. Database-backed integration checks run separately against disposable data.

## Boundaries and configuration

### Student Progress and Settings

When a new usable build is required, stop this project's competing dev/test terminals
first. Run this one block in **VS Code Git Bash**, without a diagnostic preload or
unnecessary output cleanup. This is local build verification, not deployment.

```bash
cd /c/PROJECTS/prep-pilot
export PATH="$PWD/.tools/node_modules/node/bin:$PATH"
npm.cmd run build
```

Report the complete build result. Reuse that artifact for the remaining mobile
check with disposable fixtures. The existing production and desktop passes remain
recorded; do not repeat them without a new reason. Do not run dev/typegen/build or
cleanup concurrently with production checks. See Sequential checks for the current
temporary workflow and manual mobile fallback.

- `/progress` shows lifetime question submissions/latest self-reported outcomes,
  due revisions, and active-plan-only task/resource completion. Historical plan
  versions are counted separately, never added to current completion percentages.
- `GET /api/v1/progress` is an authenticated student-only, private/no-store snapshot
  read. Query filters and client-selected owners are not accepted. Existing
  signed-cursor `/api/v1/attempts` supplies separately paginated history.
- `/account?view=settings` edits onboarding preferences using the same guarded
  `PATCH /api/v1/me/preferences`. Plain `/account` remains the login routing hub.
  Expired saved goals do not block study; new saves require a valid future date.
- Saving leaves the active plan untouched. The proposal button reads current state,
  selects replacement for an unexpired active window or initial for a new window,
  and reuses explicit preview/acceptance. Pending older previews become stale.
- Planning integration includes Progress calculations/isolation and preference/plan
  separation (`npm.cmd run test:planning -- --direct` for focused handler/domain
  verification; omit `--direct` after a current production build).
- `npm.cmd run test:student -- --progress --direct` runs the smaller connected
  preferences/catalog + Progress regression, including no-active-plan, unavailable
  history, partial dependency failure and preview-staleness cases, without repeating
  the complete planning suite. It still uses and cleans only disposable test data.

- `src/app`: pages, layouts and thin Node.js Route Handlers.
- `src/modules/identity`: authentication, profiles, access policy and actor services.
- `src/shared/server`: server mechanisms and configuration. `config.ts` is guarded
  by `server-only`; `env.ts` is a pure parser also consumed by Next's configuration.
- `src/shared/ui`: reusable accessible UI without database/provider imports.
- `src/config`: public application constants and future versioned company/topic templates.
- `scripts`: TypeScript local-secret setup, database indexes and restricted admin provisioning.

`src/config/app.ts` contains public constants only. Server variables are explicitly
selected and validated rather than copying process.env into public configuration.
No `NEXT_PUBLIC_` variable is needed. Never add secrets to public configuration,
committed environment files, logs or browser bundles.

Database/auth configuration fails closed when enabled without its required settings.
R2 application integration is implemented with mocked-storage checks; real-provider
activation and acceptance remain outstanding. Resend transport is implemented, but email
needs a verified sending domain for general recipients; R2 activation
and service release gates remain outstanding. Free-tier availability is not a
guarantee of zero billing.

The visual foundation uses warm ivory, forest green, charcoal and system typography.
Landing, authentication and the read-only admin Content Library adapt the reviewed
Stitch direction. The editor/preview extend that system where no Stitch screen
exists. Remaining student workflows and a component library are deferred.

See [implementation status](docs/IMPLEMENTATION_STATUS.md), [working instructions](AGENTS.md)
and the four design documents referenced there for scope, architecture and next steps.
