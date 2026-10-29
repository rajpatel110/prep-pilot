# Operational evidence

Current behavior and setup are documented in [product behavior](PrepPilot_PRD_v2.md),
[deployment](DEPLOYMENT.md), [content operations](content/README.md) and
[coverage](CATALOG_COVERAGE.md). This file retains operator evidence, not a roadmap.

## Current evidence boundaries

- Live signup/verification/recovery and mandatory verification are user-reported
  successes. Do not infer unreported hosted expiry, bypass or performance tests.
- Production Ready at a24a0ae was operator-confirmed. Local checkpoint 28a4520
  followed it; no newer deployed commit is independently confirmed here.
- Fifteen published items and catalog revision 47 were observed read-only on
  29 October. Publication receipts preserve editorial/provenance/audit evidence.
- Resource completion passed using representative public-content copies and
  disposable accounts/database, with cleanup confirmed. Hosted performance
  remains unmeasured.
- Files/R2 are disabled; mocked validation is not real-provider acceptance.
- Earlier homepage checks did not independently establish reduced-motion browser
  emulation or zero-flash measurement. System-change/storage-failure behavior has
  automated coverage. About re-click after resizing at the same hash did not
  always reposition in earlier evidence.

## Documentation consolidation — 29 October 2026

README and current product, architecture, API/database, setup/operator and visual
guides describe implemented behavior. Ten redundant tracked reports were
consolidated; source/provenance packs, publication receipts, validation inputs,
tests, migrations and CI remain. No application/configuration/database behavior
changed. No application suite or production build was repeated for these doc edits.

Documentation checks passed: internal relative links, documented npm script names,
server environment names, and 26 table-listed API methods against route exports.
Scoped formatting includes the four contract documents normally ignored by the
default formatter. Whitespace checks passed. No suitable committed application
screenshots were found; no stale screenshots or fabricated UI were added.

Pre-existing local operator/review notes remain in the working tree, outside this
checkpoint. They are historical evidence, not current configuration instructions.
