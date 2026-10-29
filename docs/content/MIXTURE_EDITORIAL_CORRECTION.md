# Mixture draft: proposed capacity clarification

Later duration-policy decision: the proposed honest estimate is 7 minutes, not
measured timing. New 1–60 minute validation must be deployed before this is saved
in shared data. CONTENT_DURATION_POLICY.md supersedes the old minimum-duration
hold below; no live duration or publication changed in that implementation task.

27 October later checkpoint: a fuller version of this clarification was saved
through the authorized admin editor at draft revision 2. See
FIRST_FIVE_PUBLICATION_REVIEW.md for the exact saved prompt. Correctness passed;
publication remains held on duration suitability, with reviewedAt null. The
proposal and instructions below record the earlier pre-authorization state.

27 October 2026. Editorial proposal only: **not applied, approved or published**.
Do not reimport this existing slug or alter the hash-pinned original import batch.

## Exact admin edit

Open `apt-original-mixture-replacement` in the Content Library, then Edit.
Read-only snapshot: draft, revision 1, ID `6adf5c7974e71abce42cc744`.
Compare the current saved version before editing; if it changed, reconcile rather
than overwriting it. Replace only the prompt with:

> A container with a capacity of at least 50 L initially holds 40 L of a well-mixed solution containing 30% syrup. Remove 10 L and replace with water, mix, and repeat once. Find syrup remaining after each step and final concentration. How much pure syrup must be added afterward (no liquid removed) to reach 30%? Assume volumes add.

The 50 L capacity explicitly accommodates the required 7.5 L addition without
giving away that answer in the question. Replacement means adding 10 L of water
after withdrawing 10 L of mixture, restoring the initial 40 L each time.

Leave all other fields unchanged: title **Two replacements in a mixture**,
subject `aptitude`, topic `quantitative`, type `question`, difficulty `medium`,
`estimatedMinutes: 20`, source **Original PrepPilot practice material.**,
attribution **AI-assisted original PrepPilot exercise and worked answer; pending
human editorial review.**, company associations empty, attachments empty, content
review date null. Timing remains an unmeasured estimate, not an approved duration.

## Solution check

- Initially: 40 × 0.30 = 12 L syrup.
- Each well-mixed withdrawal retains 30/40 = 3/4 of the syrup.
- First replacement: 9 L syrup in 40 L.
- Second replacement: 6.75 L in 40 L = 16.875%.
- Restore concentration: (6.75 + x)/(40 + x) = 0.30.
- Therefore 0.70x = 5.25, x = 7.5 L; final volume 47.5 L.
- Final check: 14.25/47.5 = 30%. Adding 5.25 L is incorrect because the
  denominator also increases. The saved explanation has the correct mathematics.

Save the draft, inspect its saved preview, and independently review the prompt,
examples, explanation, attribution and real study duration. Only the human
reviewer may complete publication review and publish. Do not pad the exercise if
its genuine study time is below the publication minimum.
