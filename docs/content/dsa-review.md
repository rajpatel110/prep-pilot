# DSA starter review pack

Review-only proposal v1. All items are AI-assisted, human review pending, and not inserted or published. JSON is the authoritative field-value companion. All entries have companies: [], assetIds: [], reviewedAt: null. Leave optional blank fields omitted, not null, on creation. Do not paste this Markdown metadata into a learning body.

## dsa-arrays-running-totals

| Admin field      | Proposed value                                       |
| ---------------- | ---------------------------------------------------- |
| slug             | `dsa-arrays-running-totals`                          |
| title            | Build running totals without changing the input      |
| subject          | `dsa`                                                |
| topic            | `arrays`                                             |
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

Given an integer array of length 0–1000, return a new array whose element at index i is the sum from index 0 through i. Do not change the input. Values are between -1000 and 1000; use zero-based indexes. Example: [4,-2,5,0] gives [4,2,7,7]. Empty input gives []. Write pseudocode or code, explain the loop invariant, and test a single negative value and all zeros.

### explanation — hide until the learner requests it

Keep total = 0 and a separate result. For each value, add it to total and append total. After processing index i, total equals exactly the sum of the first i+1 values, so the appended value meets the definition. The example accumulates 4,2,7,7. [-3] gives [-3]; [0,0] gives [0,0]. Empty input never enters the loop. Time O(n); result space O(n), auxiliary space excluding output O(1). This is an indexed scan, not a sorting operation.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## dsa-arrays-inclusive-range-sums

| Admin field      | Proposed value                                       |
| ---------------- | ---------------------------------------------------- |
| slug             | `dsa-arrays-inclusive-range-sums`                    |
| title            | Answer inclusive range sums with a prefix table      |
| subject          | `dsa`                                                |
| topic            | `arrays`                                             |
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

An integer array has length 1–1000. Each query [left,right] satisfies 0 ≤ left ≤ right ≤ n-1. Return each inclusive range sum without modifying the input. For [6,-2,4,3], queries [[0,2],[1,3],[2,2]] must give [8,5,4]. Construct one reusable prefix table, explain why a leading zero matters, and test the full range and a range beginning at zero.

### explanation — hide until the learner requests it

Define prefix[0]=0 and prefix[i+1]=prefix[i]+values[i]. The example table is [0,6,4,8,11]. A query is prefix[right+1]-prefix[left], subtracting the sum strictly before left. Results are 8-0=8, 11-6=5, 8-4=4. Full range [0,3] gives 11; [0,0] gives 6. Preprocessing O(n), each query O(1), total O(n+q), table O(n). This extends a scan into repeated queries; it does not use a sliding window.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## dsa-strings-ascii-palindrome

| Admin field      | Proposed value                                       |
| ---------------- | ---------------------------------------------------- |
| slug             | `dsa-strings-ascii-palindrome`                       |
| title            | Check a normalized ASCII palindrome                  |
| subject          | `dsa`                                                |
| topic            | `strings`                                            |
| type             | `question`                                           |
| difficulty       | `easy`                                               |
| estimatedMinutes | 20                                                   |
| tags             | `starter-v1`, `foundation`                           |
| companies        | `[]` — shared foundation, no supported company claim |
| assetIds         | `[]` — files deferred                                |
| reviewedAt       | `null` — human review pending                        |
| externalUrl      | Omitted; self-contained original material            |

**source:** Original PrepPilot practice material, prepared for editorial review; not company-specific.

**attribution:** AI-assisted original PrepPilot wording, examples and worked solution; not human-reviewed. Standard concepts are not claimed as proprietary.

### prompt

Input is a string of 0–1000 ASCII characters. Ignore characters other than A–Z, a–z and 0–9, and compare letters case-insensitively. Return whether the remaining sequence is a palindrome. 'Step on no pets!' gives true; 'Prep 42' gives false; punctuation-only and empty inputs give true. Supply an algorithm and explain why the empty normalized sequence qualifies.

### explanation — hide until the learner requests it

