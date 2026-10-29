# APTITUDE starter review pack

Review-only proposal v1. All items are AI-assisted, human review pending, and not inserted or published. JSON is the authoritative field-value companion. All entries have companies: [], assetIds: [], reviewedAt: null. Leave optional blank fields omitted, not null, on creation. Do not paste this Markdown metadata into a learning body.

## apt-quant-successive-discounts

| Admin field      | Proposed value                                       |
| ---------------- | ---------------------------------------------------- |
| slug             | `apt-quant-successive-discounts`                     |
| title            | Apply two discounts to the correct changing base     |
| subject          | `aptitude`                                           |
| topic            | `quantitative`                                       |
| type             | `question`                                           |
| difficulty       | `easy`                                               |
| estimatedMinutes | 15                                                   |
| tags             | `starter-v1`, `foundation`                           |
| companies        | `[]` — shared foundation, no supported company claim |
| assetIds         | `[]` — files deferred                                |
| reviewedAt       | `null` — human review pending                        |
| externalUrl      | Omitted; self-contained original material            |

**source:** Original PrepPilot practice material, prepared for editorial review; not company-specific.

**attribution:** AI-assisted original PrepPilot wording, examples and worked solution; not human-reviewed. Standard concepts are not claimed as proprietary.

### prompt

A workbook is listed at ₹800. A shop applies a 15% discount, then a further 10% discount to the reduced price. Ignore taxes and rounding. What is the final price and the single equivalent discount percentage? Explain why adding the percentages is wrong.

### explanation — hide until the learner requests it

After the first discount the price is 800×0.85=₹680. The second discount gives 680×0.90=₹612. Total reduction is ₹188, so the equivalent discount is 188/800×100=23.5%. It is not 25% because the 10% applies to ₹680, not ₹800. The retained-price factor is 0.85×0.90=0.765.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## apt-quant-combined-work-rates

| Admin field      | Proposed value                                       |
| ---------------- | ---------------------------------------------------- |
| slug             | `apt-quant-combined-work-rates`                      |
| title            | Combine unequal work rates, then finish alone        |
| subject          | `aptitude`                                           |
| topic            | `quantitative`                                       |
| type             | `question`                                           |
| difficulty       | `medium`                                             |
| estimatedMinutes | 30                                                   |
| tags             | `starter-v1`, `foundation`                           |
| companies        | `[]` — shared foundation, no supported company claim |
| assetIds         | `[]` — files deferred                                |
| reviewedAt       | `null` — human review pending                        |
| externalUrl      | Omitted; self-contained original material            |

**source:** Original PrepPilot practice material, prepared for editorial review; not company-specific.

**attribution:** AI-assisted original PrepPilot wording, examples and worked solution; not human-reviewed. Standard concepts are not claimed as proprietary.

### prompt

A can complete a fixed job alone in 12 hours and B in 18 hours. Both work at constant rates, start together and work for 3 hours. B then leaves; A completes the remaining work alone. Assume no interference or setup time. How much additional time does A need, and what is the total elapsed time?

### explanation — hide until the learner requests it

A's rate is 1/12 job/hour; B's is 1/18. Together they complete 5/36 per hour, so in 3 hours they complete 5/12 of the job. Remaining work is 7/12. A alone needs (7/12)/(1/12)=7 additional hours, giving 10 total hours. Check: A's 10 hours contribute 10/12 and B's 3 hours contribute 3/18; together 1. Averaging 12 and 18 does not combine rates.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## apt-quant-weighted-mean

| Admin field      | Proposed value                                       |
| ---------------- | ---------------------------------------------------- |
| slug             | `apt-quant-weighted-mean`                            |
| title            | Combine group averages using group sizes             |
| subject          | `aptitude`                                           |
| topic            | `quantitative`                                       |
| type             | `question`                                           |
| difficulty       | `easy`                                               |
| estimatedMinutes | 15                                                   |
| tags             | `starter-v1`, `foundation`                           |
| companies        | `[]` — shared foundation, no supported company claim |
| assetIds         | `[]` — files deferred                                |
| reviewedAt       | `null` — human review pending                        |
| externalUrl      | Omitted; self-contained original material            |

