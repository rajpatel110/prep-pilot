# Company batch v1 — editorial approval sheet

29 October release: bubble sort, longest unique window, weak peak and duplicate
values passed independent Codex editorial checks and were published at revision 3
under explicit owner authorization. See `COVERAGE_RELEASE_EIGHT.md` for the exact
reviewed record file, clarified explanations, retained candidate provenance,
estimated durations and audit/read evidence. The original proposal text below is
unchanged and does not represent these saved revisions or personal owner review.

Historical first-five receipt: FIRST_FIVE_PUBLICATION_REVIEW.md records the
27 October queue/SQL/OOP publications and the then-current mixture/DAG holds.
APTITUDE_PUBLICATION.md records their subsequent publication at revision 4.
The source proposals below are unchanged historical candidates,
not current saved attribution, review dates or publication state.

**Original source proposals, not a live catalog snapshot.** Publication and correction receipts are in FIRST_FIVE_PUBLICATION_REVIEW.md, APTITUDE_PUBLICATION.md and COVERAGE_RELEASE_EIGHT.md. Exact proposed admin fields are in `company-batch.v1.json` → `candidates[].content`; this sheet preserves source prompts/answers rather than overwriting them with live revisions. Estimates are unmeasured; current rules support 1–60 whole minutes without padding. Proposals retain null content review dates. Company labels are intended `student_reported`, not official or `verified`.

Source wording lives in the two source lists. Cohesive multi-part adaptations combine related references without asserting those original questions were identical. Provenance-review time must be supplied honestly at import, separately from later content publication review. Contributor confirmation is not approval of the solutions or editorial constraints.

## 1. Bubble sort with stable duplicates

- Slug: `reported-bubble-sort-implementation`
- Classification: dsa / sorting / question / easy
- Estimated study time: 25 minutes (unmeasured; review required).
- Intended company labels: ltm.
- References: LTM-035.
- Source: Candidate-reported interview question, confirmed by the contributor; not an official company publication. References: LTM-035.
- Attribution: AI-assisted PrepPilot editorial adaptation; original source wording preserved separately. Not human-reviewed.
- Open editorial concern: Editorial constraints, examples, solutions and duration require human review and timing calibration.

### Prompt

Editorial adaptation, not the exact interview specification.

Return an ascending copy of an integer array using adjacent swaps and an early-stop flag. Length 0–1000; values −10000 through 10000. Trace [3,1,2,1], and explain empty, singleton and already sorted inputs. Do not mutate the input.

### Explanation / worked examples

Passes: [1,2,1,3], then [1,1,2,3], then no swaps. Swap only when the left value is greater; equal values do not cross, so the algorithm is stable. Empty/singleton need no comparisons. Best case O(n), worst O(n²); the copy uses O(n) space.

## 2. Reverse word order, not characters

- Slug: `reported-reverse-word-order`
- Classification: dsa / strings / question / easy
- Estimated study time: 20 minutes (unmeasured; review required).
- Intended company labels: ltm.
- References: LTM-036.
- Source: Candidate-reported interview question, confirmed by the contributor; not an official company publication. References: LTM-036.
- Attribution: AI-assisted PrepPilot editorial adaptation; original source wording preserved separately. Not human-reviewed.
- Open editorial concern: Editorial constraints, examples, solutions and duration require human review and timing calibration.

### Prompt

Editorial adaptation, not the exact interview specification.

For an ASCII string of length 0–2000, split words on spaces and tabs, reverse their order and join with one space. Punctuation remains part of a word. Give an algorithm and test blank input and repeated words. Example: ' prep\twith care ' → 'care with prep'.

### Explanation / worked examples

Tokenize, reverse the token list, join with one space. Empty or all-space/tab input returns ''. 'Raj Raj' stays 'Raj Raj'; 'hi, all!' becomes 'all! hi,'. Time and auxiliary storage O(n). Do not reverse characters within a word.

## 3. Count ASCII character classes

- Slug: `reported-ascii-character-classes`
- Classification: dsa / strings / question / easy
- Estimated study time: 15 minutes (unmeasured; review required).
- Intended company labels: ltm.
- References: LTM-034.
- Source: Candidate-reported interview question, confirmed by the contributor; not an official company publication. References: LTM-034.
- Attribution: AI-assisted PrepPilot editorial adaptation; original source wording preserved separately. Not human-reviewed.
- Open editorial concern: Editorial constraints, examples, solutions and duration require human review and timing calibration.

### Prompt

Editorial adaptation, not the exact interview specification.

Count mutually exclusive letters (A–Z/a–z), digits (0–9), whitespace (space/tab/newline), and other characters in ASCII input of length 0–1000. Trace 'A9 !\tb', empty input and '007'; explain the classification order and complexity.

### Explanation / worked examples

'A9 !\tb' has 2 letters, 1 digit, 2 whitespace, 1 other: total 6. Empty input yields four zeros; '007' has 3 digits. Test each character against the four disjoint categories; all other ASCII characters, including other controls, are 'other'. Time O(n), counters O(1).

## 4. Character counts and repeated characters

- Slug: `reported-character-counts-duplicates`
- Classification: dsa / hashing / question / easy
- Estimated study time: 20 minutes (unmeasured; review required).
- Intended company labels: cognizant.
- References: COG-091, COG-092.
- Source: Candidate-reported interview question, confirmed by the contributor; not an official company publication. References: COG-091, COG-092.
- Attribution: AI-assisted PrepPilot editorial adaptation; original source wording preserved separately. Not human-reviewed.
- Open editorial concern: Editorial constraints, examples, solutions and duration require human review and timing calibration.

### Prompt

Editorial adaptation, not the exact interview specification.

For lowercase ASCII input of length 0–1000, return alphabetically ordered (character,count) pairs and a second list containing only pairs with count at least 2. Implement and test banana, empty input, abc and aaaa.

### Explanation / worked examples

Use 26 counters and scan them in alphabetic order. banana → [(a,3),(b,1),(n,2)], repeats [(a,3),(n,2)]. Empty → two empty lists; abc has no repeats; aaaa gives [(a,4)] in both. Time O(n+26), counter space O(26). This is a cohesive two-part adaptation, not two identical source questions.

