# PrepPilot

A modular monolith for placement preparation across DSA, aptitude and CS fundamentals.
This repository currently implements the **local scaffold milestone only**.
The page is a foundation preview; accounts, persistence and study features are not implemented.

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

CI uses `.nvmrc`, npm 10.9.3, `npm ci`, format check, lint, typecheck and build.
It does not deploy or use cloud secrets. No automated feature-test suite exists yet;
add rule, replica-set integration and browser tests as their features arrive.

## Boundaries and configuration

- `src/app`: pages, layouts and thin Node.js Route Handlers.
- `src/modules`: future business modules; see the status document for ownership.
- `src/shared/server`: server mechanisms and configuration. `config.ts` is guarded
  by `server-only`; `env.ts` is a pure parser also consumed by Next's configuration.
- `src/shared/ui`: reusable accessible UI without database/provider imports.
- `src/config`: public application constants and future versioned company/topic templates.
- `scripts`: future TypeScript migrations, seeds and restricted admin commands.

`src/config/app.ts` contains public constants only. Server variables are explicitly
selected and validated rather than copying process.env into public configuration.
No `NEXT_PUBLIC_` variable is needed. Never add secrets to public configuration,
committed environment files, logs or browser bundles.

Database/auth/R2/Resend validation will be added with those integrations. Credentials
must then be required when their feature is enabled; missing configuration must
fail closed. This scaffold neither simulates those integrations nor enables study
access. Email needs a verified sending domain for real recipients; R2 activation
and service release gates remain outstanding. Free-tier availability is not a
guarantee of zero billing.

The visual foundation uses warm ivory, forest green, charcoal and system typography.
Detailed Stitch screens and a component library are deferred.

See [implementation status](docs/IMPLEMENTATION_STATUS.md), [working instructions](AGENTS.md)
and the four design documents referenced there for scope, architecture and next steps.
