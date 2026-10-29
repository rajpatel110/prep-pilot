# First six: shared-catalog read-only checkpoint

Agent checked 26 October 2026. No shared database writes, publication or review
dates set. Application source, roles, environment files and deployment unchanged.

## Exact selection

`company-first-six.v1.json` contains only these six unchanged candidates copied
from the 39-item pack. All are `question`, pending human content review, with
`reviewedAt: null`, no attachments, and no prefilled company-review dates.

| Title / slug                                                                   | Subject / canonical topic    | Difficulty / proposed minutes | Provenance                            |
| ------------------------------------------------------------------------------ | ---------------------------- | ----------------------------- | ------------------------------------- |
| Find the missing range member / `reported-missing-range-member`                | dsa / arrays                 | easy / 20                     | Cognizant, COG-090                    |
| A FIFO queue from two stacks / `reported-queue-via-two-stacks`                 | dsa / stacks_queues          | medium / 25                   | LTM, LTM-085 and LTM-134              |
| Sales totals without losing unsold products / `reported-sql-sales-join-lab`    | cs / dbms                    | medium / 20                   | LTM LTM-074/077 and Cognizant COG-075 |
| Explain OOP through a payment test double / `reported-oop-four-pillars-design` | cs / oop                     | easy / 20                     | LTM LTM-081 and Cognizant COG-016     |
| Two replacements in a mixture / `apt-original-mixture-replacement`             | aptitude / quantitative      | medium / 20                   | Original PrepPilot; no company claim  |
| Count routes through a directed graph / `apt-original-paths-in-small-dag`      | aptitude / logical_reasoning | medium / 20                   | Original PrepPilot; no company claim  |

Company provenance is candidate-reported, contributor-confirmed, not official
company material. Prompts/constraints/examples/solutions are editorial additions.
The two combined CS exercises retain distinct contributing references, rather
than claiming every source question was identical.

No known unresolved answer defect was identified in this selection. However,
**none of the pack has human-approved or measured duration**; these six cannot
honestly be presented as free of timing concerns. They were selected as complete
implementation/design/multipart exercises rather than short recall prompts.
All six need human solution review and timing calibration; hold any exercise
that proves shorter than the schema minimum instead of padding its estimate.
Specific review points: XOR input uniqueness/range; queue amortized versus
worst-case time; SQL NULL/count semantics and PostgreSQL execution (prior example
checks used SQLite, not a PostgreSQL server); OOP subtyping versus implementation
inheritance; changing mixture volume; directed edges/path enumeration.

## Shared duplicate check and dry-run

Explicit target `prep_pilot_dev`, development, shared local/hosted database.
Existing selected account was read-verified as active, email-verified owner:
`6add2b2321b86687febca6ac`, `341raj.patel@gmail.com`. No role/session mutation.

Catalog inspection found one record: published `dsa-arrays-running-totals`,
title "Running Totals of an Array". None of the six slugs, titles or prompts
matched it. Manual semantic comparison found no likely duplicate: running totals
computes prefix sums, while the new array exercise finds a missing range member;
sharing the arrays topic alone does not make them duplicates. The other five
cover distinct queue, SQL, OOP, mixture and directed-path tasks. This is a dated
observation, not a guarantee against changes before apply.

The existing importer was executed against this exact six-item file with no
`--apply` and no fabricated provenance timestamp. Actual report:

| Slug                             | Outcome                    |
| -------------------------------- | -------------------------- |
| reported-missing-range-member    | provenance_review_required |
| reported-queue-via-two-stacks    | provenance_review_required |
| reported-sql-sales-join-lab      | provenance_review_required |
| reported-oop-four-pillars-design | provenance_review_required |
| apt-original-mixture-replacement | new                        |
| apt-original-paths-in-small-dag  | new                        |

The gate label hides the importer's exact-duplicate classification for those four;
the separate read-only catalog inspection establishes their lack of matches.
Apply without a genuine company-provenance-review timestamp rejects the entire
selection before writes. Content review is separate and must remain null until
an actual later editorial review. No human review time is inferred from the
contributor's confirmation.