## 5. Palindromes within an inclusive range

- Slug: `reported-palindromes-inclusive-range`
- Classification: dsa / strings / question / easy
- Estimated study time: 20 minutes (unmeasured; review required).
- Intended company labels: ltm.
- References: LTM-040.
- Source: Candidate-reported interview question, confirmed by the contributor; not an official company publication. References: LTM-040.
- Attribution: AI-assisted PrepPilot editorial adaptation; original source wording preserved separately. Not human-reviewed.
- Open editorial concern: Editorial constraints, examples, solutions and duration require human review and timing calibration.

### Prompt

Editorial adaptation, not the exact interview specification.

Given integers 0 ≤ low ≤ high ≤ 100000, return all decimal palindromes in the inclusive range in ascending order. No leading zeros. Implement and test [95,105], [0,0], [10,10], [11,11]. State complexity.

### Explanation / worked examples

Compare each number's decimal representation with its reverse. Results: [99,101], [0], [], [11]. For width W and at most d digits, time O(Wd), temporary space O(d) excluding output. Zero is a palindrome; leading-zero representations are not used.

## 6. First N decimal palindromes

- Slug: `reported-first-n-numeric-palindromes`
- Classification: dsa / strings / question / easy
- Estimated study time: 20 minutes (unmeasured; review required).
- Intended company labels: ltm.
- References: LTM-041.
- Source: Candidate-reported interview question, confirmed by the contributor; not an official company publication. References: LTM-041.
- Attribution: AI-assisted PrepPilot editorial adaptation; original source wording preserved separately. Not human-reviewed.
- Open editorial concern: Editorial constraints, examples, solutions and duration require human review and timing calibration.

### Prompt

Editorial adaptation, not the exact interview specification.

Return the first N nonnegative decimal palindromes in ascending order, with zero first; 0 ≤ N ≤ 100. No leading zeros. Implement enumeration and test N=0,1,12. Explain how this differs from an inclusive-range query.

### Explanation / worked examples

Scan integers from zero, append when decimal text equals its reverse, stop after N successes. N=0 → []; N=1 → [0]; N=12 → [0,1,2,3,4,5,6,7,8,9,11,22]. Time O(Md) through the final scanned number M; temporary O(d), plus output. This is not the same specification as palindromes within a range.

## 7. Longest substring without repeated ASCII characters

- Slug: `reported-longest-unique-window`
- Classification: dsa / strings / question / medium
- Estimated study time: 30 minutes (unmeasured; review required).
- Intended company labels: cognizant.
- References: COG-093.
- Source: Candidate-reported interview question, confirmed by the contributor; not an official company publication. References: COG-093.
- Attribution: AI-assisted PrepPilot editorial adaptation; original source wording preserved separately. Not human-reviewed.
- Open editorial concern: Editorial constraints, examples, solutions and duration require human review and timing calibration.

### Prompt

Editorial adaptation, not the exact interview specification.

Return (length,start) of the longest contiguous substring with no repeated characters; choose earliest start on ties. ASCII length 0–2000; spaces and case matter. Empty input returns (0,0). Trace abba, abcabcbb and aaaa; give a linear-time algorithm.

### Explanation / worked examples

Maintain last-seen indices and a left boundary. Set left=max(left,lastSeen[c]+1), then record c's index. Update the best only for a strictly longer window. abba → (2,0), abcabcbb → (3,0), aaaa → (1,0). Never move left backwards. O(n) time, O(128) space.

## 8. Find the missing range member

- Slug: `reported-missing-range-member`
- Classification: dsa / arrays / question / easy
- Estimated study time: 20 minutes (unmeasured; review required).
- Intended company labels: cognizant.
- References: COG-090.
- Source: Candidate-reported interview question, confirmed by the contributor; not an official company publication. References: COG-090.
- Attribution: AI-assisted PrepPilot editorial adaptation; original source wording preserved separately. Not human-reviewed.
- Open editorial concern: Editorial constraints, examples, solutions and duration require human review and timing calibration.

### Prompt

Editorial adaptation, not the exact interview specification.

An array contains N distinct integers from 0 through N, with exactly one missing; 0 ≤ N ≤ 10000. Find it without sorting or mutation. Trace [3,0,1], [], [0], [1]; explain why duplicate input is outside the contract.

### Explanation / worked examples

XOR every integer 0 through N and every array member. Pairs cancel, leaving the missing value: 2,0,1,0 respectively. O(n) time, O(1) space. The bounded values fit ordinary 32-bit XOR. Duplicate or out-of-range input violates the premise and is not silently repaired.

## 9. Second distinct maximum

- Slug: `reported-second-distinct-maximum`
- Classification: dsa / arrays / question / easy
- Estimated study time: 20 minutes (unmeasured; review required).
- Intended company labels: cognizant.
- References: COG-088.
- Source: Candidate-reported interview question, confirmed by the contributor; not an official company publication. References: COG-088.
- Attribution: AI-assisted PrepPilot editorial adaptation; original source wording preserved separately. Not human-reviewed.
- Open editorial concern: Editorial constraints, examples, solutions and duration require human review and timing calibration.

### Prompt

Editorial adaptation, not the exact interview specification.

Find the second DISTINCT maximum in one pass without sorting or mutation; return null if fewer than two distinct values exist. Length 0–1000, integers −10000 through 10000. Trace [5,5,2,4], [-2,-8,-3], [], [7], [7,7].

### Explanation / worked examples

Maintain optional maximum and second maximum, not zero sentinels. On a new maximum move the old maximum into second; otherwise update second only for a distinct smaller value above the current second. Outputs 4,−3,null,null,null. O(n) time and O(1) space. Equal maxima do not count as second.

## 10. Find a weak peak by binary search

- Slug: `reported-weak-peak-search`
- Classification: dsa / searching / question / medium
- Estimated study time: 25 minutes (unmeasured; review required).
- Intended company labels: cognizant.
- References: COG-089.
- Source: Candidate-reported interview question, confirmed by the contributor; not an official company publication. References: COG-089.
- Attribution: AI-assisted PrepPilot editorial adaptation; original source wording preserved separately. Not human-reviewed.
- Open editorial concern: Editorial constraints, examples, solutions and duration require human review and timing calibration.

