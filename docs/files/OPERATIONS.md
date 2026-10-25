# Private attachments: implementation and external acceptance

This is the single operational setup checklist. Product/API/database/system-design
documents remain the contract, not additional activation instructions. Files are
disabled by default. No subscription, bucket, provider credentials, billing or
real-provider transfer has been activated or verified by implementation tests.
Explicit test fixtures inject mocked storage; application configuration never
falls back to a mock.

## Before external setup

- `npm.cmd run test:files` uses the configured MongoDB connection with a generated
  disposable `pp_files_<12 hex>` database, migrates it, injects mock storage and
  removes that database afterward. It never selects the normal database name.
- Unit tests include offline SDK URL signing with synthetic credentials. This
  performs no R2 request and cannot prove that real credentials/CORS work.
- Use README's sequential verification procedure: no competing development,
  build, type-generation or production-test processes. EPERM diagnosis remains
  paused; user-run builds and agent checks are reported separately.
- AWS SDK v3 client/presigner are runtime dependencies for supported S3 signing
  and object operations. Only the server imports them.

## One external setup checklist (requires separate owner approval)

1. Review R2 activation/subscription and billing in your Cloudflare account.
   Activation is an owner action, not performed by these scripts. Do not supply
   credentials in chat. Do not assume free allowances are a spending stop.
2. Create a dedicated development bucket, proposed name `prep-pilot-dev`, using
   **Standard** storage and the ordinary/global jurisdiction. Keep `r2.dev` public
   access disabled and attach no public/custom domain. Separate production/test
   buckets and credentials later; never point disposable tests at the real catalog.
   This adapter derives the global endpoint; jurisdiction-specific buckets require
   an explicit endpoint/configuration change, not a guessed host.
3. R2 Overview → Manage API Tokens → create an R2 API token → **Object Read &
   Write** → **Apply to specific buckets only** → select only the development
   bucket. Object reads, writes, listing and deletion are required. Do not grant
   bucket-administration permissions to the application. Configure CORS/lifecycle
   in the dashboard with your operator access. Store both S3 Access Key ID and
   Secret Access Key privately; the secret is shown only on creation.
4. Add these exact server-only values to ignored `.env.local` locally:

   ```dotenv
   FILES_ENABLED=false
   R2_ACCOUNT_ID=<your-32-character-account-id>
   R2_BUCKET=prep-pilot-dev
   R2_ACCESS_KEY_ID=<private-access-key-id>
   R2_SECRET_ACCESS_KEY=<private-secret-access-key>
   ```

   Preserve existing `AUTH_ENABLED`, `APP_URL`, `MONGODB_URI`, `MONGODB_DB_NAME`
   and independent auth/CSRF/rate-limit secrets. No `NEXT_PUBLIC_` credentials,
   public object base URL or separate R2 endpoint variable is used. Incomplete
   configuration with `FILES_ENABLED=true` fails closed. Restart after changing
   configuration; credentials alone do not enable files.

5. With the test application's `APP_URL=http://localhost:3000`, configure bucket
   Settings → CORS Policy → JSON with this **one** policy:

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

   The browser sends a direct PUT with only the grant's Content-Type header and
   raw file bytes, `credentials: omit`, no application CSRF/cookie/Authorization
   headers. Downloads open signed GET links without application credentials.
   No ETag response header is required or treated as SHA-256. HEAD/list/delete
   are server-side operations, so browser HEAD/DELETE permissions are unnecessary.
   Use the actual APP_URL origin if different; `127.0.0.1`, another port and
   `localhost` are distinct origins. Do not add wildcard preview origins.

6. Add an expiration lifecycle rule **only** for exact prefix `staging/`, deleting
   objects after one day. Keys are `staging/<assetId>/<uuid>`. Never expire
   `final/`: final keys are `final/<assetId>/<leaseId>`. Lifecycle expiration is a
   delayed safety net, not MongoDB reservation cleanup. Do not enable storage
   transitions to Infrequent Access.
7. Select an isolated development/test database and explicitly run the existing
   additive setup command before enabling the application:

   ```bash
   cd /c/PROJECTS/prep-pilot
   export PATH="$PWD/.tools/node_modules/node/bin:$PATH"
   npm.cmd run db:setup -- --database YOUR_EXPLICIT_TEST_DATABASE --environment test
   ```

   The running server must use that same explicit MONGODB_DB_NAME and a trusted
   APP_URL. Migration 005 creates file indexes and insert-if-absent quota state;
   it preserves records and existing singleton values, rejects invalid/conflicting
   data/indexes, and never drops indexes. There is no automatic startup index sync.
   Enable `FILES_ENABLED=true` only in this controlled test server once setup is
   complete. Do not enable it on ordinary development/production implicitly.

## Real-provider acceptance and cleanup

Use a disposable admin/student pair, disposable draft and the private development
bucket. Do not reuse normal accounts as mutation fixtures. Keep email sending
disabled for this test. Reuse a successful build and start just one test server.

1. Check an unsigned object URL cannot read an uploaded object and public bucket
   access is disabled. Inspect actual token scope privately in Cloudflare.