The normal tsx launcher failed before execution with `uv_os_get_passwd ENOMEM`.
Agent dry-run used the previously verified existing esbuild in-memory runner
for the unchanged importer; no dependency/security/runtime setting was changed.
No full suites or build were rerun. Focused checks validate the six-item schema,
2/2/2 distribution and equality with the source pack; formatting is checked.

## Selection enforcement and later operator commands

The importer processes only the supplied `--file`; it does not discover the
39-item master pack. It does not itself pin the file's count/hash, so the commands
below additionally check the exact reviewed file bytes before either operation.
The immutable checkpoint SHA-256 is:

`1f50b6161778a19bc829181cdeb2bd14942e2f0b1e78fe00c97224360bbb3768`

If the file changes, stop and repeat the selection review/dry-run; do not simply
replace the expected hash to silence a failure.

Only after personally reviewing the company provenance (not approving the new
solutions), enter its actual UTC ISO instant below. This is required by the
existing association schema. Do not use an arbitrary current date to bypass it.
No content-publication review date is supplied by these commands.

```bash
cd /c/PROJECTS/prep-pilot
export PATH="$PWD/.tools/node_modules/node/bin:$PATH"
unset NODE_OPTIONS MONGODB_URI MONGODB_DB_NAME
BATCH='docs/content/company-first-six.v1.json'
EXPECTED='1f50b6161778a19bc829181cdeb2bd14942e2f0b1e78fe00c97224360bbb3768'
read -r -p 'Actual company-provenance review instant (UTC ISO, e.g. YYYY-MM-DDTHH:MM:SS.000Z): ' PROVENANCE_REVIEWED_AT
printf '%s  %s\n' "$EXPECTED" "$BATCH" | sha256sum --check --status &&
HOSTED_DATABASE_CONFIRMATION=prep_pilot_dev NODE_ENV=development npm.cmd run content:import -- --file "$BATCH" --database prep_pilot_dev --environment development --admin-user-id 6add2b2321b86687febca6ac --admin-email 341raj.patel@gmail.com --association-reviewed-at "$PROVENANCE_REVIEWED_AT"
```

Inspect the new dry-run: expect six `new` results if the catalog is unchanged.
Stop for any conflict/possible duplicate/gate/error. Then, only when you choose
to perform the shared-database write, in the same Git Bash terminal:

```bash
printf '%s  %s\n' "$EXPECTED" "$BATCH" | sha256sum --check --status &&
HOSTED_DATABASE_CONFIRMATION=prep_pilot_dev NODE_ENV=development npm.cmd run content:import -- --file "$BATCH" --database prep_pilot_dev --environment development --admin-user-id 6add2b2321b86687febca6ac --admin-email 341raj.patel@gmail.com --association-reviewed-at "$PROVENANCE_REVIEWED_AT" --apply
```

**Agent did not run apply.** If you run it, drafts appear in both local and hosted
admin interfaces because they share this database. Students cannot read drafts.
The importer never overwrites; a later failure may leave earlier successful
drafts, so report its per-item outcomes and preserve the same provenance time
when reconciling/retrying. Do not publish as part of this step.

## First-draft review after the operator reports import results

Open `https://prep-pilot-theta-tan.vercel.app/admin/content`, filter Draft, and
search `reported-missing-range-member`. Open Edit/Preview and review in order:

1. **Question:** N distinct values from 0 through N, exactly one missing;
   N=0–10000; no sorting or mutation. Decide whether the chosen constraints match
   the intended teaching exercise, not an invented exact interview specification.
2. **Examples:** independently check `[3,0,1] → 2`, `[] → 0`, `[0] → 1`,
   `[1] → 0`; understand why duplicates are outside this contract.
3. **Explanation:** trace pairwise XOR cancellation; check O(n) time, O(1) extra
   space and bounded 32-bit safety. Try your own implementation before approval.
4. **Attribution:** Cognizant COG-090 is student-reported, not official;
   AI-assisted editorial constraints/solution remain honestly identified.
5. **Duration:** attempt the exercise from scratch; compare the 20-minute proposal
   with realistic novice effort. If under 15 minutes, hold it rather than inflate.

Leave the content-review date null until you actually finish editorial review.
Do not publish automatically. After the operator shares non-secret import
outcomes, continue this walkthrough interactively, one draft at a time.
