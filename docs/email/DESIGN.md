# PrepPilot email and account security screens

Read-only Stitch references in project `7439735129249105516`:

- Email Verification: `dad0ec083f264d8c941f46ceb30b3c47`.
- Forgot Password: `2444fb7acc824bbeaa08fab7f62099ab`.
- Reset Password: `932ce01cf09c4f00b7f3e0e531d9d1c4`.
- Settings & Profile: `c7bbacffaec440688af4f610326e06c1`.

Reference HTML was inspected. Reuse its split introduction/form card, compact
account-security heading, primary action and visible delivery/invalid-link states.
Keep the existing warm ivory, forest green, charcoal, system typography, rounded
cards and restrained motion. Shared AuthFrame preserves the existing login/signup
layout; narrow screens hide the introduction and keep a single readable card.

Product contracts override prototype copy: verification is 60 minutes, reset is
30 minutes and passwords are 12–128 characters. Do not reproduce fictional
institutional statistics, QA switches, simulated delivery, an eight-character
policy or 24-hour verification. No new font, icon, animation or UI dependency.

The account panel links real verification status and recovery, with accurate
unavailable labels. It does not offer unsupported email/name editing. Explicit
verification confirmation is separate from opening a link. Confirmation success
requires a successful server response; recovery request acceptance is not inbox
delivery. Owner-only testing is visibly distinct from public availability.

Forms retain entries on recoverable errors, use native labels/autocomplete and
validation, keyboard-operable password visibility, busy/disabled actions, alert
errors and status messages. Tokens are held only in component memory after the
fragment is removed, never rendered as text or saved to browser storage. Reloading
after removal requires reopening the email link, not recovering it from storage.
Desktop/mobile and keyboard verification provenance belongs in IMPLEMENTATION_STATUS.
