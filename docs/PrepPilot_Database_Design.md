# PrepPilot Database Design Document

Version 1.0 | 23 October 2026 | Project owner Raj Patel

Implementation baseline for MongoDB Atlas, Mongoose and TypeScript, aligned with PrepPilot PRD v2 and System Design v1. This document defines what is stored, who owns it, which indexes enforce correctness, and how related writes remain consistent.

## 1 Storage decisions

Use one application database per environment. Mongoose owns the domain collections; the recommended Better Auth MongoDB adapter owns its identity collections. Files remain in private Cloudflare R2 storage. MongoDB stores file metadata and references, never file bytes or permanent signed URLs.

| Decision | Database consequence |
| --- | --- |
| Versioned plans | Keep historical plan documents. profiles.activePlanId is the single source of truth for the active version. |
| Attempt history | Append one document per deliberate submission; enforce retry uniqueness by user and submission ID. |
| Revision queue | Maintain one current revision per student and content item; preserve its source attempt. |
| Bounded embedding | Embed plan tasks and short content metadata; reference unbounded history and file assets. |
| Transactional writes | Use replica-set transactions for attempts, plan confirmation, content publication and quota accounting. |
| Server authority | Derive userId and role from the session. Client IDs and Mongoose references do not grant access. |

### Refinements made concrete here

Profiles may exist before preferences are complete. Tasks carry a revision-cycle identifier. Attempts retain the original response facts needed for safe retries. Upload quota reservations and finalisation leases have explicit fields. These extend the earlier architecture without changing its product scope.

Collection names in this document are literal. Set the Mongoose collection option explicitly to avoid automatic pluralisation changing names. Better Auth collection names and physical ID types follow the pinned adapter configuration; confirm them during the identity implementation.

### Reading map

2 Relationships · 3 Shared types and profiles · 4 Content · 5 Plans and tasks · 6 Previews · 7 Attempts and revisions · 8 Files and quota · 9 Operational records · 10–11 Indexes and reads · 12 Transactions · 13 Lifecycle and migrations · 14 Examples and acceptance checks.

### Status

The design is ready to guide implementation. Field limits and operational retention defaults below are proposed engineering defaults. The database, indexes and migrations have not been created by this document.

## 2 Relationships and collection ownership

| Parent or key | Child or reference | Cardinality and enforcement |
| --- | --- | --- |
| Auth user ID | profiles.userId | One profile per identity; lazy creation means temporarily zero. Unique index. |
| Profile userId | plans, planPreviews, attempts | One to many; all owned queries include userId. |
| Profile activePlanId | plans._id | Zero or one active pointer; referenced plan must have the same userId. |
| User and content pair | revisions | Zero or one current revision; compound unique index. |
| Content item | Plan tasks and attempts | One to many references with immutable historical snapshots. |
| Content item assetIds | fileAssets._id | Many to many. Content references are authoritative; no duplicate inverse array. |
| Revision lastAttemptId | attempts._id | Exactly one source attempt, with matching owner/content and sequence. |
| Plan sourcePreviewId | planPreviews._id | One confirmed plan per preview; reference survives preview TTL deletion. |

### Domain collections

Identity: profiles. Catalog: contentItems and catalogState. Planning: plans and planPreviews. Practice: attempts and revisions. Files: fileAssets and storageQuota. Operations: rateBuckets, emailDeliveries, verificationClaims, adminAudit, adminReauth, adminRoleOperations and schemaMigrations. Administration owns the new step-up/role-operation records; Identity remains the authoritative profile/auth interface.

### Authentication collections

Better Auth owns the logical user, session, account and verification records. User contains identity and email verification state; account contains credential/provider state; session contains revocable session state; verification supports library token flows. Exact physical fields and indexes come from the pinned adapter version. Do not add duplicate password, emailVerified or session-token fields to profiles. [5]

### Reference enforcement

MongoDB references are application-enforced relationships, not SQL foreign keys. Validate existence, ownership and lifecycle state inside the relevant transaction. Mongoose populate is a read convenience and does not enforce these rules. Historical references may intentionally outlive previews or archived catalog entries.

## 3 Shared types and profiles

UUID means a canonical lowercase UUID string. Notation: R = required; N = required and nullable; O = omitted when absent. ObjectId is a BSON ObjectId, Date is a BSON UTC date, Int is a safe nonnegative integer stored through Mongoose Number with integer validation. LocalDate is a calendar-validated YYYY-MM-DD string interpreted in Asia/Kolkata, never a TTL field.

Common domain fields: _id ObjectId R, schemaVersion Int R default 1, createdAt Date R, updatedAt Date R. Immutable events do not change updatedAt after insertion. Singleton/counter/migration IDs explicitly use strings where stated. API DTOs serialize ObjectIds and Dates as strings. Counters must remain within Number.MAX_SAFE_INTEGER.

