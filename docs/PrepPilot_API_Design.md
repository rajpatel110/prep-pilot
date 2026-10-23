# PrepPilot API Design Document

Version 1.0 | 23 October 2026 | Project owner Raj Patel

REST API contracts for the PrepPilot placement preparation application. This document defines requests, responses, access checks, errors and retry behaviour for implementation with Next.js Route Handlers on Node.js and TypeScript.

## 1 Contract baseline

Aligned with PRD v2, System Design v1 and Database Design v1. Application data remains in MongoDB Atlas through Mongoose; Zod validates external inputs. Better Auth is the proposed identity library, with secure cookie sessions. Cloudflare R2 handles attachments and Resend handles verification and password-reset delivery.

| Area | Contract decision |
| --- | --- |
| Application base | Same-origin /api/v1. All paths in this document use that prefix unless explicitly stated otherwise. |
| Authentication base | /api/auth mounts the pinned Better Auth adapter. Approved native operations retain the library’s request/response format. |
| Transport | HTTPS in deployed environments; JSON application bodies; cookies for browser authentication. |
| Backend | Next.js App Router Route Handlers with Node.js runtime. No separate Express or NestJS server. |
| Consistency | Version guards for mutable state; persistent submission IDs for attempt retries; preview IDs for confirmation retries. |
| Contract ownership | Services enforce business rules and ownership. Route Handlers validate and translate HTTP; response DTOs do not expose raw database records. |

### Refinements introduced here

Add read endpoints for plan history, a saved preview and admin file status so the UI can recover after refreshes or timeouts. Define application email-flow endpoints that wrap the auth library, enforce demo/live mode and consume verification links once. These complete workflows already required by the existing documents.

The API shapes and example values below are design contracts, not evidence of implemented or deployed endpoints. During implementation, encode them in Zod and an OpenAPI specification with reusable schemas and contract tests. Native auth schemas must be verified against the exact pinned library version.

### Reading map

2 Conventions · 3 Access and native authentication · 4 Email flows · 5 Profile · 6 Catalog · 7 Attempts and revisions · 8 Plans · 9 Preview and confirmation · 10 Tasks and dashboard · 11–12 Admin content · 13–14 Files · 15 Errors and retries · 16 Implementation and acceptance.

### Scope boundary

No code execution, automated grading, timed tests, student uploads, payments, public admin provisioning or bulk imports. A sending domain and R2 activation remain live-service dependencies; server capability flags make unavailable features explicit.

## 2 Transport types and response conventions

| Field | Contract |
| --- | --- |
| ID | Domain IDs: 24-character hexadecimal ObjectId strings. Auth user IDs: opaque strings. Task/submission IDs: canonical lowercase UUID strings. |
| Dates | UTC instants use ISO 8601 with Z. Study dates use valid YYYY-MM-DD in Asia/Kolkata. Examples use 23 October 2026. |
| Numbers and nulls | Counts/revisions are nonnegative safe integers. Percentages are numbers or null. Nullable response fields are present with null; optional request fields are omitted. |
| Enums | Subjects dsa\|aptitude\|cs; difficulty easy\|medium\|hard; companies cognizant\|ltm. All enum spellings are case-sensitive. |
| Application input | Content-Type: application/json for writes. Reject unknown fields, invalid IDs, unsupported query keys and repeated scalar parameters with 422 VALIDATION_ERROR. |
| Headers | Browser writes send Origin and X-CSRF-Token where required. Responses include X-Request-Id. Private responses use Cache-Control: no-store. |
| Size limits | Application JSON requests ≤64 KiB, excluding native auth and direct R2 transfer. API JSON responses ≤2 MiB; reject oversized proposals rather than truncating acknowledged work. |

### Success and error envelopes

```text
200 OK
{ "data": { "id": "507f1f77bcf86cd799439011" } }

422 Unprocessable Content
{ "error": { "code": "VALIDATION_ERROR",
    "message": "Check the highlighted fields.",
    "fields": { "dailyMinutes": ["Must be a multiple of 15."] } },
  "requestId": "req_example_01" }
```

Every application success contains data. meta is optional and contains pagination/replay information only. Errors contain a stable machine code, a safe message, optional fields and a requestId. Only readiness errors also carry the typed details defined in section 12. Frontends branch on code, not message text. Never return stack traces, Mongo errors, credentials, tokens from database records or provider secrets.

### Lists and cursors

```json
{ "data": [], "meta": { "page": {
  "limit": 20, "nextCursor": null, "hasMore": false
} } }
```

Default limit 20, maximum 50. cursor is an opaque signed string bound to endpoint, filters, sort, limit and owner where applicable. Reject tampering or changed filters with 400 INVALID_CURSOR. Cursor expiry is 30 minutes; due-date cursors also become invalid at the study-day boundary. Lists return an empty array, never 404.

Pagination is not a frozen multi-request snapshot. Mutable catalog/revision data can change between pages; refresh from page one after relevant writes. Attempt history and plan history use monotonic sequence/version ordering. No arbitrary sort or Mongo query operators are accepted.

### PATCH and GET semantics

PATCH updates only supplied allowlisted fields; omitted values remain unchanged. Array values replace the whole array, not individual elements. Explicit null clears only fields documented as clearable. GET performs no study mutation. Unsupported methods return 405 with Allow; unsupported media type returns 415; oversized body returns 413.

## 3 Access rules and native authentication

| Access label | Server requirements |
| --- | --- |
| Public | No session required. Exact allowed Origin for writes, JSON and rate checks still apply. |
| Actor | Valid database-backed session; current profile.lifecycle=active. May have incomplete preferences or unverified email. |
| Study | Actor plus verified email when EMAIL_MODE=live. Unverified demo study access is allowed only in server-configured test mode. |
| Admin | Study plus current profile.role=admin. Role is read on the server for each protected request. |
| Owned resource | Query with both resource ID and trusted userId. Return 404 RESOURCE_NOT_FOUND for absent or another user’s record. |