**source:** Original PrepPilot practice material, prepared for editorial review; not company-specific.

**attribution:** AI-assisted original PrepPilot wording, examples and worked solution; not human-reviewed. Standard concepts are not claimed as proprietary.

### prompt

Eight students average 70 marks and twelve other students average 80 marks. Every student belongs to exactly one group, and all marks use the same scale. Find the combined average. Explain when the simple mean of 70 and 80 would be valid.

### explanation — hide until the learner requests it

Total marks are 8×70+12×80=560+960=1520. There are 20 students, so the combined average is 76. The unweighted mean 75 would be valid if the two groups had equal sizes, not here. The answer lies between 70 and 80 and is nearer 80 because that group is larger.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## apt-quant-meeting-time

| Admin field      | Proposed value                                       |
| ---------------- | ---------------------------------------------------- |
| slug             | `apt-quant-meeting-time`                             |
| title            | Use closing speed with consistent units              |
| subject          | `aptitude`                                           |
| topic            | `quantitative`                                       |
| type             | `question`                                           |
| difficulty       | `easy`                                               |
| estimatedMinutes | 15                                                   |
| tags             | `starter-v1`, `foundation`                           |
| companies        | `[]` — shared foundation, no supported company claim |
| assetIds         | `[]` — files deferred                                |
| reviewedAt       | `null` — human review pending                        |
| externalUrl      | Omitted; self-contained original material            |

**source:** Original PrepPilot practice material, prepared for editorial review; not company-specific.

**attribution:** AI-assisted original PrepPilot wording, examples and worked solution; not human-reviewed. Standard concepts are not claimed as proprietary.

### prompt

Two cyclists start at the same instant from towns 45 km apart and ride directly toward each other at constant speeds 12 km/h and 18 km/h. There are no stops. After how many minutes do they meet, and how far does the slower cyclist travel?

### explanation — hide until the learner requests it

The distance closes at 12+18=30 km/h, so time is 45/30=1.5 hours=90 minutes. The slower cyclist travels 12×1.5=18 km and the faster one 27 km; 18+27=45. Subtracting speeds would model travel in the same direction, not this setup.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## apt-quant-without-replacement

| Admin field      | Proposed value                                       |
| ---------------- | ---------------------------------------------------- |
| slug             | `apt-quant-without-replacement`                      |
| title            | Calculate two draws without replacement              |
| subject          | `aptitude`                                           |
| topic            | `quantitative`                                       |
| type             | `question`                                           |
| difficulty       | `easy`                                               |
| estimatedMinutes | 15                                                   |
| tags             | `starter-v1`, `foundation`                           |
| companies        | `[]` — shared foundation, no supported company claim |
| assetIds         | `[]` — files deferred                                |
| reviewedAt       | `null` — human review pending                        |
| externalUrl      | Omitted; self-contained original material            |

**source:** Original PrepPilot practice material, prepared for editorial review; not company-specific.

**attribution:** AI-assisted original PrepPilot wording, examples and worked solution; not human-reviewed. Standard concepts are not claimed as proprietary.

### prompt

A bag contains 3 red and 2 blue counters, identical except for color. Draw two counters uniformly at random without replacing the first. What is the probability both are red? Then find the probability the second is red given that the first was red.

### explanation — hide until the learner requests it

P(first red)=3/5. Given that event, 2 red counters remain among 4, so P(second red | first red)=2/4=1/2. Multiply for both: (3/5)×(2/4)=3/10. An independent count gives choose(3,2)/choose(5,2)=3/10. Using 3/5 for the second conditional draw would incorrectly assume replacement.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## apt-logic-unique-order