| Field | Type and presence | Rules and meaning |
| --- | --- | --- |
| userId | String R | Opaque auth ID; immutable; unique. Never coerce it to ObjectId. |
| role | Enum R | student, admin or owner; default student. Only owner-controlled admin transitions; explicit operator initial-owner provisioning. |
| lifecycle | Enum R | active or deleting; default active. All protected services reject deleting accounts. |
| preferences | Object N | Null until a valid onboarding submission. Planning requires non-null preferences. |
| preferences.companies | String[] R | One or two unique IDs: cognizant, ltm. |
| preferences.deadline | LocalDate R | Must permit at least 7 inclusive days when saved. Existing stored deadlines may later be past. |
| preferences.dailyMinutes | Int R | 30–240 inclusive, multiple of 15. |
| preferences.skills | Object R | dsa, aptitude and cs integers, each 1–5. |
| timezone | String R | Asia/Kolkata in v1; server-controlled. |
| activePlanId | ObjectId N | Null before a plan is confirmed; referenced plan belongs to userId. |
| planVersion | Int R | Default 0; increases only when a plan is committed. |
| stateRevision | Int R | Default 0; increases on attempts, task changes, preference changes and plan commits. |
| attemptSequence | Int R | Default 0; incremented transactionally for each new attempt. |

### Concurrency and identity rules

Create missing profiles with an upsert using $setOnInsert and the unique userId key. No fabricated preferences are supplied. Profile edits compare the expected stateRevision and increment it atomically; a stale match returns 409. Role/lifecycle changes invalidate outstanding previews by also advancing stateRevision.

Display name and email remain in the auth user record. Read current role and lifecycle from profiles on protected requests. Email verification comes from the canonical auth state, subject to the system design’s live/test-mode gate. Profile creation is recoverable independently of auth signup; do not assume the two clients share a transaction.

### Owner governance amendment — 25 October 2026

Migration 006 adds profiles_one_owner: unique {role:1}, partial {role:"owner"},
including inactive owners so deactivation cannot silently free ownership. It also
adds profiles_admin_roles {role:1,_id:1} for bounded administrator pagination.
No independently editable isOwner flag. Migration rejects invalid profiles or
duplicate owners without deleting records or dropping indexes; normal startup
does not synchronize indexes. Provisioning requires the applied migration/index.

adminReauth: string _id SHA-256(session ID), userId string, confirmedAt Date,
expiresAt Date. TTL expiresAt cleans records only; access checks always enforce
expiry, five-minute maximum and current valid auth session. No passwords or session
tokens. Failed password confirmation clears an existing proof for that session.

adminRoleOperations: string _id actorUserId:operationId, actorUserId, operationId,
fingerprint SHA-256 of canonical validated operation, account committed DTO snapshot,
createdAt. Unique actorUserId+operationId. Retain without TTL for pilot idempotency;
review retention before broader rollout. Same ID/different payload conflicts.

Role change transaction: revalidate session/owner; lock acting owner profile, read
proof/operation, conditionally update active target role/stateRevision, append
adminAudit and insert operation receipt. Owner profile lock precedes target profile.
No catalog/quota lock needed. Target revision advances exactly once; replay does
not change target state or duplicate its audit. Existing actor guard advances its
stateRevision to serialize eligibility-sensitive work, including a replay request.
Audit adds optional previousRole/newRole for profile events; actor, target, reason,
timestamp, requestId and revisions are recorded without secret values.

Retain authored content, provenance, plans and study history on demotion. Owner
cannot be changed by ordinary role APIs/scripts. Future erasure procedures must
refuse owner; recovery/transfer is a separate, reviewed operator responsibility.

### Validation layers

Zod validates boundary DTOs and rejects unknown fields. Mongoose validates document structure. Services validate relationships and whole-plan rules; MongoDB unique indexes enforce cross-document uniqueness. Explicitly enable update validators, but do not rely on them alone for $inc or multi-field invariants. [4]

## 4 Content items and catalog state

