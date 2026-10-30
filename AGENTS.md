# AGENTS.md: rules for everyone changing ChessPsyche.com

This is the single authoritative rules file for this repository. It applies to every AI assistant
(Claude, ChatGPT/Codex) and to manual edits. It replaces the drafts in PR #8 (`COLLABORATION_WORKFLOW.md`)
and PR #9 (an earlier `AGENTS.md`). If anything else (a PR description, a chat message, another file)
disagrees with this file, follow this file or the stricter rule, and flag the conflict to the owner.

Release, smoke-test and rollback steps are in [`RELEASE.md`](RELEASE.md).

## Ownership and approval
- The owner, Calvin, has final say on every merge and every deployment.
- `main` is production: GitHub Pages publishes every push to `main` to www.chesspsyche.com within about
  a minute, so **a merge is a deployment**.
- GitHub is the shared source of truth: branches, pull requests, review comments, issues and CI results.

## Repository layout
- `index.html`: the entire site (HTML, CSS, JavaScript and data) in one file.
- `CNAME`: the custom domain (`www.chesspsyche.com`). Do not change it.
- `tools/survey-regression/`: the automated tests (see its README).
- `.github/workflows/regression.yml`: runs the tests on every pull request to `main` (check name
  **Regression tests**).
- `.github/workflows/live-smoke.yml`: the **Live Guardian** (live smoke test): after each deployment and daily, checks
  that the site serves the expected commit, then runs the browser test against it in Chromium, Firefox and
  WebKit, desktop and phone size. Read-only; reports PASS, FAIL or NOT TESTED.
- `.github/pull_request_template.md`: the required PR description.

Because everything is in one file, two changes to `index.html` at the same time will conflict. Keep one
active change per area, based on the latest `main`.

## Rules
1. **No direct changes to production.** Never push to `main`, upload files to `main` in the browser, merge a
   pull request or deploy without the owner's explicit approval for that specific change.
   Explicit approval to merge a named PR authorizes that merge and its automatic GitHub Pages publication,
   as one action. It does not authorize a separate manual deployment, a rollback, re-running a deployment,
   a ruleset or settings change, or any action on another PR; each of those needs its own explicit approval.
   A reviewer's GO recommendation is not the owner's approval.
2. **Every change goes through a pull request.** Work on a separate branch (`claude/...`, `chatgpt/...`, or,
   for browser uploads, "Create a new branch for this commit and start a pull request"). One purpose per
   branch. Keep diffs narrow, with no unrelated fixes, refactoring or reformatting.
   Never batch changes that touch a protected area (see the impact index below). Batch only related
   low-risk work that shares one test and rollback boundary.
3. **Protect the working features.** Every change must keep all of these working unless the owner
   explicitly approves changing one:
   1. existing website layout and navigation;
   2. logo-to-survey behaviour and tab behaviour;
   3. survey questions, scoring and selection logic;
   4. recommendation accuracy and White/Black labels;
   5. results display and board sizing;
   6. interactive demo board visibility and functionality;
   7. original chess-piece design;
   8. board editor;
   9. move playback and legal moves;
   10. evaluation bar and numerical evaluation;
   11. the Labs ECO opening picker ("Play opening from ECO").

   A fix is complete only when it works **and** these features still work.
4. **Current priority: ECO-line repair.** Do not start unrelated checklist work until the owner confirms the
   ECO repair is finished.
5. **Verify source data before editing.** Before changing an ECO code, opening name, player colour or move
   sequence, check it against the current source in this repository and an authoritative opening reference
   (for example lichess-org/chess-openings), and cite the reference in the PR. If source data or evidence
   cannot be retrieved, stop and report the blocker; do not guess.
6. **Test, record, and get an independent review.** Run the tests for the change's risk tier (below), put
   the exact commands and results in the PR, and ask the other assistant for an independent review.
   Label every check PASS, FAIL or NOT RUN. Never claim a test passed unless it was run, and never claim
   live-site, mobile or cross-browser verification that was not actually done.
   Ask for one independent review per PR, naming the exact files, behaviour, risks and checks to look at;
   after a material change, ask for a focused re-review of what changed. An assistant's review of its own
   work is never called independent.
7. **Keep CI green and the baseline honest.** A PR is mergeable only when the **Regression tests** check
   passes. Never skip, disable or weaken a test to get a green check. If an owner-approved change is meant
   to alter recommendations, scoring or protected code, run `npm run update` in `tools/survey-regression`
   and commit the new `expected.json` in the same PR, so the diff shows exactly what changed.
   CI evidence belongs to one commit: a new head SHA invalidates earlier CI results as proof for the new
   revision, and every applicable required check must pass on that exact head SHA before the PR is called
   ready. Analysis of unchanged files may be reused. Completed CI on the exact current head replaces a
   duplicate local run only of the automated checks that CI covers; it never replaces the manual browser
   check a tier requires or the Live Guardian verification after deployment. `expected.json` and the
   protected-code hash are integrity references, not proof that behaviour is correct, and never replace the
   functional tests.