Resolve auth from cookies; do not accept Authorization bearer tokens for application v1. Cookies use HttpOnly, Secure in production, host-only scope and SameSite=Lax. Disable cached session authorisation so revocation and role changes take effect on the next protected request. UI route guards are navigation aids, not permission checks.

### CSRF bootstrap

GET /security/csrf — Actor. 200 data: {token: string, expiresAt: UTC instant}. Token is session-bound, HMAC-signed and valid for 30 minutes as a proposed default. Browser keeps it in memory and sends X-CSRF-Token on authenticated application writes. No-store response. On CSRF_TOKEN_EXPIRED, fetch a new token once and retry with the same operation identity.

Authenticated writes require the exact approved Origin, JSON and valid CSRF token. Public email-confirmation/reset writes use their purpose-bound link token plus Origin/JSON validation; they do not require an existing session. Native auth routes retain the library’s own origin/CSRF checks. CORS does not grant cross-origin credential access.

### Approved native auth operations

| Method and path | Input | Success and special failures |
| --- | --- | --- |
| POST /api/auth/sign-up/email | name, email, password; optional fixed callbackURL | Library SDK result and any Set-Cookie headers. Public signup always creates a student. |
| POST /api/auth/sign-in/email | email, password; rememberMe? | Library SDK result; browser receives session cookie. Invalid credentials remain a generic failure. |
| POST /api/auth/sign-out | Library SDK request | Revoke current session and clear cookie. |
| GET /api/auth/get-session | Cookie | Library session result or null. Do not use this response as a substitute for application role checks. |

Configure name length 1–100, normalised email length ≤254 and password length 12–128 as proposed product settings. Never trim or transform passwords. Reject client role, emailVerified, image uploads and arbitrary redirect destinations. Allow authenticated unverified sessions so live-mode users can reach status/resend/logout; gate study services separately. [1–2]

Use the pinned library SDK for native response/error shapes. It is not the application {data, meta} contract. Do not store SDK tokens in localStorage or log session payloads. Additional library routes must be explicitly reviewed before exposure; email token-consumption routes follow section 4.

## 4 Verification and password recovery

These application endpoints wrap supported auth-library server methods. Requests and responses use the application envelope. The library remains responsible for password hashing, token validity and identity updates. General test-mode users cannot use live verification or recovery; respond 503 EMAIL_DISABLED without revealing account existence.

| Method and path | Input | Success and special failures |
| --- | --- | --- |
| POST /identity/verification/request | Actor + CSRF; body {} | 202 data {status:"accepted"}. Sends to the session user only. Already verified: 200 {status:"already_verified"}. |
| POST /identity/verification/confirm | Public; {token:string} | 200 {verified:true, nextAction:"sign_in"}. Invalid/expired/used token: 400 TOKEN_INVALID_OR_EXPIRED. |
| POST /identity/password-reset/request | Public; {email:string} | 202 {status:"accepted"} for known and unknown addresses. This acknowledges a request, not delivery. |
| POST /identity/password-reset/confirm | Public; {token:string, newPassword:string} | 200 {reset:true, nextAction:"sign_in"}. Revoke all previous sessions; invalid/used token: 400 TOKEN_INVALID_OR_EXPIRED. |

### Request and token handling

Application link-token strings are nonempty and capped at 8,192 characters; they are never returned in API responses. newPassword follows the configured 12–128 policy. Token expiry defaults: verification 60 minutes, reset 30 minutes. Redirect paths are server-configured; these endpoints accept no callback URL or target user ID.

The email link opens an app page that renders without consuming the token. An explicit user action POSTs it. Verification atomically claims the stored token digest before invoking the library. Block public bypass through the library’s direct verify-email endpoint. If a claimed verification request fails, the user requests a new link; do not claim that token replays are retry-safe.

Route the reset and resend actions through these wrappers and block direct public library routes that would bypass mode, rate or once-only checks. Preserve only documented passive callback redirects if the pinned library requires them; do not let a GET change study state or consume verification claims. Prove the allowed paths in integration tests.

### Delivery failures and privacy

Persist the delivery operation, then send outside any retried database transaction using the platform-supported lifecycle mechanism. A 202 can precede an asynchronous send failure; an admin can diagnose safe failure categories. For reset requests, user-specific delivery outcomes never change the generic public response. Platform-wide unavailability may return the same 503 for every address.

Verification resend rate limits and reset rate limits: 3 per account/address per hour and 10 per trusted client IP per hour. Token-consumption endpoints additionally allow 10 attempts per IP per 15 minutes. These shared MongoDB-backed limits are proposed defaults. A 429 includes Retry-After in seconds.

Callback pages set Referrer-Policy: no-referrer, avoid third-party analytics and remove tokens from the address bar after handling. A timeout after token consumption may mean the action succeeded; offer login/status checks or a fresh link instead of blindly repeating token use.

## 5 Current user and preparation preferences

| Method and path | Input | Success and special failures |
| --- | --- | --- |
| GET /me | Actor; no query/body | 200 MeDTO. A missing domain profile is idempotently created with student role and preferences=null. |
| PATCH /me/preferences | Actor + CSRF; complete preference fields plus expectedStateRevision | 200 MeDTO. 409 STATE_CONFLICT if revision changed; 422 VALIDATION_ERROR for invalid preferences. |

### Preference request

```json
{ "companies": ["cognizant", "ltm"],
  "deadline": "2026-11-21", "dailyMinutes": 120,
  "skills": { "dsa": 2, "aptitude": 3, "cs": 2 },
  "expectedStateRevision": 0 }
```