| Field | Type and presence | Rules and meaning |
| --- | --- | --- |
| slug; seedKey | String R; String O | Lowercase stable slug, max 120; seedKey max 120 when seeded. Both unique, with a partial index for seedKey. |
| title; subject; topic | String R | Title 1–160; subject dsa\|aptitude\|cs; topic is a configured stable ID, max 80. |
| type; difficulty | Enums R | question\|resource; easy\|medium\|hard. |
| estimatedMinutes | Int R | 1–60 inclusive whole minutes. Saved task estimates are copied, not read dynamically. |
| tags | String[] R | Default []; at most 20 unique tags, each at most 40 characters. |
| companies | Object[] R | Default [] for foundations; at most 2, unique by companyId. Fields below. |
| prompt; body; explanation | String O | Each at most 12,000 characters. Sanitised Markdown; no raw HTML. All requests also obey 64 KiB JSON limit. |
| externalUrl | String O | HTTPS only; maximum 2,048 characters. |
| assetIds | ObjectId[] R | Default []; unique IDs, maximum 5. Only ready assets may be attached at publication. |
| source; attribution | String R | Source 1–2,048; attribution 0–2,000. Include provenance even for original material. |
| reviewedAt | Date N | Required non-null for publication; not in the future. |
| status; revision | Enum R; Int R | draft\|published\|archived; default draft. Revision starts at 1 and increases on every edit. |
| createdBy; updatedBy | String R | Trusted admin auth IDs, never accepted from the form. |
| publishedAt; archivedAt | Date N | Last applicable transition time; null before the transition. |

### Embedded company association

Each companies entry contains companyId (cognizant|ltm), association (verified|student_reported), source (1–2,048 characters) and reviewedAt (Date). Validate unique companyId values within the array. An empty companies array means shared foundation content; company-filtered discovery includes it.

### Publication constraints

A question needs a prompt or an external practice URL. A resource needs body text, a URL or a ready attachment. Explanations are optional but must not appear in list DTOs. Publish only after review and attachment readiness checks. Draft creation may use incomplete content bodies, but its stable identity and classification fields are required.

Keep slug stable after publication. Archived content retains its ID and historical references. Fundamental changes to question identity create a new item. Subject/topic reclassification is an admin revision; existing attempts retain their original classification.

### catalogState singleton

_id = "catalog"; revision Int default 0; commitSerial Int default 0; common timestamps/schemaVersion. Catalog edits, publication, archival and attachment-reference changes increment revision. Plan confirmation conditionally increments commitSerial while matching revision, creating a write conflict against concurrent catalog changes. Seed this singleton before serving writes.

## 5 Plans and embedded tasks

| Field | Type and presence | Rules and meaning |
| --- | --- | --- |
| userId; version | String R; Int R | Owned auth ID; version ≥1, unique within user. |
| previousPlanId | ObjectId N | Previous version for the same user; null for the first plan. |
| sourcePreviewId | ObjectId R | Unique; identifies the confirmation command even after its preview is purged. |
| generatedAt | Date R | Server commit-time instant. |
| attemptSequenceAtGeneration | Int O | Additive adaptation watermark captured from the guarded profile at acceptance. New plans save it; legacy absence reads as 0 without rewriting history. Suppress reviewed evidence until a newer attemptSequence, not a wall-clock comparison. Internal service field, not a student DTO field. |
| templateVersion; rulesVersion | String R | Immutable version identifiers, each at most 80 characters. |
| timezone; windowStart; windowEnd | String R; LocalDates R | Asia/Kolkata; original window contains 7–30 inclusive days. |
| budgetSnapshot | Object R | dailyMinutes plus complete preferences used to build the plan. |
| tasks | Task[] R | At most 480; unique taskId within this plan. Schema below. |
| deferred | Object[] R | At most 480 retained candidate records; contentId, taskId, kind, revisionSourceSequence?, reasonCode and estimatedMinutes. See overflow rule below. |

### Task schema

| Field | Type and presence | Rules and meaning |
| --- | --- | --- |
| taskId; contentId | UUID R; ObjectId R | Stable task identity across retained versions; referenced content item. |
| contentSnapshot | Object R | title ≤160, subject, topic ≤80, type, contentRevision ≥1; historical display facts. |
| kind; revisionSourceSequence | Enum R; Int O | fresh\|revision. Revision tasks require the source attempt sequence; fresh tasks omit it. |
| scheduledDate; estimatedMinutes | LocalDate R; Int R | Inside plan window; estimate 1–60 whole minutes. All task minutes count against that date’s budget, without rounding. |
| priority | Enum R | due_revision\|overdue\|fresh; server-calculated. |
| status; completedAt | Enum R; Date N | pending\|completed; completedAt non-null exactly when completed. |
| reasonCode; reason | String R | Allowlisted reason code; human explanation up to 280 characters. |

### Version and size invariants

Only the active plan’s task status is mutable. Superseded plans become immutable. For an adjustment within a window, retain completed tasks and their IDs; pending work cannot be assigned before today. A new preparation window keeps old completions in archived history rather than copying them into an ever-growing active document.

Maximum 30 × 16 fifteen-minute tasks = 480. Validate unique embedded task IDs in service code; a unique multikey index does not enforce uniqueness within one array. Reject BSON documents above a 2 MiB application cap, below MongoDB’s 16 MiB limit. [1,6]

