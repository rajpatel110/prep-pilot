# Deployment notes: shared database, separation deferred

Current decision, 25 October 2026: **local and hosted intentionally share
`prep_pilot_dev` temporarily. Database separation is deferred.** The owner has
not performed the proposed Atlas-user or local env setup. No changes to Atlas,
`.env.local`, Vercel settings or real roles were made by the UI milestone.

## Current operating rules

Prepared Brevo integration does not change the currently disabled hosted email
configuration. Follow [the staged Brevo runbook](email/BREVO.md) for restricted
hosted delivery first, then explicit mandatory verification after receipt checks.
The Gmail sender is mailbox-verified, not an authenticated owned domain. Keep
APP_URL=https://prep-pilot-theta-tan.vercel.app and existing owner/data intact.

- Hosted origin remains `https://prep-pilot-theta-tan.vercel.app`; local APP_URL
  must remain the exact local browser origin. Authentication and CSRF are unchanged.
- Local runtime/builds accept the shared database without a confirmation flag.
  The earlier local-runtime refusal blocked the intended shared workflow and
  was removed. Do not run the future setup steps below now.
- Operator tools require explicit target selection and, for `prep_pilot_dev`,
  `HOSTED_DATABASE_CONFIRMATION=prep_pilot_dev`. A test environment selection
  always refuses the shared target, even with confirmation. Never add this
  confirmation to routine shell profiles or use it for fixture cleanup.
- Preview still refuses hosted/local database names. No Preview config was
  inspected or changed; credential isolation has not been established.
- Tests/browser fixtures generate their own disposable database names and
  select them explicitly before mutation. They may never populate, migrate for
  testing, reset or clean up `prep_pilot_dev`. Normal local browser activity can
  affect real hosted records: don't use it as a test fixture. The focused UI
  fixture uses only `pp_student_ui_<12 hex>`.
- Email and files remain disabled. No external setup is needed for the UI work.
- Local and remote dev were checked at `4716275` during preparation. Vercel's
  deployed SHA/environment and production branch remain unknown. Inspect Source
  and Branch Tracking before a future release; don't redeploy to identify them.
- Disclosed-password rotation remains unconfirmed. The supported user-operated
  reset/session-revocation procedure below remains useful, but is not an
  automated fixture. No passwords or email links in chat/logs.
- Code rollback does not undo shared database migrations or writes. Preserve
  the existing owner, account verification, sessions, audit/history and content.

## Archived separation proposal — not current setup instructions

Everything below is retained as a **deferred proposal/history**, not evidence of
completed separation or permission to switch targets/users. The old local-runtime
refusal and mandatory local setup gate below are superseded by Current operating
rules. Reactivate this plan only after separate owner approval. Do not follow it
merely to start or verify the UI milestone.

## Evidence and environment map

| Environment                         | Database                                        | Credential and origin                                                                                         | Status                                                                                             |
| ----------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Current hosted application          | `prep_pilot_dev`                                | Hosted-only Atlas user; `https://prep-pilot-theta-tan.vercel.app`                                             | Preserve records, owner, sessions and indexes. The legacy name does not mean it is safe test data. |
| Local development                   | `prep_pilot_local`                              | New Atlas user restricted to this database; `http://localhost:3000`                                           | Proposed, not created/configured by the agent.                                                     |
| Vercel Preview                      | None while disabled; later `prep_pilot_preview` | No hosted URI/secrets in Preview scope; distinct credentials and exact stable Preview origin if enabled later | Dashboard configuration not inspected; not verified isolated yet.                                  |
| Automated integration/browser tests | Harness-generated disposable databases          | Separate sandbox credentials, never hosted credentials                                                        | Existing generated names remain authoritative; see test access below.                              |

Agent read-only inspection found no database named `prep_pilot_local` in the
authorized inventory, and a direct `listCollections` returned an empty array.
Recheck before creation if time has passed; this is a point-in-time availability
check, not a reservation. Nothing was created, renamed, copied or dropped.

The hosted baseline was: owner active, role `owner`, stateRevision 5, genuinely
verified identity; one content record, published; migrations 001–006 applied.
Hosted UI login/owner access and exact-email lookup are user-reported successes.
Actual hosted helper promotion/removal is not verified and must not be tested on
real accounts merely for deployment readiness.