| Admin field      | Proposed value                                       |
| ---------------- | ---------------------------------------------------- |
| slug             | `apt-logic-unique-order`                             |
| title            | Determine a line order from explicit constraints     |
| subject          | `aptitude`                                           |
| topic            | `logical_reasoning`                                  |
| type             | `question`                                           |
| difficulty       | `easy`                                               |
| estimatedMinutes | 15                                                   |
| tags             | `starter-v1`, `foundation`                           |
| companies        | `[]` — shared foundation, no supported company claim |
| assetIds         | `[]` — files deferred                                |
| reviewedAt       | `null` — human review pending                        |
| externalUrl      | Omitted; self-contained original material            |

**source:** Original PrepPilot practice material, prepared for editorial review; not company-specific.

**attribution:** AI-assisted original PrepPilot wording, examples and worked solution; not human-reviewed. Standard concepts are not claimed as proprietary.

### prompt

Four people Asha, Bina, Chen and Dev stand in a line, from left to right. Dev is last. Asha is immediately before Bina. Chen is somewhere before Asha. Give the unique order and explain why no other arrangement satisfies all conditions.

### explanation — hide until the learner requests it

Dev occupies position 4. Asha/Bina must be an adjacent pair within positions 1–3. They cannot occupy 1–2 because Chen would have no earlier position. Therefore they occupy 2–3, leaving Chen at 1. The order is Chen, Asha, Bina, Dev. 'Immediately before' is stronger than merely 'somewhere before'.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## apt-logic-syllogism-validity

| Admin field      | Proposed value                                       |
| ---------------- | ---------------------------------------------------- |
| slug             | `apt-logic-syllogism-validity`                       |
| title            | Separate necessary conclusions from plausible ones   |
| subject          | `aptitude`                                           |
| topic            | `logical_reasoning`                                  |
| type             | `question`                                           |
| difficulty       | `easy`                                               |
| estimatedMinutes | 15                                                   |
| tags             | `starter-v1`, `foundation`                           |
| companies        | `[]` — shared foundation, no supported company claim |
| assetIds         | `[]` — files deferred                                |
| reviewedAt       | `null` — human review pending                        |
| externalUrl      | Omitted; self-contained original material            |

**source:** Original PrepPilot practice material, prepared for editorial review; not company-specific.

**attribution:** AI-assisted original PrepPilot wording, examples and worked solution; not human-reviewed. Standard concepts are not claimed as proprietary.

### prompt

Assume: (1) all coders in a club are readers; (2) some club members are readers. Does it necessarily follow that some club members are coders? Answer yes or no and give a concrete counterexample if not. Treat these as set statements; do not assume an occupation exists just because it is named.

### explanation — hide until the learner requests it

No. Let the club contain only two members, both readers and neither a coder. Every coder in the club is a reader is still true because there are no coders, and some members are readers is true, yet some members are coders is false. A universal inclusion does not guarantee the smaller set is nonempty, and the converse is not valid.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## apt-logic-conditional-contrapositive

| Admin field      | Proposed value                                       |
| ---------------- | ---------------------------------------------------- |
| slug             | `apt-logic-conditional-contrapositive`               |
| title            | Use a conditional without reversing it               |
| subject          | `aptitude`                                           |
| topic            | `logical_reasoning`                                  |
| type             | `question`                                           |
| difficulty       | `easy`                                               |
| estimatedMinutes | 15                                                   |
| tags             | `starter-v1`, `foundation`                           |
| companies        | `[]` — shared foundation, no supported company claim |
| assetIds         | `[]` — files deferred                                |
| reviewedAt       | `null` — human review pending                        |
| externalUrl      | Omitted; self-contained original material            |

**source:** Original PrepPilot practice material, prepared for editorial review; not company-specific.

**attribution:** AI-assisted original PrepPilot wording, examples and worked solution; not human-reviewed. Standard concepts are not claimed as proprietary.

### prompt

