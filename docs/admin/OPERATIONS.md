# Owner administration

Local and hosted temporarily share `prep_pilot_dev`; separation is deferred.
See [current deployment rules](../DEPLOYMENT.md). Intentional operator work on
this shared database requires `HOSTED_DATABASE_CONFIRMATION=prep_pilot_dev` in
addition to the explicit CLI target. Existing hosted ownership needs no reapply.
Tests must use only disposable databases; the shared name is never a test target,
even with confirmation. No account changes are needed for the UI milestone.

One shared email/password login. Students land in onboarding/dashboard; admins and
the owner land in `/admin`. Owner inherits content/file access and alone uses
`/admin/administrators`. This does not enable R2 or email delivery.

## Explicit initial owner setup

Nothing runs against the normal database automatically. First register, sign in
once (creating its domain profile), and verify the intended owner's own email.
Copy its immutable `userId` from authenticated `/api/v1/me`; display name is not
an identifier. Choose the development database explicitly; never guess from the
URI or copy a test database name. Keep MONGODB_URI and auth secrets local.

Stop project dev/build/test servers before setup/build work. In Git Bash:

```bash
cd /c/PROJECTS/prep-pilot
export PATH="$PWD/.tools/node_modules/node/bin:$PATH"
read -r -p 'Explicit development database name: ' OWNER_DB
read -r -p 'Exact existing owner userId: ' OWNER_USER_ID
read -r -p 'That account email: ' OWNER_EMAIL
npm.cmd run db:setup -- --database "$OWNER_DB" --environment development &&
npm.cmd run admin:owner -- "$OWNER_USER_ID" --preview --email "$OWNER_EMAIL" --database "$OWNER_DB" --environment development
```

Migration 006 is additive after 001–005: validates existing profiles, verifies
index compatibility and adds uniqueness/lookup/reauth/receipt indexes. No roles,
accounts, content, singleton state or conflicting records are removed. Back up
the explicitly selected database before operational changes. Existing student/admin
records remain compatible; do not roll back to an application unaware of owner
after assigning that role.

Read the preview's database, environment, email, immutable identity, verification,
role, lifecycle and stateRevision. Preview does not mutate the account. An existing
different owner blocks provisioning; it does not initiate a transfer. After checking
the preview yourself, run this separate command in the same Git Bash terminal:

```bash
read -r -p 'stateRevision from the checked preview: ' OWNER_REVISION
npm.cmd run admin:owner -- "$OWNER_USER_ID" --apply --email "$OWNER_EMAIL" --expected-revision "$OWNER_REVISION" --database "$OWNER_DB" --environment development
```

For disposable environments substitute `--environment test` and explicitly select
that test database. Unique partial index enforces at most one owner even under
concurrent provisioning. Promotion and audit commit together. Reapplying to the
same owner is a no-op; another owner, wrong email, unverified identity, inactive
profile or stale revision fails safely. No real owner was provisioned by tests.

The retired `admin:provision` command never grants new access; it only acknowledges
unchanged existing admin/owner profiles and otherwise fails. It cannot demote or
overwrite an owner. Ownership recovery/transfer requires a separately approved,
backed-up operator procedure; no transfer/deletion UI is provided. Future erasure
must reject owner before any deactivation, session revocation or data removal.

## Owner UI walkthrough

1. Sign in as the explicitly provisioned owner; open Manage admins in `/admin`.
2. Find one existing account by exact email. Confirm name, email, current role,
   verification and eligibility. No public directory/autocomplete is exposed.
3. Choose Grant admin access, confirm your current password, then enter a short
   reason and explicitly confirm the grant. Password confirmation alone changes
   no role. It lasts five minutes in this session only and never survives expiry
   or revocation of that session. Five confirmation attempts per 15 minutes/account
   limit failed attempts as well as successful confirmations.
4. The helper's existing session can now enter `/admin`. It cannot manage admins.
5. Select Remove admin access, review the exact account/reason and confirm. Its old
   tab loses authorization on its next protected request. With preferences it
   returns to dashboard; otherwise onboarding. Content and history are preserved.
6. Conflict/uncertain response: check current account state, then start a new
   confirmation only if another change is needed. Do not blindly resubmit.

Every mutation uses server-derived owner identity, CSRF/Origin, strict fields,
current role/revision guards, target verification, atomic audit and operation IDs.
List defaults to 20/max 50; signed cursors last 30 minutes. Lookup: 30/minute/owner;
role changes: 20/hour/owner. These are application limits, not deployment DDoS controls.

## Email and verification limits

The Resend testing sender is still owner-inbox-only. A helper must verify their own
email before promotion even in EMAIL_MODE=test. Do not mark them verified manually,
redirect email to another recipient or enable general-user delivery to bypass this.
Real helper onboarding is blocked until a verified sending domain is configured.
Tests use mocked verified identities in isolated databases and send no real email.

## Verification

`npm.cmd run test:administration` uses a unique `pp_owner_<12 hex>` database,
real disposable Better Auth sessions and supported password verification. It tests
migration/provisioning, role guards, CSRF, session-bound step-up, verification,
concurrency, audit rollback/idempotency, demotion and data preservation. It drops
only its disposable database and does not start a Next server. Existing source
regressions are run sequentially. A new production build is required for this
milestone; the preceding R2 build cannot verify these new routes/UI.

Use README's established user-run Git Bash build fallback; keep EPERM diagnosis
paused. After that build, reuse the artifact for compiled HTTP and desktop/mobile
journeys. Do not run competing processes sharing `.next`.

The focused compiled fixture is
`node --conditions=react-server --env-file=.env.local --import tsx tests/administration-browser-fixture.ts`.
It uses a generated `pp_owner_ui_<12 hex>` database and an explicitly provisioned
disposable owner, verified helper/admin and unverified fixture accounts. It never
changes normal roles or sends email. It starts the existing production artifact on
127.0.0.1:3141 and a local fixture session gateway on port 3142. Files are disabled.
The gateway's masked Disposable fixture password field is only for confirming the
generated fixture credential; never paste it into chat/logs. No passwords/tokens
are printed by the fixture.

For browser automation that cannot transfer a masked test credential, an explicit
`OWNER_BROWSER_CREDENTIAL_FILE` may select an absolute temporary file named
`owner-browser-input.json`. It is exclusively generated fixture input, not an
application setting or normal account credential. The fixture creates it with
exclusive creation (never overwrites), requests private file mode, never logs its
contents and removes it during cleanup. Keep it outside Git and never put this
test-only value in application configuration. Normal fixture runs omit this option.

After the browser helper grant/remove journey, POST locally to
`http://127.0.0.1:3142/finish`. The fixture verifies exactly one grant/removal,
old-session denials and no catalog mutations, then drops its own database and
stops its own server. It automatically exits/cleans up after 20 minutes if not
finished explicitly. No other Next dev/build/test server should run concurrently.

Supported password mechanism: [Better Auth Verify Password](https://better-auth.com/docs/concepts/users-accounts#verify-password).
The installed 1.7.12 server-only endpoint was inspected; no parallel password store,
custom hashing, new auth plugin or dependency was added.