### Prompt

Editorial adaptation, not the exact interview specification.

For a nonempty array of 1–1000 integers, return any index whose value is at least each existing neighbor. Endpoints have one neighbor; duplicates allowed. Give an O(log n) algorithm, trace [1,3,2], [2,2], [1], and explain monotone inputs.

### Explanation / worked examples

With inclusive low/high, compare mid with mid+1. If the latter is greater, set low=mid+1; otherwise high=mid. An ascending edge leads toward a weak peak; the other half also retains a weak peak. Return low. Example indices 1,0,0. Increasing arrays return last; decreasing arrays return first. O(log n) time, O(1) space. Weak-peak semantics are an editorial clarification.

## 11. A FIFO queue from two stacks

- Slug: `reported-queue-via-two-stacks`
- Classification: dsa / stacks_queues / question / medium
- Estimated study time: 25 minutes (unmeasured; review required).
- Intended company labels: ltm.
- References: LTM-085, LTM-134.
- Source: Candidate-reported interview question, confirmed by the contributor; not an official company publication. References: LTM-085, LTM-134.
- Attribution: AI-assisted PrepPilot editorial adaptation; original source wording preserved separately. Not human-reviewed.
- Open editorial concern: Editorial constraints, examples, solutions and duration require human review and timing calibration.

### Prompt

Editorial adaptation, not the exact interview specification.

Implement enqueue, dequeue and peek using two stacks, at most 1000 operations. Empty reads return null. Trace enqueue(4), enqueue(7), peek, dequeue, enqueue(9), dequeue, dequeue, dequeue; explain amortized and worst-case time.

### Explanation / worked examples

Push enqueues onto input. For a read, transfer all input elements to output only if output is empty. Read/pop output top, or null. Read results: 4,4,7,9,null. Each element crosses stacks at most once, so amortized O(1) per operation, worst-case O(n) for a transfer, O(n) space.

## 12. Repeated integer values in first-occurrence order

- Slug: `reported-duplicate-integer-values`
- Classification: dsa / hashing / question / easy
- Estimated study time: 20 minutes (unmeasured; review required).
- Intended company labels: ltm.
- References: LTM-028.
- Source: Candidate-reported interview question, confirmed by the contributor; not an official company publication. References: LTM-028.
- Attribution: AI-assisted PrepPilot editorial adaptation; original source wording preserved separately. Not human-reviewed.
- Open editorial concern: Editorial constraints, examples, solutions and duration require human review and timing calibration.

### Prompt

Editorial adaptation, not the exact interview specification.

Return every integer occurring at least twice, once each, ordered by its FIRST occurrence in the original array. Length 0–1000; values −10000 through 10000. Trace [4,2,4,4,2,7], [], [3,3,3], [-1,0,-1].

### Explanation / worked examples

Count values, then scan the original array and emit an eligible value only if not already emitted. Outputs [4,2], [], [3], [-1]. Expected O(n) time and O(k) space with hash tables. Ordering by when a duplicate is detected would not in general satisfy first-occurrence ordering.

## 13. Salary ranking, ties and NULL

- Slug: `reported-salary-ranking-lab`
- Classification: cs / dbms / question / medium
- Estimated study time: 20 minutes (unmeasured; review required).
- Intended company labels: ltm, cognizant.
- References: LTM-078, LTM-079, COG-077.
- Source: Candidate-reported interview question, confirmed by the contributor; not an official company publication. References: LTM-078, LTM-079, COG-077.
- Attribution: AI-assisted PrepPilot editorial adaptation; original source wording preserved separately. Not human-reviewed.
- Open editorial concern: Editorial constraints, examples, solutions and duration require human review and timing calibration.

### Prompt

Editorial adaptation, not the exact interview specification.

PostgreSQL 18: employees(id integer PRIMARY KEY,name text,salary integer NULL). Rows (1,A,100),(2,B,200),(3,C,200),(4,D,NULL),(5,E,150). Write queries for all highest-paid employees and all employees with the second DISTINCT salary. Compare RANK, DENSE_RANK and ROW_NUMBER. Explain all-NULL and single-distinct-salary cases.

### Explanation / worked examples

Highest: SELECT * FROM employees WHERE salary=(SELECT MAX(salary) FROM employees); IDs 2,3. Second: WITH ranked AS (SELECT *,DENSE_RANK() OVER (ORDER BY salary DESC) AS r FROM employees WHERE salary IS NOT NULL) SELECT id,name,salary FROM ranked WHERE r=2; ID 5. Non-NULL ranks are RANK 1,1,3,4; DENSE_RANK 1,1,2,3; ROW_NUMBER with id as an additional tie-breaker 1,2,3,4. All-NULL gives neither result; one distinct salary gives no second. Row order is unspecified unless ORDER BY is used.

## 14. Anti-join with nullable right-hand values

- Slug: `reported-sql-antijoin-null-lab`
- Classification: cs / dbms / question / easy
- Estimated study time: 15 minutes (unmeasured; review required).
- Intended company labels: ltm.
- References: LTM-075.
- Source: Candidate-reported interview question, confirmed by the contributor; not an official company publication. References: LTM-075.
- Attribution: AI-assisted PrepPilot editorial adaptation; original source wording preserved separately. Not human-reviewed.
- Open editorial concern: Editorial constraints, examples, solutions and duration require human review and timing calibration.

### Prompt

Editorial adaptation, not the exact interview specification.

PostgreSQL 18: a(id integer PRIMARY KEY) contains 1,2,3; b(id integer NULL) contains 2,2,NULL. Return a IDs absent from b. Explain NOT EXISTS, a LEFT JOIN alternative, NOT IN with NULL, and empty b.

### Explanation / worked examples

SELECT a.id FROM a WHERE NOT EXISTS (SELECT 1 FROM b WHERE b.id=a.id) ORDER BY a.id; returns 1,3. LEFT JOIN b ON b.id=a.id WHERE b.id IS NULL is equivalent here, because a matched equality cannot have NULL b.id. NOT IN is unsafe here: the NULL makes nonmatching comparisons unknown. Empty b returns 1,2,3.

