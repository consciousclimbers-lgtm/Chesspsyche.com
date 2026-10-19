# AGENTS.md — Rules for AI assistants working on ChessPsyche.com

These rules apply to every AI assistant working in this repository (currently ChatGPT/Codex and Claude).
The repository owner is the user, who has final say on every merge and deployment.
Detailed process notes and the ECO repair checklist live in `COLLABORATION_WORKFLOW.md` (proposed in PR #8);
if the two files ever disagree, follow the stricter rule and flag the conflict to the user.

## Repository layout
- `index.html` — the entire site (HTML, CSS, JavaScript, and data) in one file. The `CNAME` file indicates it is served by GitHub Pages.
- `CNAME` — custom domain (`www.chesspsyche.com`). Do not change it.

Because everything is in one file, two assistants editing `index.html` at the same time will conflict.
Coordinate through GitHub: one active code change at a time per area, rebased on the latest `main`.

## Rules

1. **No direct changes to production.** Never push directly to `main`, merge a pull request, or deploy
   without the user's explicit approval. Treat `main` as live.
2. **Small, reviewable changes.** Work on a separate branch (`claude/...` or `chatgpt/...`), one issue per
   branch, and open a pull request. Keep diffs narrow and free of unrelated reformatting.
3. **Protect confirmed-working features.** Do not change these unless the user explicitly asks:
   - interactive demo board
   - evaluation bar
   - results-page chessboard display and sizing
   - White/Black labels
   - logo and tab navigation
4. **Current priority: ECO-line repair.** Do not start unrelated checklist work until the user confirms the
   ECO repair is verified.
5. **Verify source data before editing.** Before changing any ECO code, opening name, player color, or move
   sequence, check it against the current source in this repository and an authoritative opening reference,
   and cite that reference in the pull request.
6. **Test, record, and get an independent review.** Run the relevant audit and tests, record the exact
   commands and results in the pull request, and request an independent review from the other assistant.
   Never claim a test passed unless it was actually run.
7. **Report blockers instead of guessing.** If source code, data, or evidence is unavailable, stop and report
   the blocker to the user.

## Workflow
1. Each assistant works independently on its own branch.
2. Findings are compared through GitHub (pull requests, review comments, and issues).
3. The proposed changes, evidence, and any remaining disagreements are presented to the user.
4. Nothing is merged or deployed until the user explicitly approves.

## Pull request checklist
- Issue / ECO code:
- Expected behavior:
- Files changed:
- Evidence / references:
- Tests run and exact results:
- Independent review (by the other assistant):
- Remaining uncertainty:
- User approval status: Pending until explicitly approved.
