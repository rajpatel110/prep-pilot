# Review the five imported drafts

Latest checkpoint: no remaining first-five drafts. Queue/SQL/OOP are published
at revision 3; mixture/DAG are published at revision 4 with 7/5-minute estimates.
See APTITUDE_PUBLICATION.md for the final authorized saves, publication and reads.
The review guidance and snapshots below are historical, not outstanding actions.

Duration policy update: 1–60 minute support is implemented but not deployed.
Proposed mixture/DAG estimates are 7/5 minutes (not measured). See
CONTENT_DURATION_POLICY.md; do not save short values against the old hosted build.
Earlier 15-minute timing holds below are historical policy, not instructions to
pad questions. No new publication is performed by the duration implementation.

Superseded by the authorized 27 October review in FIRST_FIVE_PUBLICATION_REVIEW.md:
queue, SQL and OOP are published at revision 3. Mixture wording is corrected;
mixture and DAG remain drafts at revision 2 due to duration-suitability holds.
The guidance and earlier snapshots below are retained as historical context.

27 October read-only refresh: the same five remain drafts at revision 1; the
missing-range item remains published at revision 3. Next-eight slugs are absent.
See FIRST_BATCH_STUDENT_WALKTHROUGH.md for the exact snapshot and coverage limits.
MIXTURE_EDITORIAL_CORRECTION.md provides the precise proposed admin prompt edit;
it has not been applied. Existing arithmetic/enumeration evidence is reused.

26 October 2026: user reports six imported, **Find the missing range member**
published at revision 3 and its student practice passed. The interrupted task's
read-only inspection independently found that published revision and these five
drafts at revision 1. Student practice was not rerun. Local and hosted share
prep_pilot_dev. These notes are guidance, not human approval; review dates remain
pending. Exact proposed prompts/answers are in COMPANY_BATCH_REVIEW.md.

## reported-queue-via-two-stacks

- Ask: implement FIFO enqueue, dequeue and peek using two stacks; empty reads return null.
- Approach: push into input; transfer to output only when output is empty. Peek does not remove a value.
- Enqueue 4, enqueue 7, peek, dequeue, enqueue 9, dequeue, dequeue, dequeue gives read results **4, 4, 7, 9, null**. Seven must precede nine.
- Check empty/repeated/interleaved cases. Amortized O(1), worst single transfer O(n), storage O(n).
- Attribution: LTM-085/134 candidate-reported intent, with editorial constraints; not an official or verbatim question.
- Review: implementation/complexity and unmeasured 25-minute estimate remain pending.

## reported-sql-sales-join-lab

- Ask: include every product, aggregate sales and distinguish sale rows from known amounts.
- Approach: products LEFT JOIN sales; group by product ID/name; COALESCE(SUM(amount),0), COUNT(sales.id), COUNT(sales.amount).
- Expected (ID, name, total, sale count, known amount count): **(1, Pen, 50, 2, 2), (2, Book, 0, 1, 0), (3, Bag, 0, 0, 0)**.
- COUNT(*) wrongly counts Bag's placeholder. NULL amount is unknown, not intrinsically zero. The sale with NULL product_id belongs to no product. RIGHT JOIN retains that sale; FULL JOIN also retains Bag.
- Attribution: LTM-074/077 and COG-075, related reported intents combined into an editorial lab.
- Prior SQLite semantic checks passed; PostgreSQL engine execution is unverified. Official PostgreSQL [joins](https://www.postgresql.org/docs/current/queries-table-expressions.html) and [aggregates](https://www.postgresql.org/docs/current/functions-aggregate.html) were inspected during the interrupted review. Confirm SQL and unmeasured 20-minute timing.

## reported-oop-four-pillars-design

- Ask: model PaymentMethod, CardPayment/TestPayment and Checkout; explain encapsulation, abstraction, subtyping and polymorphism.
- Approach: hide state, expose a pay contract and have Checkout use it. Checkout's HAS-A relationship is composition.
- TestPayment.pay(100) records [100]; zero is a no-op; negative minor-unit amounts fail before effects.
- Distinguish type inheritance/subtyping from implementation inheritance. An interface solution satisfies the prompt's subtyping wording but does not demonstrate inherited code. Accept that rubric explicitly, or clarify the saved draft if a base class is intended.
- Attribution: LTM-081 and COG-016; editorial exercise, not production payment security. Human rubric review and unmeasured 20-minute timing remain pending.

## apt-original-mixture-replacement

- Ask: replace two well-mixed 10 L portions of an initially 40 L, 30% syrup mixture with water; restore 30% by adding pure syrup without removal.
- Work: 12 L syrup → 9 L → **6.75 L**, or **16.875%**. Solve (6.75+x)/(40+x)=0.3 → **7.5 L**; final 14.25/47.5 = 30%.
- **Clarify before publishing:** “40 L tank” may imply fixed capacity. Say “initially contains 40 L, with sufficient spare capacity”; the last step needs 47.5 L capacity. Make this correction through the admin draft.
- Re-mix before each withdrawal. Adding 5.25 L incorrectly holds the denominator fixed.
- Original PrepPilot practice; no company claim. Prior arithmetic evidence stands, but capacity wording and unmeasured 20-minute timing require human review.

## apt-original-paths-in-small-dag

- Ask: enumerate directed S-to-T paths, count those visiting A/avoiding D, then add C→D.
- Initially **S-A-C-T, S-A-D-T, S-B-D-T**: total 3, visiting A 2, avoiding D 1.
- Added edge creates **S-A-C-D-T**: total 4, visiting A 3, avoiding D still 1.
- Follow only listed arrow directions; do not invent reverse edges or count prefixes. The graph is acyclic.
- Original PrepPilot practice; no company claim. Prior enumeration passed; unmeasured 20-minute timing remains pending. Hold if too short rather than padding time.

## Admin review

Open the saved draft, solve the question independently, compare examples/edges,
then explanation, attribution and duration. Save corrections and preview the
saved revision. Complete the publication review yourself before publishing.
Resolve mixture capacity wording first. Publishing affects local and hosted
student access. No draft was edited or approved by this review task.