This particular PATCH replaces the complete preferences object; all four preference fields are required. companies contains 1–2 unique supported IDs. dailyMinutes is 30–240 in steps of 15; each skill is 1–5. The deadline must allow at least seven inclusive study days when saved. Longer goals generate at most a 30-day window. Unknown role/timezone/owner fields are rejected.

### MeDTO

| Field | Contract |
| --- | --- |
| userId, name, email | Opaque auth ID and canonical identity display values. Never a password or raw session record. |
| role, emailVerified | student\|admin and boolean; authoritative server values. |
| preferences | null before onboarding, otherwise {companies, deadline, dailyMinutes, skills}. |
| timezone | Always Asia/Kolkata in v1. |
| activePlanId, planVersion | Nullable domain ID and nonnegative version counter. |
| stateRevision | Current concurrency token for preference, task and plan-preview writes. |
| capabilities | {studyAccess:boolean, verificationEmail:boolean, passwordRecovery:boolean, fileDownloads:boolean, adminUploads:boolean, emailMode:"test"\|"live"}. |
| nextAction | verify_email\|complete_preferences\|open_dashboard. Live verification takes precedence over incomplete preferences. |

Capabilities reflect configuration and the current actor; an admin role alone does not make R2 ready. Do not expose provider keys, the test account owner’s address or database details. Request-level permission checks remain authoritative even if an earlier capability response allowed an action.

### Effect of preference changes

Save the new preferences and increment stateRevision once. Do not rewrite active tasks. The UI offers an appropriate preview. Adapt/reschedule retains the current plan window end, as specified in the database design; a changed deadline applies when a new window is created. Companies, skills and daily budget can affect an active-window proposal.

If a lower budget cannot accommodate tasks already completed today, preview generation rejects that budget conflict. Saving preferences itself does not falsify an existing plan’s budget snapshot. On a timeout, GET /me to compare the stored preferences before retrying a version-guarded write.

## 6 Student content discovery and detail

| Method and path | Input | Success and special failures |
| --- | --- | --- |
| GET /content | Study; subject?, topic?, company?, difficulty?, q?, cursor?, limit? | 200 ContentSummaryDTO[]. Only published items. Filters combine with AND except company includes shared foundations. |
| GET /content/:id | Study; domain ID | 200 ContentDetailDTO for published content. 200 ContentUnavailableDTO only when the student has a historical reference; otherwise 404. |

subject/difficulty/company use defined enums; topic is a configured ID ≤80 characters. q is trimmed text of 1–100 characters, used as bounded keyword search rather than a client regex. Default order is id ascending, including search results; relevance-ranked pagination is not part of v1. Company filters include content whose companies array is empty.

### Response schemas

| Field | Contract |
| --- | --- |
| ContentSummaryDTO | id, slug, title, subject, type, topic, difficulty, estimatedMinutes, tags, companies, revision, reviewedAt, availability:"available". |
| companies[] | {companyId, association:"verified"\|"student_reported", source, reviewedAt}. Preserve provenance labels. |
| ContentDetailDTO | All summary fields plus prompt:string\|null, body:string\|null, explanation:string\|null, externalUrl:string\|null, source:string, attribution:string, attachments:AttachmentDTO[]. |
| AttachmentDTO | {id, displayName, mimeType, sizeBytes}. Ready published metadata only; no R2 keys or stored signed URLs. |
| ContentUnavailableDTO | {id, availability:"unavailable", reason:"archived"\|"not_published"\|"missing", snapshot:{title,subject,topic,type}}. Use the student’s saved task/attempt snapshot. |

Answers/explanations are excluded from list DTOs. Detail may include the explanation so the UI can reveal it on demand; this is a self-study app, not secure assessment delivery. Sanitise Markdown and reject dangerous link schemes before rendering. An external visit does not create an attempt or completion.

### Example list response

```json
{ "data": [{
  "id": "507f1f77bcf86cd799439011", "slug": "two-sum-basics",
  "title": "Two Sum", "subject": "dsa", "type": "question",
  "topic": "arrays", "difficulty": "easy",
  "estimatedMinutes": 30, "tags": ["arrays"],
  "companies": [], "revision": 1,
  "reviewedAt": "2026-10-23T08:00:00Z",
  "availability": "available"
}], "meta": { "page": {
  "limit": 20, "nextCursor": null, "hasMore": false
} } }
```

A content revision change does not retroactively alter task duration or attempt classification. Task DTOs expose both saved contentRevision and current availability so the frontend can explain changed or unavailable content.

## 7 Attempts history and revision queue

| Method and path | Input | Success and special failures |
| --- | --- | --- |
| POST /attempts | Study + CSRF; submissionId, contentId, kind, outcome, perceivedDifficulty? | 201 new AttemptResultDTO; 200 exact retry result with meta.replayed=true. 409 IDEMPOTENCY_CONFLICT for changed payload. |
| GET /attempts | Study; contentId?, subject?, topic?, kind?, cursor?, limit? | 200 AttemptDTO[] ordered attemptSequence descending. |
| GET /revisions | Study; dueOnly? default true, cursor?, limit? | 200 RevisionDTO[] ordered dueDate then id ascending. dueOnly accepts true\|false. |

kind is practice|revision; outcome is independent|needed_help|failed; perceivedDifficulty is optional easy|medium|hard. A new submission must reference a published question; resource items return 422 CONTENT_NOT_ATTEMPTABLE and unavailable content returns 409 CONTENT_UNAVAILABLE. A revision submission requires an existing owned revision record, otherwise 422 REVISION_NOT_FOUND.

### Attempt request and result