One approach builds a lowercase sequence containing only ASCII letters/digits, then compares mirrored positions. 'Step on no pets!' becomes 'steponnopets', which reads identically in reverse. 'Prep 42' becomes 'prep42', whose first/last characters differ. There are no mismatched pairs in an empty or one-character sequence, so both are true. Time O(n) and normalization space O(n). Alternatively skip excluded characters with two pointers for O(1) extra space. The ASCII restriction avoids silently treating UTF-16 code units as all Unicode characters.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## dsa-strings-indexing-and-unicode

| Admin field      | Proposed value                                                                                                               |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| slug             | `dsa-strings-indexing-and-unicode`                                                                                           |
| title            | Read string indexes without confusing Unicode units                                                                          |
| subject          | `dsa`                                                                                                                        |
| topic            | `strings`                                                                                                                    |
| type             | `resource`                                                                                                                   |
| difficulty       | `easy`                                                                                                                       |
| estimatedMinutes | 15                                                                                                                           |
| tags             | `starter-v1`, `foundation`                                                                                                   |
| companies        | `[]` — shared foundation, no supported company claim                                                                         |
| assetIds         | `[]` — files deferred                                                                                                        |
| reviewedAt       | `null` — human review pending                                                                                                |
| externalUrl      | [Inspected reference/practice page](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) |

**source:** Original PrepPilot learning note with reference: MDN Web Docs, String reference (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String).

**attribution:** AI-assisted original note and exercises; MDN Web Docs, String reference is the linked reference, not a source of copied exercises. No endorsement. Link inspected by agent on 2026-10-25; human content review pending.

### body

## Goal

Distinguish a string index from a user-perceived character.

Read the MDN String section on UTF-16 code units, code points and grapheme clusters. JavaScript length and bracket indexing count UTF-16 units; iteration by the string iterator follows code points, not necessarily whole visible graphemes. Strings are immutable: a method returns a value rather than changing a character in place.

## Guided practice

Spend five minutes reading, five tracing, and five explaining. Compare 'CAT', '😄' and ''. Predict length, then verify locally: 3, 2 and 0. Explain why spreading '😄' produces one element while its length is 2. Do not generalize that every emoji is one code point.

## Self-check

ASCII-only exercises can use simple indexes under their stated contract. For unrestricted natural-language text, choose the intended unit explicitly before writing a palindrome or substring algorithm.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## dsa-hashing-word-frequencies

| Admin field      | Proposed value                                       |
| ---------------- | ---------------------------------------------------- |
| slug             | `dsa-hashing-word-frequencies`                       |
| title            | Count exact tokens with a frequency map              |
| subject          | `dsa`                                                |
| topic            | `hashing`                                            |
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

Given 0–1000 already-tokenized lowercase words, return a map from word to frequency. Each word contains 1–40 lowercase ASCII letters. Tokens are compared exactly; do not tokenize or normalize text. ['red','blue','red','green','blue','red'] gives {red:3,blue:2,green:1}. Output key order is irrelevant. Explain how absent keys are handled, and test [] and ['x','x'].

### explanation — hide until the learner requests it

Start with an empty map. For each token set its count to the previous count, or zero if absent, plus one. The example has three red, two blue and one green. [] gives {}; ['x','x'] gives {x:2}. Use a real map rather than relying on inherited object-property names. With the bounded word length and average constant-time hash-map operations, expected time is O(n) and space O(k) for k distinct words. If word lengths were unbounded, hashing/comparison and key storage would also depend on total characters; do not silently treat arbitrarily long strings as constant-cost keys. Worst-case hash behavior depends on the implementation.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## dsa-hashing-complement-pair

