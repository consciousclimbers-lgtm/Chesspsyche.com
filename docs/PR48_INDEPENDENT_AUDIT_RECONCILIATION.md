# PR #48 — Reconciliation of independent 82-claim audits

**Date:** 2026-10-23  
**Scope:** Reconcile the supplied Grok and Gemini reports against the actual `ECO_SUMMARIES` entries in the PR #48 candidate. This document does not declare the 82 claims fully verified.

## High-priority code corrections identified

| ECO / side | Finding | Proposed correction | Status |
|---|---|---|---|
| D02 / White | Current summary says White develops the king's knight before committing pawns, but the Colle System begins with 1.d4. The description is misleading for the named system. | “With 1.d4 already establishing a central pawn, White can build a Colle setup with e3, Bd3, c3 and Nbd2, then prepare the e4 break.” | Confirmed wording defect; code change still required |
| B11 / Black | Current summary describes the Caro-Kann Two Knights as an active White setup and provides no useful Black-side plan. | Draft only: “Against White's early Nf3 in the Caro-Kann, Black can develop with ...d5 and ...Bf5 or ...Bg4, choosing a solid central setup while watching for White's e4 advance.” Validate the exact B11 move order and cited source before adoption. | Confirmed side-focus defect; replacement needs source validation |
| A03 / White | Current summary says Bird's Opening “claims e5 with the f-pawn,” which can be read as the pawn moving to e5. | “Bird's Opening uses 1.f4 to control e5 and prepare kingside development; against ...d5, White often adopts a Dutch-like structure with colours reversed.” | Precision improvement proposed; source check still required |

## Source-audit reconciliation

- Grok reports 56 PASS, 4 PASS WITH NARROWING, 5 UNVERIFIABLE, and 17 not fully extracted. The 17 pattern-based entries remain **not individually verified**; similar sources do not prove each exact claim.
- Gemini reports 79 PASS, 1 PASS WITH NARROWING, and 2 FAIL. Its D02 and B11 findings match defects visible in the candidate source text.
- These tallies cannot be combined into a single pass count. The auditors used different coverage and evidence standards.
- Grok's report says five URLs were unavailable but explicitly names only D03, B27, and B11 in its detailed rows; the other two unavailable entries must be identified from its full worksheets before changing URLs.
- A PASS verdict based on general opening knowledge is not the same as source-only verification. For publication, record the exact URL opened and the passage or variation supporting the exact ECO-and-side claim.

## Acceptance gate

1. Correct D02 and B11 wording in `index.html`; tighten A03 if the source confirms the revised wording.
2. Replace only URLs confirmed unavailable, and record old URL, new URL, and evidence.
3. Complete individual source review for every claim still marked pattern-confirmed or unavailable.
4. Run the exact-head regression and browser checks after code edits. A new head invalidates prior candidate CI evidence.
5. Keep PR #48 draft; no merge or deployment without Calvin's explicit approval.