Local `dev` and live remote `refs/heads/dev` both resolve to
`4716275957e2106fac1bfe15fd2ebc7123b7af25`. The remote query returned no `main`
branch. This does not establish Vercel's deployed commit or production branch.
In Vercel, select the deployment currently assigned the hosted domain and record
its Source commit SHA, branch and environment. In Settings → Environments →
Production → Branch Tracking, record the production branch. Do not redeploy to
discover these values. They remain unknown until the owner confirms them.
If Production tracks `dev`, a future push to `dev` can change the hosted site;
do not assume it creates only a Preview. Changing branch policy is a separate
owner action, not done by this milestone.

## Safeguards and target resolution

- Runtime selects `MONGODB_DB_NAME`, not the URI's default database, for both
  Better Auth and domain data. Existing process environment overrides `.env.local`.
  Stop old servers and clear old terminal exports before switching locally.
- `src/shared/server/database-boundary.ts` protects the known hosted name.
  Local development, local `next start`, builds and operator scripts refuse
  `prep_pilot_dev` unless `HOSTED_DATABASE_CONFIRMATION=prep_pilot_dev` is explicitly
  supplied for deliberate operator work. Vercel Production is allowed when its
  system variables identify `VERCEL=1` and `VERCEL_ENV=production`.
- Vercel Preview refuses both `prep_pilot_dev` and `prep_pilot_local`, even with
  that confirmation. Other names still require correctly scoped credentials;
  this name-based guard is accident prevention, not a database authorization wall.
- Never persist the confirmation in `.env.local`, Vercel Preview, team defaults
  or routine shell profiles. Do not set Vercel's system variables manually to
  evade the guard. Hosted configuration is unaffected until future code deployment.
- `databaseTarget` still requires explicit `--database` and development/test
  environment, rejects system databases and refuses `NODE_ENV=production`.
  Its environment argument describes the supported operator execution mode,
  not a guarantee that the selected database contains disposable records.
- `db:setup`, `admin:owner`, legacy `admin:provision`, `files:accounting` and
  `scripts/catalog-coverage.ts` all use this guard. The last additionally requires
  the selected name to match configured `MONGODB_DB_NAME`.
- `auth:setup` edits only `.env.local` and preserves nonempty secrets. It does
  not rotate existing secrets or create an Atlas user. Use the blank-local-secret
  procedure below rather than believing running it separates existing keys.
- Integrations choose random names explicitly and clean them up; their URI still
  comes from `MONGODB_URI`, commonly loaded by package scripts from `.env.local`.
  Never run them using a broad shared/hosted credential. Direct MongoClient test
  connections do not pass through application environment parsing or operator
  guards. Safe database credentials are essential.

## Atlas users: owner actions, no automatic credential changes

Atlas database users are connection credentials, not PrepPilot email/password
accounts, and not Atlas dashboard members. Changing one does not provision a
PrepPilot owner. Keep SCRAM authentication, TLS and the existing network policy.
Do not enable billing, relax IP access or delete an existing credential here.

In Atlas → Security/Database Access → Add New Database User:

1. Create `preppilot-local` with a fresh generated password. Use Specific
   Privileges (not “read and write any database”) to grant `readWrite` on
   **`prep_pilot_local` only**, all its application collections. Restrict access
   to the intended existing cluster. Do not grant `root`, `atlasAdmin`, `dbOwner`,
   `userAdminAnyDatabase` or `readWriteAnyDatabase` on the shared cluster.
2. Prepare a separate `preppilot-hosted` credential restricted to **`prep_pilot_dev`
   only** in the same manner. Do not replace the active Vercel URI or revoke the
   old user in this task. Future controlled credential rotation requires a new
   deployment and successful hosted checks first; old deployments retain old env.
3. The runtime needs find/aggregate, insert, update, remove and collection/index
   inspection. Mongoose/Better Auth can require implicit collection creation.
   Migrations also need `createCollection` and `createIndex`, plus the same reads
   and transactional writes to migration locks and singleton records. Database-
   scoped `readWrite` is the practical baseline for this application and runner;
   no role/user administration or cluster administration is required. For tighter
   custom roles, grant these exact actions on that database, not all databases.
   Do not add `collMod`, index-dropping or database-dropping privileges to runtime
   merely because some failure-injection fixtures need them.
