# Brevo verification and recovery rollout

Implementation opt-in; no real sending or hosted configuration changed by this
milestone. The operator reports a verified PrepPilot Gmail sender and a restricted
regular API key (Transactional email: All, other resources: None; MCP disabled).
The user subsequently reports successful single-inbox verification and recovery,
including old-password rejection, session revocation and reused-link rejection.
Account activation settings were not inspected; delivery to a second independent
inbox and hosted delivery remain unverified.
Gmail sender verification proves mailbox access, not ownership/authentication of
gmail.com. Brevo may rewrite the sender domain; inspect actual received messages.
No purchased domain is required by this approved limited rollout. This updates
the earlier Resend-only assumption; it does not claim full pilot readiness.

Agent-run production build and mocked compiled HTTP gates passed. Single-inbox
receipt and explicit confirmation are now user-reported successes; the
commands below reuse this build and do not need another compilation unless source
changes. Earlier Resend receipt tests do not count as Brevo evidence.

## Server-only configuration

No variable below uses NEXT_PUBLIC_. Add privately in VS Code to ignored
`.env.local`; preserve existing auth/database values and leave delivery disabled:

```dotenv
EMAIL_PROVIDER=brevo
BREVO_API_KEY=<your-private-restricted-Brevo-API-key>
BREVO_SENDER_EMAIL=341raj.patel@gmail.com
BREVO_SENDER_NAME=PrepPilot
BREVO_SENDER_VERIFIED=true
EMAIL_DELIVERY_MODE=disabled
EMAIL_MODE=test
EMAIL_TEST_RECIPIENTS=
```

BREVO_SENDER_VERIFIED is an operator attestation of the sender mailbox status,
never a domain-authentication claim. Resend flags cannot satisfy it. Existing
Resend configuration remains supported with EMAIL_PROVIDER=resend (legacy default).
There is no provider failover. The Brevo adapter uses native fetch, not Nodemailer,
and sends text through POST https://api.brevo.com/v3/smtp/email only. No contact or
marketing-list APIs are called.

Modes: disabled sends nothing; legacy owner_test retains its loopback/test/exact
single-recipient restriction. New restricted mode requires Brevo, up to ten exact
comma-separated EMAIL_TEST_RECIPIENTS and HTTPS or loopback. It sends only to the
intended allowlisted address, never redirects messages. It can run with test
access for delivery staging or live access for enforcement testing. Live delivery
requires EMAIL_MODE=live and HTTPS, and removes the recipient restriction.

EMAIL_MODE=live enforces the existing server-side student/admin/owner gate.
Login, verification confirmation/resend, recovery, status and sign-out remain
reachable. Signup initiates native verification only in live access mode with
delivery enabled. Signup issuance shares verification request limits; issuance
failure leaves the unverified account able to request another link. Existing
accounts are never marked verified by configuration changes.

Preferences writes now use the same study guard as their protected page; status,
CSRF issuance, resend and sign-out remain available before verification.

## Local two-inbox test, only after the new build passes

Stop other project servers. Never use prep_pilot_dev for this test. Enter your
second controlled inbox privately when prompted. In Git Bash:

```bash
cd /c/PROJECTS/prep-pilot
export PATH="$PWD/.tools/node_modules/node/bin:$PATH"
unset NODE_OPTIONS HOSTED_DATABASE_CONFIRMATION
NODE_EXE="$PWD/.tools/node_modules/node/bin/node.exe"
export MONGODB_DB_NAME="pp_brevo_manual_$("$NODE_EXE" -e 'process.stdout.write(require("crypto").randomBytes(6).toString("hex"))')"
export APP_URL=http://127.0.0.1:3122
export AUTH_ENABLED=true EMAIL_PROVIDER=brevo EMAIL_MODE=live EMAIL_DELIVERY_MODE=restricted FILES_ENABLED=false
read -r -p 'Second inbox you control: ' SECOND_INBOX
export EMAIL_TEST_RECIPIENTS="341raj.patel@gmail.com,$SECOND_INBOX"
export BETTER_AUTH_SECRET="$("$NODE_EXE" -e 'process.stdout.write(require("crypto").randomBytes(32).toString("hex"))')"
export CSRF_SECRET="$("$NODE_EXE" -e 'process.stdout.write(require("crypto").randomBytes(32).toString("hex"))')"
export RATE_LIMIT_SECRET="$("$NODE_EXE" -e 'process.stdout.write(require("crypto").randomBytes(32).toString("hex"))')"
if [[ "$MONGODB_DB_NAME" =~ ^pp_brevo_manual_[a-f0-9]{12}$ && -n "$SECOND_INBOX" ]]; then
  printf 'Disposable database: %s\nApplication: %s\n' "$MONGODB_DB_NAME" "$APP_URL"
  NODE_ENV=development npm.cmd run db:setup -- --database "$MONGODB_DB_NAME" --environment test &&
  "$NODE_EXE" --env-file=.env.local node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3122
else
  printf 'Stopped: disposable database generation or second inbox is missing.\n'
fi
```

