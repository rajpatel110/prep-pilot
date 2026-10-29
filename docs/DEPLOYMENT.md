# Setup and deployment

## Environment map

| Environment                            | Database and behavior                                                   |
| -------------------------------------- | ----------------------------------------------------------------------- |
| Current maintainer local environment   | Shares `prep_pilot_dev` with hosted data; not disposable                |
| Vercel Production                      | `prep_pilot_dev`; public app at https://prep-pilot-theta-tan.vercel.app |
| Vercel Preview                         | Must use a separate explicit database or disabled authentication        |
| Automated integration/browser fixtures | Explicit randomly named disposable databases only                       |

The name `prep_pilot_dev` does not make its real accounts/content disposable.
The current shared arrangement is intentional; this guide does not change it.
Atlas database credentials are distinct from PrepPilot login credentials.

## Local setup

Use Node 24.x and npm 10.9.3. Run `npm ci`, copy `.env.example` to ignored
`.env.local`, then privately select database/origin/security values.
The public homepage needs no database with `AUTH_ENABLED=false`; authenticated
features require a replica set, explicit database and three independent secrets.
See [README](../README.md) for the minimal commands.

All settings below are server-only. No `NEXT_PUBLIC_` variable is required.

| Variable                                                                 | Requirement / purpose                                                               |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `APP_URL`                                                                | Exact browser origin; local default http://localhost:3000                           |
| `AUTH_ENABLED`                                                           | true to enable accounts and protected features                                      |
| `MONGODB_URI`                                                            | Required with auth; private replica-set URI                                         |
| `MONGODB_DB_NAME`                                                        | Required with auth; explicit target, not URI default                                |
| `BETTER_AUTH_SECRET`                                                     | Required with auth; random ≥32 characters                                           |
| `CSRF_SECRET`                                                            | Required with auth; different random ≥32 characters                                 |
| `RATE_LIMIT_SECRET`                                                      | Required with auth; different random ≥32 characters                                 |
| `EMAIL_MODE`                                                             | test permits unverified study; live requires verification                           |
| `EMAIL_DELIVERY_MODE`                                                    | disabled, owner_test, restricted or live                                            |
| `EMAIL_PROVIDER`                                                         | Explicit brevo or resend; default resend                                            |
| `BREVO_API_KEY`                                                          | Required only for enabled Brevo delivery                                            |
| `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`                                | Verified sender mailbox and display name                                            |
| `BREVO_SENDER_VERIFIED`                                                  | true only after actual provider sender verification                                 |
| `EMAIL_TEST_RECIPIENTS`                                                  | Comma-separated exact addresses, maximum ten, for restricted Brevo                  |
| `EMAIL_TEST_RECIPIENT`                                                   | Exact owner address for loopback owner_test                                         |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL`                                    | Alternative Resend transport credentials/sender                                     |
| `RESEND_SENDER_VERIFIED`                                                 | Required for Resend live delivery; testing sender is ineligible                     |
| `FILES_ENABLED`                                                          | Keep false for the current deployment                                               |
| `R2_ACCOUNT_ID`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | Optional file module only; not needed while disabled                                |
| `HOSTED_DATABASE_CONFIRMATION`                                           | Exact prep_pilot_dev acknowledgement for deliberate shared-target operator commands |

Never print credentials, passwords, tokens or email links. Keep secrets independent
between environments; do not pull Production credentials into a Preview scope.
The parser validates mode combinations and fails closed; see
[environment parser](../src/shared/server/env.ts).

## Database permissions and migrations

Runtime credentials need only the intended database's read/write access.
Migration credentials additionally need collection/index creation and inspection
on that database; scope them to that database rather than granting cluster admin.
Inspect the migration commands in `scripts/database-migrations.ts` and
`scripts/migrations/` when defining a custom Atlas role. An operator's database
access is not application-owner authorization.

Migrations are additive, explicit and never run on application startup.
The setup script has no preview/dry-run option. Review source manifests, target,
backup and existing checksums/index compatibility before running an authorized apply.

```bash
# Use privately configured MONGODB_URI from .env.local.
NODE_ENV=development npm.cmd run db:setup -- --database YOUR_DATABASE --environment development
```

For deliberate maintenance of the current shared database, the supported form is:

```bash
HOSTED_DATABASE_CONFIRMATION=prep_pilot_dev NODE_ENV=development npm.cmd run db:setup -- --database prep_pilot_dev --environment development
```

This is an operator procedure, not an instruction to rerun already verified
migrations. Migrations 001–006 were verified on the shared target. Tests must
never select it; confirmation cannot make it a test target.
CLI environment labels are development/test, not Vercel deployment labels.
The CLI refuses NODE_ENV=production, so an operator runs it separately.

## Owner and content

Register the intended owner, sign in to create its profile, and genuinely verify
its mailbox. Preview and provision only that explicitly selected existing account
using [owner operations](admin/OPERATIONS.md). No first-signup auto-promotion,
verification bypass or role copy is supported. Existing ownership needs no reapply.

Git deployments do not transfer MongoDB accounts or content. A new database is
empty until separately populated through reviewed admin actions or the supported
draft importer. See [content procedures](content/README.md).

## Vercel configuration

1. Connect the GitHub repository to a Vercel Next.js project.
2. Confirm Production branch **dev**. Pushes to this branch may automatically
   deploy Production; do not mistake them for Preview deployments.
3. Use Node 24.x, install `npm ci`, build `npm run build` and framework-default
   output. API/database routes use Node, not Edge or static export.
4. Set Production `APP_URL=https://prep-pilot-theta-tan.vercel.app`.
   Use the exact domain in the browser; auth origins, CSRF and email links depend
   on it. For Preview choose a stable exact origin and a separate database.
