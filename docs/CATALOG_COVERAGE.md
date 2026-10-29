# Catalog coverage assessment

## Current observation — 29 October 2026

Supported read-only inspection after the authorized coverage release found
catalog revision 47: **15 published items, zero drafts, zero archived items**,
239 estimated minutes and 13/17 canonical topics. All 15 passed the existing
coverage eligibility/publication checks. The earlier seven published items retain
their original revisions. See `content/COVERAGE_RELEASE_EIGHT.md` for editorial
checks, exact-selection import, authenticated publication and audit evidence.

| Subject  | Questions | Resources | Estimated minutes | Covered topics                                              |
| -------- | --------: | --------: | ----------------: | ----------------------------------------------------------- |
| DSA      |         7 |         0 |               160 | arrays, stacks_queues, sorting, strings, searching, hashing |
| Aptitude |         3 |         0 |                14 | quantitative, logical_reasoning, verbal_ability             |
| CS       |         3 |         2 |                65 | dbms, oop, operating_systems, networking                    |

Eight items added seven previously missing topics: sorting, strings, searching,
hashing, verbal ability, operating systems and networking. Two original CS notes
are genuine resources, with 10/12-minute editorial estimates. The 2/3-minute
grammar/paging questions use the current short-duration contract. All durations
remain estimates, not measured learner times.

Global missing topics are now **linked_lists, trees, graphs, dynamic_programming**.
Company-filtered coverage is smaller than global coverage: Cognizant additionally
lacks eligible hashing/sorting/stacks_queues; LTM additionally lacks strings/searching.
The four company adaptations retain their specific candidate-reported associations;
the four original additions have no company claims. Do not infer official company
coverage or a full daily schedule from topic counts.

Actual hosted student-list/detail endpoints returned all eight new publications
at revision 3, with correct types, estimates, available status and Codex/owner
authorization disclosures. These reads used the existing eligible owner session;
no shared student account/history was created or changed. Student-page owner routing
still redirects to Administration, so that redirect is not described as a student
visual check.

Resource completion was verified through the compiled app in an isolated database
using copies of the two published resources and one public arrays question:
preview → explicit acceptance → resource opening → mark studied → Dashboard/Progress.
Both resources were completed, readingCompleted=2 and task completion=2/3; attempts,
solved questions and revisions stayed zero. The 30-minute daily budget was respected.
The exact disposable database was removed and its owned server stopped. This is
local functional evidence, not a hosted performance measurement.

## Historical observation — 27 October 2026

Read-only inspection of shared `prep_pilot_dev` found seven published questions,
112 estimated minutes and no resources. The older empty-catalog snapshot below
is historical and is superseded by this observation.

| Subject  | Questions | Minutes | Covered topics                  |
| -------- | --------: | ------: | ------------------------------- |
| DSA      |         3 |      60 | arrays, stacks_queues           |
| Aptitude |         2 |      12 | quantitative, logical_reasoning |
| CS       |         2 |      40 | dbms, oop                       |

Both company selections with all subject skill levels 3 and a 30-minute daily
budget can use this small catalog, but cannot fill a seven-day 210-minute window.
The isolated compiled-app preview scheduled seven distinct questions (112 minutes)
without exceeding any daily budget, including the honest 7- and 5-minute estimates.
Easy-only selection excludes both medium aptitude questions and visibly reports
zero eligible aptitude work. Company associations are candidate reports/editorial
inputs, not an official syllabus; missing associations do not establish irrelevance.

Missing topics: strings, hashing, sorting, searching, linked_lists, trees, graphs,
dynamic_programming, verbal_ability, operating_systems and networking. No resource
completion path can be covered using representative published copies yet.

Next proposed batch and historical short-question reassessment:
`content/NEXT_PREPARED_CONTENT_RECOMMENDATION.md`. No new records were imported.

## Historical observation — 24 October 2026

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
