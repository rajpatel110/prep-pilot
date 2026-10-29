# Content operations and provenance

PrepPilot publishes reviewed questions and learning resources. Authoring packs are
not database seeds or proof of live publication. The last catalog read found
15 published items; see [coverage](../CATALOG_COVERAGE.md) and
[the eight-item publication receipt](COVERAGE_RELEASE_EIGHT.md).

## Editorial contract

Every item has a stable slug, subject/topic, question/resource type, difficulty,
source, attribution and a positive whole-minute estimate from 1–60. Estimates
are editorial budgets, not measured completion times; never pad a small question
to fit a minimum. Daily study budgets are separate.

Independently check the full prompt/body, solution, worked examples, boundary
cases, external links, ambiguity and classification. Resource labels require
actual learning material, not a relabelled question. Publication requires a real,
nonfuture content-review date and usable material. Review fields record actual
editorial checking, not automatic approval.

Preserve candidate-reported company provenance without implying an official
syllabus, year, hiring frequency or endorsement. Original practice has no company
claim. Company-source review timestamps and content-review timestamps represent
different checks. Describe Codex checking and owner publication authorization
honestly; do not claim personal human review or measured timing without evidence.

## Files and records

- [Company source/import guide](COMPANY_BATCH.md): ledger, exact-selection safety
  and supported CLI.
- [Company review pack](COMPANY_BATCH_REVIEW.md): exact prepared content, concerns.
- `company-source-ledger.v1.json`, `company-ltm-sources.md` and
  `company-cognizant-sources.md`: original reference identities and deduplication.
- `company-batch.v1.json`, `company-first-six.v1.json`,
  `company-next-eight.v1.json`: frozen proposal selections, not current live state.
- `coverage-release-eight.v1.json`: exact released selection. Do not reimport it.
- `starter-catalog.v1.json`, `first-publication-batch.v1.json`, the subject
  review sheets and solution/validation ledgers: source material and validator
  inputs. Null review fields intentionally preserve proposal history.
- [First-five editorial receipt](FIRST_FIVE_PUBLICATION_REVIEW.md),
  [aptitude receipt](APTITUDE_PUBLICATION.md) and
  [coverage release receipt](COVERAGE_RELEASE_EIGHT.md): preserve publication,
  correction and authorization evidence rather than rewriting frozen packs.

Historical review sheets retain their original estimates/holds. Current validation
accepts 1–60 whole minutes; a historic hold does not authorize changing live data.
The unreviewed next-release sheet remains separate preparation, not an import list.

## Review and publication

Use `/admin/content` to create/edit a draft. Compare prompt/body → examples →
explanation → attribution → estimated duration. Save against its current revision,
inspect the saved preview, then explicitly publish. Re-read after a conflict.
Archive rather than delete material referenced by history.

A draft import is not publication and does not overwrite reviewed records.
Local/hosted share real data, so intentional draft imports appear in both admin
interfaces. Fixtures and cleanup must use disposable databases.

## Validation tools

- `npm run test:company-content`: pure source/schema/answer checks.
- `npm run test:content-import`: isolated persistence, duplicate, authorization,
  concurrency and audit rollback coverage.
- `node --import tsx docs/content/validate-starter.ts`: starter schemas/solutions.
- `node --import tsx docs/content/validate-coverage-release.ts`: selected release
  schema and executable answer checks.

These do not constitute personal editorial approval or measured timing.
`verify-coverage-publication.ts` is a read-only historical receipt assertion for
its exact released revisions, not a generic current-state or import tool.
Do not weaken it when subsequent authorized revisions change the catalog.
