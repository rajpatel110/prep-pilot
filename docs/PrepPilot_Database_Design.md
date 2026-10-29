# Database contracts

MongoDB replica-set transactions are required. Better Auth owns its adapter
records; Mongoose owns domain collections. No startup index synchronization runs.
Use the additive migration tool with an explicit target.

## Collections and ownership

| Collection                           | Purpose and invariants                                                                                     |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| user, account, session, verification | Better Auth identities, credentials, sessions and token flows; adapter-owned                               |
| profiles                             | Unique userId; active/deleting lifecycle, student/admin/owner role, preferences, counters and activePlanId |
| contentItems                         | Unique slug, optional unique seedKey; draft/published/archived, revision, provenance and material          |
| catalogState                         | Catalog singleton revision and transactional commit guard                                                  |
| plans                                | Owned immutable version identity, task snapshots and explicit task status                                  |
| planPreviews                         | Owned expiring proposals with base state, catalog/config versions and confirmation receipt                 |
| attempts                             | Immutable owned submissions with unique submission identity, sequence and result snapshot                  |
| revisions                            | One current revision per user/content pair, referencing its latest attempt                                 |
| rateBuckets                          | Durable expiry-bound counters; no process-local security rate state                                        |
| verificationClaims                   | Single-use verification coordination                                                                       |
| emailDeliveries                      | Safe delivery metadata; acceptance is not inbox receipt                                                    |
| adminAudit                           | Transactional action, actor, entity and revision metadata                                                  |
| adminReauth                          | Short-lived session-bound password confirmation                                                            |
| adminRoleOperations                  | Durable idempotency receipts for owner role changes                                                        |
| schemaMigrations                     | Version/checksum receipts for additive setup                                                               |
| fileAssets, storageQuota             | Optional file lifecycle and reservations; live files disabled                                              |

Exact physical auth fields/indexes belong to the pinned Better Auth adapter.
Do not duplicate passwords, verification flags or session tokens in profiles.

## Profiles and saved history

Preferences use Cognizant/LTM selections, ISO deadline, 30–240 daily minutes in
15-minute increments, and subject confidence 1–5. Timezone is Asia/Kolkata.
`stateRevision` and plan versions guard mutations and stale proposals.
The partial unique owner index permits at most one owner. Owner provisioning
requires an existing verified identity and active profile, not a signup claim.

Attempts retain title/subject/topic/type/contentRevision and original result
facts. Plans retain task estimates and content snapshots. Catalog edits never
retroactively rewrite saved classification or durations. Referenced unavailable
content retains a safe historical snapshot instead of leaking draft bodies.

## Content contract

Content estimates are integers 1–60. Subject/topic pairs must be canonical.
Company entries contain companyId, association (verified/student_reported), source
and an actual review date. Empty companies means foundation content, not missing
provenance. Every item still has source/attribution.

Content transitions and edits increment revision and catalog revision with an
audit in the same transaction. Publication requires a nonfuture review date,
usable question/resource material and ready referenced assets. Draft import
leaves content review pending and never overwrites existing records.
See [canonical content schemas](../src/modules/catalog/schemas.ts) and
[models/indexes](../src/modules/catalog/model.ts).

## Planning and practice

A plan references its source preview uniquely. Its active status is derived from
the profile pointer; owned queries include userId. Task IDs are unique within a
proposal, fresh material is not duplicated, and scheduled/deferred arrays are
bounded at 480 each. Whole-plan validation enforces date/budget/snapshot rules.

Pending previews expire after ten minutes and have a 24-hour purge TTL. Confirmed
plans/receipts retain acceptance identity after preview removal. TTL deletion is
eventual, so services enforce expiry explicitly. Confirmation serializes against
profile and catalog changes, then atomically saves the version and pointer.

An attempt atomically advances the user's sequence, inserts an immutable record,
updates its revision cycle and stores an idempotent result. Exact retries return
that original result; changed input conflicts. Task completion is separate.

## Migration and recovery rules

Migrations 001–006 cover foundation/catalog/auth, practice, planning, email,
files and owner administration. The script verifies checksums, existing data and
index compatibility, creates missing structures and preserves existing records
and singleton state. Conflicts fail; it does not drop indexes or repair by
deleting records.

`scripts/database-migrations.ts`, `scripts/migrations/` and module
`indexes.ts` files are the executable index manifest. Keep migration files
immutable after application; never substitute hand-written indexes in a runbook.
The setup CLI has no dry-run flag: inspect its manifests before an authorized apply.

Provider calls remain outside retryable transactions. Audit failure rolls back
its domain mutation. References use service checks and transaction guards, not
MongoDB foreign keys. Do not directly edit roles, verification flags, tokens or
catalog state to work around validation.

Current local and hosted environments share the non-disposable
`prep_pilot_dev`. Automated fixtures use exact randomly named disposable
targets and guard cleanup. Code rollback never reverses migrations or saved
records. See [deployment procedures](DEPLOYMENT.md).