If deferred candidates exceed 480, reject preview creation with a scope-too-large error and require a narrower planning scope; never silently truncate the work shown for acknowledgement. The full revision queue remains independently paginated.

## 6 Plan previews and confirmation receipts

| Field | Type and presence | Rules and meaning |
| --- | --- | --- |
| userId; kind | String R; Enum R | initial\|adapt\|reschedule; server validates whether the operation is allowed. |
| basePlanId | ObjectId N | Active pointer captured when building the proposal. |
| baseStateRevision; catalogRevision | Int R | Capture user and catalog revisions from a consistent read snapshot. |
| templateVersion; rulesVersion | String R | Versions used by the deterministic scheduling engine. |
| localDateAtCreation | LocalDate R | Preview becomes stale when the study date changes. |
| proposal | Object R | Complete new plan payload: budget, window, tasks and deferred records using section 5 schemas. |
| evidence | Object[] R | At most 100 topic entries: subject, topic, up to 3 attempt IDs and an allowlisted rule code. |
| expiresAt | Date R | createdAt + 10 minutes; check explicitly at confirmation. |
| purgeAt | Date R | createdAt + 24 hours; TTL deletion, independent of validity. |
| state; confirmedPlanId | Enum R; ObjectId N | pending\|confirmed; plan ID is non-null exactly when confirmed. |
| confirmedAt | Date N | Set in the same transaction as the plan and active pointer. |

### What is persisted and what is derived

Persist the complete proposed schedule so confirmation commits exactly what the student reviewed. Derive the task diff and daily totals from proposal versus base plan; do not store a third independently editable copy of the same tasks. Store triggering attempt IDs so recommendations remain explainable.

A pending preview is never an active plan. It is invalid after expiration, a date change, any relevant state change, or a rules/template version change. Confirmation must also validate every referenced content item against the transaction’s catalog state.

### Retry after preview deletion

Before treating a missing preview as not found, look up plans by sourcePreviewId and userId. A matching plan proves a previous successful confirmation and can be returned as the original result. The sourcePreviewId unique index prevents two committed results for the same preview. Never return a plan to a different user who guesses that ID.

### Initial and renewed windows

Initial generation requires complete preferences and no current plan, or an explicitly requested new window after the prior window ends. Adapt/reschedule retains the existing window end. An expired window produces a new-window prompt, not tasks scheduled outside the old boundary.

### Task changes and retained completion

Completion and undo require expectedStateRevision and the activePlanId. The taskId is unique only within a plan version; retaining it across versions is intentional. Never apply an update by taskId alone across every plan document.

## 7 Attempts and revisions

### attempts collection

| Field | Type and presence | Rules and meaning |
| --- | --- | --- |
| userId; submissionId | String R; UUID R | Unique pair. Retry uses the same submissionId; a new deliberate attempt uses a new one. |
| requestHash | String R | 64-character SHA-256 of canonical validated user input and operation version. |
| contentId; contentSnapshot | ObjectId R; Object R | Question identity plus title, subject, topic, type and contentRevision at submission. |
| subject; topic | String R | Indexed classification copied from the snapshot; must agree with it. |
| kind; outcome | Enums R | practice\|revision; independent\|needed_help\|failed. |
| perceivedDifficulty | Enum O | easy\|medium\|hard; omit when not rated. |
| attemptSequence | Int R | Unique per user; monotonic transactionally allocated sequence. |
| resultSnapshot | Object R | revisionId, dueDate, intervalDays, resultingStateRevision and attempt date returned by the original submission. |

The common createdAt is the server attempt timestamp, fixed across transaction retries. The record is immutable after commit. Duplicate retries return resultSnapshot, not today’s mutable revision record. Reject the same submissionId with a different canonical requestHash. Attempt inputs cannot set sequence, snapshots or userId.

### revisions collection

| Field | Type and presence | Rules and meaning |
| --- | --- | --- |
| userId; contentId | String R; ObjectId R | Exactly one record per pair after the first qualifying attempt. |
| lastAttemptId; lastAttemptSequence | ObjectId R; Int R | Latest accepted source; owner and content must match. |
| dueDate; timezone | LocalDate R; String R | Calendar date in Asia/Kolkata; may lie beyond the active plan. |
| intervalDays | Int R | One of 1, 3 or 7. |
| reason | Enum R | failed_or_hard\|help_or_medium\|independent_easy_or_unrated. |

### Revision and metric semantics

Precedence: failed OR hard → 1 day; otherwise needed_help OR independent+medium → 3 days; otherwise independent+easy/unrated → 7 days. Derive dueDate from the server attempt date in the study timezone. A later revision attempt advances the same queue record and produces a new cycle sequence.

