# Homepage polish: focused study desk

27 October 2026. Scope: the public homepage only, following the approved Hallmark
audit. Hallmark was not installed or executed. No scaffold, dependency, font,
palette, shared navigation, authentication logic or database configuration changed.

## Content and visual changes

- Preserve the headline; shorten the hero to its message and two existing actions.
  Remove redundant pill, subject line and account note. Tighten the mobile gap to
  the illustrative agenda.
- Show an explicitly illustrative 27-minute agenda within a 30-minute budget,
  including 15-, 7- and 5-minute estimates. These are sample data, not a promise
  about an individual student's plan or measured study time.
- Replace three large workflow cards with a compact numbered sequence. Reduce
  subject-card padding, place icons beside headings and remove repeated uppercase
  introductory labels. All example topic lists remain, with a visible coverage caveat.
- Replace the hypothetical schedule-substitution illustration and sample metric
  totals with preview → explicit acceptance → recorded practice outcome. Explain
  that practice outcomes and task completion are separate, and outcomes schedule
  revisions. The illustration has no simulated form controls or actions.
- Correct stale demo-only, plans-coming-later and email-unavailable copy. Explain
  verification confirmation and password-reset links without guaranteeing delivery.
  Keep the limited-catalog, no-official-syllabus and no-hiring-guarantee caveats.
- Preserve the About text, supplied portrait, contact links and existing footer.

Styles live in `src/app/home.module.css`, under a local main-element class or local
component classes. The module consumes the existing semantic theme tokens. Global
styles, student/admin layouts, root theme initialization, persistence and CSP are
unchanged. This polish checkpoint introduced no new motion; the separately approved
scroll-reveal follow-up is described below.

## Evidence used for claims

Recorded Production `feb902c` evidence establishes the compatible short-duration
release. The existing catalog-backed disposable browser journey established plan
preview/acceptance, separate practice/task completion and Dashboard/Progress/Revisions
reads. Hosted email enforcement and completion are user-reported evidence in
implementation status, not new provider delivery tests in this task. No generic
future adaptive-scheduling screen is presented as a working current interaction.

Resource completion remains unverified in the earlier catalog-backed journey;
its interrupted standalone regression and lint/typecheck attempts remain
interrupted. Homepage checks do not retroactively complete those earlier checks.

## Preserved destination inventory

- Section IDs: `main-content`, `sample-plan`, `plan-title`, `how-it-works`, `subjects`,
  `faq`, `availability`, `about`, `about-heading`, `builder-name`.
- Header desktop/mobile and footer anchors remain unchanged, including `/#about`.
- Authentication destinations remain `/signup`, `/login` and `/account`, with the
  existing header's session-aware labels and destinations untouched.
- Contacts: `https://github.com/rajpatel110`,
  `https://www.linkedin.com/in/raj-patel-cse`, `mailto:341raj.patel@gmail.com`.
  GitHub/LinkedIn retain new-tab notices and `noopener noreferrer`.
- Theme button, local preference, native mobile disclosure and its Escape/focus
  handling, skip link and native FAQ disclosures remain in place.

## Verification checkpoint

Agent-run focused Prettier, homepage ESLint and project TypeScript
(`tsc --noEmit --incremental false`) passed. No unrelated suites were run.
One ordinary agent-run production build failed in webpack with Windows EPERM
creating `.next/server/app/api`. No unchanged retry or EPERM investigation followed.
The established user-run Git Bash build then passed: webpack, TypeScript, all 21
pages and final optimization (build `2hZM7QlssNrLMGnpT5gMl`). No rebuild followed.
An agent test-server launch was rejected by execution policy before execution;
the user then started `next start` on 127.0.0.1:3140 with command-only auth,
email and file capabilities disabled. No rebuild or source edit followed.

Before screenshots were captured from the deployed homepage at actual 1280×800
and 390×844 viewports in both themes. Artifacts are outside the repository at
`C:/Users/RAJPATEL/Documents/Codex/2026-10-23/usa/home-before-{desktop|mobile}-{light|dark}.png`.
Mobile document scroll width was 375 at a 390-wide viewport (scrollbar excluded),
without horizontal overflow. Browser theme changes were local-only; no account,
catalog, practice, plan, email or role mutation was performed.

### Completed compiled-browser comparison — 28 October 2026

Agent inspection reused the user-built artifact and user-started server. Full-page
after screenshots were compared at both requested sizes in both themes. Files use
the same artifact directory and `home-after-{desktop|mobile}-{light|dark}.png` names.
The desktop light hero also has `home-after-desktop-light-viewport.png`.

