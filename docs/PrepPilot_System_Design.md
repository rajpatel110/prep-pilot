# Architecture

PrepPilot is one Next.js App Router modular monolith deployed on Vercel.
Pages and route handlers run in Node.js; there is no separate Express service.

## Module boundaries

| Location                     | Responsibility                                                                                  |
| ---------------------------- | ----------------------------------------------------------------------------------------------- |
| `src/app`                    | Pages, layouts, loading boundaries and thin HTTP adapters                                       |
| `src/modules/identity`       | Better Auth integration, actors, role/verification guards, preferences                          |
| `src/modules/catalog`        | Published discovery, admin lifecycle, draft imports and catalog revisions                       |
| `src/modules/practice`       | Immutable outcomes, submission idempotency and attempt history                                  |
| `src/modules/revisions`      | Per-user/content revision cycles and due reads                                                  |
| `src/modules/planning`       | Pure engine, persisted proposals, acceptance, task completion and authorized Progress snapshots |
| `src/modules/administration` | Audits, step-up confirmation and owner role management                                          |
| `src/modules/notifications`  | Explicit Brevo/Resend transport selection and delivery metadata                                 |
| `src/modules/files`          | Optional private-storage lifecycle; disabled in the live demo                                   |
| `src/shared/server`          | Environment, connection pools, HTTP, CSRF and rate-limit mechanisms                             |
| `src/shared/ui`              | Shared navigation, forms, dialogs and theme controls                                            |
| `src/config`                 | Public constants and versioned topic/planning configuration                                     |
| `scripts`                    | Explicit-target migrations, owner provisioning and draft import                                 |
| `tests`                      | Pure, handler and isolated database/compiled-app checks                                         |

Routes and UI call domain services. Services enforce permissions even when invoked
without HTTP. Cross-module operations use public interfaces; the planner receives
plain data and performs no database or provider calls.

## Runtime and security

Server Components load authorized data directly rather than fetching the app's
own API. Interactive mutations use same-origin REST. Zod validates strict inputs;
explicit DTOs keep auth/provider fields and list explanations out of responses.

Better Auth owns persistent identities, credential records and sessions. Mongoose
owns domain data. Session authorization is not cached in cookies: the current
session and profile role/lifecycle control access on the next protected request.
Production cookies are Secure, HttpOnly, host-only and SameSite=Lax.

Writes enforce exact APP_URL origin, JSON/body bounds, application CSRF and durable
rate limits. Application identity never comes from a client-selected user/role.
Server-only imports isolate credentials. No client environment variable is needed.
Errors expose safe codes/request IDs, not tokens, provider bodies or credentials.

## Consistency

Replica-set transactions group related domain writes, revision/state increments
and audits. Profile guards serialize user mutations; catalog guards prevent stale
publication/plan-confirmation races. Operation/submission IDs reconcile retries.
External provider calls remain outside retryable database transactions.

Plans and attempts retain content snapshots. Publishing changes future eligibility,
not old plan estimates or historic classifications. A plan preview is a persisted,
expiring proposal with explicit confirmation and durable acceptance identity.

## Hosting and delivery

MongoDB clients reuse bounded pools within a warm instance; sessions, rate limits
and coordination live in MongoDB, not process memory. Private responses are
no-store. There is no shared cache of private user data or always-running worker.
Notifications use the existing supported post-response mechanism and bounded
provider requests, not a daemon. Email is a configured side effect, not proof
that a mailbox received a message.

Brevo uses native HTTPS fetch. Resend remains an explicitly selectable alternative;
there is no automatic provider failover. Optional R2 uses the AWS SDK/presigner,
but its live capability is off. Runtime correctness does not depend on writable
local disk.

Theme initialization is same-origin and runs before hydration. CSS provides
system-theme/no-JavaScript fallbacks. See [visual theme](VISUAL_THEME.md).
See [database](PrepPilot_Database_Design.md), [API](PrepPilot_API_Design.md) and
[deployment](DEPLOYMENT.md) for operational contracts.
