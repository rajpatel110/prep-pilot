# Product behavior

PrepPilot supports interview preparation through curated DSA, aptitude and CS
fundamentals content, saved schedules, self-reported practice and revisions.
The filename is retained for repository references; this document describes the
implemented product, not a delivery roadmap.

## Accounts and access

Public signup creates a student. With live email policy, unverified users can
sign in, inspect verification status, request verification/recovery and sign out,
but cannot use protected student or admin pages/APIs. Opening an email link alone
does not verify an address: explicit confirmation consumes a valid single-use link.
Password reset requires a valid link and revokes existing sessions.

Students without preferences enter onboarding; students with preferences enter
Dashboard. Admins and the owner enter Administration. Current session, profile
lifecycle and role are checked server-side. Only the owner manages administrator
access; role grants require a verified target and recent password confirmation.

## Preferences and planning

Select Cognizant, LTM or both; a deadline; 30–240 daily minutes in 15-minute
increments; and confidence 1–5 separately for DSA, aptitude and CS.
Study dates use Asia/Kolkata. A new window spans at least seven inclusive days,
up to 30 or the earlier deadline. Existing saved goals do not block access merely
because their date passed; saving new goals validates the date.

Content estimates are positive whole minutes from 1–60, independent of the daily
budget. Confidence selects a difficulty ceiling, not a measured ability score:
1–2 easy, 3 medium, 4–5 hard. Company-labelled material must match a selection;
unlabelled foundations remain eligible.

A proposal does not activate itself. Explicit acceptance saves a plan version.
Preference saves and new catalog publications do not rewrite an accepted plan.
Replacing an active-window plan retains its window and completed work. Initial
generation creates a new window. Priorities, prerequisites, exact budgets and
history are defined in [planning configuration](PLANNING_CONFIGURATION.md).

Editorial subject targets are 50% DSA, 25% aptitude, 25% CS by minutes; actual
allocation can differ because of available durations, revisions and coverage.
No eligible content means an honest shortage, not duplicated or invented tasks.
Company labels do not establish an official syllabus or exhaustive coverage.

## Study and progress

The library supports subject/topic/company/difficulty filters, keyword search
and pagination. Only published content enters new discovery and plans.
Question details reveal explanations on demand and may link to external practice.
Resource details supply learning material or an external reference.

Question outcomes are self-reported: independent, needed help or failed, with an
optional perceived difficulty. Immutable submissions drive attempt history and
1/3/7-day revision dates. Revisions are not evidence of objectively graded mastery.
Opening a resource, following a practice link or recording an outcome never
automatically completes a task; completion is explicit.

Dashboard shows current work and actionable schedule reviews. Progress separates
lifetime question outcomes from active-plan task/resource completion. Historical
plans retain snapshots; unavailable content remains identifiable without exposing
unpublished bodies. Settings preserve unsaved input on recoverable errors and
save preferences separately from plan acceptance.

## Content and ownership

Administrators create, edit and preview drafts, then explicitly publish reviewed
items. Published content can be archived without deleting history. Revision
guards reject stale edits. Review dates must reflect real editorial checking.
Company provenance distinguishes candidate reports from verified associations;
original material must not acquire unsupported company claims.

The restricted operator importer creates drafts only, defaults to dry-run and
does not overwrite existing records. Publication remains a separate authenticated,
validated, audited action. See [content operations](content/README.md).

## Interface and live scope

The responsive graphite/cool-white/tangerine interface includes light/dark themes,
system preference handling and local preference persistence. Instrument Sans is
self-hosted. Homepage examples are illustrative; About/contact links describe
the actual builder. Selective scroll reveal respects reduced motion and has a
visible server-rendered fallback.

The hosted app supports the student journey, admin catalog management and owner
administration. Brevo verification/recovery and mandatory verification were
reported working by the operator. Inbox arrival is distinct from provider
acceptance. Files/R2 remain disabled in the demo; the optional server module is
documented separately for maintenance, not advertised as available.
