# PrepPilot visual theme

Approved 28 October 2026: graphite, cool white and selective tangerine replace
the previous ivory/forest direction across homepage, auth, student and admin UI.
Existing screen compositions, product claims, controls and workflows remain.
This supersedes palette/font descriptions in older Stitch reference documents;
those documents remain useful for layout and interaction guidance only.

## Semantic roles

`src/shared/ui/theme.css` is the single palette source. Light uses page #F6F7F9,
surface #FFFFFF, muted surface #E9ECF0, text #15181C and muted text #535B65.
Dark uses page #111316, surface #191D22, muted surface #242931, text #F3F4F6
and muted text #ABB2BC. Structural borders are #D9DEE5 / #343B45.

Primary actions are graphite with near-white text in light mode and light grey
with dark text in dark mode. Neutral selected surfaces retain explicit selected
controls, current-page semantics and existing labels; colour is not the only cue.
Legacy `ivory`, `charcoal` and `forest` CSS names are compatibility aliases to
semantic page/text tokens, not a second palette. New UI should use semantic names.

Accent #E8590C / #FF8A3D is for the brand mark, sample-plan tag and progress fill.
Small accent text and focus use darker #AE3B06 in light mode and #FFAB73 in dark
mode. Orange is not a blanket link/button/card colour. Inputs use stronger
#747E8B / #74808F boundaries, independently of subtle decorative borders.
Success remains green, warnings amber, errors red; published/archived labels and
other existing status text remain explicit. Do not remap feedback into brand orange.

## Typography and delivery

Instrument Sans is loaded once in the root layout through the installed
`next/font/google` loader, Latin variable font, with `display: swap` and Next's
adjusted fallback. The build fetches font assets; visitors receive self-hosted
same-origin files, not Google requests. No package or external runtime font CSS
is added. Existing responsive sizes, heading hierarchy and reading measures remain.
Code/SQL retains the existing monospace browser/Tailwind stack.

## Behaviour and verification

The existing theme initialization, OS preference tracking, explicit local
preference, storage-failure handling and colour-scheme are unchanged. The same
dark token map also applies without initialization under the OS media query.
No competing provider or CSP change is introduced. The application did not
previously declare a browser theme-colour value; this change does not add one.

Homepage reveals retain their existing finite animations, SSR-visible baseline,
reduced-motion bypass and focus/hash safeguards. No geometry or motion settings
are changed by this palette update.

Focused tests cover contrast of text, feedback, action labels, accent labels,
input boundaries and focus rings, as well as existing theme/reveal behaviour.
Compiled checks on build `qC4fdKmAxzG_-b92FpgTb` confirmed the Instrument Sans
rendered stack, both palettes and representative homepage/signup/student/admin
layouts at desktop and 390×844. Theme keyboard operation, reload/route persistence,
mobile navigation, About/contact preservation, dark filters/table/status labels,
and the shared dialog's fit/Escape focus restoration passed. Student/admin checks
used the existing random disposable UI database, which was removed afterward;
there were no shared-database changes or practice/plan mutations.

Before/after screenshots are recorded in implementation status. Browser font
waterfall/CLS measurement, exhaustive state coverage, actual reduced-motion and
JavaScript-disabled browser runs remain unverified; automated fallback coverage
is not presented as a substitute for those browser checks.