4. Copy Atlas's Drivers URI for the new local database user into local settings
   yourself. Preserve `authSource=admin` where required, URI-encode special
   password characters, and select the database separately as below. Never paste
   the URI/password into chat, Git or shell history.

Tests: the current harnesses create random databases, sometimes conflict siblings,
and call `dropDatabase`; the student failure fixture also uses `collMod`.
A user restricted to `prep_pilot_local` cannot run those suites. Do not “fix” this
by widening that user to hosted databases. Until a sandbox test credential is
arranged, use pure unit/static checks and the explicitly local manual journey.
Existing harnesses have no fixed-target switch; do not invent one. An isolated
test-only replica-set cluster can provide the necessary disposable namespace
permissions without any access to hosted data, but provisioning it is not
authorized or needed to finish local setup. Record database-backed suites as
blocked until safe test access is selected. MongoDB roles do not provide a
simple database-name-prefix allowlist for these random names.

## Local setup gate

Do these steps yourself, then tell the agent when complete. The agent must not
edit your real env file, target, credentials or accounts automatically.

1. Stop local PrepPilot servers, not all Node processes. Keep hosted serving.
2. In local `.env.local`, replace only the local URI with the new scoped local
   user's URI, set `MONGODB_DB_NAME=prep_pilot_local`, and set
   `APP_URL=http://localhost:3000`. Keep hosted Vercel settings unchanged.
3. Clear the values of `BETTER_AUTH_SECRET`, `CSRF_SECRET`, `RATE_LIMIT_SECRET`
   in this local file only. Set `EMAIL_MODE=test`, `EMAIL_DELIVERY_MODE=disabled`,
   `FILES_ENABLED=false`; remove `HOSTED_DATABASE_CONFIRMATION`. Do not copy a
   Vercel env export or old owner-inbox shell configuration into this file.
4. In a fresh Git Bash terminal run the existing setup and migration tooling:

```bash
cd /c/PROJECTS/prep-pilot
export PATH="$PWD/.tools/node_modules/node/bin:$PATH"
unset NODE_OPTIONS MONGODB_URI MONGODB_DB_NAME BETTER_AUTH_SECRET CSRF_SECRET RATE_LIMIT_SECRET HOSTED_DATABASE_CONFIRMATION
npm.cmd run auth:setup &&
NODE_ENV=development npm.cmd run db:setup -- --database prep_pilot_local --environment development
```

`auth:setup` fills the three blank local secrets with independent randomness
without printing them. The additive runner creates the fresh database, verifies
001–006 and creates required indexes/singletons. It does not copy users/content
or promote anyone. There is no migration dry-run/`--preview` flag; inspect the
numbered manifests and explicit target before apply. Stop on any conflict. Do
not insert a placeholder collection manually or use `syncIndexes`.

Fresh terminal exports for `APP_URL`/email modes also override files: clear any
leftover test overrides or open a genuinely fresh terminal. No setup command above
renames/drops/migrates the hosted database. Check target availability again before
apply if someone else may have started using `prep_pilot_local`.

After the owner confirms setup, the agent will compare local target/credential
boundaries read-only, check required indexes and secret separation without
printing secret values, and use a unique local-only disposable account to prove
its ID/email is absent from hosted. No fixture may target `prep_pilot_dev`.
Read-only hosted owner/content comparisons must account for legitimate live
changes; count equality alone is not proof of unchanged content.

## Fresh local accounts and local owner

Start `npm.cmd run dev` only after local setup. Register a new local student;
the same email can be registered independently, but it is a new identity with
no transferred sessions, role, verification, attempts or history. Do not use the
previously disclosed password. Complete preferences with disposable local data.

For a local owner, register an account whose email is genuinely your Resend
account address in **`prep_pilot_local`**. Leave hosted delivery disabled. Locally
opt into `owner_test` using the existing [email operations](email/OPERATIONS.md),
loopback APP_URL and exact `EMAIL_TEST_RECIPIENT`. Request/confirm the real email
yourself. Never flip `emailVerified` in MongoDB or redirect another recipient's
email. Return local delivery to disabled afterward. No real email is sent
automatically by this milestone.