A revision task identifies a cycle by contentId plus revisionSourceSequence. At most one pending task for that cycle may appear in a plan. If a newer attempt changes the queue, the saved plan stays unchanged until a preview is confirmed; show the old task as superseded when appropriate.

Currently solved is based on the latest attempt per question, including revision attempts. Reading completion comes from plan tasks. Do not add a permanently increasing solvedCount or store a second “latest attempt” flag that can drift from history.

## 8 File assets and storage reservations

| Field | Type and presence | Rules and meaning |
| --- | --- | --- |
| createdBy; displayName | String R | Admin ID and sanitised filename ≤180 characters. |
| stagingKey; finalKey | String R; String O | Unique application-generated R2 keys; finalKey set only for a validated ready object. |
| declaredMime; declaredBytes | String R; Int R | Allowlisted MIME; 1–10,485,760 bytes. Declaration is untrusted. |
| detectedMime; actualBytes; sha256 | String O; Int O; String O | Required at ready: verified MIME, size from 1 byte to 10 MiB and 64-character digest. |
| status | Enum R | uploading\|validating\|ready\|rejected\|deleting\|deleted. |
| expiresAt | Date R | Upload completion deadline; proposed 15 minutes after grant. No TTL index on this field. |
| leaseId; leaseUntil | UUID N; Date N | Conditional ownership of finalisation/cleanup; finite lease, renewed only by owner. |
| candidateKey | String O | Persist before writing a final object; key includes asset ID and lease ID. |
| reservationBytes; reservationState | Int R; Enum R | Reserve the full 10 MiB maximum per grant; reserved\|committed\|released. |
| readyAt; deletedAt | Date N | Set on relevant completed transition. |
| errorCode | String O | Safe category only; no credentials or signed URLs. |

### storageQuota singleton

_id="r2"; readyBytes, readyCount, reservedBytes, reservedCount are nonnegative Int values starting at zero. limitBytes=524,288,000 and limitCount=100 are server-owned defaults. Common timestamps/schemaVersion apply. Reserve one object and 10 MiB before issuing a grant; reserving only declaredBytes would allow under-declaration to bypass the cap.

Grant transaction: require readyBytes+reservedBytes+10 MiB ≤ limitBytes and readyCount+reservedCount+1 ≤ limitCount; increment reserved totals and insert the asset. Ready transaction: lease-match the asset, convert its reservation to actual ready usage and record verified metadata. Rejection/expiry releases the reservation exactly once. Successful provider deletion decrements committed usage once.

### Object safety and reference integrity

Finalise inspected staging bytes into a fresh candidateKey, then commit that key as finalKey. A browser never receives a PUT URL for final keys. Old leases cannot publish after a new lease owns the asset. The asset-specific R2 prefix allows cleanup to discover orphan keys from prior leases without embedding an unbounded operation list.

Content assetIds is the authoritative reference. Cleanup uses an indexed assetIds lookup and the same catalog-state transaction guard as attachment changes. Referenced assets cannot enter deleting. Do not TTL-delete FileAsset metadata: object deletion and quota release must finish first.

Cleanup must allow the maximum finalisation request lifetime to pass before removing abandoned candidate objects, then recheck readiness and lease ownership. Periodically reconcile ready/reserved totals from asset records and inspect orphan prefixes; report discrepancies before applying a guarded repair. Verify actualBytes does not exceed the reserved maximum before committing ready usage.

## 9 Operational collections

| Collection | Required fields beyond common fields | Rules |
| --- | --- | --- |
| rateBuckets | _id String bucket key; count Int; windowStart Date; expiresAt Date | Key includes policy, HMAC subject and time window. Atomic increment; deny when count exceeds configured limit. TTL expiresAt. |
| verificationClaims | tokenDigest String; userId String; expiresAt Date; claimedAt Date\|null; purgeAt Date | Unique digest. Atomically match unclaimed and unexpired, then set claimedAt. Token validity remains the auth library’s responsibility. |
| emailDeliveries | operationKey String; userId String\|null; type verification\|reset; state pending\|accepted\|failed\|skipped_test; providerId String?; attempts Int; errorCode String?; purgeAt Date | Unique issuance key. pending is a refinement for in-flight sends; it is not a durable mail queue. No raw token, link, recipient address or message body. |
| adminAudit | actorUserId String; action String; entityType String; entityId String; priorRevision Int\|null; newRevision Int\|null; changedFields String[]; requestId String | Append-only application interface. changedFields max 40 names. Safe reason text optional, max 500; no secret values. |
| schemaMigrations | _id String migration key; checksum String; state running\|applied\|failed; ownerToken String; leaseUntil Date\|null; startedAt Date; completedAt Date\|null; errorCode String? | New operational collection. One document per versioned migration; immutable checksum, fenced runner and restart-safe batches. |

