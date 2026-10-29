# Brevo operator reference

Current supported modes, user behavior and configuration are consolidated in
[Email operations](OPERATIONS.md). Hosted setup is in
[Deployment](../DEPLOYMENT.md). This file provides Brevo-specific diagnosis, not a second rollout checklist.

## Provider diagnosis

Use the verified sender mailbox and a regular API key restricted to transactional
email. Sender verification is not authenticated ownership of a free-mail domain.
The adapter sends through the HTTPS transactional API with native fetch; it does
not subscribe contacts to marketing lists.

Inspect Brevo's private transactional dashboard for activation/sender/quota errors.
401/403 requires checking key permissions and account sending activation.
If activation is pending, complete Brevo's requested transactional-sending review.
Sender rejection requires correcting the verified sender/provider policy, not
using another provider's flag to bypass validation.

4xx/429 stops sending without a retry storm. Explicit server failures have bounded
retries with stable idempotency identity; ambiguous timeout/network/success results
are not blindly retried. Logs contain only sanitized categories, status, allowlisted
codes and request IDs, not addresses, keys, bodies or token links.

Operator reports include two-inbox verification/recovery; later reports describe
mandatory verification working. Those are user-run reports, not a new provider
dashboard inspection. Distinguish accepted request, inbox receipt and successful
explicit confirmation. Genuine expired-unused hosted links remain separately
unverified. Optional files remain disabled.
