# PrepPilot implementation status

Updated: 23 October 2026 (Asia/Kolkata).

## Scope

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