After signing in once, copy the local `/api/v1/me` immutable ID. Do not reuse the
hosted owner's ID. The following uses the current local URI; first ensure it is
the scoped `preppilot-local` credential:

```bash
read -r -p 'Exact local account userId: ' LOCAL_OWNER_ID
read -r -p 'That verified local account email: ' LOCAL_OWNER_EMAIL
NODE_ENV=development npm.cmd run admin:owner -- "$LOCAL_OWNER_ID" --preview --email "$LOCAL_OWNER_EMAIL" --database prep_pilot_local --environment development
```

Read the preview: exact local DB/identity, verified email, active lifecycle,
no different owner and current stateRevision. Only after approving that preview:

```bash
read -r -p 'Revision from the checked local preview: ' LOCAL_OWNER_REVISION
NODE_ENV=development npm.cmd run admin:owner -- "$LOCAL_OWNER_ID" --apply --email "$LOCAL_OWNER_EMAIL" --expected-revision "$LOCAL_OWNER_REVISION" --database prep_pilot_local --environment development
```

These commands never promote the existing hosted owner. Do not run an apply
command unless you intend the local account change. Supported initial-owner
restrictions and atomic auditing are unchanged.

## Vercel configuration checklist

Before any later deployment of these guards, confirm the current domain's actual
environment and that Vercel exposes its system environment variables. Do not
deploy this source onto a Preview that still points at the hosted database: it
will intentionally fail closed rather than keep sharing that target.

Inspect the dashboard; do not reveal secret values. Current live URL is
`https://prep-pilot-theta-tan.vercel.app`. Its exact `APP_URL` is mandatory for
CSRF, trusted origins and callback/link generation. Wrong origin previously
caused `CSRF_INVALID` before credentials were checked.

| Variable                                                                 | Purpose / value source                                    | Local                                                       | Hosted Production                                  | Preview                                               |
| ------------------------------------------------------------------------ | --------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------- |
| `APP_URL`                                                                | Exact browser origin, no path; owner-selected URL         | `http://localhost:3000`                                     | `https://prep-pilot-theta-tan.vercel.app`          | Exact chosen stable Preview URL if auth enabled later |
| `AUTH_ENABLED`                                                           | Account capability                                        | `true` after setup                                          | Keep current `true`                                | Recommend `false` until isolated setup                |
| `MONGODB_URI`                                                            | Atlas Drivers URI with database-scoped user               | `<local-only URI>`                                          | Existing hosted URI; future `<hosted-only URI>`    | Omit while disabled; later `<preview-only URI>`       |
| `MONGODB_DB_NAME`                                                        | Explicit database, not URI default                        | `prep_pilot_local`                                          | Keep `prep_pilot_dev`                              | Omit while disabled; later `prep_pilot_preview`       |
| `BETTER_AUTH_SECRET`                                                     | Auth signing, at least 32 chars                           | Fresh local `auth:setup` value                              | Preserve current hosted value; rotate deliberately | Separate new secret if enabled                        |
| `CSRF_SECRET`                                                            | Session-bound protection, at least 32 chars               | Independent fresh local value                               | Preserve current hosted value                      | Separate new secret if enabled                        |
| `RATE_LIMIT_SECRET`                                                      | Durable counter key derivation, at least 32 chars         | Independent fresh local value                               | Preserve current hosted value                      | Separate new secret if enabled                        |
| `EMAIL_MODE`                                                             | Study access policy, not delivery mode                    | `test`                                                      | Keep `test`                                        | `test`                                                |
| `EMAIL_DELIVERY_MODE`                                                    | Provider sending opt-in                                   | `disabled`, temporary owner test only by explicit action    | `disabled`                                         | `disabled`                                            |
| `EMAIL_TEST_RECIPIENT`                                                   | Exact Resend-owner address for loopback testing           | Omit normally                                               | Omit                                               | Omit                                                  |
| `RESEND_API_KEY`                                                         | Resend secret; optional while disabled                    | Only needed for explicit local email test                   | Not needed while disabled                          | Omit                                                  |
| `RESEND_FROM_EMAIL`                                                      | Resend sender; optional while disabled                    | `PrepPilot <onboarding@resend.dev>` for explicit local test | Not needed while disabled                          | Omit                                                  |
| `RESEND_SENDER_VERIFIED`                                                 | Operator attestation, not actual domain verification      | `false`                                                     | `false`                                            | `false`                                               |
| `FILES_ENABLED`                                                          | R2 capability                                             | `false`                                                     | `false`                                            | `false`                                               |
| `R2_ACCOUNT_ID`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | R2 provider configuration                                 | Omit                                                        | Omit while disabled                                | Omit                                                  |
| `HOSTED_DATABASE_CONFIRMATION`                                           | Exact target acknowledgment for exceptional operator work | Omit                                                        | Not required for Vercel Production                 | Omit; cannot override Preview refusal                 |