In a particular system, whenever a report is approved, it has been reviewed. This rule has no exceptions. A report has not been reviewed. What can you conclude about approval? If a different report has been reviewed, can you conclude it is approved? Explain both answers.

### explanation — hide until the learner requests it

Approved implies reviewed. The contrapositive is not reviewed implies not approved, so the first report is not approved. Reviewed does not imply approved; a reviewed report may still be rejected or pending. The rule gives a necessary condition for approval, not a sufficient one. This uses only the stated rule, not a claim about all real systems.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## apt-logic-specified-sequence-rule

| Admin field      | Proposed value                                       |
| ---------------- | ---------------------------------------------------- |
| slug             | `apt-logic-specified-sequence-rule`                  |
| title            | Continue a sequence under a stated difference rule   |
| subject          | `aptitude`                                           |
| topic            | `logical_reasoning`                                  |
| type             | `question`                                           |
| difficulty       | `easy`                                               |
| estimatedMinutes | 15                                                   |
| tags             | `starter-v1`, `foundation`                           |
| companies        | `[]` — shared foundation, no supported company claim |
| assetIds         | `[]` — files deferred                                |
| reviewedAt       | `null` — human review pending                        |
| externalUrl      | Omitted; self-contained original material            |

**source:** Original PrepPilot practice material, prepared for editorial review; not company-specific.

**attribution:** AI-assisted original PrepPilot wording, examples and worked solution; not human-reviewed. Standard concepts are not claimed as proprietary.

### prompt

A sequence begins 4,9,16,25. Its next term is formed by adding the next odd positive difference, continuing the differences 5,7,9 by increasing each difference by 2. Find the next two terms and explain the rule. Do not infer uniqueness from an arbitrary finite prefix without the stated continuation rule.

### explanation — hide until the learner requests it

The next differences are 11 and 13. Add them successively: 25+11=36, then 36+13=49. The terms also match consecutive squares 2²,3²,4²,5²,6²,7². A finite prefix could fit other formulas; the explicitly stated difference rule makes this exercise determinate.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## apt-logic-four-day-assignment

| Admin field      | Proposed value                                       |
| ---------------- | ---------------------------------------------------- |
| slug             | `apt-logic-four-day-assignment`                      |
| title            | Test whether a four-day assignment is unique         |
| subject          | `aptitude`                                           |
| topic            | `logical_reasoning`                                  |
| type             | `question`                                           |
| difficulty       | `medium`                                             |
| estimatedMinutes | 30                                                   |
| tags             | `starter-v1`, `foundation`                           |
| companies        | `[]` — shared foundation, no supported company claim |
| assetIds         | `[]` — files deferred                                |
| reviewedAt       | `null` — human review pending                        |
| externalUrl      | Omitted; self-contained original material            |

**source:** Original PrepPilot practice material, prepared for editorial review; not company-specific.

**attribution:** AI-assisted original PrepPilot wording, examples and worked solution; not human-reviewed. Standard concepts are not claimed as proprietary.

### prompt

Arun, Bela, Cora and Deep each present once, one person on each of Monday through Thursday. Arun presents immediately before Cora. Bela presents before Arun. Deep does not present on Monday. Determine whether the timetable is unique. List every valid timetable and show how you rule out other adjacent positions for Arun/Cora. If it is not unique, propose one additional condition that selects just one timetable.

### explanation — hide until the learner requests it

Number days 1–4. Arun/Cora cannot be 1–2 because Bela must be earlier. If they were 3–4, Bela and Deep would occupy 1–2; Deep cannot be 1, so Bela=1 and Deep=2, which is valid. If they were 2–3, Bela=1 and Deep=4, which is also valid. Therefore the stated constraints do NOT produce a unique timetable: Bela,Arun,Cora,Deep and Bela,Deep,Arun,Cora both work. Correct response: two solutions; a uniqueness claim is unjustified. If Deep must also precede Cora, only the second remains.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## apt-verbal-subject-agreement