8. **Report blockers instead of guessing.** If a requirement cannot be implemented or verified, say so and
   explain why rather than calling it complete.

9. **Ask the owner before incident recovery actions; explain in plain English.** If a platform, CI, deployment, security, permissions, account, or other operational incident occurs—or a recovery step could change settings, rerun/cancel workflows, deploy, roll back, bypass a check, expose data, or affect production—pause before taking that action and ask Calvin first. Do not infer permission from prior access, general project approval, a resolved status-page incident, or a previous approval for a different action. Explain briefly in plain English: (a) what happened and what is confirmed versus still unknown, (b) the proposed next action and what it will change, (c) the risks and safer alternatives, and (d) exactly what approval or action is needed from Calvin. Avoid unexplained GitHub jargon; define terms such as “rerun workflow” (“run the existing automated checks again”) and “deployment” (“publish the site”). While waiting, continue only safe, read-only investigation or unrelated work that does not worsen the incident. Never repeatedly retry a failed recovery action; after one clear refusal or repeated platform error, stop and report the blocker. Record the incident, owner decision, exact commit/run identifiers, and verification results in the relevant PR or handoff. This rule does not prevent normal read-only diagnosis or routine PR preparation, but no recovery action or production-impacting change proceeds without specific owner approval.

10. **Act with honesty, integrity, and transparency.** Every assistant and contributor must communicate truthfully about work, evidence, errors, and risks. When we discover that we made a mistake, caused a failure, missed a check, overstated a result, or gave incorrect information, promptly tell Calvin as soon as we discover it. Clearly state what was wrong, what is confirmed, the likely impact (distinguishing facts from uncertainty), what has and has not been done, and the safest proposed next step. Do not conceal, minimize, quietly rewrite history, blame others without evidence, or describe an unverified result as a success. Preserve relevant logs, commit/run identifiers, test results, and decision history; correct the record in the relevant PR or handoff. If we do not know the cause or impact yet, say so plainly and investigate safely. Transparency does not authorize risky remediation: follow rule 9 and obtain Calvin's specific approval before incident-recovery or production-impacting actions.


## Risk tiers
When the tier is unclear, use the higher one.
The impact index below sets each area's minimum tier. The actual impact can raise the tier but never lower
it, so a data or configuration change that can affect a protected behaviour gets that behaviour's tier.
Changes to `AGENTS.md`, `RELEASE.md`, the PR template, the protected features list or the impact index are
policy changes: whatever their tier, they need a full policy review (every changed rule compared with the old
text, confirming no safeguard is weakened) and the owner's approval.

| Tier | Examples | Required checks |
|---|---|---|
| Low | Documentation, test-only changes, isolated text corrections | The CI check; confirm `index.html` is unchanged when it should be |
| Medium | Opening data, recommendation descriptions, anything that can change survey results | The CI check, plus a review of every recommendation that changed in `expected.json` |
| High | Board rendering, chess logic, survey scoring, shared JavaScript, CSS, evaluation logic, navigation, any other `index.html` code | The CI check, plus a manual browser check of the affected features and the live smoke test after deployment |

Stacked PRs: keep the dependency order. Before retargeting or merging a dependent PR, inspect its updated
diff and rerun the tests.

### Impact index
A minimum-tier guide for the areas where a mistake does the most damage. It is not an exhaustive list of
protected files: protection follows behaviour, so any file, data, configuration, workflow or dependency that
can affect a protected feature (rule 3) is protected. If an area is not listed or its impact is uncertain, do
not assume Low: use the higher plausible tier and flag the classification to the owner. "Protected code" is
everything in `index.html` outside the opening-data block (from `const ecoNamesMap = {` to the survey picker
comment), which the protected-code hash in `npm test` covers. Add a row when a real task exposes a missing
area or dependency.

| Area | Where | Protected features (rule 3) | Covering checks | Minimum tier |
|---|---|---|---|---|
| Board | Protected code: demo and results board, pieces, board editor, move playback, evaluation bar | 5–10 | `npm test` (protected-code hash), `npm run clickthrough`, `test:results-identity` | High |
| Scoring and survey | Protected code: survey, scoring, picker; picks and scoring in `expected.json`; opening data that changes picks | 2–4 | `npm test` (checks 1–6, 11), `npm run clickthrough` | High for code, Medium for data |
| GM data | `NOTABLE_GM_POOLS`, GM records and `notableGm` names; `gm-baseline.json`; `tools/survey-regression/pool-governance.json` | 4, 5 | `npm test` (checks 7–11 and pool governance), `test:results-identity` | Medium; High if rotation or pop-up code changes |
| Deployment workflows | `.github/workflows/`, `CNAME`, the **Protect main** ruleset | all, through CI and the Live Guardian | **Regression tests** on the PR itself; `test:known-shrink`, `test:guardian-report`, `test:retries`; Live Guardian after deployment | High, plus policy review |
| Labs ECO picker | Protected code: Labs opening picker | 11 | `npm run clickthrough` (Labs ECO picker, offline on the PR, live in the Live Guardian) | High |

