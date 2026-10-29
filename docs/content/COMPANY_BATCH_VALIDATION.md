# Company batch validation evidence

Agent-run, 26 October 2026. Preparation only: no shared-catalog writes, real
roles/account changes, external provider requests, import or publication.

## Concrete disposable dry-run / persistence report

Target: randomly generated test database `prep_pilot_import_test_8ec8d59ea297`.
This was migrated using existing migrations 001–006, populated only with a
synthetic verified administrator, and removed in `finally`. It was not the local
and hosted shared `prep_pilot_dev` database.

| Check                                        | Actual result                                                                                 |
| -------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Default dry-run, no provenance date          | 20 new original candidates; 19 company candidates gated; zero mutations                       |
| Apply without genuine review argument        | Rejected before writes                                                                        |
| Apply with synthetic fixture provenance date | 39 draft records; revision 1, null content-review date; 39 audits; catalog/profile each +39   |
| Idempotent rerun                             | 39 identical; zero writes/revision changes                                                    |
| Changed same-slug payload                    | Conflict, original preserved                                                                  |
| Injected audit failure                       | Content/catalog/profile/audit all rolled back                                                 |
| Concurrent identical import                  | One created draft, one identical; only one audit/catalog increment                            |
| Operator checks                              | Student, deleting, unverified and wrong-email actors rejected; verified admin/owner permitted |
| CLI without apply                            | Read-only and reports identical fixture records                                               |
| Target safety                                | Missing explicit target and test-on-shared rejected                                           |
| Cleanup                                      | Disposable database removed; no test server started                                           |

The fixture review date is synthetic and exists only in disposable data. It is
not human review of this pack. Human provenance review and content review remain
pending; there is no approved real import command with an invented date/actor.

## Content checks

Four focused test groups pass: strict pack/source/publication gates; coding
examples/edges (including exhaustive small weak-peak cases); quantitative and
logical calculations/enumerations; SQL example semantics. 246 source references
are accounted for, with 38 repeat references retained under canonical identities.
All 39 draft records validate against current canonical schema. All remain blocked
from publication by null content-review dates. No slug matches the existing
50-item starter pack; live shared duplicate/semantic review is still pending.

SQL examples run on Node's built-in SQLite, not a PostgreSQL server. Primary
PostgreSQL documentation was also opened; no PostgreSQL engine acceptance claim
is made. Conceptual OOP/deadlock and verbal rubrics still require human review;
automated arithmetic/algorithm checks are not editorial approval or timing data.

The normal tsx invocation was blocked before tests by `uv_os_get_passwd ENOMEM`
in tsx's initialization. For agent verification, tests used already installed
TypeScript/esbuild in-memory transpilation, preserving actual migration source
paths/checksums; no dependency/runtime/security configuration was modified.
The CLI's dry-run behavior was exercised through compiled script code. Standard
Git Bash commands remain documented; no claim that npm's tsx test launcher passed
inside Codex. An initial integration attempt failed without sufficient diagnostic
stage output; the subsequent instrumented integration completed successfully.

Five final difficulty labels were refined from easy to medium after the
persistence fixture run (peak search, queue, salary ranking, sales joins, index
workload). This does not change persistence behavior. Final content checks cover
the updated labels. See IMPLEMENTATION_STATUS.md for final tooling/build outcomes.