```text
{ "submissionId": "49a7771c-6260-4a87-9224-b462c0c5d355",
  "contentId": "507f1f77bcf86cd799439011",
  "kind": "practice", "outcome": "failed" }

201 Created
{ "data": {
  "attemptId": "507f1f77bcf86cd799439012",
  "submissionId": "49a7771c-6260-4a87-9224-b462c0c5d355",
  "contentId": "507f1f77bcf86cd799439011",
  "attemptSequence": 12, "createdAt": "2026-10-23T10:00:00Z",
  "revision": { "id": "507f1f77bcf86cd799439013",
    "dueDate": "2026-10-24", "intervalDays": 1 },
  "stateRevision": 29
}, "meta": { "replayed": false } }
```

| Field | Contract |
| --- | --- |
| AttemptDTO | id, submissionId, contentId, contentSnapshot, subject, topic, kind, outcome, perceivedDifficulty:null\|enum, attemptSequence, createdAt. |
| contentSnapshot | {title, subject, topic, type, contentRevision}; historical facts retained at submission. |
| RevisionDTO | id, contentId, lastAttemptId, lastAttemptSequence, dueDate, intervalDays, reason, timezone, availability, title, outsidePlan:boolean\|null. |
| outsidePlan | True if due after the active window; false when within it; null if no active plan. Unavailable revisions stay visible. reason is failed_or_hard\|help_or_medium\|independent_easy_or_unrated; intervalDays is 1\|3\|7. |

### Atomicity and retry rule

Generate submissionId once per deliberate attempt and reuse it after timeouts. In one transaction, allocate sequence, insert the attempt and update the current revision. Retries return saved original result facts, even if later attempts changed that revision. Refetch dashboard/revisions after a replay; do not overwrite newer UI state with an older response revision.

The 1/3/7-day precedence is defined in the PRD and database design. Recording an attempt never completes a plan task. There is no edit/delete attempt endpoint in v1.

## 8 Plans and task response models

| Method and path | Input | Success and special failures |
| --- | --- | --- |
| GET /plans/current | Study | 200 {plan:PlanDTO\|null, stateRevision:int}. Null is the normal pre-plan state. |
| GET /plans | Study; cursor?, limit? | 200 PlanSummaryDTO[] by version descending. Added read endpoint for historical navigation. |
| GET /plans/:id | Study; owned ID | 200 PlanDTO. Another user’s plan or absent ID returns 404. |

### PlanDTO

| Field | Contract |
| --- | --- |
| Identity | id, version, previousPlanId:null\|ID, sourcePreviewId:ID, status:"active"\|"archived", generatedAt. |
| Provenance | templateVersion, rulesVersion, timezone, windowStart, windowEnd. |
| budgetSnapshot | {dailyMinutes, preferences:{companies,deadline,dailyMinutes,skills}}; copied from the confirmed generation input. |
| tasks | TaskDTO[], at most 480. Full plan reads are bounded rather than paginated by task. |
| deferred | DeferredDTO[], at most 480. Not counted in scheduled minutes or plan completion. |
| stateRevision | Current user revision at this read, not the historical plan’s creation revision. Required for active task edits. |

### TaskDTO and DeferredDTO

| Field | Contract |
| --- | --- |
| TaskDTO identifiers | taskId:UUID, contentId:ID, contentSnapshot:{title,subject,topic,type,contentRevision}. |
| TaskDTO schedule | kind:fresh\|revision; revisionSourceSequence:int\|null; scheduledDate:LocalDate; estimatedMinutes:15–60; priority:due_revision\|overdue\|fresh. |
| TaskDTO state | status:pending\|completed; completedAt:UTC\|null; reasonCode:string; reason:string; availability:available\|unavailable; overdue:boolean; supersededRevision:boolean. |
| DeferredDTO | taskId:UUID, contentId:ID, kind, revisionSourceSequence:int\|null, estimatedMinutes, reasonCode. taskId supplies the acknowledgement identity. |
| PlanSummaryDTO | id, version, status, windowStart, windowEnd, generatedAt, completedCount, taskCount. |

status is derived from the profile’s active pointer. Do not store a second competing active flag. Overdue means a pending task dated before today. supersededRevision indicates that a later attempt has advanced the revision cycle; it does not delete or silently reschedule the task.

### Historical availability

Content snapshots keep the original task understandable after catalog edits. Compute availability from current catalog state; archived plan details remain readable by the owner. A historical read grants no access to draft attachments. A missing active plan target is a server integrity error, not silently converted to a clean “no plan” state.

All calendar arithmetic uses Asia/Kolkata. Retained tasks preserve taskId across adjusted versions. New windows retain earlier completions in archived plans, keeping active documents bounded.

## 9 Previewing and confirming schedule changes

| Method and path | Input | Success and special failures |
| --- | --- | --- |
| POST /plan-previews | Study + CSRF; {kind, expectedStateRevision} | 201 PreviewDTO; Location points to GET /plan-previews/:id. kind=initial\|adapt\|reschedule. |
| GET /plan-previews/:id | Study; owned ID | 200 PreviewDTO while valid or confirmed. 409 PREVIEW_EXPIRED for expired pending preview; 404 if purged. |
| POST /plan-previews/:id/confirm | Study + CSRF; {acknowledgedDeferredIds:UUID[]} | 201 {plan:PlanDTO} on commit; 200 same plan on replay with meta.replayed=true. |

initial requires complete preferences (422 PREFERENCES_REQUIRED) and no active plan, or an explicitly requested new window after the old one ends. An unexpired active plan returns 409 ACTIVE_PLAN_EXISTS. adapt/reschedule requires an active window, otherwise 409 PLAN_NOT_ACTIVE. Only POST creates a persisted proposal; opening a page never changes the schedule.

### PreviewDTO

