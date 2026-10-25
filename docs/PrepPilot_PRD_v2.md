# PrepPilot Product Requirements Document

Version 2.0  |  22 October 2026  |  Project owner Raj Patel

PrepPilot is a placement preparation platform for DSA, aptitude and CS fundamentals. It creates a study plan from a student’s goals and available time, records practice outcomes, and proposes explainable changes when the student struggles or misses work.

This revision is the product baseline for Codex-assisted implementation. It replaces version 1.0 where requirements differ: Next.js and TypeScript replace Vite and Express; Vercel replaces Render; admin content management, R2 files and Resend email are now included. The adaptive preparation workflow remains the central product capability.

## 1 Product goals

- Deliver a complete portfolio application with persistent data, secure student and admin access, a useful preparation workflow and a reproducible deployment.

- Cover DSA, aptitude and CS fundamentals, starting with Cognizant and LTM company preferences and shared foundation topics.

- Make every recommendation explainable and every displayed progress metric traceable to saved records.

- Use Codex to implement the application, with reviewed changes, automated checks and demonstrable acceptance criteria. Delivery is feature-driven; no learning-based schedule is imposed.

## 2 Users and successful journeys

Student: register, configure a goal, save a roadmap, practise through curated content, record an outcome, review progress and approve a useful revision or schedule adjustment.

Admin: sign in through the shared email/password login, create or edit content, upload supporting materials, publish reviewed resources and archive outdated items while preserving student history.

Owner (approved 25 October 2026): one explicitly operator-provisioned account inherits
admin access and alone grants/removes admin access for existing accounts. New grants
require verified target email even in demo mode, recent session-bound password
confirmation and explicit final confirmation. Owner cannot be demoted or erased
through ordinary role/account paths. No invitations, usernames, bulk changes,
public admin signup or ownership-transfer UI. Students land in onboarding/dashboard;
admins and owner land in /admin. Demotion preserves authored content and study history.

The initial audience is a portfolio demonstration and a small student pilot. A working rule-based scheduler is required; an LLM is not needed for the core product.

## 3 Release scope

Required implementation includes authentication, preparation preferences, content browsing, admin publishing, controlled file access, attempt history, revision rules, adaptive planning, dashboards, transactional email integration, responsive screens, tests and deployment.

Deferred features include live code execution, automated code grading, timed mock tests, voice/video interviews, résumé analysis, student file uploads, cohort analytics, payments, social features, bulk import, recurring email reminders, streaks and LLM integration.

### Budget and readiness

Target free-tier usage without a paid AI dependency. A verified sending domain is not currently available and R2 activation is unconfirmed. The application must distinguish a working portfolio demo from a pilot with live verification and recovery email. Detailed launch gates appear in section 11; free allowances are not unlimited or guaranteed zero-billing services.

## 4 Agreed technology and application boundaries

| Area | Required choice |
| --- | --- |
| Application architecture | Modular monolith with one repository and one Vercel project. |
| Language | TypeScript for frontend, backend, application scripts and tests; strict type checking. |
| Framework and runtime | Next.js App Router with Route Handlers running on Node.js. |
| Backend interface | REST endpoints under /api/v1; no Express or NestJS application. |
| Database and models | MongoDB Atlas managed by MongoDB.com, accessed through Mongoose for domain data. |
| Validation | Zod for API input schemas and reusable form validation. |
| Authentication | Secure cookies and persistent server-side sessions, using a maintained authentication library. |
| File storage and email | Cloudflare R2 for materials and images; Resend for transactional email. |
| Hosting | Vercel for the Next.js application; separate development and production configuration. |

### Module responsibilities

Organise modules around identity and profile, content administration, files, attempts, roadmap planning, revisions, progress and notifications. Route Handlers perform request handling and call services; business decisions must not be embedded in UI components or scattered across route files.

Server Components load initial page data through authorised services. Client Components handle forms, filters and interactive updates. Browser mutations use the REST API. Server-side reads may call the same services directly without an HTTP request to the application’s own API.

### Product level API requirements

Provide interfaces for authentication, profile, filtered content, content administration, upload authorisation/finalisation, protected downloads, attempts, current plans, task updates, plan previews/confirmation, revisions and dashboards. Use consistent success/error envelopes, validation feedback, pagination limits and HTTP status codes. Authentication-library routes may use the library’s documented path and format.

