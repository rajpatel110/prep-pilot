# Student journey usability checkpoint

28 October 2026. Focused corrections; no planning-rule or brand redesign.
Local and hosted still share `prep_pilot_dev`; tests use random disposable targets.

## Findings and changes

- Reproduced on the compiled pre-change app in one browser/origin: the disposable
  signed-in student opened the homepage and its plan CTA landed on Create account.
  The CTA was hard-coded to `/signup`, whose page did not redirect active sessions.
  Both homepage CTAs now enter `/plans/review`, with the existing student guard.
  Signed-out users get a safe login return path (preserved through signup), missing
  setup routes to onboarding, mandatory verification remains enforced, admins/owners
  retain `/admin` routing. Auth pages also redirect existing eligible sessions.
- Saved setup now stays long enough to show the requested success message and
  Review my plan action through the existing GeneratePlan pipeline. Existing plans
  are not accepted/replaced automatically; current-state/revision reads remain.
  Unsaved handling and uncertain-save reconciliation are retained.
- The verification heading was unconditionally “Verify your email”, even when its
  account label said verified. It now reflects confirmed status. Previously open
  pages had no account-return invalidation. Focus, visible return, bfcache restore
  and a token-free account-change notification now request fresh server state.
  Notifications are invalidation only, never proof of verification; page/API guards
  still consult the authoritative session. Confirmation remains an explicit POST.
- Progress previously awaited summary and then independent history before returning
  its shell. Independent Suspense regions now stream each separately, retaining
  isolated partial failures/retry and a navigable loading shell. No private shared
  cache, authentication shortcut, database index or transaction change is introduced.

## Confidence and allocation

The system-design contract and engine agree: confidence 1–2 includes easy fresh
items, 3 includes up to medium, 4–5 includes up to hard. Easier material remains
eligible. Company selection, availability, prerequisites, attempted IDs and exact
budgets still constrain selection. Due revisions/overdue work precede fresh work.
The 50/25/25 editorial target is independent of confidence and drives fresh-subject
deficit priority, not guaranteed daily percentages. No broken score wiring found.
Changing confidence into subject weights needs a separate approved product decision.

Preview now shows actual scheduled minutes and percentages using their sum as the
denominator; empty plans show not-applicable percentages. Baseline allocation is
secondary disclosure. First plans show a proposed schedule, not old-zero comparisons;
empty dates say No tasks scheduled. Replacements label previous/proposed and omit
unchanged minute rows, retaining task/change summaries. Generic foundation reasoning
is no longer repeated on every task; revision/carried-work evidence stays visible.

Unused capacity is not automatically a rest day. Prior published-catalog evidence
contains only seven questions / 112 minutes and no resources, so seven 30-minute
days cannot all be filled. A DSA confidence of 1 excludes medium DSA work; an
aptitude confidence of 5 does not force additional aptitude content into existence.
The UI lists real deferred reasons and explains selection constraints without
claiming a particular empty day has a proven cause when the DTO does not expose it.

## Local baseline measurements

Before editing Progress rendering, reused compiled build `qC4fdKmAxzG_-b92FpgTb`
with the existing three-item, no-activity `student-ui-fixture.ts` (random database).
`tests/progress-timing.ts` performs three authenticated document GETs and logs only
durations, never cookie values or response bodies. First means first Progress read
after fixture setup, not a cold process or cold Atlas connection.

| Request  | Headers | Loading shell | Actual metrics | Complete response |
| -------- | ------: | ------------: | -------------: | ----------------: |
| First    |  207 ms |        212 ms |        1839 ms |           1844 ms |
| Repeat 1 |   22 ms |         23 ms |        1996 ms |           1998 ms |
| Repeat 2 |   27 ms |         27 ms |        1559 ms |           1560 ms |

