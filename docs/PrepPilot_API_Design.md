# Implemented API contracts

Application endpoints are under `/api/v1`; health is `/api/health`, native
authentication is `/api/auth`. Route handlers are Node.js adapters.
The strict schemas and DTO constructors linked below define exact field bounds.

## Transport and access

Success: `{data, meta?}`. Error: `{error:{code,message,fields?}, requestId}`.
Responses carry request IDs; private/authenticated reads are no-store.
Lists use signed cursors with bounded limits (normally 20, maximum 50).
Unsupported query fields and body fields are rejected. JSON writes are bounded
to 64 KiB unless a specialized handler applies a tighter bound.

Writes require the exact configured origin and JSON. Authenticated application
mutations also require the session-bound CSRF token from `GET /security/csrf`.
Native auth writes retain both wrapper and Better Auth protections.
Never send a client-selected user ID to select private ownership.

| Access       | Requirement                                                            |
| ------------ | ---------------------------------------------------------------------- |
| Actor        | Valid persistent session and active profile                            |
| Study        | Actor; verified email when EMAIL_MODE=live                             |
| Student      | Study and student role, for student-only snapshots/pages               |
| Admin        | Study and admin or owner role                                          |
| Owner        | Study and owner role                                                   |
| Owned record | Trusted actor plus matching record userId; other users' IDs return 404 |

## Identity and email

- Native email signup/signin/signout use the allowlisted Better Auth endpoints.
  Unsupported native verification/reset token routes are blocked.
- `GET /me`: identity, role, verification, preferences, active plan/state revision,
  derived capabilities and routing destination; never credential/session fields.
- `PATCH /me/preferences`: companies, deadline, dailyMinutes, skills and
  expectedStateRevision. Saves preferences without accepting a plan.
- Verification, resend and recovery use the application's guarded
  `/identity/...` actions: POST verification/request (empty body),
  verification/confirm ({token}), password-reset/request ({email}) and
  password-reset/confirm ({token,newPassword}). Link fragments are captured then scrubbed; opening a
  verification page does not consume a token. Explicit confirmation is required.
  Recovery request responses are generic. Reset revokes existing sessions.

Canonical implementation: [identity handlers](../src/modules/identity/email-http.ts),
[preferences schema](../src/modules/identity/preferences-schema.ts) and
[email operations](email/OPERATIONS.md).

## Student content and practice

| Method/path      | Contract                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------- |
| GET /content     | Published summaries; subject, topic, company, difficulty, q, cursor, limit                  |
| GET /content/:id | Published detail or historical unavailable snapshot; otherwise 404                          |
| POST /attempts   | submissionId UUID, contentId, kind practice/revision, outcome, optional perceivedDifficulty |
| GET /attempts    | Paginated owned history; contentId, subject, topic, kind filters                            |
| GET /revisions   | Owned queue; dueOnly, cursor, limit                                                         |
| GET /dashboard   | Current-plan work, metrics and evidence-based review suggestions                            |
| GET /progress    | Student-only lifetime outcomes and active-plan completion snapshot                          |

Company filters include unlabelled foundations. List summaries omit prompts,
bodies and explanations; detail explanations support self-study, not secure exams.
Question outcomes are independent/needed_help/failed. Resources cannot receive
question attempts. An exact submission retry returns its original receipt;
changed payload with the same ID conflicts. Recording an attempt does not
complete a plan task.

Sources: [catalog schemas](../src/modules/catalog/schemas.ts),
[practice schemas](../src/modules/practice/schemas.ts) and
[progress service](../src/modules/planning/service.ts).

## Plans

| Method/path                     | Contract                                               |
| ------------------------------- | ------------------------------------------------------ |
| GET /plans/current              | Owned active plan or null, plus current state revision |
| GET /plans                      | Paginated owned version history                        |
| GET /plans/:id                  | Owned saved plan and live availability decoration      |
| POST /plan-previews             | initial/adapt/reschedule and expectedStateRevision     |
| GET /plan-previews/:id          | Owned saved proposal, diff, totals and evidence        |
| POST /plan-previews/:id/confirm | Guarded explicit acceptance; see confirmation schema   |
| PATCH /plans/:id/tasks/:taskId  | Explicit version-guarded task action; see task schema  |

Previews expire after ten minutes. Confirmation checks state, base plan,
catalog/configuration versions and study date; stale input requires a fresh
proposal. Confirmation receipts prevent duplicate plan versions after retries.
Saved plans retain snapshots. Daily budget is a maximum, not a promise of full days.
Completion and recording question outcomes are separate mutations.

Exact requests/invariants: [planning schemas](../src/modules/planning/schemas.ts)
and [planning service](../src/modules/planning/service.ts).

## Admin catalog

| Method/path                     | Action                                     |
| ------------------------------- | ------------------------------------------ |
| GET/POST /admin/content         | Filtered admin list / create draft         |
| GET/PATCH /admin/content/:id    | Detail / revision-guarded allowlisted edit |
| POST /admin/content/:id/publish | Reviewed draft to published                |
| POST /admin/content/:id/archive | Published item to archived                 |
| POST /admin/content/:id/reopen  | Archived item to draft                     |

Stable identity/classification, source/attribution and 1–60 whole-minute estimates
are validated. Publication requires a genuine nonfuture review date and usable
question/resource material; referenced assets must be ready if used. Writes
preserve revision guards and atomic audit events. There is no unrestricted
client bulk-import endpoint. The operator importer only creates drafts.

## Owner administration

All `/admin/administrators` endpoints are owner-only and no-store.

| Method/path                               | Action                                                 |
| ----------------------------------------- | ------------------------------------------------------ |
| GET /admin/administrators                 | Paginated administrator/owner list                     |
| POST /admin/administrators/lookup         | Exact normalized email lookup                          |
| GET /admin/administrators/:userId         | Current target state                                   |
| POST /admin/administrators/reauthenticate | Password confirmation for five minutes in this session |
| PATCH /admin/administrators/:userId/role  | Guarded student↔admin operation                        |

Role requests carry role, expectedRole, expectedStateRevision, operationId and
reason. New grants require a verified active student; owner demotion is refused.
An operation ID must be reused only for the same intended change.
See [operator procedures](admin/OPERATIONS.md).

## Optional file routes

These exist but are not enabled in the hosted demo. Capability and configuration
checks run before issuing provider grants.

`GET /admin/files`, `POST /admin/files/uploads`,
`GET /admin/files/:id`, `POST /admin/files/:id/finalize`,
`POST /admin/files/:id/preview`, `POST /admin/files/cleanup`,
and `POST /files/:id/download` use file validation/authorization rules.
See the actual [route adapters](../src/modules/files/http.ts) and
[optional file operations](files/OPERATIONS.md); provider keys/signed URLs are
never stored as public content fields.

## Errors and recovery

400 invalid query; 401 unauthenticated; 403 forbidden/verification/CSRF;
404 absent or not owned; 409 stale state/unavailable/idempotency conflict;
413 oversized body; 415 wrong media type; 422 validation; 429 rate limit;
503 unavailable infrastructure/provider. Exact codes are defined by each service.
After an uncertain mutation, reconcile current state or retry with its original
operation identity rather than creating duplicate work.

`GET /api/health` reports liveness only; it does not verify MongoDB or providers.