| Field | Contract |
| --- | --- |
| Identity and validity | id, kind, state:pending\|confirmed, basePlanId:null\|ID, baseStateRevision, catalogRevision, localDateAtCreation, expiresAt, confirmedPlanId:null\|ID. |
| proposal | windowStart, windowEnd, timezone, budgetSnapshot, templateVersion, rulesVersion, tasks:TaskDTO[], deferred:DeferredDTO[]. Not an active plan. |
| evidence | At most 100 entries of {subject,topic,attemptIds:ID[],ruleCode}; at most 3 source attempts per entry. |
| diff | {addedTaskIds,removedTaskIds,moved:[{taskId,fromDate,toDate}]}; compact IDs refer to proposal/base tasks, not duplicated full plans. |
| dailyTotals | Array of {date,beforeMinutes,afterMinutes,budgetMinutes}, at most 30. Includes revisions and retained completed work. |

### Confirm request and conflict example

```text
{ "acknowledgedDeferredIds": [] }

409 Conflict
{ "error": { "code": "STALE_PREVIEW",
  "message": "Your study state changed. Generate a new preview." },
  "requestId": "req_example_02" }
```

The acknowledgement array must equal the complete deferred taskId set, without duplicates; an empty set uses []. Mismatch returns 422 DEFERRED_ACK_REQUIRED. Confirm never accepts a client-modified task list. Validate expiry, study date, profile/plan state, catalog revision and rule/template versions inside guarded transactional writes.

A preview is valid for ten minutes and stored for 24 hours. Same-preview retries resolve through plans.sourcePreviewId even after preview cleanup; replays return the original plan, which may now be archived. Another preview from an old base receives 409 STALE_PREVIEW. On expiry return 409 PREVIEW_EXPIRED, on excessive proposal size 422 PLAN_SCOPE_TOO_LARGE, and on insufficient valid window 422 PLAN_WINDOW_INVALID.

Content shortages produce visible deferred work and unused capacity. A budget below already completed minutes today returns 422 PLAN_BUDGET_CONFLICT. Preview generation does not invent content or promise that every candidate fits.

## 10 Task completion and dashboard

| Method and path | Input | Success and special failures |
| --- | --- | --- |
| PATCH /plans/:id/tasks/:taskId | Study + CSRF; {status, expectedStateRevision} | 200 {task:TaskDTO, stateRevision}. status=pending\|completed. Only the current owned plan is mutable. |
| GET /dashboard | Study; no query/body | 200 DashboardDTO from a consistent read snapshot. No mutation or preview creation. |

Task updates match plan ownership, activePlanId and stateRevision. An old revision returns 409 STATE_CONFLICT; an archived plan returns 409 PLAN_NOT_ACTIVE. Marking unavailable content completed returns 409 CONTENT_UNAVAILABLE; undo remains allowed. If the requested status already matches and the revision is current, return 200 without advancing the revision or changing completedAt.

### DashboardDTO

| Field | Contract |
| --- | --- |
| asOf, studyDate, timezone | Read timestamp, current local date and Asia/Kolkata. |
| stateRevision, activePlanId | Current user revision and nullable active plan ID. |
| progress | {distinctAttempted:int,currentlySolved:int,planCompleted:int,planTotal:int,planCompletionPercent:number\|null,readingCompleted:int}. |
| todayTasks, upcomingTasks | TaskDTO arrays; today is at most 16. upcomingTasks returns the next 5 pending tasks in scheduled order. |
| overdue | {count:int,items:TaskDTO[]}; up to 5 items. Full active plan exposes the complete bounded set. |
| revisions | {dueCount:int,unavailableDueCount:int,items:RevisionDTO[]}; up to 5 due items. GET /revisions provides the complete paginated list. |
| topics | Array of {subject,topic,distinctAttempted,currentlySolved,readingCompleted}; classifications follow saved attempts/tasks. |
| suggestions | Array of {key,subject,topic,ruleCode,attemptIds,summary}; up to 10. A deterministic key deduplicates repeated evidence; this is not a committed preview. |

### Metric calculations

Distinct attempted counts question IDs with at least one attempt. Currently solved uses the latest attempt per question, including revisions, and counts independent outcomes. Plan completion uses only scheduled tasks in the active plan; deferred items and archived versions are excluded. Reading completion counts resource tasks in the active plan.

planCompletionPercent = round(100 × planCompleted / planTotal, 1 decimal), or null when planTotal is zero. dueCount includes due but unavailable revisions; unavailableDueCount makes that limitation explicit. No automated accuracy or placement-readiness score is returned.

### Client refresh rules

After a new attempt, refetch revisions, dashboard and current plan indicators. After task or preference changes, refetch current state and invalidate pending previews. After confirmation, navigate to the returned plan ID and refetch /plans/current because a replay can refer to an older archived result.

Never blindly apply a mutation response whose stateRevision is lower than the UI’s current revision. If a versioned PATCH times out, read the current record and reconcile the intended change; do not silently resubmit against a newer revision.

## 11 Admin content reads and writes

| Method and path | Input | Success and special failures |
| --- | --- | --- |
| GET /admin/content | Admin; status?, subject?, topic?, company?, difficulty?, q?, cursor?, limit? | 200 AdminContentSummaryDTO[]. Default includes all statuses; id ascending. |
| GET /admin/content/:id | Admin | 200 AdminContentDTO including draft/archived body and attachment states. |
| POST /admin/content | Admin + CSRF; DraftInput | 201 AdminContentDTO with status=draft, revision=1. Location points to detail. |
| PATCH /admin/content/:id | Admin + CSRF; allowed fields plus expectedRevision | 200 AdminContentDTO. 409 CONTENT_CONFLICT on stale revision; 409 SLUG_TAKEN on uniqueness conflict. |

### DraftInput and editable fields

