# PR #48 — Independent source audit brief for Gemini and Copilot

**Purpose:** independently verify the 82 opening-summary claims in `ECO_SUMMARIES`. This is a factual source audit, not a rewrite exercise. Reviewers must work independently of the author's assertions and of each other's verdicts.

**Repository:** `consciousclimbers-lgtm/Chesspsyche.com`  
**PR under review:** https://github.com/consciousclimbers-lgtm/Chesspsyche.com/pull/48  
**Source-claims worksheet:** [PR48_SOURCE_CLAIMS_REVIEW.md](PR48_SOURCE_CLAIMS_REVIEW.md)  
**Separate issue ledger (375 result cards):** [PR48_SUMMARY_ISSUE_TRIAGE.md](PR48_SUMMARY_ISSUE_TRIAGE.md)

## Assignment

Review **all 82 ECO + side entries**, not a sample. For every entry, independently open the cited source URL and verify the exact factual claims made by the summary. If the source is unavailable, paywalled, too general, or does not support a claim, say so; do not infer support from the URL title, search snippet, another summary, or the code comment.

Please work on your own copy of the worksheet and return a completed file or a clearly structured report. Do not edit the website, change the PR branch, commit, merge, deploy, or modify the source code. Calvin is the release approver.

## Required procedure for each of the 82 entries

1. **Identify the exact record:** ECO code, side (White or Black), opening/system name, full summary text, and cited URL.
2. **Open the source page itself.** Record the page title, author/publisher if visible, URL, and a useful heading/section/page locator. Record access date.
3. **Break the summary into atomic factual claims.** Check opening identity, move order, plans for the specified side, strategic/tactical themes, and any asserted evaluation or characterization. A source that names the opening does not automatically substantiate every strategic statement.
4. **Compare source and claim precisely.** Note direct support, partial support, contradiction, or no evidence. Quote only short excerpts necessary to show evidence; otherwise paraphrase and provide a locator.
5. **Check side correctness.** The summary must genuinely describe the specified side's plans/position, not silently describe the opponent's plan or give a generic description that could mislead a player choosing that side.
6. **Check opening/ECO fit.** The cited source must match the named opening and move order/ECO closely enough to support this exact record. Flag transpositions or variant differences that matter.
7. **Recommend one verdict** from the controlled list below, with a short reason and a concrete correction or replacement direction where needed.
8. **Do not repair unsupported claims by inventing chess theory.** If you cannot substantiate a claim, recommend removing/narrowing it or requesting a stronger source.

## Allowed verdicts

- **PASS** — the opened source directly supports all material factual claims for this ECO and side.
- **PASS WITH NARROWING** — core point is supported, but some wording overstates or extends the evidence; give exact safer wording.
- **FAIL — WRONG / CONTRADICTED** — source contradicts a material claim, wrong opening/side, or demonstrably incorrect claim.
- **FAIL — UNSUPPORTED** — source was opened but does not support one or more material claims.
- **UNVERIFIABLE — SOURCE UNAVAILABLE** — source cannot be accessed or reliably identified; do not count this as a pass.
- **NEEDS CHESS EXPERT** — source is accessible but the claim requires specialist analysis beyond what the source establishes. Explain exactly what remains uncertain.

## Output schema — one row per claim (82 rows required)

For each worksheet entry, fill all these fields:

- ECO + side
- opening/system name
- exact summary under review
- source URL opened (yes/no)
- source page title / publisher / author if available
- access date
- evidence locator (heading, section, page, or game/move reference)
- short supporting/contradicting excerpt or faithful paraphrase
- atomic claim(s) supported
- atomic claim(s) unsupported or contradicted
- side correctness (yes/no/uncertain + reason)
- opening/ECO match (yes/no/uncertain + reason)
- verdict (one allowed label)
- exact proposed wording correction or source replacement requirement
- reviewer name/model
- confidence (high/medium/low)
- any caveat or disagreement

**Do not leave a blank verdict.** If evidence is insufficient, use an appropriate failure/unverifiable verdict, not PASS. If you could not open the source, clearly mark that.

## Independence and anti-bias rules

- Do not rely on the other model's conclusions. Gemini and Copilot should each produce their own completed review before comparing results.
- Do not treat existing worksheet notes, prior reviewer labels, code comments, search snippets, or this brief as proof. Treat them only as leads.
- Do not assume all 82 summaries are right or all are wrong.
- Do not change a verdict to reach agreement. Reconcile only after each independent review is complete, and retain disagreements.
- Do not invent source citations, page titles, quotes, page numbers, or chess claims.
- Avoid lengthy copying from copyrighted sources. Use brief excerpts only.
- Keep exact original summary text alongside any proposed wording, so changes are auditable.

## Final deliverables

Each reviewer should return:

1. **Completed 82-row worksheet** with every verdict and evidence locator filled.
2. **Executive tally:** counts of PASS, PASS WITH NARROWING, FAIL—WRONG/CONTRADICTED, FAIL—UNSUPPORTED, UNVERIFIABLE, and NEEDS CHESS EXPERT. Counts must total 82.
3. **Critical-fix list:** every wrong opening/ECO, wrong side, contradiction, and high-impact unsupported claim, prioritized by user harm.
4. **Proposed wording/source fixes:** exact ECO + side, original text, replacement text or source requirement, and evidence supporting the replacement.
5. **Disagreement list:** records where reviewer confidence is low or a chess expert is needed.
6. **Coverage statement:** confirm all 82 unique ECO+side records were reviewed; list any records not completed.

## Quality gate

A result is **not independently verified** unless the source page was opened and the relevant passage/position was recorded. A source URL alone is not evidence. A source that only supports the opening name but not the strategic claims is not a full PASS. No production edits are authorized by this assignment.

## Message to both reviewers

Please be strict but practical: prioritize truth, side-specific usefulness, and traceable evidence over elegant prose. Short accurate summaries are better than detailed summaries that exceed their sources. Thank you for independently checking this carefully; please preserve uncertainty rather than guessing.
