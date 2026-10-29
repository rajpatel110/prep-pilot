# Content duration policy

Content, scheduled tasks and deferred work accept **1–60 positive whole minutes**.
Zero, negative, fractional, nonnumeric and over-60 values are invalid.
Daily-budget preferences remain **30–240 minutes in 15-minute increments**.
A daily budget does not impose a minimum task duration.

Estimates express expected work, not measured timing. Review scope honestly and
never pad text or duration to pass validation. Short questions are valid.
The planner sums exact minutes, does not exceed daily budgets and does not
duplicate material to consume unused capacity. Saved plans retain snapshots.

Published mixture and DAG questions use 7-minute and 5-minute editorial estimates,
respectively. Their correction/publication evidence is preserved in
[APTITUDE_PUBLICATION.md](APTITUDE_PUBLICATION.md). These are not measured timings.

The former 15-minute floor was a product assumption, not a scheduler dependency.
Current behavior is implemented consistently in schemas, admin controls, imports
and scheduling. See [planning rules](../PLANNING_CONFIGURATION.md).

When operating on existing data, deploy compatible validation before saving values
an older runtime rejects. Code rollback does not rewrite stored estimates or undo
publication. Do not roll back to incompatible duration validation.
