# ECO audit findings (report only)

Audited: `index.html` at `main` commit `3e27fc5`, which includes the ECO repairs in PR #30 and #31. Reference: lichess-org/chess-openings at `a6189a3`, pinned in `ref/`.
This is a report for the owner's review. It changes no site code, and none of these findings is fixed here.

## How to reproduce
```
cd tools/eco-audit
npm ci
npm run audit        # writes eco-audit.txt (console), eco-audit.json and eco-audit.md
```
- The audit is offline: the reference is the five TSV files in `ref/`, checked by sha256 against `ref/SOURCE.json`
  before every run. If a file is missing or different, or the site data cannot be read, it prints `AUDIT NOT RUN` and exits 2.
- On every pull request and push to `main`, the **ECO audit (report only)** workflow runs it. It shows the summary in the
  job summary and uploads the full report. It never fails on findings and is not a required check.
- Moves are validated with chess.js 1.0.0. Lines are classified by **position**, so transpositions count.
- Move counts are in **plies**: one ply is one side's move, and 10 full moves are 20 plies.

## What it checks
| Area | Check | Level |
|---|---|---|
| Vault (500 codes) | every move is legal | error |
| | the line reaches a position the reference gives that code; if not, whether it stops early (warn) or follows another line (error) | error / warn |
| | the line reaches its code and then continues into a different code | warn |
| | the name's distinctive words appear in a reference name for that code | warn (none match) / info (some match) |
| | two codes with exactly the same moves | warn |
| | a generated survey card (first 10 plies) stops before the code's position | info |
| | `ECO_SIDE` against the side whose move defines the code in the reference (a heuristic) | info |
| | commentary count differs from the number of plies | info |
| Recommendation slots (36) | legal moves, from/to squares match, line reaches its code | error |
| | the line reaches its code and then continues into a different code | warn |
| | the results-board demo (first 10 plies) stops before the code's position | info |
| | the slot's colour differs from `ECO_SIDE` (the ECO list and Arena then say the other colour) | warn |
| | name, as above | warn / info |
| Notable GM pools (19 pools, 148 code and side keys) | the card the lookup key `(ECO code, side)` lands on exists and the survey can pick it for that side | warn |
| | that card's line reaches its code and ends in it; its name matches the reference | warn |
| | the card's board (first 10 plies of a vault line) stops before the code | info |
| | each code and side is in at most one pool | warn |

Findings on codes the survey picks in `tools/survey-regression/expected.json` are marked "survey pick" and listed first.

## Result on `3e27fc5`
**872 findings: 0 errors, 18 warnings, 854 info.** 7 of the warnings are on survey-picked codes.
No move is illegal, and no from/to square is wrong. PR #30 and #31 fixed every earlier error and every line that
stopped before its code (D71, E00 and A69, B56, C19, C77, C83, D56, D57, D68, D99, E19). D55/D56 are no longer duplicates.

14 of the 18 warnings are about the opening data and fall into the six groups below. The other 4 are Notable GM
pool findings, in the GM section; 3 of those repeat a data problem from the groups (E44, E48, A04).

### 1. Confirmed code/line mismatches (4)
Each line passes through its own code and then plays on into the next code, so the card shows the later opening.
The site's own name for each code agrees with the reference, so the fix is to stop the line at the code's position.

| ECO | Where | Line now ends in | Proposed line (reference position) | Survey effect |
|---|---|---|---|---|
| B62 | vault L2847 | B63 "Richter-Rauzer, Classical" after 7.Qd2 Be7 | `1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 Nc6 6. Bg5 e6` (12 plies) | none |
| D60 | vault L3045 | D63 "Orthodox Defense, Main Line" after 7.Rc1 | `1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 Nbd7` (12 plies) | none |
| E44 | vault L3129, **Nimzo-Indian Black GM pool** | E45 "St. Petersburg, Fischer" after 5...Ba6 | `1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 b6 5. Ne2` (9 plies) | none |

"Survey effect" is for the first three surveys of every combination (`expected.json`). Because candidate lists sort
shorter lines first, a trimmed line can move earlier in the retake order after the third survey.
| E48 | vault L3133, **Nimzo-Indian Black GM pool** | E49 "Botvinnik System" after 6.a3 Bxc3+ 7.bxc3 | `1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Bd3 d5` (10 plies) | **changes one pick** (below) |

Reference lines: d.tsv D60 (by transposition), b.tsv B62, e.tsv E44 and E48 at `a6189a3`.

### 2. Duplicates (1 pair)
- **E44 and E45** have the same moves (`... 4. e3 b6 5. Ne2 Ba6`), which is E45. The E44 fix above ends the duplicate;
  E45 itself is correct. E45's commentary has 9 entries for 10 plies and ends "Ne2 — Nimzo Ne2 b6", which suggests the
  two entries' data were swapped at some point; the fix should rewrite E44's commentary, not copy E45's.

### 3. Side and colour mapping (4)
A hand-written results slot shows the opening for one colour, but `ECO_SIDE` gives the other, so the ECO list and
Arena say "You play as" the other colour. The card's Notable GM lookup uses the slot's colour and is not affected.