## 15. Sales totals without losing unsold products

- Slug: `reported-sql-sales-join-lab`
- Classification: cs / dbms / question / medium
- Estimated study time: 20 minutes (unmeasured; review required).
- Intended company labels: ltm, cognizant.
- References: LTM-074, LTM-077, COG-075.
- Source: Candidate-reported interview question, confirmed by the contributor; not an official company publication. References: LTM-074, LTM-077, COG-075.
- Attribution: AI-assisted PrepPilot editorial adaptation; original source wording preserved separately. Not human-reviewed.
- Open editorial concern: Editorial constraints, examples, solutions and duration require human review and timing calibration.

### Prompt

Editorial adaptation, not the exact interview specification.

PostgreSQL 18: products(id integer PRIMARY KEY,name text): (1,Pen),(2,Book),(3,Bag). sales(id integer PRIMARY KEY,product_id integer NULL,amount integer NULL): (10,1,20),(11,1,30),(12,2,NULL),(13,NULL,40). Return every product's known total (zero when no known amount), sale-row count and known-amount count. Compare join types.

### Explanation / worked examples

SELECT p.id,p.name,COALESCE(SUM(s.amount),0) AS total,COUNT(s.id) AS sale_rows,COUNT(s.amount) AS known_amounts FROM products p LEFT JOIN sales s ON s.product_id=p.id GROUP BY p.id,p.name ORDER BY p.id; results (1,Pen,50,2,2),(2,Book,0,1,0),(3,Bag,0,0,0). COUNT(*) incorrectly counts Bag's placeholder row. INNER omits Bag; RIGHT retains unmatched sale 13 but omits Bag; FULL retains both. NULL amount is unknown, not literally zero; output-zero is the requested convention.

## 16. Duplicate emails and SQL counting rules

- Slug: `reported-sql-duplicates-lab`
- Classification: cs / dbms / question / easy
- Estimated study time: 15 minutes (unmeasured; review required).
- Intended company labels: cognizant.
- References: COG-078, COG-072, COG-074.
- Source: Candidate-reported interview question, confirmed by the contributor; not an official company publication. References: COG-078, COG-072, COG-074.
- Attribution: AI-assisted PrepPilot editorial adaptation; original source wording preserved separately. Not human-reviewed.
- Open editorial concern: Editorial constraints, examples, solutions and duration require human review and timing calibration.

### Prompt

Editorial adaptation, not the exact interview specification.

PostgreSQL 18: registrations(id integer PRIMARY KEY,email text NULL), rows (1,a@x),(2,a@x),(3,b@x),(4,NULL),(5,NULL). Find repeated non-NULL emails and all rows belonging to those groups. Compare DISTINCT email, COUNT(email), COUNT(*), COUNT(DISTINCT email); include empty-table behavior.

### Explanation / worked examples

SELECT email,COUNT(_) FROM registrations WHERE email IS NOT NULL GROUP BY email HAVING COUNT(_)>1; gives a@x,2. Filter registrations with email IN (that grouped email subquery) to return IDs 1,2. DISTINCT returns a@x,b@x,NULL once each. Counts are 3,5,2. Empty table: no groups, aggregate counts 0. Exact case-sensitive sample strings only; row order requires ORDER BY.

## 17. Choose an index from a workload

- Slug: `reported-dbms-index-workload`
- Classification: cs / dbms / question / medium
- Estimated study time: 20 minutes (unmeasured; review required).
- Intended company labels: ltm.
- References: LTM-062, LTM-073.
- Source: Candidate-reported interview question, confirmed by the contributor; not an official company publication. References: LTM-062, LTM-073.
- Attribution: AI-assisted PrepPilot editorial adaptation; original source wording preserved separately. Not human-reviewed.
- Open editorial concern: Editorial constraints, examples, solutions and duration require human review and timing calibration.

### Prompt

Editorial adaptation, not the exact interview specification.

PostgreSQL 18 orders(id integer PRIMARY KEY,customer_id integer NOT NULL,status text,created_at timestamp NOT NULL) receives frequent writes. Main query filters customer_id by equality, orders created_at descending and takes 20 rows. Propose one candidate index, discuss supported predicates, write cost and how to validate it.

### Explanation / worked examples

Candidate: CREATE INDEX ON orders(customer_id,created_at DESC). Its leading key supports customer equality and ordered timestamps within that customer. It does not guarantee efficient date-only or status-only access. The primary key already indexes id. Every maintained index costs writes and storage. Compare EXPLAIN plans and measured workload behavior on representative data before deployment; no speedup is promised. Avoid indexing every column by default.

## 18. Deadlock and a consistent lock order

- Slug: `reported-os-deadlock-resource-graph`
- Classification: cs / operating_systems / question / easy
- Estimated study time: 15 minutes (unmeasured; review required).
- Intended company labels: ltm, cognizant.
- References: LTM-063, COG-045.
- Source: Candidate-reported interview question, confirmed by the contributor; not an official company publication. References: LTM-063, COG-045.
- Attribution: AI-assisted PrepPilot editorial adaptation; original source wording preserved separately. Not human-reviewed.
- Open editorial concern: Editorial constraints, examples, solutions and duration require human review and timing calibration.

### Prompt

Editorial adaptation, not the exact interview specification.

Two nonpreemptible exclusive locks A and B: T1 holds A and waits for B; T2 holds B and waits for A. Draw the wait/resource cycle, identify the four necessary deadlock conditions and propose a consistent acquisition order. Discuss failure cleanup and timeouts.

### Explanation / worked examples

Cycle T1→B→T2→A→T1. Mutual exclusion, hold-and-wait, no preemption, circular wait all hold. Requiring every thread to acquire A before B removes circular wait. Release acquired locks on every failure path. A timeout is not by itself a fix unless partial acquisition is rolled back and locks released; repeated retry can still starve. This is a language-neutral adaptation, not a Java API guarantee.

## 19. Explain OOP through a payment test double

