# Company source records and safe draft import

## Provenance

The source pack contains 144 LTM and 102 Cognizant references, with 38 repeats
mapped to canonical identities. Source lists exclude private chat sender names
and messaging dates. Candidate-reported interview material is not an official
company publication; no interview year, frequency or hiring track is inferred.

`company-source-ledger.v1.json` preserves all 246 reference identities.
The 39-item proposal pack contains 19 company adaptations and 20 original aptitude
questions. Original aptitude has no company association. Incomplete source intents
remain incomplete; HR/project/language/tooling material outside the supported
taxonomy is not silently converted into new topics.

The [review sheet](COMPANY_BATCH_REVIEW.md) contains exact authored records and
concerns. Frozen source packs retain null content-review dates and pending editorial
labels; subsequent live publication is documented separately in
[COVERAGE_RELEASE_EIGHT.md](COVERAGE_RELEASE_EIGHT.md),
[FIRST_FIVE_PUBLICATION_REVIEW.md](FIRST_FIVE_PUBLICATION_REVIEW.md) and
[APTITUDE_PUBLICATION.md](APTITUDE_PUBLICATION.md).

## Import contract

`npm run content:import` uses strict version-1 batch schemas and an explicitly
selected database plus exact verified active admin/owner identity.
It defaults to read-only dry-run. It never publishes, marks content reviewed,
changes roles, overwrites existing records or bypasses attachment/publication rules.

Company entries require an actual separately recorded provenance-review UTC
timestamp. The importer materializes student_reported associations from source
references; a flag does not make an official-company claim. Keep the same genuine
timestamp for retries. Never invent a timestamp to satisfy validation.

Duplicate inspection distinguishes:

- new slug/material;
- identical existing content (no write);
- same-slug conflict;
- possible exact title/prompt duplicate.

These checks do not prove absence of semantic duplicates; inspect related live
questions before applying. An edited/published record can correctly conflict
with its original proposal pack.

Each new draft, catalog/profile guard and audit commit atomically. A batch is not
one transaction: earlier successful drafts can remain after a later failure.
Rerun dry-run and reconcile per-item outcomes. Concurrent identical imports do
not create duplicate records. Exact draft creation is shared with admin services.

Exit 0 means only new/created/identical outcomes; 2 means review conflicts/gates/
reported domain failures; 1 means argument/configuration/connectivity/operator
failure. Logs must not expose credentials or raw private response bodies.

## Exact-selection operator workflow

Select a reviewed file containing only the intended items; neither dry-run nor
apply has a separate slug-selection option. Both process that exact file.
Do not use the whole 39-item pack when authorizing a small selection.
Check the file hash and report before applying.

```bash
# Git Bash; .env.local supplies the private MongoDB URI.
unset NODE_OPTIONS MONGODB_URI MONGODB_DB_NAME
BATCH='PATH_TO_EXACT_SELECTION.json'
TARGET_DB='YOUR_EXPLICIT_DATABASE'
ADMIN_ID='EXACT_VERIFIED_ADMIN_USER_ID'
ADMIN_EMAIL='EXACT_ACCOUNT_EMAIL'
PROVENANCE_REVIEWED_AT='ACTUAL_REVIEW_UTC_ISO_TIMESTAMP'
NODE_ENV=development npm.cmd run content:import -- --file "$BATCH" --database "$TARGET_DB" --environment development --admin-user-id "$ADMIN_ID" --admin-email "$ADMIN_EMAIL" --association-reviewed-at "$PROVENANCE_REVIEWED_AT"
```

For deliberate shared-target work only, set
`HOSTED_DATABASE_CONFIRMATION=prep_pilot_dev` and `TARGET_DB=prep_pilot_dev`.
That database is not disposable. Verify the report, unchanged file hash, target
and authorization before the separate write command:

```bash
NODE_ENV=development npm.cmd run content:import -- --file "$BATCH" --database "$TARGET_DB" --environment development --admin-user-id "$ADMIN_ID" --admin-email "$ADMIN_EMAIL" --association-reviewed-at "$PROVENANCE_REVIEWED_AT" --apply
unset HOSTED_DATABASE_CONFIRMATION ADMIN_ID ADMIN_EMAIL PROVENANCE_REVIEWED_AT BATCH TARGET_DB
```

For a new owner/empty database, follow [owner setup](../admin/OPERATIONS.md) and
[migrations](../DEPLOYMENT.md) first. Production configuration is not inferred
from a URI. No automatic import is run at build/deploy/startup.

Review imported drafts through the existing admin editor and publish only under
actual authorization, with revision guards and honest editorial attribution.
Keep existing publication/audit receipts and frozen source files intact.
