# Independent student-journey review

28 October 2026. One bounded pass; no planning-policy, branding or authorization
changes. Existing content/importer work is preserved. No shared study records,
accounts or catalog items are used as fixtures.

## Baseline and deployment evidence

- Local HEAD and GitHub `dev` both resolved to
  `e052a9e18d393a1a0ff58a0e245443cd1ef113b3` before this review's edits.
- GitHub's Vercel commit status reported success / Deployment has completed and
  linked deployment `224hGtd52L8SftBjmeMEGhFhBjHF`. The public deployment-list API
  returned no records for this SHA; the web reader could not access the hosted
  homepage. This does **not** independently establish which commit the current
  Production alias serves. No hosted private flow or latency was measured.
- Reused baseline build `N9cAvnugoxMBZVQJ3VPaQ` for the disposable browser preview
  and acceptance. The sparse three-item catalog honestly showed 45 scheduled
  minutes, 100% DSA, empty later days and no automatic acceptance. The first
  resource-opening attempt was interrupted after the fixture stopped, not passed.
- That fixture reported database removal and owned-server shutdown. Its final
  metrics read raised a MongoServerSelectionError, so no final count is claimed.
  Do not confuse this environmental interruption with a resource-flow defect.

## Confirmed findings and small fixes

| Finding                                                          | Impact and reproduction                                                                                                                                                                                                                                     | Expected versus actual                                                                                                                                                    | Root cause and fix                                                                                                                                                                                                                                                                                                                                                                                       | Severity / confidence                                                |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Successful plan acceptance could look failed                     | Confirm a preview successfully, then fail or stall the follow-up current-plan GET. The old UI stayed on the proposal and offered retry advice even though acceptance had committed. Reloading an already confirmed preview also said it was not active.     | A successful receipt should identify the saved plan independently of later read availability; an accepted historical proposal is not necessarily the current active plan. | `planning/ui/workspace.tsx` put POST and GET in one catch and hard-coded the review label. `planning/accept-preview.ts` now delivers the confirmed ID before refetching; failed refresh cannot turn the mutation into failure. Navigation starts immediately, with an accepted-plan link fallback and accurate accepted-proposal label. Uncertain POST failures still require retrying the same preview. | P2 / high; executable injected-read tests and concrete UI path       |
| Serial practice refreshes unnecessarily delayed reconciliation   | Save an outcome. The receipt appeared, but history, revisions, current plan and dashboard were fetched one after another before route refresh. The later-attempt button was usable during that work, allowing old refresh messages to arrive in a new form. | Persisted receipt must remain safe; independent reads should not form a waterfall, and previous refresh work must not overwrite a deliberate later attempt.               | `practice/ui/outcome-form.tsx` now starts route refresh after the receipt, runs the four required reads concurrently through `practice/refresh-study.ts`, preserves partial successes and prevents starting another attempt until reconciliation finishes. No automatic resubmission or task completion.                                                                                                 | P2 / high; controlled pending-promise/failure tests and code path    |
| Anonymous verification could show success for a replacement link | Confirm a valid link while signed out, then navigate to another fragment on the same verification page. Previously the success boolean survived even though link/error state reset.                                                                         | Only the explicitly confirmed link should supply anonymous success; signed-in account status must remain server-authoritative.                                            | `identity/ui/email-panel.tsx` now associates local confirmation with the link revision. `identity/ui/email-link.ts` resolves the displayed status from the current server account or matching anonymous confirmation revision. Opening a new link still consumes nothing.                                                                                                                                | P2 / high; link-revision tests and compiled mock-email browser check |

No token generation, expiry, single-use, CSRF, role, ownership, idempotency,
transaction, planner allocation or budget rules were changed. The client helpers
retain the existing API request timeouts. No private shared cache was introduced.

## Final validation

- Eight new focused recovery tests cover slow/failed post-confirmation reads,
  uncertain/rejected confirmation without retry, concurrent study refreshes,
  partial/total read failure, replacement-link status and server-account priority.
- Existing same-tab link and journey presentation tests are relevant regression
  coverage, not proof of all browser paths. Eighteen tests passed together.
- Scoped formatting and lint plus project TypeScript passed. A React render-time
  ref access found by lint during implementation was corrected using render state;
  the synchronous ref remains only for stale-response protection in events.
- Production compilation hit EPERM creating `.next/server/app/api/v1/admin/files`.
  The established user-run Git Bash build then passed, including TypeScript and
  all 21 static pages: build `0Jz3fC5sSIhzG9AcBmLP4`. No application source changed
  after that build. It was reused for the checks below. EPERM diagnosis stayed paused.
- `tests/resource-journey-http.ts` adds a disposable-only resource flow check for
  explicit completion/undo, separate reading metrics, zero attempts/revisions,
  cross-user access, CSRF, stale writes and the accepted-preview reload label.
  All these checks passed against the final compiled app.
