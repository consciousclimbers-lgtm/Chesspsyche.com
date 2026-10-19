# ChessPsyche.com Collaboration Workflow

## Ownership and approval
- Project owner: the user. The user gives final approval for merging and deployment.
- ChatGPT: investigate ECO/opening-data issues, prepare small, reviewable patches, document tests and evidence.
- Claude: independently review the proposed diff and test evidence when the user shares the branch/PR or provides the relevant repository access in Claude.
- GitHub: shared source of truth for code, branches, diffs, issues, and review history.

## Non-negotiable safety rules
1. Do not merge or deploy without explicit user approval.
2. Work on a feature branch and use a pull request for proposed code changes.
3. Keep each change narrowly scoped to one checklist item.
4. Do not change confirmed-working features unless the user explicitly asks:
   - interactive demo board
   - evaluation bar
   - results-page chessboard display and sizing
   - White/Black piece labels
   - logo and tab navigation
5. Before changing a file, inspect the current version and make a minimal diff. If repository content cannot be retrieved or validated, stop and ask for a current file snapshot rather than guessing.
6. Do not claim an audit or test passed unless it was actually run and the evidence is recorded.

## Immediate priority: ECO lines
Only investigate and repair ECO/opening-line data until the user confirms this work is complete. Do not begin the wider master-checklist comparison yet.

Known audit leads from the prior conversation (verify against current source before editing):
- B80 Open Sicilian (3.d4 Mainlines)
- D35 Queen's Gambit Exchange
- D43 Semi-Slav Defense
- D05 Colle-Zukertort
- Duplicate recommendation assignments reportedly involving B80 and E20
- Five White recommendation slots reportedly mislabeled as Black
- E98/E99 opening-name / move-sequence mismatch
- Some lines reportedly lack the requested first 10 moves

These are leads, not yet verified findings. Re-check them against the current code and authoritative opening/move references before making changes.

## ECO repair acceptance checklist
- [ ] Retrieve and inspect the current ECO source/data file(s).
- [ ] Identify the source of truth for each affected ECO code, opening name, side/color, and move sequence.
- [ ] Verify the first 10 moves for every affected line (state the move-count convention clearly, e.g. 10 plies versus 10 full moves).
- [ ] Check for duplicate mappings and White/Black label mismatches.
- [ ] Run the existing mapping audit (including `chesspsyche_mapping_audit.js`, if present) and record the exact command/output.
- [ ] Run relevant tests and inspect the final diff for unrelated changes.
- [ ] Ask Claude for independent review of the branch/PR and reconcile any disagreements.
- [ ] Present evidence and the proposed diff to the user.
- [ ] Wait for explicit user approval before merge or deployment.
- [ ] After the user deploys/approves deployment, verify the affected ECO lines live without disturbing protected features.

## Handoff format for each change
- Issue / ECO code:
- Expected behavior:
- Files changed:
- Evidence / references:
- Tests run and exact results:
- Independent review:
- Remaining uncertainty:
- User approval status: Pending until explicitly approved.
