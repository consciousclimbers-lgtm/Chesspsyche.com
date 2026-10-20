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

10. **Notable GM pools and rotation.** The Notable GM on a card comes from `NOTABLE_GM_POOLS` (approved GMs per opening family and side) in a fixed round-robin. The test checks the data (every code is in the vault and on the pool's side, no code is in two pools for one side, no GM is listed twice in a pool, every entry has a GM, an https source and a status, and every verified GM is an exact GM record name) and that every female GM record is in `NOTABLE_GM_CONSIDERED` with her actual pools. For every pool, with fresh storage, n completed surveys show each of its n GMs once and survey n + 1 repeats survey 1; the GM does not change without a new survey. Through the page, a re-render and a reload (no saved picks in memory) show the same GM as the results. Every card's GM must come from its opening's pool, and a card whose opening has no pool shows none. It prints a representation report (women's share of the pool entries and of the GMs shown, pools with no women, the GMs in the most pools) and warns when a GM is in more than 6 pools; the report is not a quota or a pass/fail gate.

11. **Every reachable card.** For every style × experience level × normal/strong answers, the test retakes the survey until both the White and Black candidate lists are used up (currently 4 to 77 surveys per combination), not just the 3 surveys of check 2. Every card that can appear (190 White, 297 Black) must come from its own side, have a legal line, show a Notable GM from its approved pool (or none when it has no pool), and have a real summary (see **Card summaries** below).

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

`npm run clickthrough` (`clickthrough.js`) is a separate browser test of the results page. It takes the survey by clicking, the way a visitor does, for ten cases: a White B12 pick, a Black B40 pick, a White D85 pick (with B82 on the Black card), a White D00 pick, a White E06 (Catalan) pick that is taken twice, and the cards reported in issue #24: Black B82 (the same survey as White D85, played as Black), Black A40, Black D07 (2nd survey), Black A86 (5th survey) and the White D35 control (2nd survey). For each it checks:
- both cards show the expected opening, each from its own side;
- the board puts the chosen side at the bottom;
- stepping through the demo moves the pieces as the line says, square by square, until the counter reaches the last move;
- each card shows the expected Notable GM (or none), and clicking a shown GM that is in the GM database opens that GM's pop-up.
- switching to another tab and back keeps the same Notable GM;
- for the Catalan case, taking the survey again shows the next GM in the Catalan pool;
- each card's summary, as rendered, passes the card summary rules below;
- each card's Notable GM is one of the approved GMs for that exact ECO code and side (none when it has no pool), and both cards always show the "Notable GM:" line: "Notable GM: <name>", or "Notable GM: None approved for this opening yet." when the card has no approved GM (owner decision, 2026-10-20). A card with no GM and without that line is a `no-gm-heading` issue (see below).

A case for a later survey starts from **saved state** instead of clicking through the earlier surveys: `preload` holds the saved picks (`chesspsyche_opening_picks_v1`) and Notable GM rotation (`chesspsyche_notable_gm_rotation_v1`) that the earlier surveys leave. Before using it, the test replays those earlier surveys in the page and fails if they would save anything different, so a fixture cannot drift from real behaviour. A86 is the 5th survey of `aggressiveVanguard` / no experience / normal answers (the 5th or 6th for other levels), which is why the 3-survey baseline never showed it.

It also opens the Labs board editor, places and erases a piece, plays 1.e4 and checks that the evaluation bar updates (it waits for Stockfish to finish each analysis rather than for a fixed time). Then it checks navigation: the home-page logo opens the survey, the header buttons open Grandmasters, Clubs, Play, the survey and home, and the header logo opens the survey. Any JavaScript or console error fails. It runs offline in the same way as `npm test`. Add `--shots DIR` to save screenshots.

It also tries an illegal move in the board editor (e2-e5, which must be refused) before playing 1.e4.

**Browsers and screen sizes.** `--browser chromium|firefox|webkit` (default Chromium) and `--viewport desktop|mobile` (desktop 1280x1000, default; mobile 390x844 with touch, plus mobile emulation in Chromium and WebKit). `npm run clickthrough:mobile` is the phone-size run. If the browser cannot be started (not installed, or not supported on the machine), the run prints `NOT TESTED` and exits with code 3, never 0. On pull requests, the **Click-through ...** jobs in `regression.yml` run Chromium at phone size, Firefox, WebKit and WebKit at phone size; they are not required by the ruleset.

**Diagnostics.** Every run lists page-load retries, failed requests and HTTP errors. With `--shots DIR`, a check that fails saves a full-page screenshot (`<check>-FAILED.png`); add `--trace` to also keep a Playwright trace of it (`<check>-FAILED-trace.zip`, open with `npx playwright show-trace`). A check that stops with an error (a timeout, a page that does not load) fails with that error, and the other checks still run. `--report FILE` writes the result as JSON: PASS or FAIL per check, or NOT_TESTED.

