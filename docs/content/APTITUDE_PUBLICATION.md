# Final first-batch aptitude publication

27 October 2026. Explicit owner authorization covers only the two records below.
Local and hosted share `prep_pilot_dev`; all mutations used the authenticated
hosted admin editor and its guarded Save changes / Confirm publish actions.

## Deployment gate, before shared mutations

- Remote `dev` resolved to `feb902c17f86728382d9c9ef20b66bccc2640e36`.
- The owner's Vercel screenshot showed that commit **Ready / Production**.
- Independently, GitHub's public commit-status API returned Vercel **success**,
  description **Deployment has completed**, for that exact full commit and linked
  [the deployment](https://vercel.com/personal-project-5d65/prep-pilot/GAYorCeqRnvFqiS7katVWYdnVpDF).
- The private Vercel dashboard required login in the connected Chrome profile;
  its Ready/Production label is screenshot evidence, not a fresh authenticated
  agent dashboard observation. No settings were changed to obtain access.
- The actual hosted editor exposed duration minimum 1, maximum 60, step 1 and
  the new honest-estimate guidance before either record was edited.

## Editorial reconciliation and results

Both records were re-read at draft revision 2, with 20-minute estimates and null
review dates. Prompts/explanations matched prior reviewed evidence. The mixture
still explicitly specified at least 50 L capacity, initial 40 L, 30% syrup,
two well-mixed 10 L replacements and a final pure-syrup addition without removal.
No question/solution text had changed since that review; no repeated suite was
needed. Existing executable arithmetic/path-enumeration evidence was reused.

| Slug                             | Estimate | Saved revision | Published revision | Publication UTC          |
| -------------------------------- | -------- | -------------- | ------------------ | ------------------------ |
| apt-original-mixture-replacement | 7 min    | 3              | 4                  | 2026-10-27T14:20:03.169Z |
| apt-original-paths-in-small-dag  | 5 min    | 3              | 4                  | 2026-10-27T14:20:44.682Z |

Only estimatedMinutes, attribution and reviewedAt changed on each save. Review
dates record Codex editorial checking, with explicit owner publication
authorization. Attribution states the owner did not personally review/time the
exercise and that the 7/5-minute values are **editorial estimates, not measured
timing**. Source remains Original PrepPilot practice material; company/attachment
arrays remain empty. Titles, slugs, classifications, prompts and solutions stayed
unchanged. The 50 L correction and all correct prior calculations are preserved.

## Actual postchecks

- Admin UI confirmed each publication at revision 4.
- Read-only database inspection confirmed edit audits 2→3 and publish audits
  3→4 for both, with request IDs and only the expected changed fields.
- The catalog revision advanced 19→23, matching the four successful mutations.
  No direct MongoDB writes bypassed the domain workflows.
- Actual hosted GET `/api/v1/content` listed both as available at revision 4,
  with exact 7/5-minute values and no prompt/explanation bodies in summaries.
- Actual hosted student detail GETs returned both available, revision 4, exact
  durations and prompts; the mixture still contained the capacity correction.
  These checks used the eligible verified owner's session against student read
  endpoints, not a separate student login or a new practice journey.
- No attempt, plan, task, preference, role or unrelated content mutation was
  submitted. No additional import, commit, push, deployment, application build,
  repeated suite or EPERM investigation occurred in this publication checkpoint.

All six imported first-batch items are now published; with running totals the
catalog has seven published questions, 112 estimated minutes across six canonical
topics. It is still a small catalog: no resources and incomplete topic coverage.
New plans may use published short items; historical saved task estimates are
unchanged. No plan was generated or accepted as part of this task.