- Browser checks used actual 1280×800 desktop and 390×844 mobile viewports:
  Dashboard → preview → keyboard acceptance → saved plan → resource → explicit
  reading completion → back to plan passed. The resource had no practice-outcome
  form; completion and Undo were visible. A question saved an independent outcome
  and receipt, left its task pending, then separately completed the task. Starting
  a later attempt reset the form without creating another attempt automatically.
  Mobile dark mode, light-mode switching, route persistence, visible keyboard
  focus and no horizontal overflow were observed on the affected study surfaces.
- The final mock-email browser check requested a mocked message, signed out,
  opened the captured link and explicitly confirmed it. The anonymous heading
  changed to Email verified. A replacement fragment in the same tab restored
  Verify your email and the confirmation control; an invalid token was rejected
  without stale success. Reopening the used link also required confirmation and
  was rejected. Mobile light/dark error controls were readable, with width 390,
  height 844 and scroll width 390. No provider or real inbox was contacted.
- Screenshots are local, not committed:
  `C:/Users/RAJPATEL/Documents/Codex/preppilot-review-2026-10-28/resource-mobile-dark.jpg`,
  `email-replacement-mobile-dark.jpg` and `email-used-link-mobile-light.jpg` in that
  same directory. Browser viewport override was reset and the final test tab closed.

## Performance and cleanup

Local final-build Progress document measurements, using the existing timing script:

| Read                      | Headers | Loading shell | Metrics in streamed response | Response complete |
| ------------------------- | ------- | ------------- | ---------------------------- | ----------------- |
| First measured navigation | 33 ms   | 37 ms         | 1193 ms                      | 1197 ms           |
| Repeat 1                  | 16 ms   | 17 ms         | 1167 ms                      | 1169 ms           |
| Repeat 2                  | 23 ms   | 23 ms         | 1479 ms                      | 1481 ms           |

The server/database were already warm. These are response-stream timings, not
browser usable-paint measurements, cold starts or hosted timings. Progress source
was unchanged in this pass; no before/after speed improvement is inferred.
The supported browser evaluation scope did not expose Resource Timing, so a browser
waterfall was unavailable. Mobile navigation reached the Progress loading shell;
its final browser metrics were not inspected before the study fixture expired.
API metrics checks passed, but that interruption is not a passed browser check.

The final study fixture exited successfully, reported one attempt and two plans,
and confirmed its own disposable database deletion and server shutdown. Its port
was no longer reachable. The first email-fixture launch failed before connecting
or creating a database because permissions were unavailable; the subsequent launch
used the existing random-name fixture and mocked delivery. Its expected automatic
cleanup did not report completion. Sending Enter to its owned terminal was blocked
by the execution policy, and host process inspection was unavailable. Read-only
reconciliation positively identified `prep_pilot_mail_ui_1b2f215f42db`: exactly one
expected mock account, created `2026-10-28T17:45:26.187Z`, now verified. No real
account data was logged. Port 3119 still answered health checks; bridge 3120 was
unreachable. Therefore email-fixture cleanup remains **unconfirmed**, not passed.

A one-use guarded TypeScript cleanup script is saved outside the repository at
`C:/Users/RAJPATEL/Documents/Codex/preppilot-review-2026-10-28/cleanup-email-review.ts`.
It refuses deletion while either fixture port responds, then checks that exact
database/account/timestamp and zero study records before deletion, and verifies
database absence. Its attempted execution stopped at the safety guard. The user
must stop the remaining fixture server before running it. No broad process kill
or database cleanup was attempted; `prep_pilot_dev` was untouched.

## Remaining bounded follow-ups

- P3 usability: resource detail still offers a redundant Open resource self-link
  and question-oriented outcome guidance. Resource reading/completion itself
  passed; copy/navigation cleanup was left outside the three fixes in this pass.
- One browser accessibility observation reported the consumed verification fragment
  after confirmation, despite the initial capture reporting a clean URL. The later
  replacement/error page had no fragment according to the actual document URL.
  Whether this was browser reporting or a refresh/history interaction was not
  established. Do not treat URL scrubbing on every refresh as newly verified.
- Injected read failures are verified with deterministic tests, not a browser
  network-fault harness. A complete fresh desktop/mobile × light/dark matrix,
  every stale/session-expiry path and owner-specific routing were not repeated.

## Product limitations, not defects

Confidence currently limits fresh-question difficulty; it does not reweight the
50/25/25 editorial allocation. Changing that needs an approved product decision.
Insufficient eligible content must leave time unused rather than invent or repeat
tasks. Explicit acceptance and separate practice/task-completion actions remain
intentional. Self-reported outcomes are not automated accuracy or readiness scores.

Previous signup/verification/onboarding/Settings and role-routing evidence remains
as recorded in `JOURNEY_USABILITY.md`; it is not relabelled as a new complete pass.
Hosted performance stays unmeasured. No MongoDB profiling, physical-phone test,
exhaustive expired-session matrix, hosted owner exercise or browser network-fault
injection has been completed during this pass. Deterministic mocked request tests
are not real-provider delivery tests.
