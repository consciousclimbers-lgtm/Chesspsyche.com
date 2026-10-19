# Survey-pick regression test

Checks that a change to `index.html` does not unexpectedly change the survey's opening recommendations (picks) or touch protected site code.

**Scope: this is a survey-pick regression test, not an end-to-end survey test.** It loads the page in headless Chromium and calls the page's own picker, `choosePicksForRun(style)`, directly. Before each call it sets the inputs the survey would set: the style, the experience level (`skillLevelKey`), and the strong/normal answer count (`lastExtremeCount`). It does **not** click through or submit the survey UI; `npm run clickthrough` (below) does that, and covers the results page, demo board, board editor, evaluation bar and navigation.

Both tests run automatically on every pull request to `main` (GitHub Actions, check name **Regression tests**, `.github/workflows/regression.yml`). The results and screenshots are attached to each run.

## What it checks

1. **Protected code is unchanged.** The test hashes `index.html` with the opening-data block removed. That block runs from `const ecoNamesMap = {` up to the survey picker comment. Any edit outside that block fails the test, including edits to the demo board, evaluation bar, pieces, board editor, results board, player labels, navigation, or the survey logic.
2. **Survey picks are unchanged.** For every style × experience level × normal/strong answers, the test calls `choosePicksForRun` three times in a row, which covers the retake behaviour. All 60 × 3 White/Black picks must match `expected.json`.
3. **Recommendation cards are correct.** Each card must come from the side it was picked for, and its moves must be legal. A mismatch fails the test unless it is listed in `knownSideIssues` (currently empty).
4. **The page loads cleanly.** Any JavaScript error or console error fails the test. The only console errors allowed are `Failed to load resource: net::ERR_FAILED`, which the blocked offline requests cause.
5. **The question bank is complete.** Each of the 5 areas has 10 questions; every question has a text and low/mid/high answers; no text is empty or repeated. 200 survey runs built by the page's `buildSurveyRun()` must each ask one question per area, with answers worth 1, 2 and 3 points taken from the right lists.
6. **Scoring is unchanged.** All 243 answer combinations (1 to 3 points in each area) must give the style saved under `scoring` in `expected.json`, through the page's `getArchetypeFromPoints`.
7. **Notable GM is unchanged.** For every combination and run above, the GM named under "Notable GM" on the White and Black cards must match `gm-baseline.json`. The output also lists shown GMs that have no record in the GM database (their name cannot open a pop-up).
8. **Hand-written Notable GM names are unchanged.** The `notableGm` of all 36 hand-written systems in `archetypes` must match `gm-baseline.json`. These names sit in the opening-data block, which check 1 does not cover.
9. **The Labs GM drill is unchanged.** For each GM in the Labs picker (the first 30 of the GM list), the moves `startGmDrill(name)` loads must match `gm-baseline.json`. The drill finds a GM's opening by matching their first name against the hand-written `notableGm` names, so renaming one changes the drill.

Checks 7 to 9 read `gm-baseline.json`, kept separate from `expected.json`. Each file has its own update command, so updating one can never overwrite the other: `npm run update` rewrites only `expected.json`, and `npm run update:gm-baseline` rewrites only `gm-baseline.json`. An owner-approved change to the Notable GM, the hand-written names or the Labs drill needs `npm run update:gm-baseline`, and the diff of `gm-baseline.json` shows exactly what changed.

**Determinism.** The opening picker (`ecoCandidatesFor`, `pickEcoCode`, `choosePicksForRun`) uses no randomness. Its only state is the retake history saved in localStorage. Other parts of the page do use `Math.random`, for question order and answer order. So that nothing random can leak into the result, the test:
- replaces `Math.random` with a seeded generator before any page script runs;
- uses a fresh browser context, with empty localStorage, for every run;
- clears the saved picks before each combination;
- runs the whole pick simulation 3 times with the same seed (change with `--repeat N`), and all runs must match;
- runs it once more with a different seed, which must give the same picks.

**Offline.** The page loads three external resources: chess.js 0.10.3 from cdnjs, Font Awesome CSS from cdnjs, and a Google Fonts stylesheet. The test blocks every http(s) request. The only exception is chess.js, which is served from `node_modules` at the same version the page uses, so the picks and cards behave as on the live page. Fonts and icons are not needed for these checks. The output lists the hosts that were blocked.

Network access is needed only once, for `npm install`, and for `npx playwright install chromium` if Playwright has no browser yet. After that, `npm test` makes no network requests.

## Run

```
cd tools/survey-regression
npm install          # first time only; if Playwright has no browser: npx playwright install chromium
npm test             # checks ../../index.html against expected.json
node survey_regression.js /path/to/other/index.html   # check another copy
```

## When a change is intended

If an owner-approved change is meant to alter picks, scoring or protected code, run `npm run update` and commit the new `expected.json` with that change. The diff of `expected.json` then shows reviewers exactly which recommendations changed.

## Results-page click-through

`npm run clickthrough` (`clickthrough.js`) is a separate browser test of the results page. It takes the survey by clicking, the way a visitor does, for four cases: a White B12 pick, a Black B40 pick, a White D85 pick and a White D00 pick (a case where both cards name a GM). For each it checks:
- both cards show the expected opening, each from its own side;
- the board puts the chosen side at the bottom;
- stepping through the demo moves the pieces as the line says, square by square, until the counter reaches the last move;
- each card shows the expected Notable GM (or none), and clicking a shown GM that is in the GM database opens that GM's pop-up.

It also opens the Labs board editor, places and erases a piece, plays 1.e4 and checks that the evaluation bar updates (it waits for Stockfish to finish each analysis rather than for a fixed time). Then it checks navigation: the home-page logo opens the survey, the header buttons open Grandmasters, Clubs, Play, the survey and home, and the header logo opens the survey. Any JavaScript or console error fails. It runs offline in the same way as `npm test`. Add `--shots DIR` to save screenshots.

**Live smoke test.** `node clickthrough.js --url https://www.chesspsyche.com/` runs the same checks against a deployed site, with nothing blocked or replaced, so every console error counts. The **Live smoke test** workflow runs it after each GitHub Pages deployment; see `RELEASE.md` in the repository root.

## Side mismatches (fixed)

`ecoToSystem` used to reuse a hand-written card with the same ECO code even when it belonged to the other colour, so B40 (Black), B12 (White) and D85 (White) showed a card for the wrong side. PR #15 makes it side-aware, so `knownSideIssues` is now empty and any side mismatch fails the test.
