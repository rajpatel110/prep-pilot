# Catalog coverage assessment

Read-only observation: 24 October 2026, 14:46 UTC, explicitly selected authorized
development database `prep_pilot_dev`, catalog revision 0. The report used one
snapshot transaction and performed no catalog, singleton, index or migration writes.

| Subject  | Records | Eligible published | Foundation | Cognizant associated | LTM associated | Missing topics |
| -------- | ------- | ------------------ | ---------- | -------------------- | -------------- | -------------- |
| DSA      | 0       | 0                  | 0          | 0                    | 0              | 10             |
| Aptitude | 0       | 0                  | 0          | 0                    | 0              | 3              |
| CS       | 0       | 0                  | 0          | 0                    | 0              | 4              |

All 17 canonical editorial template topics lack published material, including all
shared foundations and both company selections:

- DSA: arrays, strings, hashing, sorting, searching, linked_lists, stacks_queues,
  trees, graphs, dynamic_programming.
- Aptitude: quantitative, logical_reasoning, verbal_ability.
- CS: dbms, operating_systems, networking, oop.

Both prerequisite edges have a missing arrays source: arrays → sorting and arrays
→ searching. No eligible fresh work or easier-item replacement can currently be
created from this development catalog. The 50/25/25 target cannot be populated;
unused capacity is not preparation coverage. Real users cannot demonstrate
outcome-driven adjustments until reviewed content is explicitly curated/published.
No metadata defects were observed because there were no records to assess; this
does not verify the quality of future content. Synthetic integration material is
restricted to disposable test databases and does not fill these gaps.

Reproduce with Node 24, ignored local configuration and an explicit target:

```powershell
node --env-file=.env.local --import tsx scripts/catalog-coverage.ts --database prep_pilot_dev --environment development
```

The target must equal configured `MONGODB_DB_NAME`; missing configuration or another
target fails closed. The command uses the existing URI, never prints it, does not
run migrations and does not create/update/delete records. At more than 2,000
records it fails rather than claiming a truncated report is complete.

JSON includes subject/topic/type/difficulty counts, direct company associations,
company eligibility including shared foundations, missing template/foundation/
company topics, prerequisite gaps and field names of invalid published records.
It validates stored metadata and publication completeness; bodies, sources,
credentials and auth/student records are never printed. Per-student ceilings,
attempt history, prerequisites and capacity may further limit scheduling.

Planner correctness is independently testable with fixtures. Content sufficiency
requires reviewed real material. Company mappings remain PrepPilot editorial
assumptions, not sourced or official syllabuses; a missing association is not proof
that a topic is irrelevant to a company. Re-run after authorized editorial changes.