The authenticated session supplies the user identity. Do not trust an owner ID or role sent by the client. Every service exposing private data must enforce the same ownership rules, whether called from a Route Handler or a Server Component.

### Infrastructure constraints

The monolith is a single application, not an assumption that one Node.js process handles all requests. Vercel can execute requests in different instances. Reuse database connections within each instance and bound connection pools. Persist sessions and authoritative state in MongoDB; files live in R2. Do not rely on local disk, in-memory sessions or an always-running process for correctness.

The System Architecture Document will specify library selection, folder structure, exact API contracts, schemas and deployment configuration. This PRD sets the required outcomes and engineering constraints.

## 5 Identity preferences and transactional email

### P0 AUTH Secure account access

Students can register with name, email and password, log in, refresh while authenticated and log out. Normalise email, reject duplicates and store only securely hashed passwords. Public signup always creates a student. Only the owner grants/removes admin rights; only initial owner establishment uses the restricted operator procedure. Roles cannot be requested through signup or ordinary profile updates.

Use persistent sessions with HttpOnly cookies, Secure in production, an explicit SameSite policy, expiry and server-side revocation. Enforce CSRF protection for state-changing requests. A role change or revoked session must take effect on the next protected request; UI visibility is not authorisation.

### P0 PROFILE Preparation preferences

Collect Cognizant, LTM or both; a preparation deadline; daily study minutes; and self-rated skill from 1 to 5 for DSA, aptitude and CS fundamentals. Explain the scale. Use Asia/Kolkata as the displayed study timezone for the first release and apply it consistently.

Retain the product defaults of a 7–30 calendar day plan, including today, and 30–240 daily minutes in 15-minute increments. If the deadline is farther away, show a 30-day preparation window. Reject a deadline that gives fewer than seven inclusive days. These are scheduler limits, not a development timeline.

Preference changes do not silently rewrite a plan. Save preferences and offer a fresh preview for changes that affect the active schedule.

### P0 EMAIL Verification and recovery

Implement verification and password-reset email flows through Resend. Verification links and reset links must expire, be single-use and be associated with the intended account. Store token material safely, keep tokens out of logs and reject invalid or previously used links.

After a successful password reset, invalidate existing sessions and require login. Give a generic response to reset requests regardless of whether the address exists. Rate-limit requests and resend actions. Email failure must not mark an address verified, report a completed password reset or leave an unrecoverable partial account state.

Use a server-controlled email mode. Test mode permits provider-supported testing and visibly disables verification and password recovery for other demo users. Demo accounts remain explicitly unverified and cannot gain admin privileges through email claims. Switching mode must never mark existing accounts verified.

In live-email mode, a registered student must verify their address before entering protected study features. Existing unverified demo accounts must verify at that point. Keep login, logout, verification status and resend routes accessible as needed to complete verification. During temporary live delivery failures, retain the verification requirement and provide a retry path.

### Email delivery requirement

A Resend sending domain controlled by the owner is required for real recipients. Until it exists, the UI and README must identify the test-mode limitation. Do not expose verification/reset tokens in production as a workaround. Welcome emails and scheduled digests are not release requirements.

## 6 Content administration and file access

### P0 CONTENT Student discovery

Browse published content by subject, topic, difficulty, company and search, with pagination and clear empty states. Include untagged foundation content when applying company preferences. DSA links to an external practice page. Aptitude includes reviewed questions with hidden answers/explanations or external links. CS fundamentals covers DBMS, operating systems, networking and OOP using study resources and recall questions.

Show provenance and distinguish verified company associations from student-reported ones. A resource visit or download is not counted as a solved question or a completed task.

### P0 ADMIN Content management

Provide an admin dashboard to create, edit, preview, publish and archive content. Each item has a stable slug, subject, type, topic, difficulty, estimated duration, source description or URL, review date, attribution notes and optional company labels. Question items have a prompt or practice link and an explanation where applicable.

Maintain draft, published and archived states. Only published items enter discovery and new plans. Archiving preserves prior attempts and task references; existing plans show the item as unavailable and offer an adjustment. Do not hard-delete referenced content or silently change a saved task’s estimate. Keep an audit record of admin content and file actions without storing secrets.

Target 50 reviewed seed items: 20 DSA, 15 aptitude and 15 CS fundamentals items spanning all four CS topics. Use the owner’s Cognizant/LTM materials after review. Seed scripts must be repeatable and must not silently overwrite later admin edits. Bulk import is deferred.

### P0 FILES Controlled R2 attachments