| ECO | Slot | Slot colour | `ECO_SIDE` | The survey picks it as |
|---|---|---|---|---|
| B12 | `patientGrinder.intermediate` | Black | white | White (vault card) |
| B40 | `aggressiveVanguard.advancedGm` | White | black | Black (vault card) |
| D85 | `aggressiveVanguard.advancedGm` | Black | white | White (vault card) |
| B80 | `tacticalFirebrand.advancedGm` | White | black | Black (vault card) |

The survey only picks a code for its `ECO_SIDE` colour, so these slots of the other colour appear only on the safety-net
path (`getScaledOpeningsForUser`, used if card building fails) and in the Labs GM drill. That makes them low impact.
Changing it is a product decision, not a reference error.

### 4. Short or truncated lines
- **No vault line stops before its code any more.**
- Info only: the board on a generated card shows the first 10 plies, so 202 vault codes and 4 survey-picked slots
  (B99, C88, C89, E97) are reached later than the board shows. The card's name and ECO code are still right.

### 5. Naming-only issues (4)
| ECO | Site name | Reference (lichess) | Assessment |
|---|---|---|---|
| A04 | "Réti Opening" (also the Réti White GM pool) | "Zukertort Opening" | **Editorial.** Lichess names 1.Nf3 lines Zukertort; Réti is the usual ECO name. |
| B06 | "Modern Defense (Robatsch Defense)" | "Modern Defense" | **Editorial.** Robatsch is a traditional alias. |
| A12 | "English Opening (Hedgehog System)" | "Réti Opening: Anglo-Slav Variation" | **Real.** The line `1. c4 c6 2. Nf3 d5 3. b3` is not a Hedgehog. |
| E10 | "Queen's pawn game" | "Indian Defense" / "Blumenfeld Countergambit" | **Editorial.** "Queen's pawn game" is the traditional ECO name for E10; the line `1. d4 Nf6 2. c4 e6 3. Nf3` is an Indian Defense. |

248 more names partly match (info). Most are wording differences ("Nimzowitsch" vs "Nimzo", "Mar del Plata" vs
"Orthodox Variation, Modern System").

### 6. Possible false positives and editorial choices
- A04, B06 and E10 names (above).
- Side heuristic (216 info): it only says whose move defines the code in the reference, not who usually chooses it.
- Commentary count (133 info): the comment array is shorter or longer than the move list. This affects the move notes
  only, not the line.

## Notable GM pools: code and side behind each lookup
The Results card looks up its GM by the picked ECO code and the card's side, so that pair must name the opening shown.
All 148 code and side keys in the 19 pools resolve to a card, and no code and side is in two pools. The audit simulates
which codes the survey can pick for each side (`ecoCandidatesFor` and `pickEcoCode`; 190 White and 297 Black codes, the
same counts as the regression suite's every-reachable-card sweep). **144 keys are clean.** The other 4:

| Key | Card | Problem | Fix |
|---|---|---|---|
| E44 black (Nimzo-Indian) | vault | the line ends in E45 | group 1 |
| E48 black (Nimzo-Indian) | vault | the line ends in E49 | group 1 |
| A04 white (Réti) | vault | name differs from lichess | none needed (editorial) |
| D34 black (QGD) | vault | never used: `ECO_SIDE.D34 = either`, and the survey only uses `either` codes when a style has no code for that side, which never happens | none needed; the key is harmless |

The GM shown is from the right family in all three cases (E44, E45, E48 and E49 are all in the Nimzo-Indian pool),
but the board and the code disagree for E44 and E48. 51 pool keys have a board that stops before the code (info).

## Smallest safe data-only repair batch
**Batch A: B62, D60, E44.** It trims each vault line, and its commentary, to the proposed line in group 1.
- Data only: 3 lines of `ecoVaultData` in `index.html`. No names, sides, pools, picks, scoring or protected code.
- It ends the E44/E45 duplicate and the E44 GM-pool mismatch.
- Simulated on `3e27fc5` (not committed): `npm test` in `tools/survey-regression` passes with no change to
  `expected.json`. All 243 scoring combinations and all picks are unchanged.

**Batch B: E48, separately.** The same kind of trim changes one survey pick, because shorter lines sort first:
`strategicArchitect|advanced|strong` Black goes from `E52 E53 B49` to `E48 E52 E53`, and its third Notable GM goes from
Vasyl Ivanchuk to Alexandra Kosteniuk. That needs `npm run update` and your review of the changed pick (Medium tier).

**Tests that would prove Batch A:**
1. Add B62, D60 and E44 to `REPAIRED_VAULT_LINES` in `tools/survey-regression/eco_lines.test.js`, each with its
   reference line and the code it wrongly reached (B63, D63, E45); run `npm run test:eco-lines`.
2. `npm test` passes with `expected.json` unchanged (picks, scoring, Notable GM baseline, protected hash).
3. `npm run clickthrough` and `npm run test:known-shrink`; `known-card-issues.json` is updated only if its entries for
   these three cards change, and only by removal.
4. This audit shows no "ends in its code" or "duplicate line" warning for B62, D60 or E44.
5. Live Guardian after deployment, plus a manual look at one B62, D60 and E44 card if the survey can reach them.

## Proposed next steps (each needs the owner's approval)
1. Approve Batch A, then decide on Batch B.
2. Decide how to label the four slots whose colour differs from `ECO_SIDE` (group 3).
3. Decide whether to rename A12 (and E10, which is only editorial).
4. Only after the review, consider a committed baseline so that new findings stand out.
