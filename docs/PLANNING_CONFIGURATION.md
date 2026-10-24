# Editorial planning configuration v1

This is PrepPilot editorial configuration, not a sourced or official company
syllabus. Both Cognizant and LTM include every existing canonical foundation
topic. Published associations select relevant additional material, but absence
of an association never removes a foundation topic. No hiring coverage is promised.

The canonical topic lists in src/config/catalog.ts define the allowed topic IDs.
The only initial prerequisites are DSA arrays before sorting and searching: these
topics operate on ordered/indexed collections in the initial editorial sequence.
These are introductory sequencing choices, not mastery requirements or claims
about recruitment. Trees are not made a prerequisite for graphs; that relationship
is uncertain and unnecessary for introductory graph representations. Other relationships remain
unspecified. Self-ratings select a difficulty ceiling only; no history is treated
as proof of mastery. A prerequisite must already have a retained task or an eligible
candidate scheduled no later than the dependent task. Missing prerequisite content
blocks dependent fresh work and is reported rather than silently bypassed.

Both company mappings contain DSA: arrays, strings, hashing, sorting, searching,
linked_lists, stacks_queues, trees, graphs, dynamic_programming; aptitude:
quantitative, logical_reasoning, verbal_ability; CS: dbms, operating_systems,
networking, oop. All are shared editorial foundation coverage. Published company
labels retain their own provenance and filter material selection; they do not
determine whether an unlabelled foundation topic is relevant to a company.

Allocation stays 50/25/25 by minutes, with due revisions first, then overdue work,
then fresh work. Stable content/task IDs break ties. Tasks are never shortened.
Completed work is preserved during replacements, including its original date.
Pending work is never scheduled before today. Unavailable work and insufficient
capacity are explicitly deferred, never fabricated.

Update templates/edges in src/config/planning.ts through reviewed code changes,
using canonical subject/topic IDs. Bump templateVersion for any mapping/edge change
and rulesVersion for scheduling changes. The template version also includes a
deterministic SHA-256 configuration fingerprint, so changed mappings/edges cannot
accidentally reuse an incompatible pending preview if an editorial label bump is
missed. Integrity tests reject unknown IDs,
self-references and cycles. Persist both versions on previews/plans; confirmation
rejects incompatible versions and changed study date, profile or catalog state.

The previous practice milestone's clean production build passed in the user's
normal VS Code terminal with Node 24.22.1/npm 10.9.3. This is user-run evidence,
not an agent-run build or production regression result.

## Evidence-based adjustments

Rules version `deterministic-budget-2` enables the documented last-three rule:
group non-revision attempts by their immutable subject/topic, order by descending
attemptSequence, require three and at least two needed_help/failed outcomes.
Revision attempts never count toward this trigger. Individual saved revision due
dates continue to apply with fewer than three attempts; no repeat is invented early.

Conservative interpretation of "easier": choose a published question strictly
below the catalog difficulty of every help/failed source in the triggering group,
within the existing preference ceiling and selected company/foundation eligibility.
Unknown source metadata prevents an easier comparison rather than implying ability.
Choose the lowest catalog difficulty, then stable content ID. These are editorial
difficulty labels, not automatic assessment or a new numeric scoring threshold.

Promote at most one easier candidate per triggered topic within fresh priority.
It may replace one harder pending fresh task in that topic (oldest date, then stable
task ID); never replace completed work, revisions or overdue work. The replaced
task is explicitly deferred as REPLACED_FOR_SUPPORT and needs acknowledgement.
If the chosen substitute cannot actually be scheduled, restore the original
candidate before returning the proposal. Prerequisites, unchanged duration, daily
capacity, due-revision/overdue priority and the existing allocation rules remain.
Among remaining fresh work, the 50/25/25 deficit allocation still applies.

No easier item means an explicit limitation and the existing saved revision rule,
not an invented early recall or mastery assumption. An adaptation is useful only
when evidence-related easier work or a revision is added/moved; unrelated schedule
changes alone do not qualify. No-useful previews are readable but cannot activate
another plan version (422 VALIDATION_ERROR). Reschedule remains a separate action.

Dashboard reads derive compact evidence, never run the planning engine or persist
a preview. Stable evidence keys prevent duplicate recommendation entries. Topic
suggestions already covered by plan acceptance are suppressed until a new source
attempt sequence exceeds the plan's saved acceptance watermark. Unsatisfied due revision cycles can
still suggest a review. A click POSTs a ten-minute persisted preview; keep-current
is navigation without writes. Reload, staleness and acceptance reuse the existing
transaction, state/catalog/config/date guards and durable confirmation receipts.
New practice invalidates pending previews through stateRevision, including changes
that do not meet the topic trigger. No recommendation is silently accepted.

Evidence uses allowlisted LAST_THREE_SUPPORT / REVISION_DUE codes with at most
three immutable attempt IDs per entry (100 total). PreviewDTO adds an `adjustment`
projection for adapt previews (null otherwise): useful, summaries, limitations,
contentAvailable and named task changes with old/new dates. Daily totals and diff
remain derived from the persisted proposal/base, not a second editable schedule.
The student copy contains no internal revision/configuration identifiers.

The actual authorized development catalog assessment is in CATALOG_COVERAGE.md.