Admins can attach question PDFs, study materials and question images. Accept PDF, PNG, JPEG and WebP files with a proposed 10 MB per-file maximum. Student uploads, executable formats, SVG/HTML uploads, video and résumé processing are out of scope.

The backend authorises the admin and issues a short-lived upload URL for a unique object key. The browser uploads directly to private R2 storage. Finalisation verifies the stored object, actual size and allowed format before marking it ready. Failed or oversized uploads stay unavailable and can be removed. The application must not trust a client-reported successful upload.

Store metadata and object keys in MongoDB, not file bytes or permanent signed URLs. An authenticated student can request a short-lived download URL only for a ready attachment on published content. Admin preview access is separate. Restrict bucket CORS to allowed application origins and never expose storage credentials.

Publishing must reject incomplete attachment references. Replacing a file creates a new object and updates its reference only after successful finalisation. An admin can remove failed/orphaned uploads through a maintenance action. Signed download links may remain valid until their short expiry even after a resource is archived; the application must stop issuing new links immediately.

## 7 Study planning and adaptive changes

### P0 SCHEDULE Generate a feasible roadmap

Generate plans using templates and deterministic backend rules. Aim for 50% DSA, 25% aptitude and 25% CS fundamentals across the plan, allowing approximate shares for discrete task durations. Include all three subjects when eligible content and available time allow. Use skill ratings to select starting difficulty and templates to respect topic prerequisites.

Merge supported-company templates and deduplicate shared content. Company preferences guide preparation priorities; they are not guarantees of current hiring requirements. Select only published, available content. Expose content shortages and unscheduled work instead of inventing material.

Each task references one content item and has a stable task ID, subject, topic, planned date, estimated minutes, priority, status and a human-readable reason. Retain 15–60 minute task estimates. Split long reading topics during curation; never silently shorten an estimate to fit a day.

The daily budget includes new practice, revisions and carried-over work. Never exceed it. Pick a shorter eligible item when available or leave unused time. Do not repeat fresh practice merely to fill the calendar. Students explicitly complete tasks and may undo completion; saving an attempt does not silently complete every related task.

### P0 ADAPT Explain recommendations

Record each outcome and update its revision due date. If at least two of the last three non-revision attempts in a subject/topic required help or failed, suggest replacing pending lower-priority work with an easier item or revision in that topic. Fewer than three attempts trigger only the individual revision rule.

Display the triggering evidence and before/after task changes, including time totals. If no easier item exists, suggest reviewing an existing item and explain the limitation. Recompute proposals after new activity without creating duplicate suggestions. These rules are transparent heuristics, not a validated prediction of learning or placement success.

### P0 RESCHEDULE Preview and confirm

Identify pending tasks dated before today when loading the roadmap. Suggest a feasible arrangement of remaining work, prioritising due revisions, then overdue tasks, then fresh practice. Break ties by oldest due date and stable task ID. Do not apply schedule changes on a page view or without confirmation.

Never move completed work, schedule before today or exceed the plan end date. The preview lists work that cannot fit and supports explicitly deferring it. Due but unscheduled revisions remain visible without being presented as additional scheduled minutes.

Confirmation creates a new plan version and archives the previous version. Preserve retained task IDs and completion state. Allow one active plan per user. Reject stale previews if plan/task state or relevant content availability changed. Concurrent confirmations must not create two active plans.

### Acceptance example

For a 60-minute day with 45 minutes already scheduled, a 30-minute overdue task needs a different slot, a visible replacement proposal or deferral. A hidden 75-minute workload is never an acceptable result.

## 8 Attempts revisions and progress definitions

### P0 ATTEMPT Preserve outcome history

For questions and recall prompts, record solved independently, needed help or could not solve, with optional easy/medium/hard difficulty. Each deliberate submission creates a timestamped history record. A client submission identifier makes retries and double-clicks return the same result rather than writing duplicates.

Reading tasks use completion status rather than a question outcome. Record practice and revision as distinct attempt types. Preserve history across plan versions and allow students to view their recent attempts. Editing past attempts is deferred.

### P0 REVISION Schedule the next review

| Latest outcome evaluated in this order | Next review |
| --- | --- |
| Could not solve, or any outcome rated hard | 1 calendar day |
| Needed help, or independent success rated medium | 3 calendar days |
| Independent success rated easy or without a difficulty rating | 7 calendar days |