- Slug: `reported-oop-four-pillars-design`
- Classification: cs / oop / question / easy
- Estimated study time: 20 minutes (unmeasured; review required).
- Intended company labels: ltm, cognizant.
- References: LTM-081, COG-016.
- Source: Candidate-reported interview question, confirmed by the contributor; not an official company publication. References: LTM-081, COG-016.
- Attribution: AI-assisted PrepPilot editorial adaptation; original source wording preserved separately. Not human-reviewed.
- Open editorial concern: Editorial constraints, examples, solutions and duration require human review and timing calibration.

### Prompt

Editorial adaptation, not the exact interview specification.

Sketch a language-neutral PaymentMethod.pay(amountMinorUnits), CardPayment, TestPayment and Checkout design. Amounts are nonnegative integers, negatives rejected before effects; zero is a consistent no-op. Identify encapsulation, abstraction, inheritance/subtyping and polymorphism. Show how a test double records a 100-unit payment without charging anything.

### Explanation / worked examples

Hide mutable provider details behind methods (encapsulation); expose the PaymentMethod contract (abstraction). CardPayment and TestPayment implement the same type; inheritance of implementation is optional. Checkout holds a PaymentMethod (composition) and calls pay without knowing the implementation (polymorphism). TestPayment records [100]; zero adds nothing, negative raises a validation error before recording. Composition itself is not inheritance. This is a design exercise, not production payments code.

## 20. Discounts, tax and a partial return

- Slug: `apt-original-price-discount-tax-return`
- Classification: aptitude / quantitative / question / easy
- Estimated study time: 15 minutes (unmeasured; review required).
- Intended company labels: none; original foundation.
- References: none; original PrepPilot material.
- Source: Original PrepPilot practice material.
- Attribution: AI-assisted original PrepPilot exercise and worked answer; pending human editorial review.
- Open editorial concern: Proposed cohesive practice set; novice timing has not been measured. Hold if it takes less than 15 minutes rather than padding it.

### Prompt

A shop lists each notebook at ₹250. An order of 4 receives 12% discount before 5% tax. Delivery is ₹30, not taxed or refundable. One unopened notebook is returned; refund its discounted, tax-inclusive price. Find discounted subtotal, tax, amount paid and net cost after return. Explain why subtracting 12% from the tax-inclusive final bill is wrong.

### Explanation / worked examples

Subtotal ₹1000×0.88=₹880; tax ₹44; paid ₹954. Refund ₹250×0.88×1.05=₹231; net ₹723. Discount applies to merchandise before tax, not delivery. All calculations are exact rupees here; a different rounding policy would need specifying.

## 21. Work rates with a staged team

- Slug: `apt-original-work-rates-staged`
- Classification: aptitude / quantitative / question / medium
- Estimated study time: 20 minutes (unmeasured; review required).
- Intended company labels: none; original foundation.
- References: none; original PrepPilot material.
- Source: Original PrepPilot practice material.
- Attribution: AI-assisted original PrepPilot exercise and worked answer; pending human editorial review.
- Open editorial concern: Proposed cohesive practice set; novice timing has not been measured. Hold if it takes less than 15 minutes rather than padding it.

### Prompt

A completes a job in 12 hours, B in 18 hours, at constant independent rates. They work together for 3 hours, then A leaves. Find fraction completed, remaining time for B and total elapsed time. Compare with both working throughout, then explain why averaging 12 and 18 is invalid.

### Explanation / worked examples

Combined rate 1/12+1/18=5/36 per hour. In 3 hours:5/12 done;7/12 remains. B takes (7/12)×18=10.5 more hours; total13.5 hours. Together throughout:36/5=7.2 hours. Completion times are reciprocals of rates, so their arithmetic mean is not a combined completion time.

## 22. Two replacements in a mixture

- Slug: `apt-original-mixture-replacement`
- Classification: aptitude / quantitative / question / medium
- Estimated study time: 20 minutes (unmeasured; review required).
- Intended company labels: none; original foundation.
- References: none; original PrepPilot material.
- Source: Original PrepPilot practice material.
- Attribution: AI-assisted original PrepPilot exercise and worked answer; pending human editorial review.
- Open editorial concern: Proposed cohesive practice set; novice timing has not been measured. Hold if it takes less than 15 minutes rather than padding it.

### Prompt

A well-mixed 40 L tank contains 30% syrup. Remove 10 L and replace with water, mix, and repeat once. Find syrup remaining after each step and final concentration. How much pure syrup must be added afterward (no liquid removed) to reach 30%? Assume volumes add.

### Explanation / worked examples

Initially12 L syrup. Each removal retains3/4:9 L then6.75 L. Concentration6.75/40=16.875%. Solve (6.75+x)/(40+x)=0.30:0.7x=5.25, x=7.5 L. Final14.25/47.5=30%. The amount added changes the denominator; adding5.25 L alone is insufficient.

## 23. Two travelers and a stop

- Slug: `apt-original-journey-relative-speed`
- Classification: aptitude / quantitative / question / medium
- Estimated study time: 20 minutes (unmeasured; review required).
- Intended company labels: none; original foundation.
- References: none; original PrepPilot material.
- Source: Original PrepPilot practice material.
- Attribution: AI-assisted original PrepPilot exercise and worked answer; pending human editorial review.
- Open editorial concern: Proposed cohesive practice set; novice timing has not been measured. Hold if it takes less than 15 minutes rather than padding it.

### Prompt

Towns are 180 km apart. A leaves the west town eastward at 60 km/h at 09:00, stops from 10:00 to10:15, then resumes. B leaves the east town westward at 40 km/h at09:30 with no stop. Find meeting time and distances each travels. Verify that the meeting occurs after A resumes.

### Explanation / worked examples

At10:00 A has60 km, B20 km; gap100 km. During A's15-minute stop B travels10 km; gap90 km at10:15. Closing speed100 km/h; remaining0.9 h=54 min, meeting11:09. A travels60+54=114 km; B66 km in1.65h. Sum180 km, so the after-resumption assumption holds.

## 24. Successive growth and recovery

