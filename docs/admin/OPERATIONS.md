# Owner administration

Students route to onboarding/Dashboard; admins and the owner route to `/admin`.
The owner inherits admin access and alone manages administrators.
Files remain disabled independently of those permissions.

## Initial owner setup

Use an explicitly selected database with migrations 001–006. Back up real data
before operator changes. Register the intended account, sign in to create its
profile and genuinely verify its email. Read its exact userId from
`/api/v1/me`; display name is not an identifier.

The current shared `prep_pilot_dev` is not disposable. Deliberate operator work
there also requires `HOSTED_DATABASE_CONFIRMATION=prep_pilot_dev`.
The existing owner needs no reapply. Never copy identities or mark an address
verified to make provisioning pass.

```bash
# Git Bash: .env.local contains private MongoDB settings.
read -r -p 'Explicit database: ' OWNER_DB
read -r -p 'Existing verified account userId: ' OWNER_USER_ID
read -r -p 'Exact account email: ' OWNER_EMAIL
NODE_ENV=development npm.cmd run admin:owner -- "$OWNER_USER_ID" --preview --email "$OWNER_EMAIL" --database "$OWNER_DB" --environment development
```

Inspect database, identity, email verification, lifecycle, role and stateRevision.
The preview does not mutate. Then, only when establishing the selected sole owner:

```bash
read -r -p 'stateRevision from the checked preview: ' OWNER_REVISION
NODE_ENV=development npm.cmd run admin:owner -- "$OWNER_USER_ID" --apply --email "$OWNER_EMAIL" --expected-revision "$OWNER_REVISION" --database "$OWNER_DB" --environment development
unset OWNER_DB OWNER_USER_ID OWNER_EMAIL OWNER_REVISION HOSTED_DATABASE_CONFIRMATION
```

Another owner, stale revision, wrong email, unverified or inactive account fails.
Reapplying to the same owner is a no-op; role and audit otherwise commit together.
The retired admin:provision script cannot grant new privileges or overwrite owner.
Provisioning is not ownership transfer; no ordinary owner deletion/demotion exists.

## Managing administrators

1. Owner opens Manage admins at `/admin/administrators`.
2. Look up an existing account by exact email and inspect verification/eligibility.
3. Choose grant/remove, confirm the owner's current password, enter a reason and
   explicitly confirm the intended change.
4. Reconcile current state after conflicts/uncertain results rather than blindly
   resubmitting. Existing target sessions see role changes on protected requests.

New admin grants require a verified active student even in test access mode.
Demotion preserves authored content and study history. Administrators cannot
manage other administrators; the owner cannot demote itself.

Step-up confirmation lasts five minutes in that session. Password confirmation
changes no role by itself. All mutations enforce Origin, CSRF, current owner and
target revisions, operation idempotency and atomic audit. The list uses bounded
signed cursors. Rate limits include five reauthentication attempts/15 minutes,
30 lookups/minute and 20 role changes/hour per owner.

Genuine mailbox verification uses the configured email provider; it does not
require changing auth roles or redirecting messages. See
[email operations](../email/OPERATIONS.md) and [deployment](../DEPLOYMENT.md).