2. In `/admin/files`, upload a tiny original PDF and a small PNG through the browser.
   Confirm actual preflight and PUT succeed from the configured origin, status
   becomes ready only after server finalization, and another origin is not allowed.
   Do not paste signed URLs or export token-bearing network logs/screenshots.
3. Attach a ready file in the editor, save, review provenance/review date, preview
   as admin and publish only the disposable resource. Sign in as the disposable
   student: request and open a short-lived download, verify exact file bytes/name.
4. Verify unsupported/mismatched content fails finalization; anonymous/student
   upload attempts and draft/unrelated student download grants fail. Reuse a
   staging PUT after finalization and confirm the final download remains unchanged.
   Confirm five-minute PUT and 60-second GET expiry without logging the URLs.
5. Archive the disposable content and verify no new student grant is issued;
   already-issued links may work until expiry. Reopen and detach the files, save,
   then use explicit admin cleanup. Referenced files must be skipped. Wait for
   active leases/grant deadlines before cleaning pending uploads. Inspect per-item
   outcomes; retry only failed/eligible items, not the entire operation blindly.
6. Confirm objects disappear, ready/reserved counters reconcile and repeat cleanup
   does not decrement usage twice. Account for any staging URL still usable until
   expiry and verify the one-day lifecycle safety net separately. Stop the test
   server, disable files locally, revoke disposable provider credentials, and
   remove only explicitly identified test data/resources after owner approval.
   Database deletion alone does not delete provider objects. Content has no
   hard-delete endpoint: archive disposable content unless removing its entire
   confirmed isolated database. Never delete a shared development bucket wholesale.

## Recovery and accounting

- Grant creation is not generally idempotent. After an ambiguous response, inspect
  the file list for the pending grant; never automatically allocate another one.
- PUT success is not finalization success. After timeout, GET status; ready is
  idempotent, a live lease returns UPLOAD_IN_PROGRESS/Retry-After, and an eligible
  expired lease can be retried before finalizeBy. A missing object permits another
  transfer within the original five-minute URL lifetime. A new grant is explicit.
- Finalization reads at most 10 MiB + one byte, checks signatures/MIME/size and
  SHA-256, writes exactly those inspected bytes to a fresh immutable candidate,
  then commits ready metadata and quota conversion with the lease. This is not a
  malware scanner or a guarantee against malicious PDF contents. PDFs download;
  permitted images can open inline. A browser never receives a final-key PUT URL.
- Finalization external work has a 45-second abort budget, leaving transaction
  time within the route's 60-second configured maximum. Leases last 90 seconds;
  cleanup waits an additional 60 seconds after an abandoned validating lease.
  Provider calls remain outside retryable database callbacks. Hosting duration
  support and actual transfer timing remain real-provider/deployment checks.
- Invalid files retain rejected metadata and release reserved usage once. Provider
  or uncertain database failures retain a retryable lease/reservation and candidate
  prefix. Cleanup lists the asset's final prefix to discover old candidate orphans.
- Cleanup checks authoritative content references under the catalog guard, marks
  deleting with a lease, performs provider deletes, then atomically releases usage,
  marks deleted and writes audit. A failed provider/DB step remains retryable.
  Partial batch results are explicit; live/referenced uploads are skipped.
- The readonly accounting command is:

  ```bash
  npm.cmd run files:accounting -- --database YOUR_EXPLICIT_TEST_DATABASE --environment test
  ```

  It compares counters with reserved/committed file records and exits nonzero on
  mismatch. It changes no records, keys or indexes. A discrepancy requires stopping
  grants and an explicitly reviewed guarded repair; there is intentionally no
  automatic repair or counter-reset command. Metadata is not TTL-deleted.

## Quotas and billing are different controls

The application permits at most 100 ready + reserved objects and 500 MiB ready +
reserved bytes; every grant reserves a full 10 MiB. Durable limits: 20 grants per
admin/hour, six cleanup calls per admin/minute, 60 signing/download requests per
actor/minute. Five attachments per content item. These logical caps do not bound
all physical staging/candidate copies, oversized rejected objects, repeated PUTs,
download reuse, orphan storage or other account usage. CORS is not authorization.
Turning files off stops new grants, not existing signed capabilities.

Standard's currently documented monthly free allowances are 10 GB-month storage,
one million Class A and ten million Class B operations; excess is billable. Free
egress is not free storage/operations. Infrequent Access does not share that free
tier. Monitor account-wide usage and billing; an alert is not a hard spending cap.

Official references checked during preparation:

- [S3 setup and bucket-scoped credentials](https://developers.cloudflare.com/r2/get-started/s3/)
- [Token permissions](https://developers.cloudflare.com/r2/api/tokens/)
- [Private/public bucket settings](https://developers.cloudflare.com/r2/buckets/public-buckets/)
- [Browser CORS](https://developers.cloudflare.com/r2/buckets/cors/)
- [Presigned URL behavior](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)
- [Prefix lifecycle expiration](https://developers.cloudflare.com/r2/buckets/object-lifecycles/)
- [Pricing](https://developers.cloudflare.com/r2/pricing/)
