# Survey-pick regression test

Checks that a change to `index.html` does not unexpectedly change the survey's opening recommendations (picks) or touch protected site code.

**Scope: this is a survey-pick regression test, not an end-to-end survey test.** It loads the page in headless Chromium and calls the page's own picker, `choosePicksForRun(style)`, directly. Before each call it sets the inputs the survey would set: the style, the experience level (`skillLevelKey`), and the strong/normal answer count (`lastExtremeCount`). It does **not** click through or submit the survey UI. So it does not test:
- question display or answer selection;
- how answers are scored into a style;
- the results-page rendering, demo board or evaluation bar behaviour.

Those areas are covered only by the protected-code check below: the test fails if their code changes, but it does not exercise them.

## What it checks

1. **Protected code is unchanged.** The test hashes `index.html` with the opening-data block removed. That block runs from `const ecoNamesMap = {` up to the survey picker comment. Any edit outside that block fails the test, including edits to the demo board, evaluation bar, pieces, board editor, results board, player labels, navigation, or the survey logic.
2. **Survey picks are unchanged.** For every style × experience level × normal/strong answers, the test calls `choosePicksForRun` three times in a row, which covers the retake behaviour. All 60 × 3 White/Black picks must match `expected.json`.
3. **Recommendation cards are correct.** Each card must come from the side it was picked for, and its moves must be legal. The pre-existing side mismatches listed in `knownSideIssues` are reported but do not fail the test.
4. **The page loads cleanly.** Any JavaScript error fails the test.

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

If an owner-approved change is meant to alter picks or protected code, run `npm run update` and commit the new `expected.json` with that change. The diff of `expected.json` then shows reviewers exactly which recommendations changed.

## Known issues (separate follow-up, not fixed here)

`ecoToSystem(code)` reuses a hand-written card with the same ECO code even when that card belongs to the other colour. Three picks are affected; they are listed in `knownSideIssues` and existed before PR #13:

- **B40**, picked for Black, shows the White card "Open Sicilian (3.d4 Mainlines)".
- **B12**, picked for White, shows the Black card "Caro-Kann (Advance Line)".
- **D85**, picked for White, shows the Black card "Grünfeld Defense".

Fixing these needs a survey-logic change, which is out of scope for this test PR. When a fix lands, remove the entries from `knownSideIssues`. The test reports any entry that is no longer seen.
