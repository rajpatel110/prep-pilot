# First-batch editorial approval sheet

Agent review: 25 October 2026. **29 reviewed proposals, zero human approvals.** All `reviewedAt: null`, `companies: []` and `assetIds: []` remain unchanged. This sheet is not permission to create/publish records. The JSON companion remains the exact DraftInput source; review notes and timing ranges are not API fields.

## Decision summary

- **14 candidates for your review**, with provisional schema-valid time budgets; none is marked approved.
- **15 HOLD — timing**: all nine selected aptitude questions, five selected short CS questions, and the sorting trace. Their answers are useful but they are micro-drills, not honest standalone tasks at the current 15-minute minimum. Do not publish them with their nominal JSON time. Decide later whether to develop substantive learning activities or keep them outside scheduled content; no count-filling duplicates or artificial waiting are proposed.
- Lowered eight coding estimates from the blanket 30-minute proposal to 15–25 minutes. These are editorial estimates, not stopwatch results. Ranges below reflect independent solving plus the requested implementation/tests/explanation, not merely reading an answer.
- Corrected/clarified tree edges, frequency-map word-length/cost assumptions, BFS traversal-versus-sort cost, pronoun tense preservation, and per-thread-stack isolation wording. Removed artificial five-minute-per-step instructions from four resources without adding filler.
- The whole 29 remains a **review list**, not an approved release batch. Its nominal 510 minutes include held items and must not be used to claim useful approved capacity. The 14 candidates total 270 proposed minutes and cover 13 topics; **all three aptitude topics and sorting remain uncovered in that subset**. Do not change planner prerequisites or relax the schema to conceal this.
- Current worked answers were rechecked; conceptual/grammar judgments and time calibration still require you. Company materials remain absent; generic foundations stay unassociated.

## Source conventions and link checks

**Original question provenance:** original PrepPilot practice material, AI-assisted wording/examples/solution about standard concepts; not human-reviewed, not company-specific, not a claim to have invented the underlying algorithm/concept. The same disclosure applies to original notes. Each item below identifies its own source. Keep the attribution from the JSON when entering a draft; do not replace it with an invented outside author.

Three links occur in this batch and were reopened in this review:

- [LeetCode Binary Search](https://leetcode.com/problems/binary-search/description/): relevant logarithmic search over ascending distinct integers. Visible statement requires nonempty input; the PrepPilot variant adds empty input. Page content was accessible; judge submission/account behavior was not tested.
- [PostgreSQL Transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html): relevant transaction/commit/rollback reading. Our inventory example is original, not copied from the source's example. No database exercise was run.
- [MDN HTTP overview](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview): relevant message/state overview. Original sketch/check questions remain PrepPilot-authored. Reading-page access does not verify a provider integration.

No link is evidence of Cognizant/LTM provenance. Link availability is a point-in-time check, not a permanent guarantee. The other 26 items have no external URL; they are self-contained, not claimed as external judge exercises.

## Items

### 1. Build running totals without changing the input

**Slug:** `dsa-arrays-running-totals` · **question** · `dsa:arrays` · **easy**\
**Time:** 15 min in JSON (provisional); expected effort roughly 10–20 min, not measured.\
**Disposition:** Candidate for your review; not approved. Candidate at 15 minutes for an independent implementation, invariant and stated edge tests. Time it once; if it is consistently shorter than 15, hold rather than padding.

**Question:** Given an integer array of length 0–1000, return a new array whose element at index i is the sum from index 0 through i. Do not change the input. Values are between -1000 and 1000; use zero-based indexes. Example: [4,-2,5,0] gives [4,2,7,7]. Empty input gives []. Write pseudocode or code, explain the loop invariant, and test a single negative value and all zeros.

**Explanation:** Keep total = 0 and a separate result. For each value, add it to total and append total. After processing index i, total equals exactly the sum of the first i+1 values, so the appended value meets the definition. The example accumulates 4,2,7,7. [-3] gives [-3]; [0,0] gives [0,0]. Empty input never enters the loop. Time O(n); result space O(n), auxiliary space excluding output O(1). This is an indexed scan, not a sorting operation.

**Source/provenance:** Original PrepPilot practice material, prepared for editorial review; not company-specific. No external source is claimed.

### 2. Check a normalized ASCII palindrome

**Slug:** `dsa-strings-ascii-palindrome` · **question** · `dsa:strings` · **easy**\
**Time:** 20 min in JSON (provisional); expected effort roughly 15–25 min, not measured.\
**Disposition:** Candidate for your review; not approved. Candidate at 20 minutes including implementation and empty/punctuation/case tests. ASCII scope must remain explicit; no Unicode-general claim.

**Question:** Input is a string of 0–1000 ASCII characters. Ignore characters other than A–Z, a–z and 0–9, and compare letters case-insensitively. Return whether the remaining sequence is a palindrome. 'Step on no pets!' gives true; 'Prep 42' gives false; punctuation-only and empty inputs give true. Supply an algorithm and explain why the empty normalized sequence qualifies.

**Explanation:** One approach builds a lowercase sequence containing only ASCII letters/digits, then compares mirrored positions. 'Step on no pets!' becomes 'steponnopets', which reads identically in reverse. 'Prep 42' becomes 'prep42', whose first/last characters differ. There are no mismatched pairs in an empty or one-character sequence, so both are true. Time O(n) and normalization space O(n). Alternatively skip excluded characters with two pointers for O(1) extra space. The ASCII restriction avoids silently treating UTF-16 code units as all Unicode characters.

**Source/provenance:** Original PrepPilot practice material, prepared for editorial review; not company-specific. No external source is claimed.

### 3. Count exact tokens with a frequency map

**Slug:** `dsa-hashing-word-frequencies` · **question** · `dsa:hashing` · **easy**\
**Time:** 15 min in JSON (provisional); expected effort roughly 10–20 min, not measured.\
**Disposition:** Candidate for your review; not approved. Candidate at 15 minutes with implementation and edge tests. Added 1–40 ASCII-letter token bound and qualified hash/string costs; owner should calibrate with a novice.

**Question:** Given 0–1000 already-tokenized lowercase words, return a map from word to frequency. Each word contains 1–40 lowercase ASCII letters. Tokens are compared exactly; do not tokenize or normalize text. ['red','blue','red','green','blue','red'] gives {red:3,blue:2,green:1}. Output key order is irrelevant. Explain how absent keys are handled, and test [] and ['x','x'].

**Explanation:** Start with an empty map. For each token set its count to the previous count, or zero if absent, plus one. The example has three red, two blue and one green. [] gives {}; ['x','x'] gives {x:2}. Use a real map rather than relying on inherited object-property names. With the bounded word length and average constant-time hash-map operations, expected time is O(n) and space O(k) for k distinct words. If word lengths were unbounded, hashing/comparison and key storage would also depend on total characters; do not silently treat arbitrarily long strings as constant-cost keys. Worst-case hash behavior depends on the implementation.

**Source/provenance:** Original PrepPilot practice material, prepared for editorial review; not company-specific. No external source is claimed.

### 4. Trace insertion sort and equal-key stability

**Slug:** `dsa-sorting-insertion-trace` · **question** · `dsa:sorting` · **easy**\
**Time:** 30 min in JSON **— rejected as a publication estimate**; expected effort roughly 5–10 min, not measured.\
**Disposition:** HOLD — timing. A four-element trace plus a short stability discussion does not reliably justify 30 minutes. HOLD: replace with a genuinely substantive sorting exercise in a later content revision, or retain as an unscheduled micro-drill; do not pad it to 15.

**Question:** Sort [7,3,5,3] ascending using insertion sort. After each outer pass, show the whole array. Shift an earlier element only when it is strictly greater than the key. Separately label the two 3s as 3a and 3b in their original order: which appears first after sorting, and why? Explain sorted, reverse-sorted and empty inputs.

**Explanation:** The three passes give [3,7,5,3], [3,5,7,3], [3,3,5,7]. The second 3 is inserted after the earlier 3 because equality does not cause a shift, so 3a remains before 3b. This implementation is stable. The prefix before each new key is already sorted. With the usual early stopping inner loop, sorted input needs O(n) comparisons; reverse order needs O(n²) work. Extra space O(1); empty input has no passes. Stability follows from the comparison rule, not from every algorithm named sorting.

**Source/provenance:** Original PrepPilot practice material, prepared for editorial review; not company-specific. No external source is claimed.

### 5. Find an exact value in a sorted unique array

**Slug:** `dsa-searching-binary-exact-index` · **question** · `dsa:searching` · **easy**\
**Time:** 20 min in JSON (provisional); expected effort roughly 15–25 min, not measured.\
**Disposition:** Candidate for your review; not approved. Candidate at 20 minutes including implementation and boundary tests. Requires arrays as configured. External problem excludes empty input; do not submit our extended empty case as its stated contract.

**Question:** Given an ascending array of distinct integers, length 0–1000, return the zero-based index of target or -1. Use binary search, not a linear scan. For [-8,-1,3,9,14], target 9 gives 3 and target 2 gives -1. Empty input gives -1. State a consistent interval convention. The optional linked challenge has its own constraints; our empty-input case is an extension.

**Explanation:** Use inclusive bounds low=0, high=n-1. While low is at most high, inspect mid=low+floor((high-low)/2). Return mid on equality. If the middle value is less than target, set low=mid+1; otherwise high=mid-1. Every discarded index cannot hold the target because of sorted order. On exhaustion return -1. For target 9, middle value 3 discards the left portion and index 3 is found next. Empty input starts with high=-1. Time O(log n) for nonempty inputs, extra space O(1).

**Source/provenance:** Original PrepPilot practice material, prepared for editorial review; not company-specific. Related external practice: LeetCode, https://leetcode.com/problems/binary-search/description/. [Open the inspected page](https://leetcode.com/problems/binary-search/description/).

### 6. Reverse a singly linked chain without losing its tail

**Slug:** `dsa-linked-lists-reverse-chain` · **question** · `dsa:linked_lists` · **easy**\
**Time:** 25 min in JSON (provisional); expected effort roughly 20–30 min, not measured.\
**Disposition:** Candidate for your review; not approved. Candidate at 25 minutes for actual pointer implementation and empty/single-node tests. Requires basic reference concepts as learner context, not a newly asserted planner prerequisite.

**Question:** A singly linked list has nodes with value and next, ends at null, and contains no cycle. Reverse its links in place and return the new head. A→B→C→null becomes C→B→A→null. Describe the three references you maintain. Test an empty list and one node. Do not allocate replacement nodes.

**Explanation:** Maintain previous=null and current=head. Before changing current.next, save its old next as nextNode. Point current.next to previous, then advance previous=current and current=nextNode. At termination previous is the new head. Saving nextNode prevents losing the unprocessed suffix. A single node ends pointing to null and remains the head; null input returns null. Time O(n), extra space O(1). The returned head matters because the original head is now the tail.

**Source/provenance:** Original PrepPilot practice material, prepared for editorial review; not company-specific. No external source is claimed.

### 7. Validate bracket nesting with a stack

**Slug:** `dsa-stacks-balanced-brackets` · **question** · `dsa:stacks_queues` · **easy**\
**Time:** 25 min in JSON (provisional); expected effort roughly 20–30 min, not measured.\
**Disposition:** Candidate for your review; not approved. Candidate at 25 minutes including stack implementation and malformed-order tests. Ensure the learner understands push/pop before attempting it.

**Question:** Input contains only (), [] and {} and has length 0–1000. Return whether brackets are balanced and properly nested. '([]{})' gives true; '([)]' gives false; ']' gives false; '' gives true. Write a stack algorithm and identify why counts alone do not establish nesting.

**Explanation:** Push each opening bracket. On a closing bracket, reject if the stack is empty or its top is not the matching opener; otherwise pop. At the end require an empty stack. In '([)]', ')' encounters '[' on top and rejects despite matching overall counts. A lone closer fails immediately; a leftover opener such as '(' fails at the end. Empty input is valid. Time O(n), worst-case stack space O(n). This is LIFO matching, not FIFO processing.

**Source/provenance:** Original PrepPilot practice material, prepared for editorial review; not company-specific. No external source is claimed.

### 8. Calculate binary-tree height with an explicit convention

**Slug:** `dsa-trees-height-in-edges` · **question** · `dsa:trees` · **easy**\
**Time:** 20 min in JSON (provisional); expected effort roughly 15–25 min, not measured.\
**Disposition:** Candidate for your review; not approved. Candidate at 20 minutes. Added explicit only-edges/null-child condition and code/pseudocode deliverable. Keep height in edges; a height-in-nodes solution must be reconciled, not silently marked equal.

**Question:** Use height measured in edges: an empty tree has height -1 and a leaf has height 0. Tree R has left child L and right child M; L has left child P; M and P are leaves. These are the only edges; other child references are null. Return the height, give pseudocode or code for a recursive algorithm, and explain its base case. Also evaluate an empty tree, a leaf and a three-node chain. Assume a finite tree without cycles.

**Explanation:** Return -1 for null. Otherwise return 1+max(height(left),height(right)). In the example P and M have height 0, L has height 1, and R has height 2. Empty tree is -1, leaf is 0, and a three-node chain has 2 edges. The convention matters: a node-count definition would give different numbers. Visit each node once: O(n) time and O(h+1) call-stack space for height h, worst-case O(n) for a chain.

**Source/provenance:** Original PrepPilot practice material, prepared for editorial review; not company-specific. No external source is claimed.

### 9. Find shortest unweighted distances with BFS

**Slug:** `dsa-graphs-breadth-first-distances` · **question** · `dsa:graphs` · **easy**\
**Time:** 30 min in JSON (provisional); expected effort roughly 25–35 min, not measured.\
**Disposition:** Candidate for your review; not approved. Candidate at 30 minutes with queue implementation, trace and unreachable case. Easy is an introductory algorithm label, not zero prior instruction; consider a pre-read, not an invented mastery edge. Qualified traversal cost versus sorting.

**Question:** An undirected unweighted graph has vertices A,B,C,D,E and edges A–B, A–C, B–D, C–D; E is isolated. Starting at A, return each vertex's shortest edge distance, using null for unreachable. Process neighbor labels alphabetically for a deterministic trace. Describe a queue algorithm and when to mark a vertex visited.

**Explanation:** Distances are A:0, B:1, C:1, D:2, E:null. Set A to 0 and enqueue it. When exploring a vertex, assign each undiscovered neighbor distance=current+1 and enqueue it immediately. Marking on enqueue prevents B and C both queuing D. FIFO processes distance layers in order, which gives shortest paths only for equal-weight edges. With neighbor lists already in the required order, the traversal takes O(V+E) time and O(V) extra space. Sorting unsorted neighbor lists adds preprocessing cost. Neighbor ordering affects trace/parents but not these distances.

**Source/provenance:** Original PrepPilot practice material, prepared for editorial review; not company-specific. No external source is claimed.

### 10. Count staircase routes with a small recurrence

**Slug:** `dsa-dp-one-or-two-step-climb` · **question** · `dsa:dynamic_programming` · **easy**\
**Time:** 25 min in JSON (provisional); expected effort roughly 20–30 min, not measured.\
**Disposition:** Candidate for your review; not approved. Candidate at 25 minutes including recurrence derivation and iterative implementation. Easy is borderline for a learner new to recurrence/base cases; owner decides after trying it. Do not change planning rules to admit it.

**Question:** A staircase has n steps, where n is an integer from 0 through 30. Each move climbs 1 or 2 steps. Count ordered move sequences that reach exactly n. There is one way to climb zero steps: make no moves. For n=4, the answer is 5. Derive a recurrence, list those five routes, and compute n=0,1,2.

**Explanation:** Let ways[0]=1 and ways[1]=1. For n at least 2, ways[n]=ways[n-1]+ways[n-2], partitioning routes by whether the last move used one or two steps. The five routes for 4 are 1111,112,121,211,22. Values for 0,1,2 are 1,1,2. Retain only the previous two counts for O(n) time and O(1) extra space, with an explicit n=0 case. The empty route is a defined base case, not zero ways. No mastery of another topic is inferred.

**Source/provenance:** Original PrepPilot practice material, prepared for editorial review; not company-specific. No external source is claimed.

### 11. Apply two discounts to the correct changing base

**Slug:** `apt-quant-successive-discounts` · **question** · `aptitude:quantitative` · **easy**\
**Time:** 15 min in JSON **— rejected as a publication estimate**; expected effort roughly 4–7 min, not measured.\
**Disposition:** HOLD — timing. Correct arithmetic and changing-base explanation, but one short calculation is not a 15-minute task.

**Question:** A workbook is listed at ₹800. A shop applies a 15% discount, then a further 10% discount to the reduced price. Ignore taxes and rounding. What is the final price and the single equivalent discount percentage? Explain why adding the percentages is wrong.

**Explanation:** After the first discount the price is 800×0.85=₹680. The second discount gives 680×0.90=₹612. Total reduction is ₹188, so the equivalent discount is 188/800×100=23.5%. It is not 25% because the 10% applies to ₹680, not ₹800. The retained-price factor is 0.85×0.90=0.765.

**Source/provenance:** Original PrepPilot practice material, prepared for editorial review; not company-specific. No external source is claimed.

### 12. Combine group averages using group sizes

**Slug:** `apt-quant-weighted-mean` · **question** · `aptitude:quantitative` · **easy**\
**Time:** 15 min in JSON **— rejected as a publication estimate**; expected effort roughly 4–6 min, not measured.\
**Disposition:** HOLD — timing. Correct 76-mark result; one weighted average and a sentence of reasoning are too short for the schema minimum.

**Question:** Eight students average 70 marks and twelve other students average 80 marks. Every student belongs to exactly one group, and all marks use the same scale. Find the combined average. Explain when the simple mean of 70 and 80 would be valid.

**Explanation:** Total marks are 8×70+12×80=560+960=1520. There are 20 students, so the combined average is 76. The unweighted mean 75 would be valid if the two groups had equal sizes, not here. The answer lies between 70 and 80 and is nearer 80 because that group is larger.

**Source/provenance:** Original PrepPilot practice material, prepared for editorial review; not company-specific. No external source is claimed.

### 13. Use closing speed with consistent units

**Slug:** `apt-quant-meeting-time` · **question** · `aptitude:quantitative` · **easy**\
**Time:** 15 min in JSON **— rejected as a publication estimate**; expected effort roughly 3–5 min, not measured.\
**Disposition:** HOLD — timing. Correct 90-minute/18-km result. Distinguish the answer's travel time from the learner's study time; this is a short drill.

**Question:** Two cyclists start at the same instant from towns 45 km apart and ride directly toward each other at constant speeds 12 km/h and 18 km/h. There are no stops. After how many minutes do they meet, and how far does the slower cyclist travel?

**Explanation:** The distance closes at 12+18=30 km/h, so time is 45/30=1.5 hours=90 minutes. The slower cyclist travels 12×1.5=18 km and the faster one 27 km; 18+27=45. Subtracting speeds would model travel in the same direction, not this setup.

**Source/provenance:** Original PrepPilot practice material, prepared for editorial review; not company-specific. No external source is claimed.

### 14. Determine a line order from explicit constraints

**Slug:** `apt-logic-unique-order` · **question** · `aptitude:logical_reasoning` · **easy**\
**Time:** 15 min in JSON **— rejected as a publication estimate**; expected effort roughly 4–7 min, not measured.\
**Disposition:** HOLD — timing. Unique order is correct; checking two placements is too brief for a standalone 15-minute study task.

**Question:** Four people Asha, Bina, Chen and Dev stand in a line, from left to right. Dev is last. Asha is immediately before Bina. Chen is somewhere before Asha. Give the unique order and explain why no other arrangement satisfies all conditions.

**Explanation:** Dev occupies position 4. Asha/Bina must be an adjacent pair within positions 1–3. They cannot occupy 1–2 because Chen would have no earlier position. Therefore they occupy 2–3, leaving Chen at 1. The order is Chen, Asha, Bina, Dev. 'Immediately before' is stronger than merely 'somewhere before'.

**Source/provenance:** Original PrepPilot practice material, prepared for editorial review; not company-specific. No external source is claimed.

### 15. Separate necessary conclusions from plausible ones

**Slug:** `apt-logic-syllogism-validity` · **question** · `aptitude:logical_reasoning` · **easy**\
**Time:** 15 min in JSON **— rejected as a publication estimate**; expected effort roughly 4–7 min, not measured.\
**Disposition:** HOLD — timing. Countermodel is correct in ordinary set logic. Confirm that the pilot wants this convention, not an exam-specific existential convention; task is also too short.

**Question:** Assume: (1) all coders in a club are readers; (2) some club members are readers. Does it necessarily follow that some club members are coders? Answer yes or no and give a concrete counterexample if not. Treat these as set statements; do not assume an occupation exists just because it is named.

**Explanation:** No. Let the club contain only two members, both readers and neither a coder. Every coder in the club is a reader is still true because there are no coders, and some members are readers is true, yet some members are coders is false. A universal inclusion does not guarantee the smaller set is nonempty, and the converse is not valid.

**Source/provenance:** Original PrepPilot practice material, prepared for editorial review; not company-specific. No external source is claimed.

### 16. Use a conditional without reversing it

**Slug:** `apt-logic-conditional-contrapositive` · **question** · `aptitude:logical_reasoning` · **easy**\
**Time:** 15 min in JSON **— rejected as a publication estimate**; expected effort roughly 3–5 min, not measured.\
**Disposition:** HOLD — timing. Both conditional conclusions are correct, but this is a micro-recall question.

**Question:** In a particular system, whenever a report is approved, it has been reviewed. This rule has no exceptions. A report has not been reviewed. What can you conclude about approval? If a different report has been reviewed, can you conclude it is approved? Explain both answers.

**Explanation:** Approved implies reviewed. The contrapositive is not reviewed implies not approved, so the first report is not approved. Reviewed does not imply approved; a reviewed report may still be rejected or pending. The rule gives a necessary condition for approval, not a sufficient one. This uses only the stated rule, not a claim about all real systems.

**Source/provenance:** Original PrepPilot practice material, prepared for editorial review; not company-specific. No external source is claimed.

### 17. Choose the verb that agrees with the grammatical subject

**Slug:** `apt-verbal-subject-agreement` · **question** · `aptitude:verbal_ability` · **easy**\
**Time:** 15 min in JSON **— rejected as a publication estimate**; expected effort roughly 2–4 min, not measured.\
**Disposition:** HOLD — timing. Correct singular agreement; one sentence cannot honestly justify 15 minutes.

**Question:** Choose the correct verb in standard edited English: 'The list of practice topics (is/are) on the desk.' Identify the grammatical subject, not just the nearest noun, and explain why the other option fails.

**Explanation:** Use 'is'. The subject head is the singular noun 'list'; 'of practice topics' modifies that noun and does not change its number. 'Are' incorrectly agrees with the plural noun inside the modifying phrase. The corrected sentence is 'The list of practice topics is on the desk.'

**Source/provenance:** Original PrepPilot practice material, prepared for editorial review; not company-specific. No external source is claimed.

### 18. Remove an ambiguous pronoun without inventing facts

**Slug:** `apt-verbal-pronoun-clarity` · **question** · `aptitude:verbal_ability` · **easy**\
**Time:** 15 min in JSON **— rejected as a publication estimate**; expected effort roughly 3–6 min, not measured.\
**Disposition:** HOLD — timing. Rewritten answer repeats names and preserves past-perfect tense. Multiple clear rewrites should be accepted. Still too short as one scheduled item.

**Question:** 'Riya told Meera that she had finished the report.' Explain the ambiguity. Rewrite it once to mean Riya finished, and once to mean Meera finished, while keeping who spoke unchanged. Do not guess which meaning the original writer intended.

**Explanation:** 'She' can refer to either Riya or Meera. Riya-finished version: 'Riya told Meera that Riya had finished the report.' Meera-finished version: 'Riya told Meera that Meera had finished the report.' Both keep Riya as speaker, Meera as listener and the original past-perfect time relationship. Repeating a name is intentionally explicit; equivalent unambiguous rewrites are acceptable. The original sentence alone does not establish who finished.

**Source/provenance:** Original PrepPilot practice material, prepared for editorial review; not company-specific. No external source is claimed.

### 19. Read a policy without strengthening its claim

**Slug:** `apt-verbal-reading-qualified-inference` · **question** · `aptitude:verbal_ability` · **easy**\
**Time:** 15 min in JSON **— rejected as a publication estimate**; expected effort roughly 4–7 min, not measured.\
**Disposition:** HOLD — timing. B follows; A and C overreach. One short passage with one selection is below the minimum task length.

**Question:** Read this original passage: 'The lab opens on weekdays. On Tuesdays, only students who have completed safety training may use the soldering stations. Visitors may observe from the marked area.' Which conclusion is supported? A: every trained student uses a station on Tuesday. B: an untrained student may not use a station on Tuesday. C: visitors may use a station on Tuesday. Explain why the other options go beyond the passage.

**Explanation:** B is supported. The training condition is required for student station use on Tuesday. A turns permission/eligibility into actual use; the passage does not say all eligible students attend. C confuses observing from a marked area with permission to operate a station. Nothing here establishes weekend opening or rules for other weekdays.

**Source/provenance:** Original PrepPilot practice material, prepared for editorial review; not company-specific. No external source is claimed.

### 20. Understand an all-or-nothing transaction

**Slug:** `cs-dbms-transaction-boundaries` · **resource** · `cs:dbms` · **easy**\
**Time:** 15 min in JSON (provisional); expected effort roughly 12–20 min, not measured.\
**Disposition:** Candidate for your review; not approved. Candidate at 15 minutes only with the linked reading and the original rollback/commit reasoning activity, not the short note alone. Confirm comfort with a SQL-specific reference.

**Resource body:**

#### Goal

Explain transaction boundaries without confusing them with one SQL statement.

Read the linked PostgreSQL introduction to transactions. A transaction groups changes into a unit; COMMIT accepts it and ROLLBACK abandons uncommitted changes. Visibility/isolation details depend on the database and isolation level, so do not infer a universal concurrency guarantee from atomicity alone.

#### Original exercise

An inventory count is 12 and reserved count is 0. A transaction intends to reduce inventory by 3 and increase reserved by 3. If an application error occurs after the first update and the transaction is rolled back, the counts remain 12 and 0. After a successful commit of both updates they become 9 and 3.

#### Self-check

Explain why two independent autocommitted updates could leave inconsistent counts if the application fails between them. Read the reference, trace the original example and explain rollback in your own words; the proposed study time includes that activity, not a required waiting period.

**Explanation:** Not a separate question-answer field; the worked example/self-check is part of the resource above. Do not invent a question outcome for reading it.

**Source/provenance:** Original PrepPilot learning note with reference: PostgreSQL Global Development Group, tutorial Transactions (https://www.postgresql.org/docs/current/tutorial-transactions.html). [Open the inspected page](https://www.postgresql.org/docs/current/tutorial-transactions.html).

### 21. Identify keys from declared data rules

**Slug:** `cs-dbms-candidate-and-foreign-keys` · **question** · `cs:dbms` · **easy**\
**Time:** 15 min in JSON **— rejected as a publication estimate**; expected effort roughly 6–10 min, not measured.\
**Disposition:** HOLD — timing. Keys and minimality are correct under the stated constraints; too brief for a whole 15-minute task for a prepared beginner.

**Question:** A Students relation has studentId, email and departmentId. Every studentId and every email is unique and non-null; many students may share a departmentId. A Departments relation has a unique non-null departmentId. Under these stated rules, name the minimal candidate keys for Students, choose one primary key, and identify a possible foreign key.

**Explanation:** {studentId} and {email} are each minimal candidate keys. Choose studentId as the primary key; email remains an alternate candidate key with a uniqueness constraint. Students.departmentId can reference Departments.departmentId as a foreign key, with explicit nullability decided separately. departmentId is not a candidate key for Students because duplicates are allowed. A candidate key is minimal, so the pair {studentId,email} is a superkey but not a minimal candidate key.

**Source/provenance:** Original PrepPilot practice material, prepared for editorial review; not company-specific. No external source is claimed.

### 22. Distinguish row filtering from grouped filtering

**Slug:** `cs-dbms-grouping-filter` · **question** · `cs:dbms` · **easy**\
**Time:** 15 min in JSON **— rejected as a publication estimate**; expected effort roughly 5–8 min, not measured.\
**Disposition:** HOLD — timing. East 110 is correct; manually grouping five rows alone is too short. No actual SQL execution was claimed.

**Question:** Sales rows are (region,amount): ('East',40),('East',70),('West',90),('West',20),('North',30). All amounts are non-null integers. Query: SELECT region, SUM(amount) AS total FROM Sales WHERE amount >= 40 GROUP BY region HAVING SUM(amount) >= 100. What rows are returned? Output order is unspecified. Explain WHERE versus HAVING.

**Explanation:** WHERE retains East 40, East 70 and West 90. Group totals become East 110 and West 90. HAVING retains only ('East',110). North disappears before grouping because its row fails WHERE. WHERE filters individual input rows; HAVING filters groups after aggregation. The query has no ORDER BY, so row ordering is not promised.

**Source/provenance:** Original PrepPilot practice material, prepared for editorial review; not company-specific. No external source is claimed.

### 23. Compare processes, threads and shared state

**Slug:** `cs-os-process-thread-boundaries` · **resource** · `cs:operating_systems` · **easy**\
**Time:** 15 min in JSON (provisional); expected effort roughly 12–20 min, not measured.\
**Disposition:** Candidate for your review; not approved. Candidate at 15 minutes for drawing address-space/execution state and tracing the lost update. Clarified that thread stacks are not security-isolated; no runtime concurrency experiment performed.

**Resource body:**

#### Goal

Distinguish an execution context from an isolation boundary.

In a conventional operating-system model, a process has an address space and owned resources; threads in that process share its address space but have their own execution state, including registers and stack. Per-thread stacks are not security-isolated from other threads in the same address space. Separate processes can explicitly share memory, so isolation is not an absolute claim that sharing never happens.

#### Exercise

Two threads both read shared counter 0, both compute 1, then both store 1. The final counter is 1 despite two intended increments. Identify the lost update and propose a mutex around the read-modify-write sequence or a suitable atomic increment. Making a second thread does not by itself make the operation atomic.

#### Self-check

Explain why sharing data can be convenient but requires coordination. Draw per-thread stacks and a shared heap, trace the interleaving, then explain where synchronization belongs. Do not confuse a per-thread stack with protected memory.

**Explanation:** Not a separate question-answer field; the worked example/self-check is part of the resource above. Do not invent a question outcome for reading it.

**Source/provenance:** Original PrepPilot learning note, prepared for editorial review; not company-specific. No external source is claimed.

### 24. Trace round-robin completion and waiting time

**Slug:** `cs-os-round-robin-trace` · **question** · `cs:operating_systems` · **easy**\
**Time:** 15 min in JSON (provisional); expected effort roughly 10–20 min, not measured.\
**Disposition:** Candidate for your review; not approved. Candidate at 15 minutes for six-interval trace, three completion times and waiting calculations. Validate pace with a beginner; do not count simulated CPU time as study time.

**Question:** Three CPU-only jobs A,B,C arrive at time 0 in that queue order. CPU bursts are 5,3,1 time units. Round-robin quantum is 2, context-switch cost is zero, and there are no later arrivals or I/O. Give the execution intervals and completion times. Compute waiting time as turnaround minus burst.

**Explanation:** Intervals: A [0,2), B [2,4), C [4,5), A [5,7), B [7,8), A [8,9). Completion times A=9, B=8, C=5. Since arrival is 0, turnaround equals completion. Waiting times are A:9-5=4, B:8-3=5, C:5-1=4; average waiting is 13/3 time units. Total CPU time 9 equals the burst sum. Do not mistake response time (first start) for total waiting.

**Source/provenance:** Original PrepPilot practice material, prepared for editorial review; not company-specific. No external source is claimed.

### 25. Split a logical address into page and offset

**Slug:** `cs-os-page-offset` · **question** · `cs:operating_systems` · **easy**\
**Time:** 15 min in JSON **— rejected as a publication estimate**; expected effort roughly 3–5 min, not measured.\
**Disposition:** HOLD — timing. Correct page/offset/frame arithmetic; a single address translation is a micro-drill.

**Question:** Pages contain 1024 bytes and logical addresses are nonnegative byte offsets starting at zero. For logical address 2500, find page number and offset. The page table maps that page to physical frame 7; give the physical address. Assume the mapping is present and permissions allow access.

**Explanation:** 2500=2×1024+452, so page number is 2 and offset 452. Frame 7 starts at 7×1024=7168; the physical address is 7168+452=7620. Offset is unchanged by page translation and is between 0 and 1023. An absent mapping would require fault handling rather than blindly forming an address, but presence is guaranteed here.

**Source/provenance:** Original PrepPilot practice material, prepared for editorial review; not company-specific. No external source is claimed.

### 26. Read HTTP as messages, not a persistent login guarantee

**Slug:** `cs-net-http-request-response` · **resource** · `cs:networking` · **easy**\
**Time:** 15 min in JSON (provisional); expected effort roughly 12–20 min, not measured.\
**Disposition:** Candidate for your review; not approved. Candidate at 15 minutes only with MDN reading and message sketch/state explanation. A reference visit is not an attempt or automatic completion.

**Resource body:**

#### Goal

Recognize request/response messages and distinguish transport from application state.

Read the linked MDN HTTP overview. A request names a method and target and may carry headers/body; a response supplies a status and headers and may carry a body. HTTP's stateless semantics do not prevent an application from relating requests using cookies and server-side session records.

#### Exercise

Sketch GET /notes followed by a 200 response and a short text body. Then explain a 404 response: the requested resource was not found, not necessarily that the network is offline. Explain why a cookie alone should not be assumed to prove current server-side permission.

#### Boundary

HTTPS adds transport protection; it does not make every application action authorized. Read the relevant message/state sections, sketch the exchange and explain state in your own words; do not stretch the activity merely to fill a time allowance. Reading this note does not record an attempt or complete a task.

**Explanation:** Not a separate question-answer field; the worked example/self-check is part of the resource above. Do not invent a question outcome for reading it.

**Source/provenance:** Original PrepPilot learning note with reference: MDN Web Docs, Overview of HTTP (https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview). [Open the inspected page](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview).

### 27. Calculate a conventional IPv4 /27 subnet

**Slug:** `cs-net-ipv4-subnet` · **question** · `cs:networking` · **easy**\
**Time:** 15 min in JSON **— rejected as a publication estimate**; expected effort roughly 5–10 min, not measured.\
**Disposition:** HOLD — timing. Correct /27 network/broadcast/host range. Do not inflate one subnet calculation to the minimum.

**Question:** For host 192.168.10.77/27, give subnet mask, network address, broadcast address and conventional usable host range/count. Assume ordinary multi-access IPv4 subnet rules, not /31 point-to-point exceptions.

**Explanation:** A /27 mask is 255.255.255.224 with blocks of 32 addresses in the last octet. 77 is in the 64–95 block. Network is 192.168.10.64, broadcast 192.168.10.95, usable hosts 192.168.10.65 through 192.168.10.94: 30 hosts. The block contains 32 addresses; conventional network/broadcast reservations remove two. The mask comes from 27 network bits, not the decimal size of the host address.

**Source/provenance:** Original PrepPilot practice material, prepared for editorial review; not company-specific. No external source is claimed.

### 28. Separate name resolution from encrypted HTTP

**Slug:** `cs-net-dns-versus-https` · **question** · `cs:networking` · **easy**\
**Time:** 15 min in JSON **— rejected as a publication estimate**; expected effort roughly 4–7 min, not measured.\
**Disposition:** HOLD — timing. Layer order is correct under the explicit TCP/no-cache assumptions; one conceptual recall is too short.

**Question:** In a simplified fresh HTTPS connection to a site by hostname, distinguish DNS resolution, transport setup, TLS and the HTTP exchange. Does receiving an IP address prove the website is authentic? Assume ordinary HTTPS over TCP with no reused connections; other transports and cached results are outside this trace.

**Explanation:** DNS resolves a hostname to addressing information; it does not itself establish the site's HTTPS identity. The client opens a TCP connection, performs TLS negotiation including appropriate certificate/hostname validation, then exchanges HTTP within the protected channel. An IP result alone is not proof of authenticity or permission. DNS may be cached in real clients and HTTPS can use other transports, so this ordered trace is tied to the stated simplified setup.

**Source/provenance:** Original PrepPilot practice material, prepared for editorial review; not company-specific. No external source is claimed.

### 29. Model an object by its behavior and collaborators

**Slug:** `cs-oop-composition-contracts` · **resource** · `cs:oop` · **easy**\
**Time:** 15 min in JSON (provisional); expected effort roughly 12–20 min, not measured.\
**Disposition:** Candidate for your review; not approved. Candidate at 15 minutes with the interface/fake sketch and contract comparison. The note alone is shorter; owner should choose a familiar implementation language.

**Resource body:**

#### Goal

Use encapsulation and composition without treating inheritance as mandatory.

A StudyTimer owns elapsed minutes and exposes start, stop and readElapsed operations. An application-facing StudySession can use a timer object as a collaborator instead of inheriting its implementation. Encapsulation keeps callers from arbitrarily changing internal elapsed state; a clear interface states allowed operations and errors.

#### Exercise

Sketch a Timer interface and two implementations: one reading a real clock and one controlled by a test. Inject the interface into StudySession. Explain why tests can advance the fake without sleeping, and why the fake must still honor the same observable contract.

#### Self-check

Composition means using a collaborator; inheritance means specializing a type/implementation relationship. Neither automatically guarantees substitutability. Draw the collaborators, sketch the interface and check the fake's observable contract. The time label is a provisional budget, not an instruction to spend five minutes on each small step.

**Explanation:** Not a separate question-answer field; the worked example/self-check is part of the resource above. Do not invent a question outcome for reading it.

**Source/provenance:** Original PrepPilot learning note, prepared for editorial review; not company-specific. No external source is claimed.

## Your approval record — complete manually, not generated

For each candidate record Approve / Request changes / Hold, any corrected wording/difficulty/time, your name/initials and actual review date in your editorial notes. Do not transfer a timestamp to `reviewedAt` until you have actually reviewed the saved content. A pass from Zod or this agent is not a human signature. Any rejection reducing a subject/topic count must be visible; a 50-proposal file does not equal 50 acceptable publications.

## Practical walkthrough: one draft, then publication only after approval

Use item 1, **Build running totals without changing the input**, as the first candidate. Do not use one of the timing-held items for this walkthrough.

1. Confirm the intended environment and use an **existing** admin login. Open `/admin/content`; search `dsa-arrays-running-totals` first. If it already exists, compare it instead of creating a duplicate. If you lack an admin account, stop; this task does not authorize role promotion.
2. Click **Create draft**. Enter title and slug from item 1; choose subject `dsa`, topic `arrays`, type `question`, difficulty `easy`, estimated minutes **15**, and tags `starter-v1, foundation`. Leave external URL blank, companies empty, files empty and review time blank.
3. Copy item 1's complete Question into **Question prompt** and Explanation into **Explanation**. Leave Resource body blank. Copy its exact `source` and `attribution` from the JSON companion; retain AI-assisted/pending-review disclosure. Do not paste review-sheet metadata, timing uncertainty or status/revision fields into learning content.
4. **Save draft**. Confirm saved status is draft and verify the saved slug/content. If saving times out, return to the library, search the unique slug and compare before creating again. A stale revision needs reconciliation, not blind overwrite.
5. Open the saved **Admin preview**. Independently implement/trace `[4,-2,5,0] → [4,2,7,7]`, `[] → []`, `[-3] → [-3]` and `[0,0] → [0,0]`; confirm the input remains unchanged. Reveal the explanation only after trying it. Check readable mobile/desktop layout and links where an item has one. Time the actual activity: if 15 minutes is not credible, keep it on hold rather than padding it.
6. **Stop for your content approval.** Do not click Mark reviewed now merely to clear an error. After you approve the saved wording, explanation, difficulty, time and provenance, update pending-review attribution wording honestly, preserve the authorship disclosure, record the actual review time using **Mark reviewed now**, then **Save changes**. This walkthrough does not mark the JSON pack reviewed.
7. Click **Publish**, read the confirmation for the current saved revision, and confirm only after that approval. On a conflict or ambiguous result, refetch/reconcile first. Published slugs are immutable; archival preserves history.
8. In a separate student session, verify the item is visible in `/content`, its explanation is not leaked in the list, and the detail can reveal it. An outcome is a deliberate self-report, not automatic grading. Creating/publishing the item must not silently replace an existing study plan.

No step above has been performed automatically. No migrations, imports, account promotions, service changes, application test suites or EPERM diagnostics are part of this review.

# Duration-hold reassessment

The historical timing holds below are not current 15-minute requirements.
Content now supports whole-minute estimates from 1–60. See
`NEXT_PREPARED_CONTENT_RECOMMENDATION.md` for proposed honest estimates and the
coverage-first next batch. This does not grant editorial approval or change
review timestamps, source records or publication state.