### Counter and token rules

Rate bucket expiry is cleanup only. The bucket key determines its enforcement window; a delayed TTL pass cannot extend or reset a rate window. On concurrent first insertion, handle duplicate key by retrying the atomic increment. Fail closed for protected mutations if the durable limiter cannot be consulted.

Verification claims store a digest of the library-issued high-entropy token. A passive link page does not consume it; explicit confirmation claims it before library verification. Once claimed, retries cannot reuse it; a failed claimed request needs a new link. All public consumption paths must use the guard.

### Provider outcomes

Store a pending email operation before sending; mark accepted only after provider acceptance. A request timeout may leave an unknown outcome, so retry that issuance with the same provider idempotency key while supported. A new issuance is a new key. No queued-mail guarantee is inferred from a pending record.

### Audit and migration ownership

Content changes and their audit insert share the domain transaction. File events describe actual recorded state transitions. Auth-library changes may need a separate supported hook and reconciliation because a Mongoose transaction does not encompass another client’s transaction. Never claim that a best-effort audit write is atomic with auth.

## 10 Index specification for domain collections

Index keys are shown in order; + means ascending and − means descending. U = unique; P = partial. Every collection already has its _id index. Give indexes stable names in the TypeScript migration manifest; verify exact keys/options with listIndexes before enabling dependent writes.

| Collection | Key and options | Purpose |
| --- | --- | --- |
| profiles | userId+ U | One profile per identity; actor lookup. |
| contentItems | slug+ U | Stable unique slug. |
| contentItems | seedKey+ U P: seedKey is string | Idempotent seed identity; omit key for admin-created items. |
| contentItems | status+, _id+ | Default published browsing and admin status lists. |
| contentItems | status+, subject+, topic+, difficulty+, _id+ | Fully specified catalog filter; not guaranteed to cover every partial filter sort. |
| contentItems | status+, companies.companyId+, _id+ | Company discovery; foundations require a separate empty-array branch. |
| contentItems | assetIds+ | Reference check before asset cleanup. |
| contentItems | title/text, topic/text, tags/text | One MongoDB text index. Bounded keyword search; no unescaped user regex. |
| plans | userId+, version− U | Version allocation uniqueness and history ordered newest first. |
| plans | sourcePreviewId+ U | One committed result per preview; retry receipt after preview TTL. |
| planPreviews | userId+, createdAt−, _id− | Owned recent previews. |
| planPreviews | purgeAt+ TTL=0 | Asynchronous cleanup at the stored purge time. |
| attempts | userId+, submissionId+ U | Retry idempotency. |
| attempts | userId+, attemptSequence− U | Per-user sequence uniqueness and global history. |
| attempts | userId+, contentId+, attemptSequence− | Latest attempt per content and content history. |
| attempts | userId+, subject+, topic+, kind+, attemptSequence− | Last three practice attempts per topic. |
| revisions | userId+, contentId+ U | One current queue record per question. |
| revisions | userId+, dueDate+, _id+ | Due-list range query and stable cursor. |

### Uniqueness details

Use a partial filter {seedKey: {$type: "string"}} rather than indexing missing/null seed keys as ordinary unique values. Unique indexes enforce cross-document guarantees even during concurrent writes; catch error 11000 and map it to the relevant conflict/retry rule. Mongoose unique is an index declaration, not a validator. [1,3,4]

## 11 Operational indexes and read paths

| Collection | Key and options |
| --- | --- |
| fileAssets | stagingKey+ U; finalKey+ U P where finalKey is string; status+, createdAt+, _id+; status+, expiresAt+ |
| rateBuckets | expiresAt+ TTL=0; deterministic _id supplies uniqueness. |
| verificationClaims | tokenDigest+ U; purgeAt+ TTL=0. |
| emailDeliveries | operationKey+ U; state+, updatedAt+, _id+; purgeAt+ TTL=0. |
| adminAudit | entityType+, entityId+, createdAt−, _id−; actorUserId+, createdAt−, _id−. |
| catalogState; storageQuota | Singleton _id only. |
| schemaMigrations | Migration _id only; runner lease checked through conditional updates. |

### Read patterns

