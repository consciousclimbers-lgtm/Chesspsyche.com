# ECO audit findings (Claude)

Audited: `index.html` at `main` commit `3e53eef`. This audit is read-only and changes no site code.

## How to reproduce
```
cd tools/eco-audit
npm install
npm run fetch-ref   # downloads the lichess-org/chess-openings TSV files into ref/
npm run audit
```
- Reference: [lichess-org/chess-openings](https://github.com/lichess-org/chess-openings), 3,865 classified positions.
- Moves are validated with chess.js 1.0.0.
- Classification is by **position**, so transpositions count: a line "reaches" an ECO code if it passes through a position that the reference assigns to that code.
- Move-count convention: **10 full moves = 20 plies**.

## Files and mappings involved
Everything is in `index.html`:

| Structure | Line | Role |
|---|---|---|
| `ecoNamesMap` | 2554 | ECO code → display name (500 codes) |
| `ecoVaultData` | 2684 | ECO code → move line and commentary (500 entries). Aliased as `ECO_OPENINGS` (L3295) for Opening Drill and Speed Run |
| `ECO_SIDE` / `sideForEco` | 3229 / 3281 | ECO code → `white`/`black`/`either`. Drives "You play as …" in the ECO vault and Arena (`loadEcoIntoArena`, L4937; L5014) |
| `ecoVault` | 3284 | Built from the three structures above |
| `archetypes[*].systems[level].whiteSystem/blackSystem` | 3298–3410 | The 36 survey recommendation slots, each with its own `eco`, `name`, and `variations[0].moves` |
| `initResultsBoard` | ~3893 | Results demo board. On `main` it plays only `moves.slice(0, 10)`, i.e. **10 plies, not 10 moves** |

The results-page "Playing as White/Black" badges (L3818, L3828) are fixed per slot. They do **not** read `ECO_SIDE`.

## Verified findings for the known leads

| Lead | Verdict | Evidence |
|---|---|---|
| **B80 "Open Sicilian (3.d4 Mainlines)"** (`aggressiveVanguard.advancedGm.whiteSystem`, L3332) | **Confirmed wrong code.** | The line 1.e4 c5 2.Nf3 e6 3.d4 cxd4 4.Nxd4 is B40 (Sicilian, French Variation, Open), not B80. Branch `chesspsyche/survey-opening-audit-fixes` already relabels it to B40. |
| **Duplicate B80** | **Confirmed.** | `tacticalFirebrand.advancedGm.whiteSystem` (L3313) and `aggressiveVanguard.advancedGm.whiteSystem` (L3332). |
| **Duplicate E20** | **Confirmed.** | `strategicArchitect.intermediate.blackSystem` (L3348) and `flexibleChameleon.intermediate.blackSystem` (L3386). The second is named "Nimzo-Indian (Rubinstein)", and its line with 4.e3 is **E40**, not E20. |
| **D35 Queen's Gambit Exchange** (L3347) | **Confirmed: the line never reaches D35.** | 1.d4 d5 2.c4 e6 3.cxd5 exd5 4.Nc3 stays in D30. The reference D35 needs 3.Nc3 Nf6 4.cxd5. The vault entry for D35 (L3020) is correct. |
| **D43 Semi-Slav** | **Slot correct; vault entry wrong.** | The slot (L3352) reaches D43. The vault entry `ecoVaultData.D43` (L3028), 1.d4 d5 2.c4 e6 3.Nc3 Nf6 4.Bg5 c6, is a QGD Modern (D50) line, not the Semi-Slav. |
| **D05 Colle-Zukertort** (L3366) | **Code OK; line is short** (9 plies). | It reaches D05. |
| **Five White slots mislabeled as Black** | **Confirmed as a data conflict.** | The White slots using B80 (×2), D35, C84 and C88 all have `ECO_SIDE = black`. The results card still says "White" because the badge is hard-coded per slot. The conflict only shows if a code is opened in the ECO vault or Arena, which says "You play as Black". Not yet confirmed visually in a browser. |
| **E98/E99 name/move mismatch** | **Confirmed, and worse: the moves are illegal.** | Both lines play 8.d5 Ne7 9.Nd2 f5, but ...f5 is impossible with the knight still on f6. The E98 name ("9...Ne8 10.Nd2 f5 11.f3") doesn't match its moves either. The reference E98 is 9.Ne1; E99 is 9.Ne1 Nd7 10.f3 f5 or similar. |
| **Lines shorter than 10 moves** | **Confirmed, almost everywhere.** | All 36 slots are under 20 plies (range 2–16). Only 10 of the 500 vault lines have ≥20 plies. |

## Other findings (beyond the original leads)
**Recommendation slots whose line doesn't reach the stated code.** The line is listed first, then where it actually lands:
- C50 "Evans Gambit": 4.b4 is C51
- C45 "Scotch": stops at 3.d4, which is C44
- C26 "Vienna": 3.f4 is C29
- E97 "Mar del Plata": stops before 7.O-O Nc6, which is E92
- B99 "Najdorf 6.Bg5": stops at 6...e6, which is B95
- D85 "Grünfeld": D80
- E00 "Catalan": E01
- A10 "English Symmetrical": A36
- A04 "Réti": transposes to A09
- A07 "KIA": A05 by transposition (borderline)

**Recommendation slots with `ECO_SIDE` disagreeing with the slot colour:** B80, B80, D35, C84, C88. B40 also has this problem on the survey-opening-audit-fixes branch.

**ECO vault (500 entries):**
- 2 contain illegal moves (E98, E99).
- 66 are too short to reach their own code: the line is a correct prefix of the reference line.
- 71 follow a different line and don't reach their code's position: A32 A33 A39 A42 A61 A62 A63 A64 A88 A89 A99 B34 B35 B55 B59 B61 B62 B67 B68 B69 B73 B77 B78 B79 B85 B87 C76 C91 C93 D29 D39 D43 D44 D45 D46 D47 D48 D49 D54 D56 D57 D58 D59 D60 D62 D65 D71 D75 D77 D78 D79 D84 D95 E09 E25 E26 E28 E29 E44 E48 E54 E55 E56 E57 E58 E59 E62 E66 E68 E71 E79.
  - Each of these needs manual review. Some may be stylistic move orders rather than real errors.

## Not verified / blockers
- `chesspsyche_mapping_audit.js` (mentioned in `COLLABORATION_WORKFLOW.md`) is not in the repository on any branch, so it was not run.
- Nothing has been tested in a browser yet.
- ECO boundaries differ slightly between references; lichess is used here as the single source of truth. Borderline cases (A07/A05, A04/A09) are noted rather than treated as definite errors.

## Proposed repair order (pending owner approval)
1. E98/E99: replace the illegal lines with correct reference lines and names.
2. Recommendation slots: fix the code or the line for B80 (3.d4), E20 (Rubinstein → E40), D35, C50, C45, C26, E97, B99, D85, E00, A10, so each line reaches its stated code. Resolve the B80 and E20 duplicates.
3. Decide how a White recommendation that uses a "Black" ECO code (B80, D35, C84, C88) should be labelled in the vault and Arena. This is a product decision for the owner.
4. Extend lines to 20 plies and change `slice(0, 10)` → `slice(0, 20)`. That edit touches the protected results demo board, so it needs explicit owner approval.
5. Vault entries that don't reach their own code, in batches.