The one-day rule takes precedence. Keep one revision record per student/content item and update it after a qualifying attempt. A revision submission writes a revision-type attempt and reschedules the next review. Scheduling a review does not mark it completed.

Due dates use the study timezone. Reviews can fall after the active plan ends; retain them in the queue and label them outside the plan. Due-list queries are read-only. There is no required email-reminder scheduler.

### P0 METRICS Calculate from saved records

| Metric | Definition |
| --- | --- |
| Distinct attempted | Number of distinct question/recall items with a recorded practice or revision attempt. |
| Currently solved | Distinct question/recall items whose latest outcome is solved independently; later failed recall can reduce this number. |
| Plan completion | Completed tasks divided by all tasks in the active plan. Show the completed and total counts; exclude archived versions. |
| Topic progress | Distinct attempted/currently solved questions by subject and topic. Show reading-task completion separately. |
| Due revisions | Revision records due on or before today; unavailable archived content is flagged and excluded from new scheduling. |

Use clear empty states and defined zero-denominator behaviour. Do not label self-reported outcomes as automated accuracy or a placement-readiness score. Do not compare percentages across plan versions without showing changed totals.

### P0 DASHBOARD Make the next action clear

Show today’s tasks, overdue work, due revisions, pending adjustment suggestions and the defined progress counts. Link each item to the relevant action. Completion and question outcomes remain separate. After a confirmed mutation, refresh affected views so the user sees the persisted result.

## 9 Data security and operational quality

### Required persistent records

| Record | Responsibility |
| --- | --- |
| User and session | Identity, role, verification state, preparation profile and revocable login sessions. |
| Content item | Question/resource metadata, provenance, publication status and attachment references. |
| Study plan | Version, preference snapshot, dated tasks, completion state and selection reasons. |
| Attempt and revision | Individual submissions and the current next-review record per student/content pair. |
| File asset | R2 key, uploader, verified format/size, status and parent content reference. |
| Email and admin records | Verification/recovery token state and delivery outcome as needed; admin audit events. |

Enforce unique email, content slug, user/submission identifier, and user/content revision pair. Enforce one active plan per user. Use indexes for common user/date, publication and subject/topic queries. Auth-library collections may be additional to these logical records.

### P0 SECURITY Enforce access on the server

- Use a maintained authentication library; exact selection is an architecture decision. Restrict administrative endpoints by current server-side role, and user-specific reads/writes by ownership.

- Validate request bodies, identifiers and filters with Zod. Reject unapproved fields such as role or verification status in student updates. Mongoose schemas do not replace API validation.

- Protect mutations against CSRF. Rate-limit login, registration, email actions, generation and upload authorisation. Abuse controls must account for multiple function instances.

- Keep database, auth, R2 and Resend secrets server-side and out of Git, browser bundles and logs. Private user data must never enter a shared public cache.

### P0 RELIABILITY Keep related operations consistent

Save an attempt and its revision update atomically, or provide an equally testable consistency guarantee. Confirm a plan version atomically with a concurrency guard. A failed request must not leave duplicate attempts or multiple active plans.

MongoDB, R2 and Resend do not share a transaction. Track upload readiness and email outcomes explicitly, with safe retries and cleanup. Do not report success merely because an operation was started. Important work cannot rely on unawaited background promises after the request completes.

### P0 UX AND OBSERVABILITY Support real use

Provide loading, empty, validation and error states; preserve form input after recoverable failures. Support keyboard navigation, labelled forms and mobile/desktop layouts without horizontal overflow. Use UTC timestamps with consistent study-date conversion and test midnight boundaries.

Log structured errors and request IDs without passwords, session tokens, reset links or signed file URLs. Provide a health check, document recovery steps and make email/storage configuration failures diagnosable. CI must run type checking, linting, relevant tests and a production build before release.

## 10 Delivery sequence and acceptance criteria

Implement in dependency order and close each stage through working acceptance evidence. These stages are not estimates of learning time or promises of fixed completion dates.

| Stage | Exit condition |
| --- | --- |
| Foundation | Next.js TypeScript app deploys to Vercel and reads sample Atlas content through the service layer. |
| Identity and roles | Student/admin accounts are isolated; sessions, role checks and email mode behave correctly. |
| Content and files | Admin publishing and R2 upload/download work; students see only eligible resources. |
| Attempts and revisions | Practice history, retry protection and all revision branches persist correctly. |
| Planning and progress | Budgeted roadmaps, confirmed adjustments and dashboard calculations work end to end. |
| Release verification | Security, failure cases, content review, documentation and the declared release-mode gates pass. |

