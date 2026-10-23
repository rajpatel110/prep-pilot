# PrepPilot

A modular monolith for placement preparation across DSA, aptitude and CS fundamentals.
This repository implements the local scaffold, homepage and authentication foundation.
The homepage follows the reviewed Stitch landing direction, with responsive sections,
native FAQ disclosures and explicitly illustrative plan/progress examples. Accounts,
persistent database sessions and protected account destinations are implemented.
Study plans, content management and practice features remain future milestones.
The sample-plan links show illustrative data only.

## Run locally

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

Email delivery is **not implemented in this slice**. Test mode allows unverified
student access and visibly disables verification/recovery. The application email
wrappers validate input and return `503 EMAIL_DISABLED`; native token routes are
blocked. Setting `EMAIL_MODE=live` does not enable delivery or bypass verification.
Do not launch a live pilot until Resend, single-use email flows and recovery
session-revocation acceptance tests are implemented and verified.

Rate limits are MongoDB-backed and fail closed. This initial local foundation
uses HMAC account buckets (10 login requests / 15 minutes; 5 signups / 15 minutes)
plus shared deployment caps (200 logins / 15 minutes; 30 signups / 15 minutes),
rather than trusting arbitrary forwarded IP headers. Tune and add verified
hosting-IP policies before deployment; shared caps can affect unrelated users.
Application authenticated mutations use session-bound HMAC CSRF tokens from
`/api/v1/security/csrf`, in addition to exact Origin and JSON checks. Native auth
mutations retain Better Auth origin checks plus the route wrapper's checks.

For a restricted admin, first register and sign in once, then obtain that exact
existing auth user ID from your own Atlas console or authenticated `/api/v1/me`.
Run `npm run admin:provision -- <user-id> --database <development-db-name> --environment development`
locally. `EMAIL_MODE` must explicitly be `test` or `live`. This updates an active profile
and writes an audit event transactionally. Live mode also requires verified email.
Already-admin profiles remain unchanged without duplicate audit events. A failed
audit insert rolls back the promotion and revision. There is no public promotion
endpoint or role selector. Never exercise this command against a real account as
part of a test; the integration suite uses disposable identities only.

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

This slice provides models and validation only, not content CRUD, forms, publishing,
student discovery or file integration. `contentItems` has strict classification,
provenance, company associations, draft/published/archived enum values, trusted
author fields and safe-integer revisions starting at 1. The starter subject/topic
allowlist lives in `src/config/catalog.ts`; review these IDs before curation. It is
not the complete scheduling template or prerequisite graph. Draft text may be
incomplete. Markdown validation conservatively rejects HTML and unsafe link schemes;
a future rendering/preview slice still needs a sanitised Markdown renderer.

Attachment compatibility is retained through `assetIds` (domain ObjectIds), but
**every nonempty attachment array is rejected** at the input and document layers.
No asset is assumed ready and no R2 capability is enabled. Lifecycle transitions,
publication requirements, atomic revision increments and content/audit orchestration
belong to later service milestones; raw query updates are not an approved write API.
Future services must validate complete candidate documents and use revision guards;
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
R2 and Resend integrations remain future work. Email needs a verified sending
domain for real recipients; R2 activation
and service release gates remain outstanding. Free-tier availability is not a
guarantee of zero billing.

The visual foundation uses warm ivory, forest green, charcoal and system typography.
Landing and authentication pages adapt the reviewed Stitch direction. Full study/admin
screens and a component library are deferred.

See [implementation status](docs/IMPLEMENTATION_STATUS.md), [working instructions](AGENTS.md)
and the four design documents referenced there for scope, architecture and next steps.