| Field | Contract |
| --- | --- |
| Required on create | slug, title, subject, type, topic, difficulty, estimatedMinutes, source, attribution. |
| Identity and classification | slug: lowercase stable slug ≤120; title 1–160; subject enum; type question\|resource; configured topic ≤80; difficulty enum; estimatedMinutes integer 15–60. |
| Optional on create | tags defaults []; companies defaults []; assetIds defaults []; reviewedAt defaults null; prompt/body/explanation/externalUrl absent. |
| tags and companies | ≤20 unique tags, each ≤40 characters. ≤2 associations: {companyId,association,source,reviewedAt}; company IDs unique. |
| Text and URLs | prompt, body, explanation ≤12,000 characters each. externalUrl is HTTPS ≤2,048. source 1–2,048; attribution 0–2,000. Total JSON limit still applies. |
| Attachments and review | assetIds ≤5 unique domain IDs; reviewedAt UTC\|null, not future-dated. Drafts may reference their pending upload assets; publication requires all ready. |
| PATCH clearing | Null clears prompt/body/explanation/externalUrl (remove stored optional field) and reviewedAt. [] clears arrays. Required identity/classification fields cannot be null. |
| Server-owned fields | Reject status, revision, seedKey, createdBy, updatedBy, timestamps, role and owner IDs in editable payloads. |

### Admin response types

AdminContentSummaryDTO extends the student summary metadata with status, createdAt, updatedAt and attachmentCount; availability is omitted because admins can inspect every state. AdminContentDTO adds prompt, body, explanation, externalUrl (each string|null), source, attribution, assetIds, publishedAt:UTC|null, archivedAt:UTC|null and attachments:FileAssetDTO[]. It never includes signed URLs or R2 credentials.

Use explicit actions for publish/archive/reopen. Slugs are editable only while never published; a published slug is stable. Every successful mutation increments the content revision and relevant catalog revision, and writes an audit event. Published-item edits must continue to satisfy publication validation; incomplete edits return 422 PUBLISH_REQUIREMENTS_NOT_MET.

### Retry expectations

Content creation has no generic idempotency guarantee. After a timeout, search the intended unique slug and compare the saved content before issuing another create. Version-guarded PATCH retries may return CONTENT_CONFLICT after a successful first commit; refetch to reconcile.

## 12 Publication actions audit and service health

| Method and path | Input | Success and special failures |
| --- | --- | --- |
| POST /admin/content/:id/publish | Admin + CSRF; {expectedRevision} | 200 AdminContentDTO. Draft → published; reject missing review/content/ready assets with 422. |
| POST /admin/content/:id/archive | Admin + CSRF; {expectedRevision, reason} | 200 AdminContentDTO. Published → archived; reason length 1–500. |
| POST /admin/content/:id/reopen | Admin + CSRF; {expectedRevision} | 200 AdminContentDTO. Archived → draft. |
| GET /admin/audit | Admin; entityType?, entityId?, actorUserId?, cursor?, limit? | 200 AuditDTO[] newest first by createdAt then id. No mutation endpoint. |
| GET /admin/readiness | Admin | 200 ReadinessDTO when required enabled dependencies pass; otherwise 503 with safe readiness details. |
| GET /api/health | Public; outside /api/v1 | 200 {data:{status:"ok"}} for liveness. No database/provider credentials or topology details. |

### State transition rules

Compare expectedRevision before applying the transition. An invalid source state returns 409 INVALID_CONTENT_STATE; a stale revision returns 409 CONTENT_CONFLICT. Repeating a committed action does not silently create another audit event; the client refetches and reconciles state. There is no hard-delete content endpoint.

Publish validation: question has prompt or external practice URL; resource has body, URL or ready asset; metadata and reviewedAt are complete; referenced assets exist, belong to this application and are ready. Asset reference checks and catalog updates share the transaction guard used by cleanup. Failure returns fields where possible.

### AuditDTO

{id, actorUserId, action, entityType, entityId, priorRevision:null|int, newRevision:null|int, changedFields:string[], reason:string|null, requestId, createdAt}. Filter entityType uses profile|content|file; IDs must match that entity’s format. actorUserId remains an opaque auth ID. Unknown action values are displayed as text rather than trusted as UI instructions.

### Readiness contract

ReadinessDTO = {status:"ready"|"degraded", checkedAt, checks:{database:"ok"|"failed", email:"configured"|"disabled"|"failed", files:"ok"|"disabled"|"failed"}}. The check verifies email configuration without sending a message. Disabled features in declared demo mode do not fail readiness; enabled but misconfigured dependencies do.

The 503 response uses error.code=DEPENDENCY_UNAVAILABLE and error.details containing ReadinessDTO; this is the only documented error.details shape in v1. Do not reveal connection strings, bucket names, provider account details or raw exceptions. Rate-limit manual readiness checks to 6 per admin per minute.

### Example publication failure

```json
{ "error": { "code": "PUBLISH_REQUIREMENTS_NOT_MET",
  "message": "Complete the required fields before publishing.",
  "fields": { "assetIds": ["One attachment is not ready."] } },
  "requestId": "req_example_03" }
```

## 13 Authorising and finalising admin uploads

| Method and path | Input | Success and special failures |
| --- | --- | --- |
| POST /admin/files/uploads | Admin + CSRF; {filename, declaredMime, declaredBytes} | 201 UploadGrantDTO. 409 STORAGE_QUOTA_EXCEEDED; 503 FILES_DISABLED. |
| POST /admin/files/:id/finalize | Admin + CSRF; body {} | 200 FileAssetDTO when ready, including repeat after success. 409 UPLOAD_IN_PROGRESS while another valid lease owns finalisation. |
| GET /admin/files/:id | Admin | 200 FileAssetDTO; added status read for refresh/timeout recovery. 404 if absent. |