- Slug: `apt-original-successive-percentage-change`
- Classification: aptitude / quantitative / question / easy
- Estimated study time: 15 minutes (unmeasured; review required).
- Intended company labels: none; original foundation.
- References: none; original PrepPilot material.
- Source: Original PrepPilot practice material.
- Attribution: AI-assisted original PrepPilot exercise and worked answer; pending human editorial review.
- Open editorial concern: Proposed cohesive practice set; novice timing has not been measured. Hold if it takes less than 15 minutes rather than padding it.

### Prompt

A fund starts at ₹20000, grows10%, then falls20%, then grows5%; no deposits or fees. Calculate each balance and total percentage change. What percentage rise from the final balance restores the starting amount? Give that rise to two decimal places.

### Explanation / worked examples

Balances22000,17600,18480. Net change−1520/20000=−7.6%. Recovery1520/18480×100≈8.23%. Percentage changes multiply:1.10×0.80×1.05=0.924, not the sum of percentage points.

## 25. Draws without replacement

- Slug: `apt-original-urn-without-replacement`
- Classification: aptitude / quantitative / question / medium
- Estimated study time: 20 minutes (unmeasured; review required).
- Intended company labels: none; original foundation.
- References: none; original PrepPilot material.
- Source: Original PrepPilot practice material.
- Attribution: AI-assisted original PrepPilot exercise and worked answer; pending human editorial review.
- Open editorial concern: Proposed cohesive practice set; novice timing has not been measured. Hold if it takes less than 15 minutes rather than padding it.

### Prompt

An urn has5 red and3 blue balls. Draw2 uniformly without replacement. Find probabilities of both red, one of each, and at least one blue. Given first ball red, find probability second blue. Explain the changed denominator and check the three color-pair probabilities sum to1.

### Explanation / worked examples

Both red C(5,2)/C(8,2)=10/28=5/14. One each15/28. Both blue3/28; totals28/28. At least one blue18/28=9/14. Given first red, second blue3/7. Replacement would instead keep the denominator8; that is not this experiment.

## 26. Capacity planning with integer batches

- Slug: `apt-original-capacity-feasible-batches`
- Classification: aptitude / quantitative / question / medium
- Estimated study time: 20 minutes (unmeasured; review required).
- Intended company labels: none; original foundation.
- References: none; original PrepPilot material.
- Source: Original PrepPilot practice material.
- Attribution: AI-assisted original PrepPilot exercise and worked answer; pending human editorial review.
- Open editorial concern: Proposed cohesive practice set; novice timing has not been measured. Hold if it takes less than 15 minutes rather than padding it.

### Prompt

A workshop makes A batches using3 machine-hours and2 staff-hours each, and B batches using2 machine-hours and4 staff-hours. Daily limits18 machine-hours and24 staff-hours. Nonnegative integer counts, revenue₹40 per A and₹50 per B. Enumerate feasible B counts for each A and find maximum revenue; no fractional batches.

### Explanation / worked examples

Constraints3A+2B≤18 and2A+4B≤24. For A=0..6, maximum B is6,5,5,4,3,1,0 respectively. Revenue at those maxima300,290,330,320,310,250,240. Optimum A2,B5 gives₹330, machine16,staff24. Positive revenues mean only maximal feasible B per A need comparing.

## 27. Enumerate a four-task schedule

- Slug: `apt-original-schedule-explicit-orders`
- Classification: aptitude / logical_reasoning / question / easy
- Estimated study time: 15 minutes (unmeasured; review required).
- Intended company labels: none; original foundation.
- References: none; original PrepPilot material.
- Source: Original PrepPilot practice material.
- Attribution: AI-assisted original PrepPilot exercise and worked answer; pending human editorial review.
- Open editorial concern: Proposed cohesive practice set; novice timing has not been measured. Hold if it takes less than 15 minutes rather than padding it.

### Prompt

Tasks A,B,C,D occupy four sequential slots, each once. A must precede C; B must immediately precede D. List all valid schedules. Then add C before B: which schedule remains? Explain a systematic enumeration rather than guessing.

### Explanation / worked examples

Treat BD as one block; permute A,C,BD with A before C. Valid schedules ACBD,ABDC,BDAC. C before B keeps ACBD only. The immediate-precedence condition is stronger than merely B before D; four tasks still occupy four slots.

## 28. Sequences with explicit rules

- Slug: `apt-original-recurrence-not-guesswork`
- Classification: aptitude / logical_reasoning / question / easy
- Estimated study time: 15 minutes (unmeasured; review required).
- Intended company labels: none; original foundation.
- References: none; original PrepPilot material.
- Source: Original PrepPilot practice material.
- Attribution: AI-assisted original PrepPilot exercise and worked answer; pending human editorial review.
- Open editorial concern: Proposed cohesive practice set; novice timing has not been measured. Hold if it takes less than 15 minutes rather than padding it.

### Prompt

Sequence X starts x1=2 and follows x(n+1)=2x(n)+1. Sequence Y starts y1=1,y2=3 and follows y(n+2)=y(n+1)+y(n). Find first6 terms of each, then decide whether31 belongs among their first6 terms. Explain why an unexplained finite number list cannot uniquely determine a next term.

### Explanation / worked examples

X:2,5,11,23,47,95;31 absent. Y:1,3,4,7,11,18;31 absent. Apply the specified recurrence at each step. Infinitely many other rules can fit a finite prefix, so without a rule a unique extrapolation is not justified.

## 29. Exactly one true statement

- Slug: `apt-original-truth-statements-one-honest`
- Classification: aptitude / logical_reasoning / question / medium
- Estimated study time: 20 minutes (unmeasured; review required).
- Intended company labels: none; original foundation.
- References: none; original PrepPilot material.
- Source: Original PrepPilot practice material.
- Attribution: AI-assisted original PrepPilot exercise and worked answer; pending human editorial review.
- Open editorial concern: Proposed cohesive practice set; novice timing has not been measured. Hold if it takes less than 15 minutes rather than padding it.

### Prompt

Exactly one of A,B,C is responsible. A says 'B is responsible'; B says 'C is responsible'; C says 'B is not responsible'. Exactly one statement is true. Test all three possible responsible people and identify the consistent case. Does the result identify who is always honest?