5. Enter secrets privately in the appropriate environment scope. Do not set
   Vercel-controlled NODE_ENV/VERCEL_ENV yourself. Check linked/shared variables
   and branch overrides as well as project variables.
6. Configure Atlas network access for the deployment and database-scoped user.
   Reuse bounded application pools; do not add a long-running server process.
7. Environment edits require a new deployment to take effect. In Deployments,
   inspect the intended source SHA, Production label, Ready status and assigned
   public domain. A successful Git push is not deployment confirmation.

The app rejects Preview targeting either prep_pilot_dev or prep_pilot_local.
Keep Preview auth disabled and omit database/secrets if no isolated setup exists.
Do not weaken this safeguard to make a deployment pass.

### Current live email settings

Operator reports confirm Brevo inbox receipt, explicit verification/recovery and
the later mandatory-verification rollout. The supported final configuration is:

```dotenv
APP_URL=https://prep-pilot-theta-tan.vercel.app
AUTH_ENABLED=true
EMAIL_PROVIDER=brevo
EMAIL_MODE=live
EMAIL_DELIVERY_MODE=live
BREVO_API_KEY=<private-api-key>
BREVO_SENDER_EMAIL=<verified-sender-mailbox>
BREVO_SENDER_NAME=PrepPilot
BREVO_SENDER_VERIFIED=true
EMAIL_TEST_RECIPIENTS=
FILES_ENABLED=false
```

Preserve the required MongoDB/security settings. Live delivery ignores the
restricted recipient list. Sender-mailbox verification is not domain ownership.
See [email operations](email/OPERATIONS.md) for failure handling and recovery.

Last independently supplied deployment confirmation was operator-reported
Production Ready at `a24a0ae`. Local content/tooling checkpoint `28a4520`
was created afterward; its push failed in the agent environment. Do not infer
a newer deployed SHA without dashboard evidence. This is operational evidence,
not an assertion that the live dashboard has been checked again.

## Smoke checks, recovery and rollback

After an authorized release, use designated test accounts: signup/verification →
login/role routing → preferences → content → outcome → Dashboard/Progress →
Settings → fresh preview → explicit acceptance. Owner checks should confirm
Manage admins access and student denial without changing real roles.
Tests that write study data require an isolated target or separate explicit consent.

For CSRF_INVALID compare the actual origin to APP_URL and environment scope.
For SERVICE_UNAVAILABLE inspect request IDs, safe logs, Atlas access and migration
readiness. Health is liveness only, not proof of database/provider readiness.
For delivery failures distinguish acceptance, inbox arrival and token confirmation.

A previously disclosed application password should be changed through
`/forgot-password` with a privately entered new password. Reset revokes sessions;
check old-password failure and old-session denial. Rotation has not been
independently confirmed. Rotating an Atlas password is not a PrepPilot reset.

Rollback means selecting a compatible Vercel deployment and checking its origin,
environment and live smoke behavior. **Code rollback does not undo database
migrations, roles, publications or study records.** Do not return to code that
rejects existing 1–60-minute content or does not understand current owner/file
records. Database restore is a separate backed-up operator procedure.
