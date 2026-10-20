# ECO audit findings (report only)

Audited: `index.html` at `main` commit `dffd1c5`. Reference: lichess-org/chess-openings at `a6189a3`, pinned in `ref/`.
This is a report for the owner's review. It changes no site code, and none of these findings is fixed here.

## How to reproduce
```
cd tools/eco-audit
npm ci
npm run audit        # writes eco-audit.txt (console), eco-audit.json and eco-audit.md
```
- The audit is offline: the reference is the five TSV files in `ref/`, checked by sha256 against `ref/SOURCE.json`
  before every run. If a file is missing or different, it prints `AUDIT NOT RUN` and exits 2.
- On every pull request and push to `main`, the **ECO audit (report only)** workflow runs it. It shows the summary in the
  job summary and uploads the full report. It never fails on findings and is not a required check.
- Moves are validated with chess.js 1.0.0. Lines are classified by **position**, so transpositions count.
- Move counts are in **plies**: one ply is one side's move, and 10 full moves are 20 plies.

## What it checks
| Area | Check | Level |
|---|---|---|
| Vault (500 codes) | every move is legal | error |
| | the line reaches a position the reference gives that code; if not, whether it stops early (warn) or follows another line (error) | error / warn |
| | the name's distinctive words appear in a reference name for that code | warn (none match) / info (some match) |
| | two codes with exactly the same moves | warn |
| | a generated survey card (first 10 plies) stops before the code's position | info |
| | `ECO_SIDE` against the side whose move defines the code in the reference (a heuristic) | info |
| | commentary count differs from the number of plies | info |
| Recommendation slots (36) | legal moves, from/to squares match, line reaches its code | error |
| | the slot's colour differs from `ECO_SIDE` (the ECO list and Arena then say the other colour) | warn |
| | name, as above | warn / info |

Findings on codes the survey picks in `tools/survey-regression/expected.json` are marked "survey pick" and listed first.

## Result on `dffd1c5`
**819 findings: 1 error, 23 warnings, 795 info.** 8 of the errors and warnings are on survey-picked codes.
No move is illegal, and no from/to square is wrong.

### Error and warnings on survey-picked codes
| ECO | Where | Finding | Reference |
|---|---|---|---|
| D71 | vault, L3056 | **Error.** `1.d4 Nf6 2.c4 g6 3.g3 d5` is D70 ("Neo-Grünfeld Defense: with g3"). D71 needs 4.Bg2 d5 5.cxd5 Nxd5. | d.tsv D71 "Neo-Grünfeld Defense: Exchange Variation" |
| E00 | vault, L3085 | Stops at `2...e6` (4 plies). E00 "Catalan Opening" starts with 3.g3. | e.tsv E00 |
| B12 | slot `patientGrinder.intermediate` Black | Black card, but `ECO_SIDE.B12 = white`. The ECO list and Arena say "You play as White". | product decision |
| B40 | slot `aggressiveVanguard.advancedGm` White | White card, but `ECO_SIDE.B40 = black`. | product decision |
| D85 | slot `aggressiveVanguard.advancedGm` Black | Black card, but `ECO_SIDE.D85 = white`. | product decision |
| A04 | vault name | "Réti Opening"; lichess names A04 "Zukertort Opening". Naming convention, not a wrong line. | a.tsv A04 |
| A12 | vault name | "English Opening (Hedgehog System)"; lichess A12 is "Réti Opening: Anglo-Slav Variation". | a.tsv A12 |
| B06 | vault name | "Modern Defense (Robatsch Defense)"; lichess has no "Robatsch". Naming convention. | b.tsv B06 |

### Other warnings
- **Lines that stop before their code (10):** A69, B56, C19, C77, C83, D56, D57, D68, D99, E19. The moves are right, but the line ends before the position the reference gives the code.
- **Duplicate lines (2 pairs):** D55 and D56 have the same moves; so do E44 and E45.
- **Side:** B80, a White slot (`tacticalFirebrand.advancedGm`), has `ECO_SIDE.B80 = black`.
- **Name:** E10 "Queen's pawn game"; lichess E10 is "Indian Defense" / "Blumenfeld Countergambit".

### Info (for review, not defects on their own)
| Check | Count | Note |
|---|---|---|
| name partly matches | 248 | Mostly wording differences ("Nimzowitsch" vs "Nimzo", "Kingside Fianchetto" vs "Fianchetto Line"). |
| side (heuristic) | 216 | Heuristic only. Many codes are named after one side's move but played by both. |
| card demo stops before the code | 194 | Generated cards show the first 10 plies of the vault line. |
| commentary count | 137 | The commentary array is shorter or longer than the move list. |

## Expected false positives
- Transpositions and lines that stop before the defining move can make a correct opening look short.
- Lichess names differ from traditional ECO names (A04 Zukertort/Réti, B06 Robatsch).
- The side heuristic cannot tell who usually *chooses* an opening.

## Proposed next steps (each needs the owner's approval)
1. Review this report and mark each error and warning as "fix", "accept" (with a reason) or "false positive".
2. Fix the data errors in a separate PR, verifying each line against this reference: D71, E00 and the 10 short lines. Keep the D55/D56 and E44/E45 duplicates in the same review.
3. Decide how a slot whose colour differs from `ECO_SIDE` should be labelled (B12, B40, B80, D85). This is a product decision.
4. Only after the review, consider a committed baseline so that new findings stand out, and possibly a gate on new errors.
