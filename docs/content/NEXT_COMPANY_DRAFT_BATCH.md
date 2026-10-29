# Next eight drafts: not imported

29 October update: four DSA entries below (bubble sort, longest unique window,
weak peak and duplicate values) were imported as part of the separate coverage
release and published at revision 3. The salary-ranking, index-workload, staged
work-rate and integer-batch proposals remain unimported. Do not run the old
eight-item apply command as a new batch. The importer will preserve conflicts;
prepare a new exact selection after checking the current catalog.
See `COVERAGE_RELEASE_EIGHT.md`. The dated proposal below is historical.

26 October 2026. `company-next-eight.v1.json` is an unchanged exact subset of the
39-candidate master pack. All are questions, pending human approval, with null
content review dates and no attachments.

| Title / slug                                                                          | Subject / topic         | Difficulty / minutes | Reported provenance            |
| ------------------------------------------------------------------------------------- | ----------------------- | -------------------- | ------------------------------ |
| Bubble sort with stable duplicates / reported-bubble-sort-implementation              | dsa / sorting           | easy / 25            | LTM-035                        |
| Longest substring without repeated ASCII characters / reported-longest-unique-window  | dsa / strings           | medium / 30          | COG-093                        |
| Find a weak peak by binary search / reported-weak-peak-search                         | dsa / searching         | medium / 25          | COG-089                        |
| Repeated integer values in first-occurrence order / reported-duplicate-integer-values | dsa / hashing           | easy / 20            | LTM-028                        |
| Salary ranking, ties and NULL / reported-salary-ranking-lab                           | cs / dbms               | medium / 20          | LTM-078/079, COG-077           |
| Choose an index from a workload / reported-dbms-index-workload                        | cs / dbms               | medium / 20          | LTM-062/073                    |
| Work rates with a staged team / apt-original-work-rates-staged                        | aptitude / quantitative | medium / 20          | Original PrepPilot; no company |
| Capacity planning with integer batches / apt-original-capacity-feasible-batches       | aptitude / quantitative | medium / 20          | Original PrepPilot; no company |

LTM means reported LTM interview intent; COG means Cognizant. Neither is official
company endorsement. Editorial adaptations and explanations require human review.
Eight adds four DSA topics and two DBMS tasks without padding short recall items.
No first-six item or timing hold is selected. Bubble sort includes implementation,
stability and complexity, unlike the old held trace-only question.

No known unresolved answer error was found. Estimates remain unmeasured: hold any
item that proves too short. SQL PostgreSQL engine execution is unverified; index
performance is a hypothesis to measure, not a guarantee. Check earliest longest
window ties, weak peaks with duplicates, first-occurrence duplicate ordering and
distinct salary ranks/NULL. Work-rate total is 13.5 hours; capacity optimum is
A=2, B=5, revenue 330. Exact questions and explanations are in the selection JSON
and COMPANY_BATCH_REVIEW.md.

## Existing interrupted-task evidence

Agent read-only inspection of explicitly selected prep_pilot_dev found seven
records: two published (running totals and missing range member) and five drafts.
No selected slug/title/prompt matches or likely semantic duplicates were found.
The existing sales join lab is a different learning task from ranking/indexes.
This is a point-in-time check; importer rechecks without overwriting records.

Actual supported importer dry-run on the eight-item file: six company candidates
**provenance_review_required**, two originals **new**, exit 2. No timestamp was
invented. This gate is not an all-clear apply result. No writes occurred. The
unchanged importer used the previously verified esbuild in-memory launcher;
completed suites and the paused EPERM investigation were not repeated.

## Exact Git Bash commands

First genuinely review the source provenance, then supply its actual UTC ISO
instant (YYYY-MM-DDTHH:mm:ssZ). This does not approve explanations or set content
publication review dates. Run a fresh operator dry-run:

```bash
cd /c/PROJECTS/prep-pilot
export PATH="$PWD/.tools/node_modules/node/bin:$PATH"
unset NODE_OPTIONS MONGODB_URI MONGODB_DB_NAME
BATCH='docs/content/company-next-eight.v1.json'
EXPECTED='299ad4925f8ff3362f05b9e2ed145e213b282435c392240096291adf9457f033'
read -r -p 'Actual provenance-review timestamp (UTC ISO): ' PROVENANCE_REVIEWED_AT
printf '%s  %s\n' "$EXPECTED" "$BATCH" | sha256sum --check --status &&
HOSTED_DATABASE_CONFIRMATION=prep_pilot_dev NODE_ENV=development npm.cmd run content:import -- --file "$BATCH" --database prep_pilot_dev --environment development --admin-user-id 6add2b2321b86687febca6ac --admin-email 341raj.patel@gmail.com --association-reviewed-at "$PROVENANCE_REVIEWED_AT"
```

Only after eight new results and your decision to import, run in the same terminal:

```bash
printf '%s  %s\n' "$EXPECTED" "$BATCH" | sha256sum --check --status &&
HOSTED_DATABASE_CONFIRMATION=prep_pilot_dev NODE_ENV=development npm.cmd run content:import -- --file "$BATCH" --database prep_pilot_dev --environment development --admin-user-id 6add2b2321b86687febca6ac --admin-email 341raj.patel@gmail.com --association-reviewed-at "$PROVENANCE_REVIEWED_AT" --apply
```

Apply uses the same hash-pinned eight-record file, not all 39; it rechecks current
authorization and duplicates. Missing provenance time blocks apply. Stop and
inspect changed/conflicting results. Agent has not run apply. Drafts would become
visible in both admin interfaces sharing this database.