### Grant and file schemas

| Field | Contract |
| --- | --- |
| Upload input | filename 1–180; declaredMime application/pdf\|image/png\|image/jpeg\|image/webp; declaredBytes integer 1–10,485,760. Reject unsupported formats with 422 FILE_TYPE_NOT_ALLOWED. |
| UploadGrantDTO | assetId, method:"PUT", uploadUrl, headers:{"Content-Type":string}, uploadUrlExpiresAt, finalizeBy, maxBytes:10485760. |
| FileAssetDTO | id, displayName, status, declaredMime, declaredBytes, mimeType:null\|string, sizeBytes:null\|int, createdAt, readyAt:null\|UTC, finalizeBy, errorCode:null\|string. |
| Status enum | uploading\|validating\|ready\|rejected\|deleting\|deleted. No candidateKey, finalKey, leaseId or provider credentials in DTOs. |

A grant reserves one object and the full 10 MiB maximum, not the declared byte count. URL validity is five minutes; finalisation deadline is fifteen minutes. Send only the returned required headers and file bytes to the signed R2 URL. Do not send PrepPilot cookies or its CSRF header to R2. [3]

### Direct transfer and confirmation

The browser PUTs bytes directly to R2, then POSTs finalise. The server inspects actual size/type, writes verified bytes to an immutable final object and commits ready metadata plus quota conversion. A reusable staging PUT URL can never overwrite that ready object. A successful PUT alone does not complete the feature.

Finalisation is synchronous within a bounded request deadline; no job queue is implied. If it times out, GET file status and retry finalise only when eligible. UPLOAD_IN_PROGRESS includes Retry-After seconds. If the staging object is missing, return 409 UPLOAD_NOT_FOUND and permit upload retry within the grant lifetime.

If the asset has passed finalizeBy before work begins, return 409 UPLOAD_EXPIRED; cleanup releases its reservation. Invalid bytes/type or size return 422 FILE_VALIDATION_FAILED or FILE_TOO_LARGE and retain rejected metadata for recovery. Retry after an already-ready result returns the same metadata without allocating quota again.

### Grant failure and ambiguous outcomes

Upload grant creation itself is not idempotent in v1. After a lost response, use GET /admin/files (section 14) to locate pending grants and clean them up; never repeatedly auto-create new reservations. If the signed URL expires before transfer succeeds, create a fresh grant and let cleanup release the old one.

## 14 File downloads listing and cleanup

| Method and path | Input | Success and special failures |
| --- | --- | --- |
| GET /admin/files | Admin; status?, cursor?, limit? | 200 FileAssetDTO[] by createdAt then id descending. Added management read; no signed URLs in list. |
| POST /files/:id/download | Study + CSRF; {contentId} | 200 DownloadGrantDTO if asset is ready and attached to published content. 404 for an inaccessible relationship. |
| POST /admin/files/:id/preview | Admin + CSRF; body {} | 200 DownloadGrantDTO for a ready asset, including draft/archived content review. |
| POST /admin/files/cleanup | Admin + CSRF; {assetIds:ID[]} | 200 CleanupResultDTO for ≤20 unique IDs. Per-item failures do not cancel successful items. |

### DownloadGrantDTO

{assetId, url, expiresAt, displayName, mimeType, sizeBytes}. Grant expires after 60 seconds. The client navigates/fetches the signed GET URL without application credentials. PDFs download with a safe filename; permitted images may display inline. Links are bearer capabilities: do not store them in persistent client state, analytics or logs.

Student grants always recheck the session, published parent, attachment membership and ready state. Archiving stops new grants immediately, but a previously issued URL can still work until expiry. No public permanent object URL is exposed.

### CleanupResultDTO and safety

```json
{ "data": { "results": [{
  "assetId": "507f1f77bcf86cd799439014",
  "outcome": "skipped", "code": "ASSET_REFERENCED"
}], "deletedCount": 0, "skippedCount": 1, "failedCount": 0 } }
```

Each result has assetId, outcome=deleted|skipped|failed and code:null|string. Unknown IDs use skipped/NOT_FOUND; referenced assets use skipped/ASSET_REFERENCED; a live lease uses skipped/UPLOAD_IN_PROGRESS; dependency failure uses failed/DEPENDENCY_UNAVAILABLE. Already-deleted assets return deleted without decrementing quota again.

Eligible cleanup includes expired uploads, rejected assets and unreferenced ready assets explicitly selected by an admin. Guard attachment references, wait out possible in-flight finalisation writes, delete provider objects and release reservations/usage exactly once. Partial failure returns per-item results; retry only the failed or eligible skipped IDs.

### Limits and feature capability

Application quota defaults are 100 ready/reserved objects and 500 MiB ready/reserved bytes. They are application controls, not provider billing guarantees. Upload grants allow 20 per admin per hour; cleanup allows 6 calls per admin per minute. Signing/download requests allow 60 per actor per minute. All limits are durable across server instances.

When FILES_ENABLED=false, grant/finalise/preview/download operations return 503 FILES_DISABLED. Metadata reads remain available to admins for diagnosis. Disabled-file UI uses the capability response rather than showing a control that falsely reports success.

## 15 Error codes concurrency and retry policy

