# Releasing, checking and rolling back ChessPsyche.com

GitHub Pages publishes `main` to www.chesspsyche.com automatically: every merge into `main` is a release,
live about a minute later. The rules for who may merge are in [`AGENTS.md`](AGENTS.md).

## Before merging
1. Note the **known-good commit**: the current head of `main` (its short SHA is on the repository's front
   page, or run `git rev-parse --short origin/main`). This is what a rollback returns to.
2. Confirm the **Regression tests** check is green on the pull request's latest commit.
3. Read the PR's "Files changed" tab: only the files the PR describes should change.
4. Merge with **Create a merge commit** (not squash or rebase), so the release is one commit that can be
   reverted.

## After merging: live smoke test
1. Actions tab → **pages-build-deployment**: the run for the merge commit must succeed.
2. Actions tab → **Live smoke test**: it starts automatically after a successful deployment (listed with
   the event `workflow_run`). It waits until the site serves the merged `index.html`, then runs the browser
   click-through against www.chesspsyche.com with nothing blocked. It must be green. If no run appears
   within a few minutes of the deployment, start it by hand: Live smoke test → Run workflow (branch
   `main`). From a computer with the repository checked out:

   ```
   cd tools/survey-regression && npm ci && npx playwright install chromium
   node clickthrough.js --url https://www.chesspsyche.com/
   ```

3. Two-minute manual check in a normal browser (and on a phone when the change affects layout):
   - The home page loads with the logo, cards and pieces looking as before.
   - The logo opens the survey. Answer the 5 questions; the results page shows a White and a Black card,
     each labelled for its own colour.
   - On the results board, step through the demo: the pieces move and the counter reaches the last move.
   - The header buttons open Grandmasters, Clubs and Play; Home returns to the start page.
   - Labs → Board Editor: place and remove a piece, switch to play mode, play 1.e4; the evaluation bar and
     number change.
   - The browser console (F12 → Console) shows no red errors.

Report each item as PASS, FAIL or NOT RUN. The automated test runs desktop Chromium only; Safari, Firefox
and real phones are checked only by hand.

## If the live site breaks: roll back
Stop all other releases first. Then undo the release with a revert pull request, which keeps the history
and goes through the same checks:

**On GitHub (no tools needed):** open the merged pull request → **Revert** button (near the bottom) →
this creates a branch and a revert pull request → wait for **Regression tests** to pass → merge it with
**Create a merge commit**. Pages redeploys the previous version in about a minute. Re-run the live smoke
test.

**From the command line:**

```
git fetch origin && git checkout -b revert-<sha> origin/main
git revert -m 1 <merge-commit-sha>     # -m 1 keeps main's side of the merge
git push -u origin revert-<sha>        # then open a pull request and merge it after CI passes
```

To return to an older known-good commit instead, revert each later merge commit, newest first.

**Emergency only:** if the site is down and the revert pull request cannot wait for CI, the repository
admin can merge it while bypassing the branch ruleset (the ruleset allows the admin to bypass). Record why
in the pull request, and run the full tests and the live smoke test straight after.

After a rollback, find the cause on a branch and fix it through a normal pull request; do not mix unrelated
fixes into the rollback.