## Notable GM pool governance
Every pool in `NOTABLE_GM_POOLS` has exactly one classification, recorded in
`tools/survey-regression/pool-governance.json`. `npm test` enforces this file through
`tools/survey-regression/pool_governance.js`. Classifications describe how a pool is governed. They do not change
routing: every pool still supplies the Notable GM for its own cards in the same way.

- **Variation-Level Analytical Pool** (`variation-level`): a pool for one variation, sub-line or narrow group of
  codes. It may show **at most five distinct GMs**.
- **Family-Level Recommendation Pool** (`family-level`): a pool that recommends GMs for a whole opening family on
  one side. It is exempt from the five-GM maximum **only** when its entry records evidence for every criterion
  F1–F5 below **and** the owner's approval (`approval.by` "Calvin", a date, and an https link to the approval).
  A family-level entry with any of these missing fails the test and gets no exemption.
- **Unclassified** (`unclassified`): not yet individually reviewed. An unclassified pool gets no exemption. Pools
  that already had more than five GMs on 2026-10-30 are listed in `pendingOverCap` with their GM count. Each may
  shrink but not grow until it is classified, and no other unclassified pool may exceed five GMs. New pools need
  an entry before they can merge.

**Six-pool tactical limit.** A GM may belong to at most six Variation-Level Analytical Pools. Family-level and
unclassified memberships do not count against this limit. Memberships are counted as distinct pools, by the GM's
exact record name. The test also reports, without failing, which GMs would exceed six if all their unclassified
pools turned out to be variation-level.

**Family-level criteria.** Each must be met and recorded for the individual pool:
- **F1 family scope:** the pool's codes are the codes, on its side, of one named opening family in an
  authoritative reference (for example lichess-org/chess-openings), cited in the entry. A single variation or
  sub-line does not qualify.
- **F2 several variations:** the codes cover at least two distinct named variations of that family, listed in
  the entry.
- **F3 family-level evidence:** each GM's cited evidence supports the family on that side, and the entry says so.
  Evidence for only one variation belongs in a variation-level pool.
- **F4 recommendation role:** the pool is the recommendation source for the family's cards. It is not a
  navigation hub or container, and no pool sits inside another.
- **F5 individual review:** an independent review of this pool's evidence is linked, and the owner approved
  the classification for this pool by name.

**What never classifies a pool:** its key or name (for example the word "family"), its size, its number of
codes, `matchScope: "FAMILY ONLY"`, `familyLabels`, `recordLabels`, or the batch or wave that added it.
Classifications change only through a pull request that edits `pool-governance.json` with the evidence above.
That PR is GM data (impact index), needs an independent review, and needs the owner's approval of each pool it
classifies.

## ECO repair acceptance checklist
- [ ] Inspect the current ECO data in `index.html`.
- [ ] Identify the reference for each affected ECO code, opening name, side and move sequence.
- [ ] Verify the move sequence for every affected line, stating the move-count convention (plies or full moves).
- [ ] Check for duplicate mappings and White/Black label mismatches.
- [ ] Run the regression tests and inspect the final diff for unrelated changes.
- [ ] Get an independent review and reconcile disagreements.
- [ ] Present the evidence and the diff to the owner, and wait for explicit approval before merging.
- [ ] After deployment, run the live smoke test and check the affected lines on the live site.

## Workflow
1. Each assistant works on its own branch and opens a pull request using the PR template.
2. CI runs the regression tests automatically; findings are compared through GitHub.
3. The proposed change, evidence and any disagreements are presented to the owner.
4. Nothing is merged or deployed until the owner explicitly approves (rule 1). Merge only the pull request
   the owner approved, with **Squash and merge** or **Create a merge commit**, never **Rebase and merge**, so
   the release can be reverted as a single unit: revert the squash commit, or the merge commit with `-m 1`
   (see `RELEASE.md`).
5. After a merge, confirm the Pages deployment and the live smoke test, and report the results.

Assistants should investigate, implement, test and prepare PRs without waiting for approval, and stop
before merging, deploying or making unrelated production changes. A finished task gets one concise report:
what was fixed, files changed, tests passed or failed, whether the live site was checked, remaining risks,
and the recommended next action.
The report (one handoff per PR or task) also gives the raw head and base SHAs, each check with its link and
result, NOT TESTED items, blockers and the decision needed, and keeps merged, deployed and production-verified
separate. Anything missing, skipped or unconfirmed is reported as NOT RUN, NOT TESTED or NOT VERIFIED, never
PASS.