| HTTP and code | Meaning and client action |
| --- | --- |
| 400 INVALID_JSON / INVALID_CURSOR | Malformed JSON or invalid/expired cursor. Correct input or restart list pagination. |
| 401 UNAUTHENTICATED | Sign in; preserve unsent input. |
| 403 FORBIDDEN / ACCOUNT_UNAVAILABLE | Role denied or account deleting; do not retry. |
| 403 EMAIL_NOT_VERIFIED | Verify email; /me, resend and logout stay accessible. |
| 403 CSRF_INVALID / CSRF_TOKEN_EXPIRED | Refresh only an expired CSRF token. Never bypass Origin/signature checks. |
| 404 RESOURCE_NOT_FOUND | Absent or not owned; no existence leak. |
| 409 STATE_CONFLICT / CONTENT_CONFLICT | Refetch and reconcile changed state. |
| 409 STALE_PREVIEW / PREVIEW_EXPIRED | Generate a fresh preview. |
| 409 IDEMPOTENCY_CONFLICT | Same submissionId, different input; stop retrying. |
| 409 PLAN_NOT_ACTIVE / ACTIVE_PLAN_EXISTS | Wrong plan lifecycle for mutation or initial generation. |
| 409 INVALID_CONTENT_STATE / SLUG_TAKEN | Inspect current catalog state or slug. |
| 409 CONTENT_UNAVAILABLE | Unavailable item cannot receive new study writes. |
| 409 UPLOAD_IN_PROGRESS / UPLOAD_NOT_FOUND / UPLOAD_EXPIRED | Check file status and grant validity. |
| 409 STORAGE_QUOTA_EXCEEDED | Clean up eligible assets before another grant. |
| 422 VALIDATION_ERROR and domain codes | Correct supplied fields or scope; domain codes are defined with each endpoint. |
| 429 RATE_LIMITED | Wait Retry-After seconds; keep the same submission/preview identity. |
| 503 DEPENDENCY_UNAVAILABLE / EMAIL_DISABLED / FILES_DISABLED | Preserve input; do not bypass disabled capabilities. |
| 500 INTERNAL_ERROR | Use requestId for diagnosis; reconcile writes. |

### Additional endpoint codes

400 TOKEN_INVALID_OR_EXPIRED; 422 PREFERENCES_REQUIRED, CONTENT_NOT_ATTEMPTABLE, REVISION_NOT_FOUND, DEFERRED_ACK_REQUIRED, PLAN_SCOPE_TOO_LARGE, PLAN_WINDOW_INVALID, PLAN_BUDGET_CONFLICT, PUBLISH_REQUIREMENTS_NOT_MET, FILE_TYPE_NOT_ALLOWED, FILE_VALIDATION_FAILED and FILE_TOO_LARGE. These are finite, testable application codes; native auth errors are handled by its SDK adapter.

### Retry classification

Safe reads may retry transient failures with bounded exponential backoff and jitter. Attempts retry with the same submissionId; plan confirmation retries the same preview ID. Ready-file finalisation and already-deleted cleanup are repeat-safe. Content/upload creation, versioned PATCHes and consumed email tokens must be reconciled rather than blindly retried.

Application 409 version errors are not 503 dependency failures. When a transaction may have committed despite a timeout, resolve its persistent operation identity before creating replacement work. Rate limits and permission checks still apply to replayed requests.

## 16 Implementation mapping and acceptance

### Route and schema organisation

Implement paths in src/app/api/v1/.../route.ts, with native auth at src/app/api/auth/[...all]/route.ts and liveness at src/app/api/health/route.ts. Use explicit Node.js runtime for handlers accessing Mongoose/auth/providers. Route files call module services and serialize allowlisted DTOs. Server Components may call the same authorised read services directly. [4]

Each endpoint has a strict Zod input schema, typed output serializer and named service method. Encode path/query/body types separately. Add examples and shared components to OpenAPI during implementation; mark cookieAuth and CSRF requirements, native-auth exceptions and all documented response codes. Do not infer contracts from raw Mongoose documents.

### Baseline durable rate limits

| Operation | Starting policy |
| --- | --- |
| Login and signup | 5 failed logins per account+IP per 15 min; 50 login requests per IP per 15 min; 5 signups per IP per hour. |
| Email request and consume | 3 sends per account/address per hour plus 10 per IP per hour; 10 token-consumption attempts per IP per 15 min. |
| Preview and attempts | 10 previews per actor per 10 min; 60 attempt submissions per actor per minute. |
| Files and readiness | 20 upload grants per admin per hour; 60 signed downloads/previews per actor per minute; 6 cleanup/readiness calls per admin per minute each. |

Use MongoDB counters and trusted deployment IP extraction. Store HMAC-derived limiter subjects; never use process-local counters as the authoritative limit. Admission limits count repeated requests, including idempotent replays. Limits are tuning defaults, not claims about supported capacity.

### Required contract tests

Validate unknown-field rejection, ID/date/enum boundaries, null clearing, JSON size limits, pagination binding and no private caching. Check native and wrapper auth routes for bypasses, CSRF and cross-user access. Verify that test/live capability states match actual endpoint behaviour.

Exercise duplicate attempts with same/different payloads, original replay results after newer attempts, two simultaneous confirmations, stale catalog changes, no-op task updates and midnight preview expiry. Verify complete deferred acknowledgements and day budgets using the persisted proposal.

Test admin publication with pending assets, attach/cleanup races, invalid/oversized R2 bytes, upload timeouts, lease contention and quota release once. Check email generic responses, token replay, session revocation and provider failure. A passing screen alone is not acceptance evidence.

### Sources and remaining launch dependencies

Project baseline: current PrepPilot PRD v2, System Design v1 and Database Design v1. Official sources checked 23 October 2026; recheck the pinned auth-library version when implementing native routes. Live verification/recovery still needs a verified sending domain; R2 still needs account activation and an end-to-end integration check.

[1] Better Auth email/password — https://better-auth.com/docs/authentication/email-password

[2] Better Auth Next.js integration — https://better-auth.com/docs/integrations/next

[3] R2 presigned URLs — https://developers.cloudflare.com/r2/api/s3/presigned-urls/

[4] Next.js Route Handlers — https://nextjs.org/docs/app/getting-started/route-handlers