| User operation | Query and consistency rule |
| --- | --- |
| Load roadmap | Read profile by userId, then plan by {_id: activePlanId, userId}; return pointer/stateRevision together from a snapshot if concurrent change would make the pair inconsistent. |
| Latest outcome | Match userId, sort by contentId then attemptSequence descending, group by contentId and take first; count independent outcomes. |
| Weak-topic evidence | Match userId, subject, topic and kind=practice; sort attemptSequence descending; limit 3. |
| Due revisions | Match userId and dueDate ≤ today; sort dueDate then _id ascending; limit ≤50; join content availability separately. |
| Company browsing | Published AND (selected company ID match OR companies is empty). Index each branch where possible; merge with stable ordering/deduplication. |
| Download permission | Read published content by ID, verify assetIds contains asset and file status=ready. Do not authorise from a raw R2 key. |
| Progress dashboard | Use one read snapshot when combining plan, attempt and revision totals. No writes on GET. |

### Embedded task uniqueness

Do not create a unique index on tasks.taskId: the same task may legitimately appear in multiple plan versions, and array-internal uniqueness still needs validation. Do not create a second active-plan flag or unique active-plan index that competes with the profile pointer.

### Pagination and projection

Use a server-signed opaque cursor bound to filters and the last sort tuple. For revisions after (date,id), query dueDate \> date OR dueDate=date AND _id\>id, still scoped to owner and today. Attempts use attemptSequence; plan history uses version. Return explicit DTO fields and use lean reads where document methods are unnecessary.

Text search in v1 uses a stable _id cursor with a capped query and optional in-memory sort over the small matching set; it does not promise relevance-ranked pagination. Examine representative queries with explain executionStats. Add indexes only when measured scans/sorts justify their storage and write cost.

## 12 Transaction boundaries and write recipes

### Domain transaction contract

Use one Mongoose connection/session per transaction, primary read preference, snapshot read concern and majority write concern. Pass the session explicitly to every query/write. Use Connection.transaction or the driver helper for retryable transaction handling, with a bounded overall deadline. Do not run Promise.all inside a transaction or make R2/Resend calls in a retrying callback. [2]

### Attempt and revision commit

1 Read any existing (userId, submissionId) result first. Same hash returns it; a different hash fails. Resolve current content and prepare its snapshot, one stable attempt ID, server timestamp and request hash.

2 In the transaction, recheck retry uniqueness and content eligibility, and build the final content snapshot from that transactional read. Increment profile.attemptSequence and stateRevision, conditioned on lifecycle=active. The profile write serialises the user’s competing study mutations. Insert the attempt, upsert the revision, and store original revision/result facts in resultSnapshot.

3 Commit. On a duplicate-key race, read the winner and apply the same hash comparison. On an unknown commit outcome, resolve by the original submissionId; never generate a replacement ID automatically. Use the new sequence to ensure an older transaction cannot overwrite a newer revision.

### Confirming a plan

Load an existing plan by sourcePreviewId first for retry recovery. Otherwise validate the owned pending preview, its expiry, local date, versions and acknowledged deferred IDs. In a transaction, conditionally write catalogState using captured revision, and profile using captured activePlanId/stateRevision. Recheck catalog references, insert the next plan version, update the pointer and mark the preview confirmed. Any mismatch aborts all writes.

All writers follow one lock order when they touch several shared documents: catalogState first, then profile, then storageQuota, then dependent records. Operations that do not need a shared document omit it. This reduces avoidable contention without replacing conflict retries.

### Catalog and file writes

Content edit/publish/archive: match expected content revision, update the catalog guard, validate any referenced assets and write content plus audit. Asset attachment and deletion decisions share that catalog guard; this prevents attach-versus-delete races.

Upload grant: quota reservation and asset insertion are atomic. Finalisation: external validation/write finishes first; a lease-guarded transaction then marks the asset ready and converts the reservation. Cleanup: mark deleting only after a guarded reference check, perform external deletion, then atomically release usage and mark deleted. Failure leaves a retryable intermediate state.

### Task updates and failure semantics

Match the owned activePlanId, expected stateRevision and target taskId; change only that embedded task and increment stateRevision in one transaction. Completion never creates an attempt. Transient retries must re-run all invariants. Return a stale-state conflict for a changed base, not an automatic overwrite of the user’s new state.

## 13 Data lifecycle migrations and recovery

| Data class | Proposed retention and cleanup |
| --- | --- |
| Profiles, attempts, revisions, plans | No automatic TTL. Keep study history for the account lifetime; explicit owner-requested deletion uses an operator procedure. |
| Content and audit | Archive referenced content. Retain adminAudit for the portfolio pilot; review growth and retention before broader use. |
| Previews | Valid 10 minutes; purge after 24 hours. plans.sourcePreviewId remains the durable confirmation receipt. |
| Rate buckets | expiresAt = window end + 24 hours. Enforcement uses the bucket’s window, not TTL timing. |
| Verification claims | purgeAt = expiresAt + 24 hours. Always check expiresAt before claiming. |
| Email delivery metadata | purgeAt = createdAt + 30 days; no persistent plaintext token/link. |
| File metadata | No TTL while any object or reservation may need cleanup. Retain deleted tombstones for 30 days, then purge through a checked maintenance command. |
| Migrations | Keep permanently; retain checksum, status and execution evidence. |