### Explanation / worked examples

If A responsible: statements F,F,T → one true, valid. If B: T,F,F → one true, also valid. If C:F,T,T → two true, invalid. Responsible person is A OR B; information is insufficient to choose. One utterance cannot establish a person's general honesty. Recognizing non-uniqueness is the intended result.

## 30. Assignments with a unique solution

- Slug: `apt-original-assignment-four-people`
- Classification: aptitude / logical_reasoning / question / medium
- Estimated study time: 20 minutes (unmeasured; review required).
- Intended company labels: none; original foundation.
- References: none; original PrepPilot material.
- Source: Original PrepPilot practice material.
- Attribution: AI-assisted original PrepPilot exercise and worked answer; pending human editorial review.
- Open editorial concern: Proposed cohesive practice set; novice timing has not been measured. Hold if it takes less than 15 minutes rather than padding it.

### Prompt

Ana,Ben,Chen,Divya each receive one distinct task: API,DB,UI,QA. Ana has neither DB nor QA; Ben has DB or QA; Chen has UI; Divya does not have DB. Find assignments, first without and then with the added clue 'Ben does not have QA'. Explain uniqueness.

### Explanation / worked examples

Chen=UI; Ana=API. Ben and Divya must split DB,QA; Divya cannotDB, so Divya=QA and Ben=DB. Unique already. Added clue is redundant. Show the elimination rather than assuming every supplied clue is necessary.

## 31. Count routes through a directed graph

- Slug: `apt-original-paths-in-small-dag`
- Classification: aptitude / logical_reasoning / question / medium
- Estimated study time: 20 minutes (unmeasured; review required).
- Intended company labels: none; original foundation.
- References: none; original PrepPilot material.
- Source: Original PrepPilot practice material.
- Attribution: AI-assisted original PrepPilot exercise and worked answer; pending human editorial review.
- Open editorial concern: Proposed cohesive practice set; novice timing has not been measured. Hold if it takes less than 15 minutes rather than padding it.

### Prompt

Directed edges: S→A,S→B,A→C,A→D,B→D,C→T,D→T. Count S-to-T routes; list them. How many avoid D? How many visit A? What changes if C→D is added? Edges may be followed only in their direction.

### Explanation / worked examples

Original routes S-A-C-T,S-A-D-T,S-B-D-T:3. Avoid D:1; visit A:2. Adding C→D adds S-A-C-D-T, total4, A routes3, avoid D still1. Acyclic graph allows reverse route counts from T; no undirected backtracking or invented edges.

## 32. Survey overlaps and exclusive groups

- Slug: `apt-original-sets-survey-overlap`
- Classification: aptitude / logical_reasoning / question / medium
- Estimated study time: 20 minutes (unmeasured; review required).
- Intended company labels: none; original foundation.
- References: none; original PrepPilot material.
- Source: Original PrepPilot practice material.
- Attribution: AI-assisted original PrepPilot exercise and worked answer; pending human editorial review.
- Open editorial concern: Proposed cohesive practice set; novice timing has not been measured. Hold if it takes less than 15 minutes rather than padding it.

### Prompt

Among60 students,35 study DSA,28 aptitude and12 both; everyone may study neither. Find only DSA, only aptitude, either and neither. If5 currently studying neither join both groups, recalculate all counts. Explain why adding the group sizes double-counts the intersection.

### Explanation / worked examples

Initially onlyDSA23,onlyaptitude16,either51,neither9. After5 join both: sizes40,33,both17; exclusive counts23,16 unchanged; union56,neither4. Inclusion-exclusion subtracts one of the two counts for each shared member.

## 33. Implications, contrapositives and evidence

- Slug: `apt-original-conditional-evidence`
- Classification: aptitude / logical_reasoning / question / medium
- Estimated study time: 20 minutes (unmeasured; review required).
- Intended company labels: none; original foundation.
- References: none; original PrepPilot material.
- Source: Original PrepPilot practice material.
- Attribution: AI-assisted original PrepPilot exercise and worked answer; pending human editorial review.
- Open editorial concern: Proposed cohesive practice set; novice timing has not been measured. Hold if it takes less than 15 minutes rather than padding it.

### Prompt

Policy: if a submission is approved, it has been reviewed (A⇒R). For each observation say whether it violates the policy and what follows: (1) A and notR; (2) R and notA; (3) notR; (4) notA. Give the contrapositive and a counterexample to R⇒A.

### Explanation / worked examples

(1) violates. (2) allowed: review need not mean approval. (3) implies notA. (4) gives no conclusion about R. Contrapositive notR⇒notA. A reviewed but rejected submission has R=true,A=false, refuting the converse. The policy is a requirement, not evidence that every real system complies.

## 34. Read a qualified pilot-study result

- Slug: `apt-original-passage-qualified-inference`
- Classification: aptitude / verbal_ability / question / easy
- Estimated study time: 15 minutes (unmeasured; review required).
- Intended company labels: none; original foundation.
- References: none; original PrepPilot material.
- Source: Original PrepPilot practice material.
- Attribution: AI-assisted original PrepPilot exercise and worked answer; pending human editorial review.
- Open editorial concern: Proposed cohesive practice set; novice timing has not been measured. Hold if it takes less than 15 minutes rather than padding it.

### Prompt

Read: 'In a voluntary two-week pilot,18 of30 participants completed every scheduled session. The organizers did not measure exam results. They plan a longer study before recommending the schedule.' Classify as supported, contradicted or not established:18 completed; every participant completed; the schedule improves exam scores; a longer study is planned. Write a two-sentence summary retaining the limitations.

### Explanation / worked examples

Supported:18 completed and longer study planned. Contradicted:every participant completed (18 of30). Not established:exam-score improvement. Example summary: In a voluntary two-week pilot,18 of30 participants completed all scheduled sessions. Exam results were not measured, and organizers plan a longer study before recommending the schedule. Equivalent accurate wording is acceptable; voluntary participation limits generalization.

## 35. Rewrite parallel task instructions

