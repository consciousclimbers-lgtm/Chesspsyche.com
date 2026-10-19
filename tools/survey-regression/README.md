# Survey regression test

Checks that a change to `index.html` does not unexpectedly change the survey's opening recommendations or touch protected site code.

## What it checks

1. **Protected code is unchanged.** The test hashes `index.html` with the opening-data block removed. That block runs from `const ecoNamesMap = {` up to the survey picker comment. Any edit outside that block fails the test, including edits to the demo board, evaluation bar, pieces, board editor, results board, player labels, navigation, or the survey logic.
2. **Survey picks are unchanged.** For every style × experience level × normal/strong answers, the test runs the survey three times in a row, which covers the retake behaviour. All 60 × 3 White/Black picks must match `expected.json`.
3. **Recommendation cards are correct.** Each card must come from the side it was picked for, and its moves must be legal. The pre-existing side mismatches listed in `knownSideIssues` are reported but do not fail the test.
4. **The page loads cleanly.** Any JavaScript error fails the test.

chess.js 0.10.3, the same version the page loads from cdnjs, is served from `node_modules`. The test therefore runs offline and gives the same result as the live page.

## Run

```
cd tools/survey-regression
npm install          # first time only; if Playwright has no browser: npx playwright install chromium
npm test             # checks ../../index.html against expected.json
node survey_regression.js /path/to/other/index.html   # check another copy
```

## When a change is intended

If an owner-approved change is meant to alter picks or protected code, run `npm run update` and commit the new `expected.json` with that change. The diff of `expected.json` then shows reviewers exactly which recommendations changed.