**Live Guardian (live smoke test).** `node clickthrough.js --url https://www.chesspsyche.com/` runs the same checks against a deployed site, with nothing replaced, so every console error counts. It is read-only: only GET, HEAD and OPTIONS requests go out; any other request is blocked and fails the check. The site's own pages send none (the survey only uses the test browser's own storage); the one allowed exception is the Google Maps embed on the Clubs tab, which reads viewport information with a POST (`READ_ONLY_POSTS` in `clickthrough.js`), and every allowed one is listed in the output. A page that does not load or answers with a server error is retried twice. `--expect-sha256 HASH` makes every page load check that the site served exactly that `index.html`.

The **Live Guardian** workflow (`.github/workflows/live-smoke.yml`) runs after each GitHub Pages deployment, daily, and on demand. Its **Deployment check** waits until the site serves the expected commit's `index.html` (the deployed commit; for daily and manual runs the head of `main`), then the click-through runs in Chromium, Firefox and WebKit at desktop and phone size, and `guardian_report.js` gives one verdict: PASS only when the expected commit is live and every browser and size ran and passed, otherwise FAIL or NOT TESTED. `npm run test:guardian-report` (also run in CI) checks that the verdict never passes something that did not run. Deployment, daily and manual runs never overlap (a newer one waits); pull-request runs of the workflow have their own queue. In `--url` mode service workers are blocked, so every request passes the read-only guard, and a page whose scripts do not load in 30 s is retried like one that does not load. The Guardian has read-only permissions: it never edits code, merges or deploys; a failure produces evidence (screenshots, traces, logs, the report) for a normal pull request. See `RELEASE.md` in the repository root.

## Card summaries and `known-card-issues.json`

`card_checks.js` holds the rules both tests use. A card's summary must not be:
- `empty`;
- `fallback`: the generic "Starts with <moves>" text `ecoToSystem` uses when it has nothing better;
- `move-comment`: a move comment from `ecoVaultData` (the text after " — "), such as "English" or "Queen's Pawn". Reformatting does not hide it: case, punctuation and a leading move label such as "2...Nc6:" are ignored, and a summary made of move comments plus fewer than 4 other words also counts;
- `wrong-side`: a Black card summarised by the comment on a White move (or the other way round).

`clickthrough.js` also checks, on the rendered cards of its cases:
- `no-gm-heading`: a card with no approved Notable GM that does not show "Notable GM: None approved for this opening yet."

Today **457 unique cards** (`ECO|side`: 176 White, 281 Black) break the summary rules, with **463 issue findings** between them: fallback 436, move-comment 21, wrong-side 6. The six extra findings are the six Black cards that are both `move-comment` and `wrong-side` (A11, A15, A16, A40, A41, B01). Almost all of them are cards without a hand-written system. In addition, 8 cards in the click-through cases are `no-gm-heading` (D85, D00, A10 and D03 White; B82, A16, A40 and D07 Black), because today's page hides the line when there is no GM. Both tests print cards and findings separately.

All of these are listed, one card per line, in `known-card-issues.json` (keyed `ECO|side`, each with its issue types), so the checks can run in CI now. The list is **temporary and can only shrink**:
- an issue that is not listed fails;
- a listed issue that no longer occurs also fails, until its entry is removed with `npm run prune:known-card-issues` (which only removes, never adds; summary entries are checked by `npm test` over every reachable card, Notable GM line entries by the click-through over its cases);
- on a pull request, CI runs `check_known_shrink.js` against the base branch: it fails if the list has any card and issue type that the base branch's list does not have (so a new defect cannot be listed in the same PR that introduces it, and one issue type cannot be swapped for another). When the base branch has no list yet, it is only accepted with `index.html` identical to the base branch, so `npm test` proves the list matches the base site. Only a genuinely absent file gets that exception: if the base branch has the file but it cannot be read, is not a regular file, or is not a valid list (or the base branch cannot be resolved), the check fails with the reason. This branch's own list must exist and be a valid list too (JSON with an `issues` object whose values are arrays of strings); a missing, unreadable or malformed list fails rather than counting as empty. `npm run test:known-shrink` (also run in CI) checks those failures. Run the check itself locally with `npm run check:known-shrink`;
- each kind of entry says how it will be removed (the `removal` notes in the file): by the sourced family-and-side summary data planned in issue #24.

`npm run test:strict-cards` and `npm run clickthrough:strict-cards` ignore the list and show every issue the checks catch. The list was created once with `--init-known-card-issues`, which refuses to run again. Never add entries to get a test to pass without the owner's approval.

## Side mismatches (fixed)

`ecoToSystem` used to reuse a hand-written card with the same ECO code even when it belonged to the other colour, so B40 (Black), B12 (White) and D85 (White) showed a card for the wrong side. PR #15 makes it side-aware, so `knownSideIssues` is now empty and any side mismatch fails the test.
