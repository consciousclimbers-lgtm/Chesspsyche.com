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

10. **Notable GM pools and rotation.** The Notable GM on a card comes from `NOTABLE_GM_POOLS` (approved GMs per opening family and side) in a fixed round-robin. The test checks the data (every code is in the vault and on the pool's side, no code is in two pools for one side, no GM is listed twice in a pool, every entry has a GM, an https source and a status, and every verified GM is an exact GM record name). Pools that carry `recordLabels` are synchronized with the GM records (the data behind the GM pop-up): each entry's FIDE `id` must give a record with the same name, and a verified entry's record must list one of the pool's `recordLabels` in its `system` for the pool's side. `npm run report:gm-sync` lists every pool entry with its record and, for synchronized pools, whether the record supports it directly, only at family level, or not at all. The test also checks that every female GM record is in `NOTABLE_GM_CONSIDERED` with her actual pools. For every pool, with fresh storage, n completed surveys show each of its n GMs once and survey n + 1 repeats survey 1; the GM does not change without a new survey. Through the page, a re-render and a reload (no saved picks in memory) show the same GM as the results. Every card's GM must come from its opening's pool, and a card whose opening has no pool shows none. It prints a representation report (women's share of the pool entries and of the GMs shown, pools with no women, the GMs in the most pools) and warns when a GM is in more than 6 pools; the report is not a quota or a pass/fail gate.

11. **Every reachable card.** For every style × experience level × normal/strong answers, the test retakes the survey until both the White and Black candidate lists are used up (currently 4 to 77 surveys per combination), not just the 3 surveys of check 2. Every card that can appear (190 White, 297 Black) must come from its own side, have a legal line, show a Notable GM from its approved pool (or none when it has no pool), and have a real summary (see **Card summaries** below).

**Results cards agree** (`npm run test:results-identity`, also run in CI). `results_identity.js` collects every Results card the survey can show (all 487 reachable cards, 108 of them in the 3-survey snapshot), puts each one on the real demo board and checks, against `results-cards.json`: the card's ECO code, side and name; its Notable GM pool (for the card's side, listing the card's code) and that the GM shown is from that pool; that the board shows the card's source line (the vault line, or the hand-written system's own line) up to 20 plies (ten full moves) with nothing cut short or added; that the board position after every ply, played with the page's own Next button code, equals chess.js's; that the board reaches the position where the line first enters its ECO code in lichess-org/chess-openings (commit a6189a3); that a line shorter than 20 plies shows the honest short-line note under the board; and that a line whose named position comes only after ply 20 (10 cards, e.g. C98 at half-move 24) shows all 20 plies, is listed in the page's `DEMO_NAMED_AFTER_CAP` with that half-move, and shows the beyond-cap note. Lines that never enter their own code are listed under `known` in `results-cards.json` and reported, not failed; the list may only shrink. `npm run test:results-identity-selftest` runs the same checks on two broken copies of `index.html`: with the old 10-ply limit put back it must catch exactly the 19 snapshot cards that stopped before their named opening (the Marshall Attack C89 among them), and with the beyond-cap note switched off it must catch exactly the 10 beyond-cap cards. After an owner-approved change to card names, lines or GM pools, regenerate the file with `node results_identity.js ../../index.html --update --ref <dir>`, where `<dir>` holds `a.tsv` to `e.tsv` from `https://raw.githubusercontent.com/lichess-org/chess-openings/a6189a3/`.

**Repaired ECO lines** (`npm run test:eco-lines`, also run in CI). `eco_lines.test.js` plays each individually repaired vault line (currently D71, E00 and the ten short lines A69, B56, C19, C77, C83, D56, D57, D68, D99, E19, and the three lines B62, D60, E44 that ran past their code) and checks that it is legal, ends on the position lichess-org/chess-openings gives its code (compared as FEN, so a transposition passes), no longer ends on the position it wrongly reached before, and has one commentary entry per move. It also checks that the ten survey-slot lines repaired in PR #13 are still in `index.html` byte for byte (by sha256). It needs no browser.

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

**Live Guardian (live smoke test).** `node clickthrough.js --url https://www.chesspsyche.com/` runs the same checks against a deployed site. It is read-only: GET, HEAD and OPTIONS requests pass; the Google Maps viewport-read POST is the one explicitly listed network exception; the known Google Maps telemetry POST to `/maps_api_js_slo/log` is fulfilled locally with an empty 204 response and is never sent externally. Any other write is blocked and fails the check, and a final **read-only-guard** check fails if any unapproved write was blocked, including during a page load that was then retried. Every allowed viewport POST and every mocked telemetry POST is listed in the output. The request policy is centralized in `live_request_policy.js` and covered by `npm run test:live-request-policy`, which is also run at the start of `npm test`. A page that does not load, answers with a server error, or whose scripts do not load is retried twice. Any HTTP 4xx response (a missing or refused resource) fails the check on every page load, whether or not the browser logs a console error for it. Only transient failures are recoverable (no response, a network error, an HTTP 5xx); they are listed under the retries. Any HTTP 4xx response, JavaScript error, other console error or blocked write from a retried attempt still fails the check, even when the next attempt loads cleanly. `npm run test:retries` (also run in CI) proves both against a local server. `--expect-sha256 HASH` makes every page load check that the site served exactly that `index.html`.

The **Live Guardian** workflow (`.github/workflows/live-smoke.yml`) runs after each GitHub Pages deployment, daily, and on demand. Its **Deployment check** waits until the site serves the expected commit's `index.html` (the deployed commit; for daily and manual runs the head of `main`), then the click-through runs in Chromium, Firefox and WebKit at desktop and phone size, and `guardian_report.js` gives one verdict: PASS only when the expected commit is live and every browser and size ran and passed, otherwise FAIL or NOT TESTED. A report that cannot be read, is malformed, or duplicates another for the same browser and size is a FAIL, and a click-through that stops with an error still writes a FAIL report. `npm run test:guardian-report` (also run in CI) checks that the verdict never passes something that did not run. Deployment, daily and manual runs never overlap (a newer one waits); pull-request runs of the workflow have their own queue. In `--url` mode service workers are blocked, so every request passes the read-only guard, and a page whose scripts do not load in 30 s is retried like one that does not load. The Guardian has read-only permissions: it never edits code, merges or deploys; a failure produces evidence (screenshots, traces, logs, the report) for a normal pull request. See `RELEASE.md` in the repository root.

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
