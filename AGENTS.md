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
- `.github/workflows/live-smoke.yml`: runs the browser test against the live site after each deployment.
- `.github/pull_request_template.md`: the required PR description.

Because everything is in one file, two changes to `index.html` at the same time will conflict. Keep one
active change per area, based on the latest `main`.

## Rules
1. **No direct changes to production.** Never push to `main`, upload files to `main` in the browser, merge a
   pull request or deploy without the owner's explicit approval for that specific change.
2. **Every change goes through a pull request.** Work on a separate branch (`claude/...`, `chatgpt/...`, or,
   for browser uploads, "Create a new branch for this commit and start a pull request"). One purpose per
   branch. Keep diffs narrow, with no unrelated fixes, refactoring or reformatting.
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
   10. evaluation bar and numerical evaluation.

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
7. **Keep CI green and the baseline honest.** A PR is mergeable only when the **Regression tests** check
   passes. Never skip, disable or weaken a test to get a green check. If an owner-approved change is meant
   to alter recommendations, scoring or protected code, run `npm run update` in `tools/survey-regression`
   and commit the new `expected.json` in the same PR, so the diff shows exactly what changed.
8. **Report blockers instead of guessing.** If a requirement cannot be implemented or verified, say so and
   explain why rather than calling it complete.

## Risk tiers
When the tier is unclear, use the higher one.

| Tier | Examples | Required checks |
|---|---|---|
| Low | Documentation, test-only changes, isolated text corrections | The CI check; confirm `index.html` is unchanged when it should be |
| Medium | Opening data, recommendation descriptions, anything that can change survey results | The CI check, plus a review of every recommendation that changed in `expected.json` |
| High | Board rendering, chess logic, survey scoring, shared JavaScript, CSS, evaluation logic, navigation, any other `index.html` code | The CI check, plus a manual browser check of the affected features and the live smoke test after deployment |

Stacked PRs: keep the dependency order. Before retargeting or merging a dependent PR, inspect its updated
diff and rerun the tests.

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
4. Nothing is merged or deployed until the owner explicitly approves. Merge with **Create a merge commit**,
   so a release can be undone with a single revert (see `RELEASE.md`).
5. After a merge, confirm the Pages deployment and the live smoke test, and report the results.

Assistants should investigate, implement, test and prepare PRs without waiting for approval, and stop
before merging, deploying or making unrelated production changes. A finished task gets one concise report:
what was fixed, files changed, tests passed or failed, whether the live site was checked, remaining risks,
and the recommended next action.