Core auth variables are required only with `AUTH_ENABLED=true`. All values are
server-only; no `NEXT_PUBLIC_` variables or separate `BETTER_AUTH_URL` setting
are required. Do not set Vercel-controlled `NODE_ENV`, `VERCEL`, `VERCEL_ENV`
yourself. Vercel supplies Production NODE_ENV for both Preview and Production
builds; it is not an environment-separation signal.

Inspect both project variables and linked/shared team variables. Remove hosted
URI/secrets from Development and Preview scopes, including branch overrides;
do not remove the active Production scope. While Preview auth is disabled, omit
all database/auth signing secrets rather than merely assigning a different DB
name to a hosted-capable URI. Keep Deployment Protection enabled where available.
The application guard refuses known protected targets after future deployment,
but cannot prove that a credential scoped incorrectly lacks cross-DB privileges.
Dashboard scope checks and database authorization-denial checks remain required.
Changing Vercel env only affects a new deployment; do not redeploy during this
preparation task. Do not pull Production env into `.env.local`.

## Hosted operator maintenance and compromised password

Routine local commands must never carry hosted credentials. For exceptional
hosted maintenance, use a separate ignored `.env.hosted-operator` file prepared
by the owner with a temporary database-scoped operator credential. No copy of
hosted users, sessions, tokens, owner state or audits goes into the local DB.
Migrations are not needed again on hosted for this separation; 001–006 already
applied. Future deliberate commands use explicit target and acknowledgment:

```bash
HOSTED_DATABASE_CONFIRMATION=prep_pilot_dev NODE_ENV=development node --env-file=.env.hosted-operator --import tsx scripts/setup-database.ts --database prep_pilot_dev --environment development
HOSTED_DATABASE_CONFIRMATION=prep_pilot_dev NODE_ENV=development node --conditions=react-server --env-file=.env.hosted-operator --import tsx scripts/provision-owner.ts EXACT_EXISTING_ID --preview --email EXACT_ACCOUNT_EMAIL --database prep_pilot_dev --environment development
```

Do not run these examples now. The existing hosted owner needs no provisioning;
the tooling does not transfer ownership or overwrite a different owner. Never
run a broad integration cleanup or migration automatically on application startup.

A password was disclosed during troubleshooting. Rotation is **not confirmed**.
Hosted recovery is disabled; an Atlas database-user password change is not a
PrepPilot password reset. Supported recovery for this account is an explicitly
authorized local loopback operator session connected to the **hosted DB**, with
`HOSTED_DATABASE_CONFIRMATION=prep_pilot_dev`, `EMAIL_MODE=test`,
`EMAIL_DELIVERY_MODE=owner_test`, exact Resend account-owner recipient, valid
Resend settings, its own operator auth/CSRF/rate secrets, files disabled and
`APP_URL=http://127.0.0.1:3121`. Load the ignored operator file using:

```bash
node --env-file=.env.hosted-operator node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3121
```

