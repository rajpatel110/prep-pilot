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
`http://localhost:3000`. It is used for metadata, not an authentication trust policy.

## Commands

## Authentication setup

Use a development Atlas replica set and an ignored `.env.local` with `APP_URL`,
`MONGODB_URI` and `MONGODB_DB_NAME`. Run `npm run auth:setup` to add independent,
random authentication, CSRF and rate-limit secrets without printing them, and to
enable test-mode auth. This command preserves existing nonempty credentials.
Run `npm run db:setup` to create/verify unique auth/profile indexes and rate-bucket
expiry before enabling signup. It does not delete records. Restart the server.
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
Run `npm run admin:provision -- <user-id>` locally. This updates an active profile
and writes an audit event transactionally. Live mode also requires verified email.
There is no public promotion endpoint or role selector.

`npm test` exercises pure routing, validation and CSRF rules.
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