### Required automated and manual checks

- AUTH: signup/login/refresh/logout work. A student cannot read another user’s records, invoke an admin mutation, change role or download draft attachments by altering IDs.

- EMAIL: valid, expired and reused verification/reset links behave correctly. Reset revokes sessions. Provider failure is recoverable. Test mode does not claim live delivery or expose reset tokens.

- ADMIN and FILES: drafts stay private, publishing requires ready assets, archived items leave discovery, references survive archiving, and invalid/oversized/incomplete uploads remain unavailable.

- ATTEMPT and REVISION: two deliberate submissions create two records; duplicate retries create one. Each 1/3/7-day rule works. A simulated write failure cannot save only half of an attempt/revision update.

- SCHEDULE and ADAPT: test 7- and 30-day boundaries, minimum budget, two companies, insufficient content, last-three-attempt weakness, and a revision outside the plan. Every day stays within budget.

- RESCHEDULE: declining changes nothing; confirmation preserves completed tasks. Stale previews, concurrent confirmations, unavailable content and work that cannot fit are handled explicitly.

- METRICS: compare against a small known dataset with zero records, repeated attempts, failed recall after success, reading tasks and archived plans. No counters are hardcoded.

- DEPLOY and UX: run the whole journey on the deployed app with separate student/admin accounts, check mobile and keyboard access, and verify data survives redeployment.

### Evidence and documentation

Use unit tests for scheduling and metrics, integration tests for authorisation and database consistency, and end-to-end tests for the key student/admin journeys. Validate external integrations with controlled accounts and materials. Keep a README covering setup, environment variables, seed/admin provisioning, tests, deployment, service limits and recovery.

Release evidence includes a reviewed 50-item dataset, passing checks, a usable deployed demo and a short demonstration of a recommendation changing after real recorded attempts. Classmate feedback is useful, but no learning-effectiveness or scale claims should be made without supporting results.

## 11 Release modes dependencies and references

### Portfolio demo readiness

The core student journey, admin publishing, security checks and progress calculations must work. R2 uploads/downloads must be activated and validated to claim the file feature is complete. While Resend remains in test mode, clearly label verification and recovery as unavailable to general demo users; do not present the demo as having live email recovery.

A temporary email delivery failure in an already live deployment must never silently switch the application into demo mode. Only an explicit server-side environment setting controls the mode.

### Live email pilot readiness

Require a domain controlled by the owner, verified Resend configuration, working links using the canonical application URL, successful delivery to a separate test recipient, and valid/expired/reused token checks. Enforce the verification requirement described in section 5. The domain is a launch dependency, not a reason to omit email implementation.

### Current unresolved dependencies

| Dependency | Current state and required resolution |
| --- | --- |
| Sending domain | Not owned yet. Obtain access to a domain/subdomain with DNS control before live verification and password-reset delivery. |
| Resend account | Free plan selected. Activate credentials and test integration; quota availability does not remove the domain requirement. |
| Cloudflare R2 | Selected; activation unconfirmed. Complete subscription checkout and confirm account access before upload integration can be accepted. |
| Vercel and Atlas | Selected. Confirm accounts, free resource selection, network access and environment configuration at setup. |

### Budget assumptions

As checked on 22 October 2026, Resend Free provides 3,000 emails per month with a 100-per-day limit. Its test domain is restricted to the account owner’s address; real recipients require a verified sending domain.

R2 Standard includes 10 GB-month of storage, 1 million Class A operations and 10 million Class B operations monthly, with free internet egress. R2 requires subscription checkout and bills usage beyond included allowances. Track usage, restrict uploads to admins and apply file limits; do not assume a hard automatic spending stop.

Vercel Hobby is for personal, non-commercial use. Recheck provider limits at deployment. Target free-tier operation; live email remains dependent on obtaining a verified sending domain.

### Provider references

Next.js Route Handlers: https://nextjs.org/docs/app/getting-started/route-handlers

Vercel Hobby: https://vercel.com/docs/plans/hobby

Atlas Free limits: https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/

R2 pricing: https://developers.cloudflare.com/r2/pricing/

R2 setup: https://developers.cloudflare.com/r2/get-started/

Resend limits: https://resend.com/docs/knowledge-base/account-quotas-and-limits

Resend domain requirement: https://resend.com/docs/knowledge-base/403-error-resend-dev-domain