These are local HTTP streaming observations, not browser paint/route timings or
hosted telemetry. Source trace found three guarded account reads across page,
summary and history; no duplicate client metrics fetch on mount was found.
Those checks remain fresh and uncached. No MongoDB profiler/explain or hosted
request trace was captured; there is no evidence assigning blame to a provider.
Final warm local reads, using the real `Summary as of` metrics marker rather than
skeleton labels, measured headers 24/24/20 ms, loading shell 29/25/21 ms, actual
metrics 1241/1314/1072 ms and complete response 1244/1316/1073 ms. An earlier
post-change sample accidentally matched skeleton text and was discarded. These
warm observations are not a controlled cold benchmark or hosted guarantee.
Browser repeat navigation showed the shell at 476 ms and actual summary at
1407 ms; no equivalent pre-change browser paint measurement exists.
The baseline fixture confirmed zero plans/attempts and its database/server cleanup.

Final source checks: 34 focused tests, scoped lint/format and TypeScript passed.
The agent build hit Windows EPERM creating `.next/types/app/plans/[id]` before
compilation completed; the established user-run Git Bash fallback was requested.
The final user-run build passed (`N9cAvnugoxMBZVQJ3VPaQ`); no application source
changed afterward. EPERM diagnosis stays paused.

Compiled disposable HTTP checks passed: safe signed-out and signed-in returns,
incomplete setup routing, preferences, first preview budgets, explicit acceptance,
practice submission versus separate task completion, Progress metrics, replacement
preservation and admin routing. Browser checks passed for the signed-in homepage
CTA, saved Settings next step, first preview/empty dates, Progress, keyboard focus,
1280×800 and 390×844 light/dark layouts without horizontal overflow. Mocked explicit
verification refreshed the previously open tab to Email verified without a reload.
No real email was sent. Baseline and final study fixtures reported cleanup; the
final fixture contained one disposable plan and attempt. Shared accounts/content
were not used as fixtures.

Follow-up first-time onboarding verification used separate fresh desktop/mobile
accounts from `student-ui-fixture.ts`. Clicking the native calendar opener and
using calendar keyboard selection chose 2026-11-17. The live preparation brief
updated, step three opened, Save and continue showed the setup-saved message, and
Review my plan generated a preview ending on that date. Settings navigation and
reload confirmed date persistence for both accounts. Actual viewports were
1280×800 and 390×844, with no mobile horizontal overflow. The earlier text-fill
automation only changed the DOM value; native interaction correctly updated state.
No application change or new build was needed. These checks use a desktop browser
at mobile width, not a physical phone's operating-system date picker.

Cleanup reconciliation identified `prep_pilot_mail_ui_34abb6c8a8d3`: its sole account
was `email-browser-owner@example.com`, created at 2026-10-28T06:30:06.952Z within the
recorded fixture launch/ready window, 06:29:35–06:30:08 UTC. The exact name, account,
timestamp and absence of plans/attempts were asserted before removing this database.
An exact-name database listing then confirmed absence. No broad cleanup occurred.
Both follow-up student fixture runs reported database/server cleanup and zero
plans/attempts; the unaccepted previews were removed with their disposable database.

Remaining limits:
Compiled owner-specific routing, injected independent-read failures, hosted timings
and MongoDB query profiling were not verified. Resource completion remains outside
this completed evidence; earlier interrupted checks are not marked passed.

## Verification and manual walkthrough

Focused checks cover safe return paths, confidence ceilings (1/5, 5/5, 3/5),
actual/empty subject mix, comparison filtering, return-event cleanup and existing
planning/identity/email-link contracts. No real mail is sent.

For remaining manual checks, reuse the final build and disposable accounts only:

1. Signed out: homepage Create my study plan → login/signup; sign in and retain the
   plan-review destination. Confirm an unverified live-mode user stays at verification.
2. Incomplete setup: save preferences; see the success message and Review my plan.
3. Inspect actual subject mix, dates, empty days and deferred work; accept explicitly.
4. Existing plan: edit preferences, review replacement; confirm no schedule changes
   before acceptance. Record practice only on the designated disposable account.
5. Check Progress first/repeat navigation, metrics and independent-history failure;
   return from mocked confirmation and check verified status in a previously open tab.
6. Check desktop and 390×844 in both themes, keyboard focus and owner routing.

The finalization request authorizes a scoped commit and normal push. Shared
study/content mutations remain out of scope. Push success and Vercel deployment
status must be reported separately.