| Admin field      | Proposed value                                           |
| ---------------- | -------------------------------------------------------- |
| slug             | `apt-verbal-subject-agreement`                           |
| title            | Choose the verb that agrees with the grammatical subject |
| subject          | `aptitude`                                               |
| topic            | `verbal_ability`                                         |
| type             | `question`                                               |
| difficulty       | `easy`                                                   |
| estimatedMinutes | 15                                                       |
| tags             | `starter-v1`, `foundation`                               |
| companies        | `[]` — shared foundation, no supported company claim     |
| assetIds         | `[]` — files deferred                                    |
| reviewedAt       | `null` — human review pending                            |
| externalUrl      | Omitted; self-contained original material                |

**source:** Original PrepPilot practice material, prepared for editorial review; not company-specific.

**attribution:** AI-assisted original PrepPilot wording, examples and worked solution; not human-reviewed. Standard concepts are not claimed as proprietary.

### prompt

Choose the correct verb in standard edited English: 'The list of practice topics (is/are) on the desk.' Identify the grammatical subject, not just the nearest noun, and explain why the other option fails.

### explanation — hide until the learner requests it

Use 'is'. The subject head is the singular noun 'list'; 'of practice topics' modifies that noun and does not change its number. 'Are' incorrectly agrees with the plural noun inside the modifying phrase. The corrected sentence is 'The list of practice topics is on the desk.'

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## apt-verbal-pronoun-clarity

| Admin field      | Proposed value                                       |
| ---------------- | ---------------------------------------------------- |
| slug             | `apt-verbal-pronoun-clarity`                         |
| title            | Remove an ambiguous pronoun without inventing facts  |
| subject          | `aptitude`                                           |
| topic            | `verbal_ability`                                     |
| type             | `question`                                           |
| difficulty       | `easy`                                               |
| estimatedMinutes | 15                                                   |
| tags             | `starter-v1`, `foundation`                           |
| companies        | `[]` — shared foundation, no supported company claim |
| assetIds         | `[]` — files deferred                                |
| reviewedAt       | `null` — human review pending                        |
| externalUrl      | Omitted; self-contained original material            |

**source:** Original PrepPilot practice material, prepared for editorial review; not company-specific.

**attribution:** AI-assisted original PrepPilot wording, examples and worked solution; not human-reviewed. Standard concepts are not claimed as proprietary.

### prompt

'Riya told Meera that she had finished the report.' Explain the ambiguity. Rewrite it once to mean Riya finished, and once to mean Meera finished, while keeping who spoke unchanged. Do not guess which meaning the original writer intended.

### explanation — hide until the learner requests it

'She' can refer to either Riya or Meera. Riya-finished version: 'Riya told Meera that Riya had finished the report.' Meera-finished version: 'Riya told Meera that Meera had finished the report.' Both keep Riya as speaker, Meera as listener and the original past-perfect time relationship. Repeating a name is intentionally explicit; equivalent unambiguous rewrites are acceptable. The original sentence alone does not establish who finished.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## apt-verbal-reading-qualified-inference

| Admin field      | Proposed value                                       |
| ---------------- | ---------------------------------------------------- |
| slug             | `apt-verbal-reading-qualified-inference`             |
| title            | Read a policy without strengthening its claim        |
| subject          | `aptitude`                                           |
| topic            | `verbal_ability`                                     |
| type             | `question`                                           |
| difficulty       | `easy`                                               |
| estimatedMinutes | 15                                                   |
| tags             | `starter-v1`, `foundation`                           |
| companies        | `[]` — shared foundation, no supported company claim |
| assetIds         | `[]` — files deferred                                |
| reviewedAt       | `null` — human review pending                        |
| externalUrl      | Omitted; self-contained original material            |

**source:** Original PrepPilot practice material, prepared for editorial review; not company-specific.

