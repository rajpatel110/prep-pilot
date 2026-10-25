# Application theme

One local-only light/dark preference, no accounts, cookies, database writes or
provider integration. No additional dependency. Existing light colors are
preserved as semantic tokens in `src/shared/ui/theme.css`; the dark palette uses
green charcoal backgrounds, raised green surfaces, warm text and lighter accents.
Global, student, admin/editor and dialog CSS consume the same tokens. Native
controls follow `color-scheme`; shared focus styles use the accent token.

The root layout loads a same-origin `/theme-init.js?v=1` using Next Script's
`beforeInteractive` strategy. Its TypeScript route serves only the static
initializer from `theme-script.ts`, without secrets. No CSP is added or relaxed.
CSS follows system dark mode before initialization when no theme attribute is
present. The initializer reads only `preppilot-theme` from localStorage, sets the
root theme attribute and follows system changes until an explicit choice exists.
Blocked storage retains the explicit choice in memory for the current document.
Cross-tab updates synchronize; removing the stored choice resumes system following.
No other application storage is read, cleared or changed by this implementation.

The shared `ThemeToggle` uses `useSyncExternalStore` with a stable server snapshot
for hydration, listens to the initializer and dispatches explicit choices. Only
the root theme attribute's intentional pre-hydration change is suppressed. Icons
are decorative, while the button name describes the opposite mode action. Each
target is 44×44px. Transitions are limited to the button and existing controls;
the existing reduced-motion stylesheet disables them. No whole-page animation.

Controls are present in the homepage header, student/onboarding header, shared
admin workspace and auth frame. Mobile keeps the toggle outside collapsed menus.
About remains after FAQ and before the footer, using the same shared theme tokens.

## Focused checks

### Recorded production-browser checkpoint — 26 October 2026

User-run build passed with 21 static pages, including the static initializer route.
Agent reused it without recompiling. Actual 1280×720/390×844 sampling covered
homepage/About, auth, student dashboard/library/Settings and admin library/editor/
dialogs. Explicit light over a dark OS persisted across reload and route changes;
keyboard action names/focus, 44px target, native dark controls and sampled responsive
surfaces passed. Captured console warning/error logs were empty. About contact
destinations and dark/light card readability were preserved. Only disposable
fixtures were used; all generated records and the owned server were cleaned up.

Browser system-light/system-change and blocked-storage scenarios remain unverified
in the connected browser (unit simulations pass). Reduced-motion remains
code-verified, not emulated; no first-paint filmstrip or zero-flash guarantee.
Other pages share the tokenized styles but were not each exhaustively sampled.

`node --import tsx --test tests/theme.test.ts` checks first visit under both system
preferences, system changes before/after selection, reload preference resolution,
invalid saved values, blocked storage, cross-tab changes and core text/feedback/
button contrast in both palettes. These are simulated browser-environment tests,
not evidence of browser rendering or an actual first-paint measurement.

After a successful current production build, use the existing disposable
`tests/student-ui-fixture.ts`. Its session gateway has `/student` and `/admin`
destinations, both restricted to generated fixture identities/database. Verify
homepage/About and login, then student dashboard/library/Settings and admin
library/editor/dialogs in both themes, desktop and actual 390×844 mobile.
Check toggle names/keyboard focus, route/reload persistence, native inputs, selected
rows, feedback and disabled states. Never record study/catalog changes in the
shared database for theme checks. Stop via POST to the local gateway's `/finish`.

For actual system preference and reduced-motion emulation, use browser DevTools
Rendering controls if the connected browser does not support those capabilities.
Storage-failure tests should block only the theme fixture's localStorage; never
clear real account/session storage or paste tokens into diagnostics. First-paint
and hydration checks require a fresh navigation with matching production assets.