Use a fresh terminal without inherited database/security/email exports. The
operator file must explicitly contain every required auth setting; Next's local
file must not be the source of missing hosted settings. Keep that server running,
open `/forgot-password`, request recovery for your own account, open its email
link and enter a fresh unique password yourself. Never share the password/link.
The existing reset flow uses Better Auth's supported reset and
`revokeSessionsOnPasswordReset=true`; verify old hosted sessions lose access,
the old password fails and the new one works. Only then record rotation/revocation
as completed. Stop the operator server, remove the operator credential/config
securely, and retain the separate local config. Do not enable public email,
manually edit hashes, use a generic change-password endpoint, or rotate signing
secrets as a substitute for changing the exposed password. Rotate anywhere else
the old password was reused. This walkthrough is not permission for an agent to
reset an account or send emails automatically.

## Routine deployment and rollback

Use Next.js preset, repository root, Node 24.x (package engines), install with
`npm ci`, build `npm run build` (`next build --webpack`), default framework output.
Do not use static export, `npm start` as a Vercel build command, or Edge runtime
for database/auth routes. Confirm npm 10.9.3 and lockfile installation in logs.
Current DB clients cache bounded pools per warm instance; authoritative sessions,
rate buckets, revisions and locks are in Atlas, not memory or local disk. No
always-running worker is required. Provider work uses supported `after`, not
an untracked daemon. Files/email remain disabled, so no provider setup is needed.

For a future authorized release: record SHA and production branch; verify reviewed
diff and required checks; verify env scopes; back up the selected hosted target;
preview migration manifests and apply only new required additive migrations with
explicit scoped operator access; deploy the intended commit; verify domain and
origin, logs and hosted smoke results. CI passing does not identify the deployed
commit. Avoid automatic production deployment from a development branch until
the owner deliberately selects a branch policy. No branch was created here.

Smoke after an authorized deployment: student signup/login → preferences →
published content/practice → Progress → Settings save → plan preview/explicit
acceptance. Separately verify existing owner routing/Manage admins lookup and
student/admin denials. Use disposable hosted test records only with separate
approval; do not promote real helpers, publish content or submit practice against
real accounts just to complete this checklist. Health is liveness, not DB readiness.

Rollback via Vercel to the recorded compatible deployment, then recheck exact
origin and configuration. **Code rollback does not undo MongoDB migrations,
role changes, content or other writes.** Never roll back to code unaware of owner
or attachment data after using them. Old deployments retain old env/credentials;
check compatibility before assigning the domain. Do not delete shared DB records
or drop indexes as rollback. Keep backup/restore verification as a separate
operational release gate before trusting broader real-user use.

Troubleshooting: `CSRF_INVALID` means check actual browser origin vs APP_URL and
the deployment environment scope; corrected env needs a new deployment.
`SERVICE_UNAVAILABLE` is generic: inspect safe error/request-ID evidence and
migration/index readiness, not raw credentials. `EMAIL_DISABLED` is expected
with hosted disabled delivery. If local startup now refuses `prep_pilot_dev`,
finish local separation rather than setting a permanent bypass. A previously
compiled artifact predates these source guards; restart/build evidence matters.

## Verification checkpoint and next user actions

Prepared, not fully separated: no local credentials/target/secrets were changed,
no local DB created, no migration or test fixture ran against hosted, no real
roles or content changed, no deployment/commit/push performed. Read-only baseline
and unit/static guard checks are separate from live environment isolation proof.

Next: confirm Vercel Source SHA/environment/production branch and env scopes;
create database-scoped Atlas credentials; configure local target/fresh secrets;
run local setup; report completion without secrets. Then verify distinct targets,
Atlas denial of cross-environment access, local disposable signup/write and its
absence on hosted, read-only hosted preservation, and local owner setup only if
you explicitly choose it. A final current production build is required because
environment parsing changed. Use README's user-run Git Bash fallback after setup;
do not resume EPERM diagnosis or claim the earlier build verifies these changes.

Official references inspected for this runbook:
[Atlas database users](https://www.mongodb.com/docs/atlas/security-add-mongodb-users/),
[custom roles](https://www.mongodb.com/docs/atlas/security-add-mongodb-roles/),
[privilege actions](https://www.mongodb.com/docs/manual/reference/privilege-actions/),
[Vercel env scopes](https://vercel.com/docs/environment-variables),
[Git production-branch selection](https://vercel.com/docs/git),
[deployment inspection](https://vercel.com/docs/deployments/managing-deployments).