TTL uses a BSON Date field and runs asynchronously; expired documents may still exist. It cannot enforce access expiry or carry out provider deletion. Do not set TTL on revision dueDate, active sessions outside library guidance, or incomplete FileAssets. [7]

### Mongoose and migration setup

Set explicit collection names, strict schemas, timestamps and autoIndex=false in deployed environments. Use schemaVersion for migrations and the documented revision fields for concurrency; do not rely on __v as a universal write guard. Create/verify required indexes with an explicit TypeScript migration command before opening writes.

Migration steps: acquire a database-wide runner lock (a reserved schemaMigrations lock ID whose lock-record variant has ownerToken and leaseUntil plus common fields), verify checksum and current state, scan for duplicates/invalid data, apply restart-safe batches, create indexes, verify results, then mark applied. A crashed runner is resumed under a new fenced lease. Never silently drop conflicting records or run syncIndexes at every startup.

Use expand → backfill → enforce → later contract. Keep readers compatible during rollout. Seeds use seedKey and $setOnInsert; existing admin edits are preserved. Back up before destructive changes and document which old application versions remain compatible with the new data.

### Account deletion and recovery

An operator marks profile.lifecycle=deleting, revokes auth sessions, then deletes owned plans/previews/attempts/revisions and token/delivery records in restartable batches. Use the auth library’s supported deletion path for identity/credentials. Preserve published content and its provenance; redact personal identifiers in audit/history as defined by the project’s retention policy. Delete the profile last.

Test restoration into an isolated database, including indexes, auth configuration and R2 object references. A MongoDB backup alone does not restore deleted R2 objects. Restore credentials/configuration separately through the secret store; validate pointers, quotas and token expiry before reopening access.

## 14 Worked records and acceptance checks

### Example attempt and revision

The abbreviated storage sketch below omits common fields and uses placeholders inside ObjectId constructors; it is not an insert-ready document. Auth IDs remain opaque strings. A failed practice attempt on 23 October schedules the next revision on 24 October in Asia/Kolkata.

```text
attempts
  userId: "auth_user_A", submissionId: "<UUID>"
  contentId: ObjectId("<question-id>"), attemptSequence: 12
  kind: "practice", outcome: "failed"
  createdAt: Date("2026-10-23T10:00:00Z")
  resultSnapshot: { revisionId: ObjectId("<revision-id>"),
    dueDate: "2026-10-24", intervalDays: 1,
    resultingStateRevision: 29, attemptDate: "2026-10-23" }

revisions
  userId: "auth_user_A", contentId: ObjectId("<question-id>")
  lastAttemptId: ObjectId("<attempt-id>"), lastAttemptSequence: 12
  dueDate: "2026-10-24", intervalDays: 1
  reason: "failed_or_hard", timezone: "Asia/Kolkata"
```

### Required database acceptance evidence

Prove: two identical submissions produce one attempt and one revision update; a changed payload with the same ID fails; two different attempts receive ordered sequences; rollback cannot leave half an attempt/revision write; concurrent confirmations leave one active pointer; stale previews fail after task or catalog changes; archived plans are immutable.

Also prove: incomplete onboarding persists safely; cross-user references fail; task-cycle deduplication works; TTL lag never grants access; null/missing optional keys do not collide; upload reservations cannot exceed the cap; finalisation/cleanup cannot release quota twice; referenced assets cannot be deleted; metrics match a known dataset and midnight boundary cases.

### Sources and baseline

Project sources: PrepPilot_PRD_v2.docx and PrepPilot_System_Design.docx, current copies reviewed for this document. Official technical references checked 23 October 2026. Proposed field limits and retention periods are PrepPilot choices, not provider guarantees.

[1] MongoDB unique indexes — https://www.mongodb.com/docs/manual/core/index-unique/

[2] Mongoose transactions — https://mongoosejs.com/docs/transactions.html

[3] MongoDB partial indexes — https://www.mongodb.com/docs/manual/core/index-partial/

[4] Mongoose validation — https://mongoosejs.com/docs/validation.html

[5] Better Auth MongoDB adapter — https://better-auth.com/docs/adapters/mongo

Better Auth core schema — https://better-auth.com/docs/concepts/database

[6] MongoDB limits — https://www.mongodb.com/docs/manual/reference/limits/

[7] MongoDB TTL indexes — https://www.mongodb.com/docs/manual/core/index-ttl/
