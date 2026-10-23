# PR #48 — Summary remediation batch 1 (6 candidate cards)

**Scope:** First six `move-comment` cards in `known-card-issues.json`: A05|white, A06|white, A08|white, A14|white, A17|white, A20|white.

**Status:** Draft candidate wording for source review, NOT yet a code fix and NOT yet removed from the issue tracker. Before use in `ECO_SUMMARIES`, open the cited page, confirm that it supports the exact statement and ECO/side, and have a second reviewer check it. No source claim should be considered verified just because a link is supplied.

## Candidate replacements

| Card | ECO/line identity to preserve | Candidate White-side summary | Candidate source | Evidence still required |
|---|---|---|---|---|
| A05|white | 1.Nf3 Nf6; Zukertort/Réti family | White develops the king's knight without committing a central pawn, keeping options for a kingside fianchetto and a later d4 or c4 setup while Black's ...Nf6 also leaves several structures possible. | https://en.wikipedia.org/wiki/R%C3%A9ti_Opening | Open source and confirm that this broad flexible-plan description is supported for 1.Nf3 Nf6; ensure no specific variation is falsely implied. |
| A06|white | 1.Nf3 d5; Réti/Zukertort family | After ...d5, White can challenge the centre from the flank with c4 or develop with g3 and Bg2, delaying a fixed central pawn structure while retaining transposition options. | https://en.wikipedia.org/wiki/R%C3%A9ti_Opening | Open source and verify the exact ...d5 position and both stated plans. |
| A08|white | A08 Zukertort/Réti family; validate exact ECO continuation against vault | White's kingside fianchetto places the bishop on g2 to pressure the long diagonal; the early ...c5 gives Black a direct central challenge, so White's next moves should be described from the actual A08 line rather than from the generic Réti label. | https://en.wikipedia.org/wiki/R%C3%A9ti_Opening ; https://www.chess-review.us/en/eco-directory | **High caution:** independently confirm the exact A08 move order and opening name from the project's vault/reference before adopting. Do not use if source does not describe the exact line. |
| A14|white | English Opening: Agincourt Defense, Neo-Catalan Declined; 1.c4 e6 2.Nf3 d5 3.g3 Nf6 4.Bg2 Be7 5.O-O | White's kingside fianchetto and castling establish a flexible English/Neo-Catalan setup; the central tension remains around d4 and d5, and White can choose a later d4 or keep the position more restrained. | https://en.wikipedia.org/wiki/English_Opening | Open source and confirm the Neo-Catalan Declined move order and that the stated plans fit this line. |
| A17|white | English Opening: 1.c4 Nf6 2.Nc3 e6; Hedgehog-family positions may arise but are not forced yet | White's c4 and Nc3 control central squares while Black's ...Nf6 and ...e6 keep several Indian/English structures available; White can develop with g3 or choose a more central setup depending on Black's next move. | https://en.wikipedia.org/wiki/English_Opening | Open source and ensure wording does not falsely label the position a fully formed Hedgehog before the relevant setup appears. |
| A20|white | King's English: 1.c4 e5 | White contests d5 from the flank with c4; against ...e5, the position resembles a Sicilian with colours reversed, giving White a tempo while both sides retain several development schemes. | https://en.wikipedia.org/wiki/English_Opening | Open source and confirm reversed-Sicilian characterization and broad plans. |

## Acceptance checklist before these candidates become real fixes

- [ ] Inspect the live `ECO_SUMMARIES` schema and insert candidates only in the intended opening-data block.
- [ ] Open each source and record the supporting heading/section, or replace the source if it does not support the exact claim.
- [ ] Validate each ECO and side against `tools/survey-regression/results-cards.json` and the opening vault.
- [ ] Run the summary regression and the results-identity tests on the exact candidate head.
- [ ] Confirm `known-card-issues.json` shrinks by exactly the cards genuinely covered; do not delete issue entries manually to force a pass.
- [ ] Check Results UI for summary-side correctness and card name/ECO/GM/board-line identity.
- [ ] Obtain independent review before considering the batch complete.

## Guardrails

These are conservative candidate drafts, not a declaration that six issues are resolved. Keep all six tracked until the replacement summaries are actually integrated, sources are checked, and tests prove the issue guard recognizes them. No merge or deploy is authorized.