The generated target is explicitly selected; migration tooling never selects the
database from the URI path. Use Atlas credentials authorized for disposable test
databases. Keep this terminal running while interacting with emails. Do not send
passwords, API keys or token links to chat.

1. Open http://127.0.0.1:3122/signup in a private window. Create a disposable account
   using the sender inbox and a new test password. Repeat with your second inbox.
2. Confirm protected pages route to verification; API access must be denied while
   unverified. Check Brevo transactional logs separately from inbox/spam receipt.
3. Open the email link; merely loading it must not verify. Press explicit confirm,
   then check account status and normal role routing. Reuse must be rejected.
4. Use resend if issuance failed, respecting cooldown/rate limits. Outside the
   allowlist, verification is unavailable and reset keeps its generic response.
5. Sign into the second disposable account in two private browser contexts. Request
   recovery, receive the email, choose a new test password and confirm. Old sessions
   and old password must fail; the new password works. Reused reset link fails.
6. Record separately: provider accepted, inbox received, explicit verification
   succeeded, reset/session revocation succeeded. No provider test is claimed until
   you report the results. Do not test by resetting the existing owner.
7. Stop this server with Ctrl+C. In Atlas remove only the printed generated
   pp_brevo_manual database after confirming it contains just these fixtures.
   Close this terminal to discard temporary exports. .env.local delivery remains
   disabled. Never drop or clean prep_pilot_dev.

## Failure handling and operator diagnosis

The app reports request acceptance, not delivery. Recovery acknowledges unknown
and known addresses generically. Brevo 4xx/429 stops immediately; quota exhaustion
must not cause a retry storm. Explicit 5xx permits the existing maximum three
attempts within seconds with a stable UUID idempotency key in the JSON headers.
Timeout/network/malformed-success results are ambiguous and are not automatically
retried. A duplicate_parameter response is not treated as confirmed acceptance.
Brevo's documentation describes 15-minute single-send and 30-minute batch windows;
the app does not schedule retries beyond either window or claim indefinite dedup.

Only sanitized category, HTTP status, allowlisted provider code and request ID
are logged on terminal failure. No raw provider message, address, body, key or
token is logged. Check Brevo's private transactional dashboard for the full account
reason. 401/403: check key permission/account sending activation. Account pending
validation: complete Brevo's requested activation review. Invalid sender: confirm
the exact verified sender and provider free-domain policy. Quota/credits: wait for
reset or stop sending; no billing activation is authorized. Do not bypass rejection.

Delivery remains bounded Next after work, not a durable queue or inbox guarantee.
Provider calls stay outside retryable transactions. Existing 60-minute verification,
30-minute reset, atomic claim, CSRF/origin/rate controls and session revocation stay
unchanged. Automated tests use mock transports and generated databases only.

## Later Vercel rollout: operator controlled

Automated commands: `npm.cmd run test:brevo` exercises disposable mocked signup
and verification; `npm.cmd run test:email` covers existing recovery/expiry/rates;
`npm.cmd run test:email-auth` checks both access modes. After a successful production
build, `npm.cmd run test:brevo-http` reuses it for mocked production page/API gates
and verified-owner routing. Run sequentially, with other Next processes stopped.
The HTTP fixture uses a generated pp_brevo_http database and port 3123, then removes
only its fixtures and stops its server. No real provider request is permitted.

Do not change Vercel until local two-inbox results and the new build pass.
In Project Settings → Environment Variables, select the intended hosted environment
only; do not copy secrets/database access to Preview. Set fresh provider credentials
privately, EMAIL_PROVIDER=brevo, the three BREVO_SENDER_* values above and:

```dotenv
APP_URL=https://prep-pilot-theta-tan.vercel.app
EMAIL_MODE=test
EMAIL_DELIVERY_MODE=restricted
EMAIL_TEST_RECIPIENTS=<controlled-inbox-one>,<controlled-inbox-two>
FILES_ENABLED=false
```

Keep hosted auth/security secrets stable and the existing database/owner intact.
Deploy only when separately authorized. Test hosted verification/resend and reset
with designated disposable accounts, never the real owner's password. This first
stage still allows unverified demo access; it is delivery staging, not mandatory
verification. Do not claim the goal is live at this stage.

Once hosted receipts and explicit confirmations pass, confirm the real owner's
`/api/v1/me` still reports role owner and emailVerified true. Explicitly opt into
EMAIL_MODE=live and EMAIL_DELIVERY_MODE=live, then redeploy. Test new signup and
existing unverified-user routing, verified login and owner access. All actual
recipients must receive their own mail. If delivery fails, preserve enforcement;
disable sending to contain provider failures and repair configuration. Reverting
EMAIL_MODE to test removes the mailbox-access gate and requires an explicit
operator security decision, not an automatic fallback. Code rollback does not
undo verification, password resets, sessions or other database changes.

## Sources

- https://developers.brevo.com/docs/send-a-transactional-email
- https://developers.brevo.com/reference/send-transac-email
- https://developers.brevo.com/changelog/2021/11/10
- https://developers.brevo.com/docs/heterogenous-versions-batch-emails
- https://help.brevo.com/hc/en-us/articles/16045394674066-Troubleshooting-Domain-authentication