**attribution:** AI-assisted original PrepPilot wording, examples and worked solution; not human-reviewed. Standard concepts are not claimed as proprietary.

### prompt

Read this original passage: 'The lab opens on weekdays. On Tuesdays, only students who have completed safety training may use the soldering stations. Visitors may observe from the marked area.' Which conclusion is supported? A: every trained student uses a station on Tuesday. B: an untrained student may not use a station on Tuesday. C: visitors may use a station on Tuesday. Explain why the other options go beyond the passage.

### explanation — hide until the learner requests it

B is supported. The training condition is required for student station use on Tuesday. A turns permission/eligibility into actual use; the passage does not say all eligible students attend. C confuses observing from a marked area with permission to operate a station. Nothing here establishes weekend opening or rules for other weekdays.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## apt-verbal-paragraph-order

| Admin field      | Proposed value                                                |
| ---------------- | ------------------------------------------------------------- |
| slug             | `apt-verbal-paragraph-order`                                  |
| title            | Order sentences using references and explicit transition cues |
| subject          | `aptitude`                                                    |
| topic            | `verbal_ability`                                              |
| type             | `question`                                                    |
| difficulty       | `medium`                                                      |
| estimatedMinutes | 30                                                            |
| tags             | `starter-v1`, `foundation`                                    |
| companies        | `[]` — shared foundation, no supported company claim          |
| assetIds         | `[]` — files deferred                                         |
| reviewedAt       | `null` — human review pending                                 |
| externalUrl      | Omitted; self-contained original material                     |

**source:** Original PrepPilot practice material, prepared for editorial review; not company-specific.

**attribution:** AI-assisted original PrepPilot wording, examples and worked solution; not human-reviewed. Standard concepts are not claimed as proprietary.

### prompt

Arrange these original sentences into a coherent paragraph. A: 'This result prompted a second trial with fresh seeds.' B: 'In the first trial, the team placed ten seeds on moist paper.' C: 'After four days, eight of those seeds had sprouted.' D: 'The second trial used the same conditions and again produced eight sprouts.' Explain the linking references rather than relying only on chronology.

### explanation — hide until the learner requests it

The intended order is B,C,A,D. B introduces the first trial and seeds; 'those seeds' in C refers back to them. 'This result' in A refers to eight sprouts and introduces a second trial. D refers to that second trial and compares its outcome with the first. The chain of introduced entities and explicit first/second references supports the order. This is not evidence that ten seeds predict an exact 80% germination rate in general.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## apt-verbal-parallel-structure

| Admin field      | Proposed value                                       |
| ---------------- | ---------------------------------------------------- |
| slug             | `apt-verbal-parallel-structure`                      |
| title            | Repair a list with parallel grammatical forms        |
| subject          | `aptitude`                                           |
| topic            | `verbal_ability`                                     |
| type             | `question`                                           |
| difficulty       | `easy`                                               |
| estimatedMinutes | 15                                                   |
| tags             | `starter-v1`, `foundation`                           |
| companies        | `[]` — shared foundation, no supported company claim |
| assetIds         | `[]` — files deferred                                |
| reviewedAt       | `null` — human review pending                        |
| externalUrl      | Omitted; self-contained original material            |

**source:** Original PrepPilot practice material, prepared for editorial review; not company-specific.

**attribution:** AI-assisted original PrepPilot wording, examples and worked solution; not human-reviewed. Standard concepts are not claimed as proprietary.

### prompt

Revise 'The workshop teaches planning a solution, how to test it, and documenting results' so all three listed activities have parallel grammatical form. Preserve the three activities and provide one valid rewrite.

### explanation — hide until the learner requests it

One rewrite is: 'The workshop teaches planning a solution, testing it, and documenting results.' All three objects use gerund phrases. Another valid rewrite uses 'how to plan a solution, how to test it, and how to document results'. Parallelism improves the coordination without changing the activities. Several equivalent revisions are acceptable; this is not a single-string answer task.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.
