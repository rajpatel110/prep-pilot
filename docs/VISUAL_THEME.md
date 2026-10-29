# Visual system

PrepPilot uses graphite, cool white and selective tangerine consistently across
homepage, auth, student and admin screens.

## Tokens and type

The palette source is [theme.css](../src/shared/ui/theme.css). Light uses
page #F6F7F9, white surfaces, muted #E9ECF0, text #15181C and secondary #535B65.
Dark uses page #111316, surface #191D22, muted #242931, text #F3F4F6 and
secondary #ABB2BC. Primary buttons are neutral graphite/light-grey, not orange.

Brand accents are #E8590C/#FF8A3D, with darker/lightened accessible accent-text
and focus tokens. Success, warning and error retain distinct semantic colours
and labels. Controls use stronger boundaries than decorative card borders.
Legacy colour names are compatibility aliases, not a second design system.

Instrument Sans loads once through `next/font/google` in the root layout.
Builds fetch font assets; visitors receive self-hosted files. Code and SQL use
monospace. Responsive type sizes and reading measures are shared, not per-page
font downloads.

## Themes and accessibility

The same-origin `/theme-init.js` runs before hydration. CSS follows the system
preference before initialization and with JavaScript disabled. Explicit light/dark
selection is stored only as `preppilot-theme` in localStorage. System changes
apply until explicit selection; blocked storage retains a choice in memory for
the current document. Cross-tab preference changes synchronize.

The reusable ThemeToggle has an action name, decorative icon, visible focus and
44×44px target. It appears in homepage, auth, student and admin navigation.
Native controls use color-scheme. Do not add a competing theme provider or
relax CSP for initialization.

The homepage preserves navigation anchors, About portrait/contact links and
illustrative sample labels. Scroll reveals are homepage-only, once per load,
with server-rendered visible content. Reduced motion disables reveal effects;
focus/hash navigation must reveal targets immediately. Header, hero/actions,
portrait and large surfaces are not blurred.

Shared forms, errors, dialogs and menus must remain usable with keyboard,
small viewports and both themes. Respect focus restoration, labelled fields,
explicit busy/disabled feedback, reduced motion and readable status contrast.
The design is not a mandate to simplify dense learning/admin screens into
decorative landing-page layouts.
