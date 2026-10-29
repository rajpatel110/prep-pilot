# Verification and recovery email

The live app uses Brevo transactional email according to operator-reported
receipt/verification/reset checks. Configure delivery and access policy separately.
No provider acceptance result alone proves inbox receipt.

## Server-only configuration

```dotenv
EMAIL_PROVIDER=brevo
BREVO_API_KEY=<private-restricted-api-key>
BREVO_SENDER_EMAIL=<provider-verified-mailbox>
BREVO_SENDER_NAME=PrepPilot
BREVO_SENDER_VERIFIED=true
EMAIL_MODE=live
EMAIL_DELIVERY_MODE=live
EMAIL_TEST_RECIPIENTS=
```

Live delivery requires HTTPS and a correctly configured APP_URL; hosted origin is
`https://prep-pilot-theta-tan.vercel.app`. Preserve auth/database/security
settings. Brevo sender verification proves the provider's sender-mailbox check,
not ownership/authentication of gmail.com or any free-mail domain.

Use a regular Brevo API key restricted to transactional email, not marketing/
contact access. The adapter uses native HTTPS POST to the transactional API.
There is no contact subscription, marketing list creation or provider failover.
Enter keys privately; never send credentials, email bodies or token links to chat/logs.

| Setting                      | Meaning                                                                                 |
| ---------------------------- | --------------------------------------------------------------------------------------- |
| EMAIL_MODE=test              | Allows unverified study access; not mandatory-verification deployment                   |
| EMAIL_MODE=live              | Blocks unverified protected study/admin access, including existing sessions             |
| EMAIL_DELIVERY_MODE=disabled | Sends nothing, even with provider credentials                                           |
| restricted                   | Brevo; intended recipient must match comma-separated EMAIL_TEST_RECIPIENTS, maximum ten |
| owner_test                   | Loopback APP_URL, test access policy and exact EMAIL_TEST_RECIPIENT                     |
| live                         | Live access policy, HTTPS and configured sender; recipient allowlist is ignored         |

Restricted entries are trimmed/lowercased; mail is never redirected to a different
address. Restricted mode works with test or live access policy. Clear the list
for live operation to avoid misleading operators.

Resend remains an explicit alternative using RESEND_API_KEY, RESEND_FROM_EMAIL
and RESEND_SENDER_VERIFIED. Its testing sender is owner-inbox-only; general
Resend live sending requires a verified non-testing sender. Resend flags do not
satisfy Brevo sender configuration.

## User behavior and security

Live-mode signup creates an unverified account and initiates verification when
delivery is enabled. Failures do not mark an address verified: verification/resend,
status, recovery and sign-out remain available. Both protected pages and APIs
check current verification state. Existing verified owner roles remain unchanged.

Verification tokens expire after 60 minutes. Opening the link does not consume it;
the user explicitly confirms. Reset tokens expire after 30 minutes. Reset requires
a new password and revokes existing sessions. Used/expired/invalid links fail safely.
Requests retain CSRF, exact-origin and durable rate-limit protections. Recovery
responses remain generic rather than disclosing account existence.

Link fragments are captured and scrubbed without logging. Same-tab replacement
links clear stale errors. A refresh loses the in-memory token; reopen the original
email link instead of exposing/copying it to an operator.

## Controlled delivery check

Use a migrated disposable database and a compiled app whose terminal-only settings
select that database, fresh test secrets, loopback APP_URL and restricted delivery.
Add only inboxes you control to the allowlist. Do not enable real sending in
automated tests or point a fixture at the shared hosted database.

1. Request verification for a disposable account at a controlled inbox.
2. Separately record provider acceptance, inbox/spam receipt and explicit confirmation.
3. Check verified status, then request reset for the same account.
4. Privately choose a new password; check old-password failure and session revocation.
5. Check used links fail. Repeat delivery at a second controlled inbox when needed.
6. Stop only the identified fixture server and remove only its exact disposable DB.

After controlled hosted receipt succeeds, mandatory verification uses live/live.
Environment edits require redeployment. Do not mark existing accounts verified
or disable enforcement to work around sender/provider errors.

## Failures and maintenance

Provider activation, quotas, sender rejection and timeouts must be resolved in
the Brevo account, not bypassed. Inspect sanitized request IDs/statuses and provider
dashboard; do not log raw responses containing private material. No uncontrolled
retry loop is used. Delivery errors do not become verification success.

Mocked tests (`test:email`, `test:brevo`, `test:brevo-http`,
`test:email-auth`) use isolated fixtures and do not prove actual provider delivery.
Operator reports cover real mailbox receipt and successful flows; genuine expired,
unused hosted-link rejection is not independently established by those reports.

Password rotation uses the supported reset flow; rotating a database-user password
or signing secret is not a substitute. See [deployment](../DEPLOYMENT.md).