- All four layouts rendered without horizontal overflow: actual viewport widths
  1280/390 and document scroll widths 1265/375 (scrollbar excluded).
- Shorter hero and compact numbered sequence reduced repetition. At mobile width,
  the agenda began around y=439, bringing the product example into the first view.
- Desktop workflow, Subjects and FAQ navigation, mobile About navigation and the
  sample-plan anchor worked. Measured workflow/Subjects/About headings and sample
  agenda cleared the sticky header. All prior authored IDs remained without duplicates.
- Mobile navigation closed after selecting About. Escape closed the disclosure
  and restored visible keyboard focus to Menu. The theme button measured 44×44px.
- Keyboard theme switching, both reload preferences and dark cross-route persistence
  through signup/login/home passed. Those routes were visited read-only, without
  submitting forms. Auth-disabled fallback labels were expected, not a role test.
- FAQ Enter expansion exposed the correct verification/recovery explanation. The
  portrait loaded; contact destinations, readable wrapping, rel and target values
  remained correct. Contact links were inspected, not used to send email.
- Eight text/background samples in each theme passed 4.5:1: minimum light 5.66:1,
  dark 6.33:1. These samples do not establish exhaustive contrast compliance.
- Captured warning/error logs were empty. Existing About same-hash resize behavior,
  system-change/storage-failure browser coverage, reduced-motion emulation and
  zero-flash measurement limitations were not reclassified as passes.

The temporary tab was closed and viewport reset. No fixtures existed to clean up.
The user owns the server terminal and should stop it with Ctrl+C; no agent-run
shutdown is claimed. No shared-data writes, installation, commit, push or deploy.

## Scroll-reveal follow-up — 28 October 2026

`HomeMotion` mounts only on the homepage and initializes one IntersectionObserver.
Markers on section introductions, the progress heading and workflow/subject items
select a small subset of content. No header/hero/CTA/portrait animation. Targets
containing links, form controls or images are excluded defensively. Item children
use opacity/12px translation; small text groups additionally use 2px blur. All
animations last 450ms, ease out, have no stagger and do not retain their first frame.

Default SSR/CSS visibility never depends on script success. JS adds an animation
marker only when an offscreen target enters; animation ends naturally in visible
base styles even if cleanup does not run. Initial visible/above-viewport targets
skip animation. Reduced motion prevents animation and cancels active markers;
focus, direct hashes, same-hash clicks and history restoration bypass or cancel
reveals. No scroll listener, layout-affecting animation or per-scroll React update.

Sixteen focused simulated-DOM/CSS tests pass, alongside source formatting, lint and
project TypeScript. The earlier polish build does not verify this source. The
fresh user-run build `OrqvMDPoOKlJdFyMJRF9b` passed and was reused with the user-run
port-3140 server; no source edit/rebuild followed.

Compiled-browser checks passed at actual 1280×800 and 390×844 in light/dark:
normal/fast scrolling, once-only visibility, About anchors including a fresh direct
hash load, keyboard contact focus/FAQ operation, partial-scroll reload and history
restoration. Live read-only samples captured opacity 0→1, movement 12px→0 and blur
2px→0; links/buttons/portrait were not animated. The hero had no reveal markers.
Document heights stayed 4257px desktop and 5905px mobile during sampling, without
horizontal overflow. Returned/finished groups were readable and did not animate
again. Captured warning/error logs were empty. No formal CLS/FPS/low-end-device
profile was taken; computed-style sampling is not a frame-rate benchmark.

The compiled SSR main contains content and reveal candidates without active
animation markers. Actual JS-disabled browser rendering and reduced-motion browser
emulation remain pending because the connected browser has no supported controls
for those modes. Unit simulations, stylesheet inspection and SSR checks do not
replace them. Screenshot: `C:/Users/RAJPATEL/Documents/Codex/2026-10-23/usa/home-reveal-mobile-dark.jpg`.
Temporary browser tabs were closed and viewport reset. The user-owned server
remains available for manual checks; stop it with Ctrl+C afterward. No DB fixtures,
email sends, shared-data writes, commit, push or deployment.

If the connected browser cannot emulate these settings, the remaining manual
checks are: Chrome DevTools Rendering → prefers-reduced-motion: reduce, reload
and scroll (no fade, movement or blur); then Command Menu → Disable JavaScript,
reload and scroll (all content and native anchor/FAQ navigation remain visible).
Re-enable JavaScript and restore the normal motion preference afterward. These
instructions are a checklist, not evidence that either browser check has passed.
