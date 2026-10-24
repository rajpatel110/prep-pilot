# Design System: PrepPilot student workspace

## 1. Visual Theme & Atmosphere

Balanced daily-study workspace, restrained motion and predictable hierarchy.
Reviewed Stitch project 7439735129249105516: onboarding Goals, Schedule and
Starting Point; desktop/mobile Content Library; Question Detail and Resource Detail.
Product contracts override prototype-only controls, illustrative values and state switchers.

Planning references reviewed: desktop First Visit Dashboard, Active Dashboard,
Study-Plan Preview & Acceptance and Active Study Plan. Reuse their preferences
summary, explicit review/acceptance and agenda hierarchy with the existing ivory
and forest tokens. Do not reproduce QA scenario switches, sample people/metrics,
official-syllabus claims, seven-day-only windows, measured time or readiness scores.
The documented 50/25/25 target overrides conflicting prototype ratios. Plan and
preview mobile layouts use the existing single-column student workspace because
no separate mobile plan/preview reference is present. Loading uses existing status
regions; errors remain inline and keyboard reachable. No remote fonts or service
dependencies are added.

## 2. Color Palette & Roles

Reuse existing CSS tokens: warm ivory canvas (#F7F5EF), forest green accent (#245443),
charcoal ink (#202823), muted secondary text (#59645C), white content surfaces
(#FFFFFF) and fine structural borders (#D9DFD2).
No new palette, neon, gradients or fabricated progress metrics.

## 3. Typography Rules

Preserve the existing system sans-serif stack. Controlled, tightly tracked headings,
relaxed reading line height, readable metadata and approximately 65ch prose measure.
Do not introduce remote font dependencies or alter homepage/authentication typography.

## 4. Component Stylings

Selected company/skill options use forest borders and pale green fill with real
checkboxes/radios. Labels sit above inputs; inline errors connect with aria-describedby.
Library rows use subject/type/difficulty metadata, provenance and a single reading link.
Native disclosure reveals explanations. Skeletons match content rows; failures offer retry.

## 5. Layout Principles

Onboarding uses a main form and compact live preparation brief on desktop,
single column below 768px. Library has a compact filter panel above stacked rows.
Details use a reading column and metadata rail, collapsing on mobile. Targets >=44px,
bounded containers, wrapping text and no horizontal overflow.

## 6. Motion & Interaction

Restrained feedback only, respecting reduced-motion preferences. Native keyboard
focus and semantic form controls take priority over decorative motion. No perpetual
animations or heavy animation dependencies are needed for this reading workflow.

## 7. Anti-Patterns

No prototype state switchers, fake totals, placement predictions, unsupported completion
buttons, bookmarking, sharing, unsupported companies, notifications, R2 controls or
plan-generation promises. Mobile drawer layout is adapted to a native disclosure;
desktop detail layouts are responsively collapsed where no separate mobile reference exists.

## 8. Practice and revision controls

The reviewed Stitch question outcome panel now maps Solved independently to
`independent`, Solved with help to `needed_help`, and Not solved yet to `failed`.
Practice and revision are explicit modes; perceived difficulty is optional. Saving,
confirmed receipts, frozen uncertain submissions and deliberate later attempts are
real backend states, not prototype switchers. Dates come only from saved receipts.
Due revisions and immutable history use compact reading-list layouts in the existing
student shell as temporary destinations, not a fabricated dashboard or study plan.

## Progress and Settings

Reviewed Stitch desktop Progress (3656f06ce4c345e3b33613c43f83fc5c), desktop
Settings (c7bbacffaec440688af4f610326e06c1) and mobile Settings
(5cdceccf88414bca90dbb2c43469623a), including desktop HTML and screenshots.
Reuse metric cards, readable topic outcome rows, a separate history panel,
preference groups and an account sidebar. Keep ivory, forest green, charcoal and
existing typography, native inputs and visible focus. Mobile cards and the account
sidebar stack; Progress uses the existing responsive shell because no separate
mobile Progress reference was inspected. Bars have equivalent exact text counts
and measure latest self-reports among distinct attempted questions, not mastery.
No prototype metrics, QA switches, institutional SSO, notifications, placement-cell
claims or live recovery controls ship. Settings reuses onboarding's rating labels.

The account routing hub remains intact; its explicit view=settings is the editable
student destination. Preference success offers a proposal, never an automatic
schedule change. Cancel/navigation uses the existing unsaved-change dialog. Summary
and history failures are independent, with retry and no zero-data fallback.

## 9. Evidence and plan-change review

Reviewed Stitch Active Plan Dashboard and Review Proposed Plan Changes
(screen 699616b381c34aed8612220f60dd09fb), including HTML. Reuse the recommendation
entry, why-this-change panel, current/proposed schedule comparison and explicit
Keep current plan / Accept updated plan controls. Preserve existing ivory/forest/
charcoal tokens and system typography rather than importing prototype fonts.
The prototype's confidence index, >=80% unlocking, estimated confidence lift,
arbitrary array-to-DP dependency and automatic retry simulation are not product
rules and must not ship. No QA scenario controls or fabricated metrics.

Comparison uses a readable task/date change list plus daily minute totals; at
mobile widths it stays single-column rather than forcing the desktop two-column
prototype. No separate mobile adjustment reference was found. Native buttons and
links preserve tab order, visible focus and >=44px targets. Preparing/acceptance
states disable duplicate submission; failures are inline alerts, not fake success.
