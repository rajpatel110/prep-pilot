# Email verification and recovery

Separation is deferred; local and hosted currently share `prep_pilot_dev`.
Automated tests must use only disposable targets, never the shared database.
The existing real owner was later
genuinely verified through an explicitly chosen local owner-inbox session on that
shared database; this does not authorize routine tests on it. Hosted remains
email-disabled. See [the runbook](../DEPLOYMENT.md) for environment separation and
the supported, user-operated exposed-password reset/session-revocation procedure.

## Configuration and availability

`EMAIL_MODE` remains the access policy, not a provider sandbox switch. `test`
preserves unverified demo study access. `live` gates study/admin access on actual
email verification. Changing it does not enable mail or verify existing accounts.

`EMAIL_DELIVERY_MODE` is a separate, default-`disabled` opt-in:

| Mode         | Requirements and effect                                                                                                                                                                                                                                                                                         |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `disabled`   | Existing demo behavior. Provider credentials alone do not activate sending. Email wrappers return EMAIL_DISABLED (already-verified resend may return already_verified).                                                                                                                                         |
| `owner_test` | Authentication, loopback APP_URL, EMAIL_MODE=test, exact EMAIL_TEST_RECIPIENT and valid Resend configuration. Only that actual account's address may receive mail. Other reset requests get the same generic acknowledgment without sending; other verification requests are unavailable. No address rewriting. |
| `live`       | EMAIL_MODE=live, HTTPS APP_URL, non-resend.dev sender and explicit RESEND_SENDER_VERIFIED=true operator attestation. Set only after verifying the owned sender with Resend. This flag does not verify a domain with the provider.                                                                               |

No `.env.local` values or modes were changed by implementation. The testing
sender `onboarding@resend.dev` is not a verified general-user sending domain.
Do not enable public/live delivery with it.

## Owner-inbox manual walkthrough

The user completed owner-inbox verification/recovery on 25 October 2026 against
an isolated database and the existing production build at 127.0.0.1:3121.
Actual receipt and functional outcomes are recorded separately from automated
mocked-delivery evidence in IMPLEMENTATION_STATUS.md. Disposable databases were
inspected and removed afterward. This does not enable general-user delivery.
The reported same-tab fragment issue has a focused source correction: later
email-link fragments are captured and scrubbed without consuming them. Focused
event tests, a user-run production build and the agent's mocked compiled-browser
same-tab recheck passed. Refresh deliberately loses the in-memory token; reopen
the original email link in that case. A subsequent focused mocked-browser check
also passed at a measured 390x844 viewport: same-tab confirmation, replacement
link error clearing, keyboard confirmation and readable non-overflowing success
and error states. Earlier failed viewport attempts remain recorded separately
in IMPLEMENTATION_STATUS.md. Never share token-bearing links.

Use a separate, explicitly selected development/test database and a disposable
PrepPilot account whose email **exactly matches your Resend account email**.
Do not reset your existing admin/student accounts. No promotion is needed.
If that email already belongs to a real account in the current database, use an
isolated development database; do not repurpose the real account.

In the ignored `.env.local`, configure locally (replace placeholders, never paste
credentials into chat):

```dotenv
APP_URL=http://localhost:3000
EMAIL_MODE=test
EMAIL_DELIVERY_MODE=owner_test
EMAIL_TEST_RECIPIENT=your-resend-account-address@example.com
RESEND_API_KEY=your-local-secret
RESEND_FROM_EMAIL="PrepPilot <onboarding@resend.dev>"
RESEND_SENDER_VERIFIED=false
```

Preserve the existing auth/MongoDB/secret settings for the explicitly selected
test database. Run the existing additive migration runner once, specifying that
database (not a guessed target). Git Bash:

```bash
cd /c/PROJECTS/prep-pilot
export PATH="$PWD/.tools/node_modules/node/bin:$PATH"
npm.cmd run db:setup -- --database YOUR_EXPLICIT_TEST_DATABASE --environment test
```

Migrations 001–004 preserve records/singleton state, fail on conflicts and never
sync/drop indexes on application startup. The new migration creates unique digest
and issuance indexes, delivery state/updatedAt/_id ordering, and TTL purge indexes.
004 must be applied before enabling delivery. Implementation/tests did not apply
this to the development catalog. Do not run setup against production.

Build using the README's normal Git Bash fallback, then run one production server
with `npm.cmd start`. Do not share `.next` with another dev/build/test process.
Restart after configuration changes. Never add a diagnostic NODE_OPTIONS preload.

1. Register the disposable owner-address account; signup does not auto-send email.
2. Open `/verify-email`, choose **Send a new verification link**. A request accepted
   message is not proof of inbox delivery. Check Resend, inbox and spam privately.
3. Open the received link. The address-bar fragment disappears, but verification
   must remain false until **Confirm email verification**. Then check account
   status/sign in. Reopening the same original link and confirming must show the
   generic invalid/expired/already-used state. Do not share the link/token.
4. Sign in in two browser sessions to this disposable account. Request recovery
   at `/forgot-password`; open the received link, enter matching 12–128-character
   passwords and explicitly confirm. Both earlier sessions must lose access;
   old password must fail and the new password must work. Reuse must fail.
5. Check a different disposable email's request returns generic acceptance but
   no mail is redirected to the owner. Test general demo access remains unchanged.
6. Record inbox receipt separately from provider acceptance. Remove the disposable
   database/account using the established isolated-fixture cleanup, restore
   EMAIL_DELIVERY_MODE=disabled, remove EMAIL_TEST_RECIPIENT and stop the test server.
   Do not delete a database containing real users/content.