| Admin field      | Proposed value                                                                          |
| ---------------- | --------------------------------------------------------------------------------------- |
| slug             | `dsa-hashing-complement-pair`                                                           |
| title            | Find one pair of distinct indexes by complements                                        |
| subject          | `dsa`                                                                                   |
| topic            | `hashing`                                                                               |
| type             | `question`                                                                              |
| difficulty       | `medium`                                                                                |
| estimatedMinutes | 30                                                                                      |
| tags             | `starter-v1`, `foundation`                                                              |
| companies        | `[]` — shared foundation, no supported company claim                                    |
| assetIds         | `[]` — files deferred                                                                   |
| reviewedAt       | `null` — human review pending                                                           |
| externalUrl      | [Inspected reference/practice page](https://leetcode.com/problems/two-sum/description/) |

**source:** Original PrepPilot practice material, prepared for editorial review; not company-specific. Related external practice: LeetCode, https://leetcode.com/problems/two-sum/description/.

**attribution:** AI-assisted original PrepPilot wording, examples and worked solution; not human-reviewed. Standard concepts are not claimed as proprietary. The linked challenge is related practice with its own constraints, not a claim that this original variant or explanation came from LeetCode. Page inspected by agent on 2026-10-25; no company provenance inferred.

### prompt

Given 0–1000 integers between -1000 and 1000 and a target in that range, return any two distinct zero-based indexes whose values sum to the target, or [] if none exist. [-3,4,8,12] with target 9 gives [0,3]. [5,5] with target 10 gives [0,1]; [5] with target 10 gives []. Explain duplicates and why lookup must precede insertion. Optional related external practice uses its own constraints; this PrepPilot variant also permits no solution.

### explanation — hide until the learner requests it

Scan from left to right with a map from earlier value to index. For current value v, look up target-v first; if present, return that earlier index and the current index. Only then store v. This prevents using one element twice and handles [5,5]. In the first example, 12 looks for -3 and finds index 0. If the scan ends, return []. Expected time O(n), space O(n), assuming average constant-time map operations. The independently written prompt/example/solution are not copied from the linked challenge.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## dsa-sorting-insertion-trace

| Admin field      | Proposed value                                       |
| ---------------- | ---------------------------------------------------- |
| slug             | `dsa-sorting-insertion-trace`                        |
| title            | Trace insertion sort and equal-key stability         |
| subject          | `dsa`                                                |
| topic            | `sorting`                                            |
| type             | `question`                                           |
| difficulty       | `easy`                                               |
| estimatedMinutes | 30                                                   |
| tags             | `starter-v1`, `foundation`                           |
| companies        | `[]` — shared foundation, no supported company claim |
| assetIds         | `[]` — files deferred                                |
| reviewedAt       | `null` — human review pending                        |
| externalUrl      | Omitted; self-contained original material            |

**source:** Original PrepPilot practice material, prepared for editorial review; not company-specific.

**attribution:** AI-assisted original PrepPilot wording, examples and worked solution; not human-reviewed. Standard concepts are not claimed as proprietary.

### prompt

Sort [7,3,5,3] ascending using insertion sort. After each outer pass, show the whole array. Shift an earlier element only when it is strictly greater than the key. Separately label the two 3s as 3a and 3b in their original order: which appears first after sorting, and why? Explain sorted, reverse-sorted and empty inputs.

### explanation — hide until the learner requests it

The three passes give [3,7,5,3], [3,5,7,3], [3,3,5,7]. The second 3 is inserted after the earlier 3 because equality does not cause a shift, so 3a remains before 3b. This implementation is stable. The prefix before each new key is already sorted. With the usual early stopping inner loop, sorted input needs O(n) comparisons; reverse order needs O(n²) work. Extra space O(1); empty input has no passes. Stability follows from the comparison rule, not from every algorithm named sorting.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## dsa-sorting-stable-keys

| Admin field      | Proposed value                                                                    |
| ---------------- | --------------------------------------------------------------------------------- |
| slug             | `dsa-sorting-stable-keys`                                                         |
| title            | Choose stable sort keys without changing records                                  |
| subject          | `dsa`                                                                             |
| topic            | `sorting`                                                                         |
| type             | `resource`                                                                        |
| difficulty       | `easy`                                                                            |
| estimatedMinutes | 15                                                                                |
| tags             | `starter-v1`, `foundation`                                                        |
| companies        | `[]` — shared foundation, no supported company claim                              |
| assetIds         | `[]` — files deferred                                                             |
| reviewedAt       | `null` — human review pending                                                     |
| externalUrl      | [Inspected reference/practice page](https://docs.python.org/3/howto/sorting.html) |

**source:** Original PrepPilot learning note with reference: Python Software Foundation, Sorting Techniques (https://docs.python.org/3/howto/sorting.html).

**attribution:** AI-assisted original note and exercises; Python Software Foundation, Sorting Techniques is the linked reference, not a source of copied exercises. No endorsement. Link inspected by agent on 2026-10-25; human content review pending.

### body

## Goal

Understand an ascending key sort and what equal keys preserve. Arrays/indexed sequences are the configured prerequisite; this note does not replace them.

Read the Python sorting guide's basics, key functions and stability sections. sorted creates a new list; list.sort changes the list. A stable key sort retains original order only among records with equal keys.

## Exercise

For [('Mira',2),('Omar',1),('Nia',2)], sort ascending by the numeric field without changing the original list. Expected order: Omar, Mira, Nia. Then sort by (numeric field, name): Omar, Mira, Nia again. Explain that a different secondary key can deliberately change an equal-primary-key order.

## Self-check

A key function chooses comparison data; it does not imply that names disappear from output. Spend five minutes reading, five tracing the example and five explaining stability in your own words.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## dsa-searching-binary-exact-index

| Admin field      | Proposed value                                                                                |
| ---------------- | --------------------------------------------------------------------------------------------- |
| slug             | `dsa-searching-binary-exact-index`                                                            |
| title            | Find an exact value in a sorted unique array                                                  |
| subject          | `dsa`                                                                                         |
| topic            | `searching`                                                                                   |
| type             | `question`                                                                                    |
| difficulty       | `easy`                                                                                        |
| estimatedMinutes | 20                                                                                            |
| tags             | `starter-v1`, `foundation`                                                                    |
| companies        | `[]` — shared foundation, no supported company claim                                          |
| assetIds         | `[]` — files deferred                                                                         |
| reviewedAt       | `null` — human review pending                                                                 |
| externalUrl      | [Inspected reference/practice page](https://leetcode.com/problems/binary-search/description/) |

**source:** Original PrepPilot practice material, prepared for editorial review; not company-specific. Related external practice: LeetCode, https://leetcode.com/problems/binary-search/description/.

**attribution:** AI-assisted original PrepPilot wording, examples and worked solution; not human-reviewed. Standard concepts are not claimed as proprietary. The linked challenge is related practice with its own constraints, not a claim that this original variant or explanation came from LeetCode. Page inspected by agent on 2026-10-25; no company provenance inferred.

### prompt

Given an ascending array of distinct integers, length 0–1000, return the zero-based index of target or -1. Use binary search, not a linear scan. For [-8,-1,3,9,14], target 9 gives 3 and target 2 gives -1. Empty input gives -1. State a consistent interval convention. The optional linked challenge has its own constraints; our empty-input case is an extension.

### explanation — hide until the learner requests it

Use inclusive bounds low=0, high=n-1. While low is at most high, inspect mid=low+floor((high-low)/2). Return mid on equality. If the middle value is less than target, set low=mid+1; otherwise high=mid-1. Every discarded index cannot hold the target because of sorted order. On exhaustion return -1. For target 9, middle value 3 discards the left portion and index 3 is found next. Empty input starts with high=-1. Time O(log n) for nonempty inputs, extra space O(1).

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## dsa-searching-first-equal-index

| Admin field      | Proposed value                                       |
| ---------------- | ---------------------------------------------------- |
| slug             | `dsa-searching-first-equal-index`                    |
| title            | Return the first occurrence among sorted duplicates  |
| subject          | `dsa`                                                |
| topic            | `searching`                                          |
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

Given an ascending integer array allowing duplicates, return the first index containing target or -1. Length is 0–1000. For [1,2,2,2,6], target 2 gives 1, target 6 gives 4 and target 4 gives -1. Use O(log n) time and explain why returning the first equal midpoint is insufficient.

### explanation — hide until the learner requests it

Use binary search with answer=-1. On equality save mid but continue left by setting high=mid-1. On a value below target move low right; on a value above target move high left. Saving equality keeps a known candidate while narrowing to earlier possibilities. Midpoint 2 initially matches in the example, but further search finds index 1. For [2,2], target 2 gives 0; [] gives -1. Time O(log n), extra space O(1). Exact search and first occurrence have different equality handling.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## dsa-linked-lists-reverse-chain

| Admin field      | Proposed value                                        |
| ---------------- | ----------------------------------------------------- |
| slug             | `dsa-linked-lists-reverse-chain`                      |
| title            | Reverse a singly linked chain without losing its tail |
| subject          | `dsa`                                                 |
| topic            | `linked_lists`                                        |
| type             | `question`                                            |
| difficulty       | `easy`                                                |
| estimatedMinutes | 25                                                    |
| tags             | `starter-v1`, `foundation`                            |
| companies        | `[]` — shared foundation, no supported company claim  |
| assetIds         | `[]` — files deferred                                 |
| reviewedAt       | `null` — human review pending                         |
| externalUrl      | Omitted; self-contained original material             |

**source:** Original PrepPilot practice material, prepared for editorial review; not company-specific.

**attribution:** AI-assisted original PrepPilot wording, examples and worked solution; not human-reviewed. Standard concepts are not claimed as proprietary.

### prompt

A singly linked list has nodes with value and next, ends at null, and contains no cycle. Reverse its links in place and return the new head. A→B→C→null becomes C→B→A→null. Describe the three references you maintain. Test an empty list and one node. Do not allocate replacement nodes.

### explanation — hide until the learner requests it

Maintain previous=null and current=head. Before changing current.next, save its old next as nextNode. Point current.next to previous, then advance previous=current and current=nextNode. At termination previous is the new head. Saving nextNode prevents losing the unprocessed suffix. A single node ends pointing to null and remains the head; null input returns null. Time O(n), extra space O(1). The returned head matters because the original head is now the tail.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## dsa-linked-lists-insert-after

| Admin field      | Proposed value                                       |
| ---------------- | ---------------------------------------------------- |
| slug             | `dsa-linked-lists-insert-after`                      |
| title            | Reason about inserting one linked-list node          |
| subject          | `dsa`                                                |
| topic            | `linked_lists`                                       |
| type             | `resource`                                           |
| difficulty       | `easy`                                               |
| estimatedMinutes | 15                                                   |
| tags             | `starter-v1`, `foundation`                           |
| companies        | `[]` — shared foundation, no supported company claim |
| assetIds         | `[]` — files deferred                                |
| reviewedAt       | `null` — human review pending                        |
| externalUrl      | Omitted; self-contained original material            |

**source:** Original PrepPilot learning note, prepared for editorial review; not company-specific.

**attribution:** AI-assisted original PrepPilot wording, examples and worked solution; not human-reviewed. Standard concepts are not claimed as proprietary.

### body

## Goal

Separate a node's identity from its value, and preserve a chain while editing links.

A singly linked node stores a value and a reference to its successor; the head is a reference, not an array index. For A→C→null, insert new node B immediately after A: first set B.next to A.next, then set A.next to B. The result is A→B→C→null. Reversing those assignments can lose the reference to C unless it was saved elsewhere.

## Practice

Draw the two assignments and trace an insertion after the tail C: the new node points to null. Explain why two nodes with value 5 can still be different nodes. Explain that inserting after a known node is O(1), but finding that node may take O(n).

## Self-check

This operation assumes the predecessor exists and the new node is not already linked into this chain. Empty-head insertion is a separate case. Spend five minutes drawing, five tracing and five explaining these contracts.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## dsa-stacks-balanced-brackets

| Admin field      | Proposed value                                       |
| ---------------- | ---------------------------------------------------- |
| slug             | `dsa-stacks-balanced-brackets`                       |
| title            | Validate bracket nesting with a stack                |
| subject          | `dsa`                                                |
| topic            | `stacks_queues`                                      |
| type             | `question`                                           |
| difficulty       | `easy`                                               |
| estimatedMinutes | 25                                                   |
| tags             | `starter-v1`, `foundation`                           |
| companies        | `[]` — shared foundation, no supported company claim |
| assetIds         | `[]` — files deferred                                |
| reviewedAt       | `null` — human review pending                        |
| externalUrl      | Omitted; self-contained original material            |

**source:** Original PrepPilot practice material, prepared for editorial review; not company-specific.

**attribution:** AI-assisted original PrepPilot wording, examples and worked solution; not human-reviewed. Standard concepts are not claimed as proprietary.

### prompt

Input contains only (), [] and {} and has length 0–1000. Return whether brackets are balanced and properly nested. '([]{})' gives true; '([)]' gives false; ']' gives false; '' gives true. Write a stack algorithm and identify why counts alone do not establish nesting.

### explanation — hide until the learner requests it

Push each opening bracket. On a closing bracket, reject if the stack is empty or its top is not the matching opener; otherwise pop. At the end require an empty stack. In '([)]', ')' encounters '[' on top and rejects despite matching overall counts. A lone closer fails immediately; a leftover opener such as '(' fails at the end. Empty input is valid. Time O(n), worst-case stack space O(n). This is LIFO matching, not FIFO processing.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## dsa-stacks-queues-fifo-lifo

| Admin field      | Proposed value                                       |
| ---------------- | ---------------------------------------------------- |
| slug             | `dsa-stacks-queues-fifo-lifo`                        |
| title            | Trace FIFO and LIFO on the same arrivals             |
| subject          | `dsa`                                                |
| topic            | `stacks_queues`                                      |
| type             | `resource`                                           |
| difficulty       | `easy`                                               |
| estimatedMinutes | 15                                                   |
| tags             | `starter-v1`, `foundation`                           |
| companies        | `[]` — shared foundation, no supported company claim |
| assetIds         | `[]` — files deferred                                |
| reviewedAt       | `null` — human review pending                        |
| externalUrl      | Omitted; self-contained original material            |

**source:** Original PrepPilot learning note, prepared for editorial review; not company-specific.

**attribution:** AI-assisted original PrepPilot wording, examples and worked solution; not human-reviewed. Standard concepts are not claimed as proprietary.

### body

## Goal

Distinguish processing policy from a particular implementation.

Enqueue A, B, C into an initially empty queue. Two dequeues return A then B and leave C. Push A, B, C onto an empty stack. Two pops return C then B and leave A. Queue is FIFO; stack is LIFO.

## Practice

Trace enqueue A, enqueue B, dequeue, enqueue C, dequeue. Outputs A then B; the queue finally contains C. Explain why undo history often uses a stack, while a simple arrival-order work line uses a queue. Real schedulers may add priorities, so not every work system is FIFO.

## Implementation check

A linked queue with head/tail or circular buffer can provide O(1) enqueue/dequeue. Removing the first element from a contiguous array may require O(n) shifts; naming a variable queue does not remove that cost. Spend five minutes drawing, five tracing and five choosing an implementation.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## dsa-trees-height-in-edges

| Admin field      | Proposed value                                           |
| ---------------- | -------------------------------------------------------- |
| slug             | `dsa-trees-height-in-edges`                              |
| title            | Calculate binary-tree height with an explicit convention |
| subject          | `dsa`                                                    |
| topic            | `trees`                                                  |
| type             | `question`                                               |
| difficulty       | `easy`                                                   |
| estimatedMinutes | 20                                                       |
| tags             | `starter-v1`, `foundation`                               |
| companies        | `[]` — shared foundation, no supported company claim     |
| assetIds         | `[]` — files deferred                                    |
| reviewedAt       | `null` — human review pending                            |
| externalUrl      | Omitted; self-contained original material                |

**source:** Original PrepPilot practice material, prepared for editorial review; not company-specific.

**attribution:** AI-assisted original PrepPilot wording, examples and worked solution; not human-reviewed. Standard concepts are not claimed as proprietary.

### prompt

Use height measured in edges: an empty tree has height -1 and a leaf has height 0. Tree R has left child L and right child M; L has left child P; M and P are leaves. These are the only edges; other child references are null. Return the height, give pseudocode or code for a recursive algorithm, and explain its base case. Also evaluate an empty tree, a leaf and a three-node chain. Assume a finite tree without cycles.

### explanation — hide until the learner requests it

Return -1 for null. Otherwise return 1+max(height(left),height(right)). In the example P and M have height 0, L has height 1, and R has height 2. Empty tree is -1, leaf is 0, and a three-node chain has 2 edges. The convention matters: a node-count definition would give different numbers. Visit each node once: O(n) time and O(h+1) call-stack space for height h, worst-case O(n) for a chain.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## dsa-trees-global-bst-bounds

| Admin field      | Proposed value                                       |
| ---------------- | ---------------------------------------------------- |
| slug             | `dsa-trees-global-bst-bounds`                        |
| title            | Detect a binary-search-tree violation below the root |
| subject          | `dsa`                                                |
| topic            | `trees`                                              |
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

Validate a binary search tree with distinct integer keys, all left-descendant keys strictly smaller and all right-descendant keys strictly larger. Root 20 has left 10 and right 30; node 10 has right child 25. Is it valid? Explain a general O(n) method; test an empty tree and an equal-valued child. Assume no cycles.

### explanation — hide until the learner requests it

It is invalid: 25 is in root 20's left subtree, so it must be less than 20 even though it exceeds its immediate parent 10. Carry optional exclusive lower/upper bounds. At each node reject a key outside its bounds; recurse left with upper=current key and right with lower=current key. Use absent bounds instead of a numeric sentinel that could equal a legal key. Empty tree is valid; a child equal to its parent is invalid under this distinct-key contract. O(n) time, O(h+1) stack space.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## dsa-graphs-breadth-first-distances

| Admin field      | Proposed value                                       |
| ---------------- | ---------------------------------------------------- |
| slug             | `dsa-graphs-breadth-first-distances`                 |
| title            | Find shortest unweighted distances with BFS          |
| subject          | `dsa`                                                |
| topic            | `graphs`                                             |
| type             | `question`                                           |
| difficulty       | `easy`                                               |
| estimatedMinutes | 30                                                   |
| tags             | `starter-v1`, `foundation`                           |
| companies        | `[]` — shared foundation, no supported company claim |
| assetIds         | `[]` — files deferred                                |
| reviewedAt       | `null` — human review pending                        |
| externalUrl      | Omitted; self-contained original material            |

**source:** Original PrepPilot practice material, prepared for editorial review; not company-specific.

**attribution:** AI-assisted original PrepPilot wording, examples and worked solution; not human-reviewed. Standard concepts are not claimed as proprietary.

### prompt

An undirected unweighted graph has vertices A,B,C,D,E and edges A–B, A–C, B–D, C–D; E is isolated. Starting at A, return each vertex's shortest edge distance, using null for unreachable. Process neighbor labels alphabetically for a deterministic trace. Describe a queue algorithm and when to mark a vertex visited.

### explanation — hide until the learner requests it

Distances are A:0, B:1, C:1, D:2, E:null. Set A to 0 and enqueue it. When exploring a vertex, assign each undiscovered neighbor distance=current+1 and enqueue it immediately. Marking on enqueue prevents B and C both queuing D. FIFO processes distance layers in order, which gives shortest paths only for equal-weight edges. With neighbor lists already in the required order, the traversal takes O(V+E) time and O(V) extra space. Sorting unsorted neighbor lists adds preprocessing cost. Neighbor ordering affects trace/parents but not these distances.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## dsa-graphs-adjacency-and-components

| Admin field      | Proposed value                                             |
| ---------------- | ---------------------------------------------------------- |
| slug             | `dsa-graphs-adjacency-and-components`                      |
| title            | Represent an undirected graph, including isolated vertices |
| subject          | `dsa`                                                      |
| topic            | `graphs`                                                   |
| type             | `resource`                                                 |
| difficulty       | `easy`                                                     |
| estimatedMinutes | 15                                                         |
| tags             | `starter-v1`, `foundation`                                 |
| companies        | `[]` — shared foundation, no supported company claim       |
| assetIds         | `[]` — files deferred                                      |
| reviewedAt       | `null` — human review pending                              |
| externalUrl      | Omitted; self-contained original material                  |

**source:** Original PrepPilot learning note, prepared for editorial review; not company-specific.

**attribution:** AI-assisted original PrepPilot wording, examples and worked solution; not human-reviewed. Standard concepts are not claimed as proprietary.

### body

## Goal

Represent topology without inventing a tree prerequisite.

For vertices A,B,C,D with undirected edges A–B and B–C, an adjacency list is A:[B], B:[A,C], C:[B], D:[]. Include D even though it has no neighbor. Each undirected edge appears in two lists. This graph has two connected components: {A,B,C} and {D}.

## Practice

Add edge C–D and redraw both affected lists. All vertices then belong to one component. Draw an adjacency matrix in order A,B,C,D: set both symmetric cells for an edge, and keep the diagonal zero when no self-loops exist. Explain why a disconnected graph is not a single tree.

## Tradeoff

Adjacency lists use O(V+E) storage; a matrix uses O(V²). Which is smaller depends on graph density. Assume a simple finite graph with no parallel edges in this exercise. Spend five minutes drawing each representation and five comparing them.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## dsa-dp-one-or-two-step-climb

| Admin field      | Proposed value                                       |
| ---------------- | ---------------------------------------------------- |
| slug             | `dsa-dp-one-or-two-step-climb`                       |
| title            | Count staircase routes with a small recurrence       |
| subject          | `dsa`                                                |
| topic            | `dynamic_programming`                                |
| type             | `question`                                           |
| difficulty       | `easy`                                               |
| estimatedMinutes | 25                                                   |
| tags             | `starter-v1`, `foundation`                           |
| companies        | `[]` — shared foundation, no supported company claim |
| assetIds         | `[]` — files deferred                                |
| reviewedAt       | `null` — human review pending                        |
| externalUrl      | Omitted; self-contained original material            |

**source:** Original PrepPilot practice material, prepared for editorial review; not company-specific.

**attribution:** AI-assisted original PrepPilot wording, examples and worked solution; not human-reviewed. Standard concepts are not claimed as proprietary.

### prompt

A staircase has n steps, where n is an integer from 0 through 30. Each move climbs 1 or 2 steps. Count ordered move sequences that reach exactly n. There is one way to climb zero steps: make no moves. For n=4, the answer is 5. Derive a recurrence, list those five routes, and compute n=0,1,2.

### explanation — hide until the learner requests it

Let ways[0]=1 and ways[1]=1. For n at least 2, ways[n]=ways[n-1]+ways[n-2], partitioning routes by whether the last move used one or two steps. The five routes for 4 are 1111,112,121,211,22. Values for 0,1,2 are 1,1,2. Retain only the previous two counts for O(n) time and O(1) extra space, with an explicit n=0 case. The empty route is a defined base case, not zero ways. No mastery of another topic is inferred.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.

## dsa-dp-non-adjacent-reward

| Admin field      | Proposed value                                          |
| ---------------- | ------------------------------------------------------- |
| slug             | `dsa-dp-non-adjacent-reward`                            |
| title            | Maximize non-adjacent rewards, allowing an empty choice |
| subject          | `dsa`                                                   |
| topic            | `dynamic_programming`                                   |
| type             | `question`                                              |
| difficulty       | `medium`                                                |
| estimatedMinutes | 30                                                      |
| tags             | `starter-v1`, `foundation`                              |
| companies        | `[]` — shared foundation, no supported company claim    |
| assetIds         | `[]` — files deferred                                   |
| reviewedAt       | `null` — human review pending                           |
| externalUrl      | Omitted; self-contained original material               |

**source:** Original PrepPilot practice material, prepared for editorial review; not company-specific.

**attribution:** AI-assisted original PrepPilot wording, examples and worked solution; not human-reviewed. Standard concepts are not claimed as proprietary.

### prompt

Given 0–30 integer rewards between -100 and 100, choose any subset of indexes with no two consecutive indexes and maximize the sum. Choosing no indexes is permitted. [5,1,2,10,6] gives 15 using indexes 0 and 3. [-4,-2] gives 0. Explain why choosing the current largest value greedily can fail, and return the maximum sum only.

### explanation — hide until the learner requests it

Let best[i] be the best sum using the first i values. best[0]=0 and best[1]=max(0,values[0]) when nonempty. For i at least 2, best[i]=max(best[i-1],best[i-2]+values[i-1]). Skipping or taking the last index partitions valid choices. For the example the prefix best values are 0,5,5,7,15,15. Empty or all-negative arrays give 0. Greedy largest-first fails on [4,5,4]: picking 5 loses the optimal 4+4=8. O(n) time and O(1) extra space with two rolling totals.

**Editorial sign-off:** pending. Confirm correctness, learning scope, duration and difficulty; do not mark reviewed merely because schema checks pass.
