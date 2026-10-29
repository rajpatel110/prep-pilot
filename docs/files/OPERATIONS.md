# Optional private-file module

Files are **disabled in the hosted demo**. This document describes existing
server code for maintenance, not an available product capability.
No real bucket privacy, credentials, CORS, transfer or billing activation is
established by mocked tests. Do not activate cloud services implicitly.

## Configuration and storage boundary

The module requires authentication plus R2_ACCOUNT_ID, R2_BUCKET,
R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY when FILES_ENABLED=true.
Incomplete enabled configuration fails closed; the runtime never falls back
to mock storage. Keep FILES_ENABLED=false without separately authorized setup.

The adapter derives the ordinary/global R2 S3 endpoint. Use a private Standard
bucket with no public r2.dev/custom domain, and Object Read & Write credentials
restricted to that bucket. Configure bucket settings with operator access, not
bucket-admin privileges in the application's credential. These provider settings
need real acceptance before enabling files.

The browser uploads raw bytes by signed PUT with only Content-Type, credentials
omitted. Signed GETs do not carry application cookies/CSRF headers. One CORS policy
for the actual local test origin is:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedHeaders": ["Content-Type"],
    "MaxAgeSeconds": 600
  }
]
```

Use the exact APP_URL origin, not a wildcard. CORS is not authorization.
Lifecycle expiration applies **only** to `staging/` after one day;
never expire `final/`. Lifecycle expiry does not release database reservations.

## Implemented lifecycle

PDF, PNG, JPEG and WebP are accepted, at most 10 MiB/file. Grants reserve a full
10 MiB and return a five-minute staging PUT capability. Finalization must begin
within fifteen minutes. It reads at most 10 MiB plus one byte, validates size,
MIME/signature and SHA-256, writes the inspected bytes to an immutable candidate,
then conditionally commits ready metadata under the finalizer's lease.

Validation leases last 90 seconds; provider work has a bounded 45-second budget
inside the route's 60-second maximum. Provider calls are outside retryable
transactions. Browser clients never receive final-key PUT URLs.
This validates file structure, not malware safety.

A ready finalization retry is idempotent. An active lease reports in progress;
expired leases may be retried within their allowed window. Stale finalizers cannot
commit. Rejected files release reserved quota once. Uncertain provider/database
failures retain retryable reservation/candidate metadata, not false success.

Admin listing/status/preview and cleanup use existing authorization/CSRF/audits.
Cleanup checks authoritative catalog references under its guard, skips referenced
or live assets, leases deletion, removes provider objects and atomically releases
usage once. Candidate-prefix listing recovers orphan objects. Do not TTL-delete
metadata or reset quota counters. A failed step remains retryable.

Student grants require a published parent and attachment membership, not just
possession of a file ID. Five attachments per content item are allowed.

## Limits and recovery

Application limits: 100 ready+reserved objects and 500 MiB ready+reserved bytes;
20 grants/admin/hour, six cleanup calls/admin/minute and 60 signing/download
requests/actor/minute. These are logical controls, not a provider spending cap.
Repeated PUTs, staging/orphan copies, signed-link reuse and other account usage
can incur charges. Disabling files does not revoke already issued capabilities.

Read-only accounting:

```bash
npm.cmd run files:accounting -- --database YOUR_EXPLICIT_DATABASE --environment development
```

Compare reservations/committed metadata to counters. A mismatch requires reviewed
repair; no automatic reset is provided. The shared target needs its explicit
operator confirmation, never test cleanup.

`npm run test:files` uses a generated disposable database and mocked storage.
For separately authorized real acceptance, use an isolated database/bucket:
grant → signed upload → finalize → attach/publish → authorized download, with
wrong-role/parent/member rejection checks. Inspect counters, detach through
supported revision-guarded workflows and run cleanup; confirm provider objects
and disposable fixtures are removed. Mock evidence cannot replace these checks.

Provider references: [R2 S3 API](https://developers.cloudflare.com/r2/get-started/s3/),
[CORS](https://developers.cloudflare.com/r2/buckets/cors/),
[lifecycle](https://developers.cloudflare.com/r2/buckets/object-lifecycles/).