If Resend rejects the owner recipient, check the address/sender/account setup
privately. Do not workaround by forwarding another user's reset or verification.
If a confirmation times out, first sign in/check verification status; a consumed
token is not blindly retry-safe. Reopen the email link if the browser reloads after
the fragment was stripped; tokens are deliberately not persisted in browser storage.

## Token, delivery and privacy boundaries

Pinned Better Auth 1.7.12 owns hashing, JWT validity, native reset token storage
and credential/session transactions. The app wraps its supported server methods;
native public verify/send/reset/callback routes remain blocked. Unverified users
can sign in/request verification/sign out without bypassing the live study gate.

Verification stores only SHA-256 digest, user ID and library expiry; an atomic
unclaimed/unexpired update precedes native verification. A dependency failure
after claiming does not unspend it: request a fresh link. Same-second native JWT
issuance can coalesce to the same operation; it never clears an existing claim.
Wait before resending (UI waits at least 60 seconds). No auto-sign-in.

Reset keeps Better Auth's 30-minute stored token and transactional single-use
consumption, password write and all-session revocation. A failed credential write
rolls back all three. Native verification JWT expiry is 60 minutes. Missing,
expired and used links share TOKEN_INVALID_OR_EXPIRED, intentionally not an oracle.

Links use only configured APP_URL and fragment tokens; callbacks are passive GETs.
Fragments never reach server request URLs. Pages remove the fragment after capture,
set no-referrer/noindex/no-store and add no third-party analytics. Requests accept
no callback URLs, actor IDs or privileged fields. Verification resend requires a
current session, CSRF and exact Origin; public reset/confirmation require Origin
and JSON. Errors preserve request IDs without raw exception/provider messages.

Strict Mongoose metadata models use the same underlying client/session for
claim+delivery issuance; no provider request occurs in a retryable transaction.
Metadata contains no recipient, password, reusable token, recovery URL or body.
Claims purge 24 hours after expiry; delivery metadata purges after 30 days.
The auth adapter alone owns its own reset-token representation.

Next `after` registers awaited, bounded delivery work: pending before sending,
accepted only after a valid provider acknowledgment, up to three attempts with
250/500 ms backoff, five-second request timeouts, stable issuance idempotency key
and identical message. Permanent rejection stops immediately. Resend idempotency
keys are valid for 24 hours; these retries stay inside that window. No durable
queue, inbox-delivery guarantee or automatic restart recovery is claimed.
Pending can remain if execution stops; provider acceptance can be unconfirmed
after an acknowledgment/storage failure. Failed means attempts did not confirm
acceptance, not proof that the inbox received nothing. Request another link rather
than reconstructing stored email bodies (there are none).

Provider errors never affect reset's generic 202 acknowledgment. Unknown and
ineligible addresses receive the same response. A 500 ms minimum request floor
mitigates fast-path timing differences; it is not a claim of perfect constant-time
network/database behavior. Platform-wide disabled mode returns 503 for all.

Durable HMAC buckets: each send flow 3/address/hour and 10/client/hour; combined
consumption 10/client/15 minutes. Retry-After reflects the actual fixed-window end.
Only Vercel's overwritten x-vercel-forwarded-for is trusted when VERCEL=1; elsewhere
use a conservative shared local/deployment bucket, ignoring forwarded spoofing.
Review the trusted proxy policy before hosting elsewhere. Local limits affect
all local sessions; restarting does not clear the MongoDB counters.

## Sources and verification

- [Better Auth email/password](https://better-auth.com/docs/authentication/email-password)
- [Better Auth MongoDB adapter](https://better-auth.com/docs/adapters/mongo)
- [Resend send API](https://resend.com/docs/api-reference/emails/send-email)
- [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys)
- [Testing sender restriction](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain)
- [Vercel request headers](https://vercel.com/docs/headers/request-headers)

Installed adapter/password source was inspected for transaction behavior; focused
integration tests prove it against disposable data rather than relying on docs
alone. `npm.cmd run test:email` mocks delivery, creates a unique test database,
runs migrations and cleans it up. Cross-process reset consumers cannot send mail;
tokens/passwords travel only through private IPC, not process arguments or logs.
`npm.cmd run test:email-auth` reuses the existing canonical permission/authentication
regression in both email modes against separate disposable databases. Run these
sequentially; neither compiles Next nor uses a production build. After the user-run
build, run the existing production HTTP auth regression sequentially. Its child
environment explicitly sets EMAIL_DELIVERY_MODE=disabled for the established
demo assertions, rather than inheriting the operator's local owner-only opt-in.
No provider request is made. Exact execution/build/UI
results and remaining limitations are recorded in IMPLEMENTATION_STATUS.md.

For compiled-screen checks without sending email, the isolated browser harness is:
`node --env-file=.env.local --import tsx tests/email-browser-fixture.ts` with Node 24.
Run it only after other Next test/development processes stop. It reuses `.next`,
creates a guarded short test database, injects mock Resend delivery into its owned
production child, and prints a loopback fixture control URL. Tokens and session
cookies stay in fixture memory/private IPC, never terminal output. The helper is
not imported by application code and must never be used for a real account/server.
Enter ends the fixture; a 15-minute timeout also cleans up its database and owned
servers. Add `--focused` for a two-minute noninteractive hold when only rechecking
confirmation; this mode does not depend on terminal input. Browser password
changes require manual handoff; automated backend reset
tests remain separate. Do not infer real Resend inbox delivery from this harness.