- Slug: `apt-original-parallel-instructions`
- Classification: aptitude / verbal_ability / question / easy
- Estimated study time: 15 minutes (unmeasured; review required).
- Intended company labels: none; original foundation.
- References: none; original PrepPilot material.
- Source: Original PrepPilot practice material.
- Attribution: AI-assisted original PrepPilot exercise and worked answer; pending human editorial review.
- Open editorial concern: Proposed cohesive practice set; novice timing has not been measured. Hold if it takes less than 15 minutes rather than padding it.

### Prompt

Edit: 'The reviewer is responsible for checking examples, to verify sources, and that estimates are realistic.' Provide two grammatical rewrites preserving all three duties. Explain the parallel structure and identify any meaning changed by replacing 'verify' with 'invent'.

### Explanation / worked examples

Example1: 'The reviewer is responsible for checking examples, verifying sources, and assessing whether estimates are realistic.' Example2: 'The reviewer must check examples, verify sources, and assess whether estimates are realistic.' Gerunds align in1; base verbs align after must in2. 'Invent sources' changes verification into fabrication and does not preserve meaning. Other grammatical meaning-preserving rewrites are acceptable.

## 36. Write a clear request without inventing facts

- Slug: `apt-original-email-clarity-no-invention`
- Classification: aptitude / verbal_ability / question / medium
- Estimated study time: 20 minutes (unmeasured; review required).
- Intended company labels: none; original foundation.
- References: none; original PrepPilot material.
- Source: Original PrepPilot practice material.
- Attribution: AI-assisted original PrepPilot exercise and worked answer; pending human editorial review.
- Open editorial concern: Proposed cohesive practice set; novice timing has not been measured. Hold if it takes less than 15 minutes rather than padding it.

### Prompt

Known facts: your draft is ready; two examples still need checking; you want Mira's review by Friday; no publication date is agreed. Rewrite 'Everything is finished and we will publish Friday, please look' as a concise subject and3-sentence email. Explain which claims must be removed and how to express the deadline as a request.

### Explanation / worked examples

Example subject: 'Draft review requested by Friday'. Body: 'Hi Mira, the draft is ready, but two examples still need checking. Could you review it by Friday? We have not agreed a publication date.' Remove 'everything finished' and the publication promise. Friday is a requested review deadline, not an established commitment. Polite equivalent wording is acceptable.

## 37. Resolve pronouns without changing facts

- Slug: `apt-original-pronouns-and-timing`
- Classification: aptitude / verbal_ability / question / medium
- Estimated study time: 20 minutes (unmeasured; review required).
- Intended company labels: none; original foundation.
- References: none; original PrepPilot material.
- Source: Original PrepPilot practice material.
- Attribution: AI-assisted original PrepPilot exercise and worked answer; pending human editorial review.
- Open editorial concern: Proposed cohesive practice set; novice timing has not been measured. Hold if it takes less than 15 minutes rather than padding it.

### Prompt

Sentence: 'When Sara sent Leena the draft after she revised it, she requested a review.' List the ambiguous references. Rewrite for each specified meaning: (A) Sara revised and requested; (B) Leena revised, Sara sent and requested. Preserve revision before sending and request with sending; explain why the original alone cannot settle the actors.

### Explanation / worked examples

Both instances of 'she' can refer to Sara or Leena; 'it' most naturally denotes the draft. A: 'After revising the draft, Sara sent it to Leena and requested a review.' B: 'After Leena revised the draft, Sara sent it to Leena and requested a review.' The supplied scenarios, not the original pronouns, determine actors. Do not insert approval or publication.

## 38. Order a process paragraph

- Slug: `apt-original-paragraph-logical-order`
- Classification: aptitude / verbal_ability / question / easy
- Estimated study time: 15 minutes (unmeasured; review required).
- Intended company labels: none; original foundation.
- References: none; original PrepPilot material.
- Source: Original PrepPilot practice material.
- Attribution: AI-assisted original PrepPilot exercise and worked answer; pending human editorial review.
- Open editorial concern: Proposed cohesive practice set; novice timing has not been measured. Hold if it takes less than 15 minutes rather than padding it.

### Prompt

Arrange sentences into the only order consistent with their explicit references: A 'Finally, the reviewer approved that corrected draft.' B 'First, the author prepared a draft.' C 'The author then corrected those errors.' D 'Next, the reviewer identified errors in that draft.' Explain each link and write a one-sentence summary without claiming publication.

### Explanation / worked examples

B,D,C,A. 'That draft' in D refers to B, 'those errors' in C refers to D, and 'that corrected draft' in A refers to C. Example summary: The author drafted and corrected the material after review, then the reviewer approved the corrected version. Approval is stated; publication is not.

## 39. Separate observations from causal claims

- Slug: `apt-original-evidence-not-causation`
- Classification: aptitude / verbal_ability / question / medium
- Estimated study time: 20 minutes (unmeasured; review required).
- Intended company labels: none; original foundation.
- References: none; original PrepPilot material.
- Source: Original PrepPilot practice material.
- Attribution: AI-assisted original PrepPilot exercise and worked answer; pending human editorial review.
- Open editorial concern: Proposed cohesive practice set; novice timing has not been measured. Hold if it takes less than 15 minutes rather than padding it.

### Prompt

Report: 'Group A chose the optional workshop:20 of25 passed. Group B did not choose it:30 of50 passed. Groups were not randomly assigned and prior preparation was not recorded.' Calculate pass rates, describe the difference in percentage points, and rewrite 'The workshop caused a20% improvement' to reflect only the evidence. Name two limitations.

### Explanation / worked examples

Rates80% and60%, difference20 percentage points; relative rate difference would be33⅓%, not20%. Example: Workshop participants had an80% observed pass rate versus60% among nonparticipants in this report; it does not establish a causal effect. Self-selection and unmeasured prior preparation limit causal inference. Do not generalize beyond the report.

## Review order

Start with `reported-missing-range-member`, `reported-sql-sales-join-lab`, and `apt-original-mixture-replacement`: they exercise array foundations, careful SQL NULL handling and checked aptitude arithmetic. Inspect related existing candidates before approving another item on an already represented topic. No approval or review timestamp is inferred from this recommendation.
