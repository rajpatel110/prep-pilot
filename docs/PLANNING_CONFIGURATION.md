# Planning rules

The executable policy is [src/config/planning.ts](../src/config/planning.ts) and
the pure [planning engine](../src/modules/planning/engine.ts).
Rules version is `deterministic-budget-3`; template version includes a configuration
fingerprint. Company mappings are PrepPilot editorial foundations, not official
company syllabuses.

## Eligibility and capacity

- New windows contain 7–30 inclusive study days, ending no later than the deadline.
  Replacements preserve the active window; completed work keeps its original date.
- Daily budgets are 30–240 minutes in steps of 15. Content/task estimates are exact
  1–60 whole minutes. Tasks are not rounded, shortened or repeated to fill a day.
- Cognizant/LTM templates contain the canonical topics. Company-labelled material
  must match a chosen company; unlabelled foundations remain eligible.
- Per-subject confidence sets the difficulty ceiling: 1–2 easy, 3 medium, 4–5 hard.
  It does not establish mastery or change the editorial 50/25/25 minute targets.
- Arrays precedes sorting and searching. A prerequisite needs a retained or
  eligible scheduled topic no later than the dependent work.
- Due revisions precede overdue work, then fresh work. Stable IDs break ties.
  Attempted/cycle/current-plan material is excluded from additional fresh tasks.
- Arrays are bounded at 480 scheduled and 480 deferred tasks. No duplicates or
  unbounded generation are used to consume spare budget.
- Earliest fitting dates are selected within the window. Unavailable material,
  prerequisite shortages and insufficient capacity are reported, not bypassed.

The budget is a ceiling, not a filled-time quota. Actual subject shares depend
on discrete estimates, availability and priorities. The current catalog assessment
is [CATALOG_COVERAGE.md](CATALOG_COVERAGE.md).

## Review and acceptance

Preferences save separately from plan generation. `/plans/review` creates a fresh
initial/replacement proposal without activating it. Ten-minute proposals check
study date, profile/base plan, catalog and configuration revisions on acceptance.
Expired or stale proposals require a new review. Saved plans keep their snapshots.

Publication does not retroactively update an accepted schedule. Generate a fresh
proposal to see new eligible material, inspect the differences and accept only if
wanted. Recording an outcome does not complete the associated task.

## Evidence-based adjustments

The last three non-revision attempts in an immutable subject/topic group trigger
support review when at least two report needed help or failed. Revision attempts
do not count toward that trigger. Saved revision dates still apply independently.

An easier substitute must be published, eligible and strictly below every
help/failed source's known catalog difficulty. Unknown source metadata does not
imply ability. At most one easier item per triggered topic is promoted within
fresh priority; completed, revision and overdue work are not replaced.
Unscheduled substitutions restore the original candidate. Replacements are
explicitly shown and require acknowledgement.

No easier content means an honest limitation. An adaptation without useful
evidence-related changes cannot activate another version. Dashboard suggestions
are derived read-only; clicking review creates a proposal, never an accepted plan.
New outcomes invalidate old proposals through stateRevision. Acceptance suppresses
already-covered suggestions until new attempt evidence exceeds its saved watermark.
