// Browser click-through for the results page (complements survey_regression.js, which only calls the picker).
//
// For each case it takes the survey in headless Chromium by clicking: open the survey tab, click the
// experience level, click an answer on each of the 5 questions. Then it checks, on the results page:
//   - the White and Black cards show the expected openings, each from its own side;
//   - each card shows the expected "Notable GM" (or none), and clicking a shown GM whose name is in the
//     GM database opens that GM's pop-up;
//   - the board shows the chosen side at the bottom (White/Black orientation);
//   - stepping through the demo moves the pieces: after every step the on-screen pieces must match the
//     line replayed in chess.js, and the move counter must reach the end;
//   - each card's rendered summary passes card_checks.js (not empty, not the "Starts with" fallback, not a
//     copied move comment, not a comment on the other side's move); issues listed in
//     known-card-issues.json are reported, not failed (--strict-cards ignores that list);
//   - each card's Notable GM comes from the approved pool for that exact ECO code and side (none when it
//     has no pool), and the "Notable GM:" line is on the card exactly when there is a GM.
// A case with "preload" starts from the saved picks and Notable GM rotation that earlier surveys leave in
// localStorage, so a later survey (such as the 5th) is tested without clicking through the earlier ones.
// The test first checks that the fixture is exactly what those earlier surveys save (preload.after).
// It opens the Labs board editor and checks that placing and erasing a piece works, that a move can be
// played, and that the evaluation bar updates: it waits for Stockfish to finish analysing the start
// position, plays 1.e4, and waits for the finished analysis of the new position.
// It checks navigation: from the home page the logo opens the survey; the header buttons open the
// Grandmasters, Clubs, Play, survey and home sections; the header logo opens the survey.
// Any JavaScript error or console error fails the case it happens in.
//
// Offline by default, like survey_regression.js: every http(s) request is blocked except chess.js 0.10.3,
// served from node_modules (the console errors those blocked requests cause are expected and ignored).
// With --url it tests a deployed site instead (live smoke test): nothing is blocked or replaced, and
// every console error counts. A fresh browser context (empty localStorage) is used for every case, so
// each case gets the first pick for its combination.
//
// Usage: node clickthrough.js [path/to/index.html] [--shots DIR] [--strict-cards]
//        node clickthrough.js --url https://www.chesspsyche.com/ [--shots DIR]
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { Chess } = require('chess.js');
const cardChecks = require('./card_checks');

const args = process.argv.slice(2);
const strictCards = args.includes('--strict-cards');
const shots = args.includes('--shots') ? path.resolve(args[args.indexOf('--shots') + 1]) : null;
const url = args.includes('--url') ? args[args.indexOf('--url') + 1] : null;
const positional = args.filter((a, i) => !a.startsWith('--') && !['--shots', '--url'].includes(args[i - 1]));
const htmlPath = path.resolve(positional[0] || path.join(__dirname, '../../index.html'));
const target = url || 'file://' + htmlPath;
const chessLocal = require.resolve('chess.js');
// Console message Chromium logs for each request blocked in offline mode
const BLOCKED_LOAD = 'Failed to load resource: net::ERR_FAILED';

// strong = 4 or more of the 5 answers are the strongest or mildest choice (lastExtremeCount >= 4)
// gm: the Notable GM each card shows on a first survey (null = no Notable GM line): the starting GM of
// the opening's approved pool. retake: the picks and Notable GMs after taking the same survey again,
// where the pool's next GM must appear.
const CASES = [
  { name: 'white-B12', style: 'patientGrinder', level: 'novice', strong: false, side: 'white', white: 'B12', black: 'C42', gm: { white: 'Alexander Grischuk', black: 'Yu Yangyi' } },
  { name: 'black-B40', style: 'strategicArchitect', level: 'novice', strong: false, side: 'black', white: 'D06', black: 'B40', gm: { white: 'Levon Aronian', black: 'Vasyl Ivanchuk' } },
  { name: 'white-D85', style: 'patientGrinder', level: 'advanced', strong: true, side: 'white', white: 'D85', black: 'B82', gm: { white: null, black: null } },
  { name: 'white-D00', style: 'patientGrinder', level: 'none', strong: false, side: 'white', white: 'D00', black: 'C42', gm: { white: null, black: 'Yu Yangyi' } },
  { name: 'white-E06', style: 'flexibleChameleon', level: 'advanced', strong: true, side: 'white', white: 'E06', black: 'A16', gm: { white: 'Ding Liren', black: null },
    retake: { white: 'E07', black: 'D71', gm: { white: 'Aleksandra Goryachkina', black: null } } },
  // Reported cards (issue #24). The white-D85 case above covers the B82 Black card.
  { name: 'black-A40', style: 'strategicArchitect', level: 'none', strong: false, side: 'black', white: 'D06', black: 'A40', gm: { white: 'Levon Aronian', black: null } },
  { name: 'black-D07', style: 'strategicArchitect', level: 'none', strong: false, side: 'black', white: 'A10', black: 'D07', gm: { white: null, black: null },
    preload: { after: 1, picks: { 'strategicArchitect|white': 'D06', 'strategicArchitect|black': 'A40' }, rotation: { "Queen's Gambit / QGD Exchange|white": 1 } } },
  // A86 first appears on the 5th survey of this combination (not in the 3-survey baseline)
  { name: 'black-A86', style: 'aggressiveVanguard', level: 'none', strong: false, side: 'black', white: 'D03', black: 'A86', gm: { white: null, black: 'Anna Muzychuk' },
    preload: { after: 4, picks: { 'aggressiveVanguard|white': 'A46', 'aggressiveVanguard|black': 'A85' }, rotation: { 'Dutch Defence|black': 3, "Alekhine's Defence|black": 1 } } },
  // Control: hand-written White system with a summary and a pool GM
  { name: 'white-D35', style: 'patientGrinder', level: 'none', strong: true, side: 'white', white: 'D35', black: 'D30', gm: { white: 'Levon Aronian', black: 'Nino Batsiashvili' },
    preload: { after: 1, picks: { 'patientGrinder|white': 'B12', 'patientGrinder|black': 'C42' }, rotation: { 'Caro-Kann Advance|white': 1, "Petrov's Defence|black": 1 } } },
];

async function takeSurvey(page, label, vec) {
  await page.locator("[onclick=\"switchTab('quiz')\"]:visible").first().click();
  await page.getByText(label, { exact: true }).click();
  for (let q = 0; q < 5; q++) {
    await page.waitForFunction(n => currentQuestionIdx === n && document.querySelectorAll('#quiz-container button.option-card').length === 3 && !isAdvancing, q);
    const idx = await page.evaluate(v => { const it = currentRun[currentQuestionIdx]; return it.options.findIndex(o => o.points === v[SURVEY_AREAS.indexOf(it.area)]); }, vec);
    await page.locator('#quiz-container button.option-card').nth(idx).click();
  }
  await page.waitForSelector('#tab-results:not([style*="display: none"]) #results-chess-board .square', { timeout: 10000 });
  await page.waitForTimeout(400);
}

const gmLineTexts = page => page.locator('#results-container span[onclick^="openGmModal"]').allTextContents().then(t => t.map(x => x.trim()));

async function openPage(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  if (!url) await context.route(/^https?:\/\//, r => r.abort());
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(`page error: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error' && (url || m.text() !== BLOCKED_LOAD)) errors.push(`console error: ${m.text()}`); });
  if (!url) await page.route('**/chess.js/0.10.3/chess.min.js', r => r.fulfill({ path: chessLocal, contentType: 'application/javascript' }));
  await page.goto(target);
  const ready = await page.waitForFunction(() => typeof window.Chess === 'function' && typeof archetypes === 'object', null, { timeout: 30000 }).then(() => true, () => false);
  if (!ready) throw new Error(`${target} did not load chess.js and the page scripts within 30 s. Errors: ${errors.join('; ') || 'none'}`);
  return { context, page, errors };
}

// Piece on every results-board square (FEN letter), keyed by square name, read from the screen:
// on-screen squares run row by row from the top left, so the square name depends on the side at the bottom
const boardPieces = (page, side) => page.evaluate(side => {
  const out = {}, shape = {};
  for (const k of Object.keys(svgPieces)) { const d = document.createElement('div'); d.innerHTML = svgPieces[k]; shape[k] = d.innerHTML; }
  document.querySelectorAll('#results-chess-board .square').forEach((sq, i) => {
    const f = side === 'white' ? i % 8 : 7 - i % 8, r = side === 'white' ? 8 - Math.floor(i / 8) : Math.floor(i / 8) + 1;
    out['abcdefgh'[f] + r] = Object.keys(shape).find(k => sq.innerHTML.includes(shape[k])) || '';
  });
  return out;
}, side);

function expectedPieces(moves) {
  const g = new Chess();
  for (const m of moves) g.move(m);
  const out = {};
  for (const f of 'abcdefgh') for (let r = 1; r <= 8; r++) { const p = g.get(f + r); out[f + r] = p ? (p.color === 'w' ? p.type.toUpperCase() : p.type) : ''; }
  return out;
}

const diffSquares = (a, b) => Object.keys(b).filter(k => a[k] !== b[k]);

async function runCase(browser, c) {
  const { context, page, errors } = await openPage(browser);
  const fails = [], info = {};
  // An answer vector that the page's own scoring maps to the wanted style and strength
  const vec = await page.evaluate(({ style, strong }) => {
    for (let i = 0; i < 243; i++) {
      const v = [0, 1, 2, 3, 4].map(k => Math.floor(i / 3 ** (4 - k)) % 3 + 1);
      if (getArchetypeFromPoints(v) === style && (v.filter(x => x !== 2).length >= 4) === strong) return v;
    }
    return null;
  }, c);
  if (!vec) { await context.close(); return { ...c, fails: ['no answer set gives this style'], info, errors }; }
  const label = await page.evaluate(k => SKILL_LEVELS.find(l => l.key === k).label, c.level);
  if (c.preload) {
    // The fixture must equal what `after` earlier surveys with these inputs save; then it is loaded
    const made = await page.evaluate(({ style, level, strong, preload }) => {
      localStorage.removeItem(PICKS_KEY); localStorage.removeItem(GM_ROTATION_KEY);
      skillLevelKey = level; lastExtremeCount = strong ? 5 : 0;
      for (let i = 0; i < preload.after; i++) choosePicksForRun(style);
      const got = { picks: loadOpeningPicks(), rotation: loadGmRotation() };
      currentPicks = null;
      localStorage.setItem(PICKS_KEY, JSON.stringify(preload.picks));
      localStorage.setItem(GM_ROTATION_KEY, JSON.stringify(preload.rotation));
      return got;
    }, c);
    info.preload = `saved state of ${c.preload.after} earlier survey(s)`;
    if (JSON.stringify(made.picks) !== JSON.stringify(c.preload.picks) || JSON.stringify(made.rotation) !== JSON.stringify(c.preload.rotation))
      fails.push(`fixture differs from what ${c.preload.after} earlier survey(s) save: ${JSON.stringify(made)}`);
  }
  await takeSurvey(page, label, vec);

  info.scored = await page.evaluate(() => ({ level: skillLevelKey, extremeAnswers: lastExtremeCount }));
  if (info.scored.level !== c.level || (info.scored.extremeAnswers >= 4) !== c.strong) fails.push(`survey scored ${JSON.stringify(info.scored)}`);
  // Cards on the page, and which side each card object belongs to (hand-written slot side, else vault side)
  const shown = await page.evaluate(() => {
    const handSide = new Set();
    for (const a of Object.values(archetypes)) for (const s of Object.values(a.systems)) { handSide.add(`${s.whiteSystem.eco}|white`); handSide.add(`${s.blackSystem.eco}|black`); }
    const sideOf = (sys, want) => handSide.has(`${sys.eco}|${want}`) ? want : (ecoVault.find(e => e.eco === sys.eco) || {}).side;
    const titles = [...document.querySelectorAll('#results-container h3.gradient-text')].map(h => h.textContent.trim());
    const ecos = [...document.querySelectorAll('#results-container span.text-accentGold')].map(s => s.textContent.trim()).filter(x => x.startsWith('ECO'));
    return {
      whitePanel: `${ecos[0]} ${titles[0]}`, blackPanel: `${ecos[1]} ${titles[1]}`,
      white: { eco: currentPicks.whiteSystem.eco, name: currentPicks.whiteSystem.name, side: sideOf(currentPicks.whiteSystem, 'white') },
      black: { eco: currentPicks.blackSystem.eco, name: currentPicks.blackSystem.name, side: sideOf(currentPicks.blackSystem, 'black') },
    };
  });
  info.cards = shown;
  for (const s of ['white', 'black']) {
    if (shown[s].eco !== c[s]) fails.push(`${s} pick ${shown[s].eco}, expected ${c[s]}`);
    if (shown[s].side !== s && shown[s].side !== 'either') fails.push(`${s} card "${shown[s].name}" is a ${shown[s].side} card`);
    if (!shown[`${s}Panel`].includes(`ECO: ${c[s]}`) || !shown[`${s}Panel`].includes(shown[s].name)) fails.push(`${s} panel shows "${shown[`${s}Panel`]}"`);
  }

  // Notable GM line on each card, and the GM pop-up it opens
  const gmLinks = page.locator('#results-container span[onclick^="openGmModal"]');
  const gmShown = await page.evaluate(() => ['whiteSystem', 'blackSystem'].map(k => currentPicks[k].notableGm || null));
  const gmTexts = await gmLinks.allTextContents();
  info.gm = { white: gmShown[0], black: gmShown[1], modal: [] };
  for (const [i, s] of ['white', 'black'].entries()) if (gmShown[i] !== c.gm[s]) fails.push(`${s} Notable GM "${gmShown[i]}", expected "${c.gm[s]}"`);
  const wantTexts = gmShown.filter(Boolean);
  if (JSON.stringify(gmTexts.map(t => t.trim())) !== JSON.stringify(wantTexts)) fails.push(`Notable GM lines show ${JSON.stringify(gmTexts)}, expected ${JSON.stringify(wantTexts)}`);
  for (let i = 0; i < gmTexts.length; i++) {
    const name = gmTexts[i].trim();
    const inDb = await page.evaluate(n => grandmastersList.some(g => g.name === n), name);
    if (!inDb) { info.gm.modal.push(`${name}: no GM record, no pop-up`); continue; }
    await gmLinks.nth(i).click();
    const opened = await page.waitForSelector('#gm-modal:not(.hidden)', { timeout: 5000 }).then(() => true, () => false);
    const content = opened ? await page.textContent('#gm-modal-content') : '';
    if (!opened || !content.includes(name)) fails.push(`clicking Notable GM "${name}" did not open its pop-up`);
    else info.gm.modal.push(`${name}: pop-up opens`);
    await page.evaluate(() => closeGmModal());
  }
  // Card text as rendered: summary under each title, and whether the card has a "Notable GM:" line;
  // the approved pool GMs for each card's exact ECO code and side
  const texts = await page.evaluate(() => [...document.querySelectorAll('#results-container h3.gradient-text')].slice(0, 2).map((h, i) => {
    const sys = currentPicks[i ? 'blackSystem' : 'whiteSystem'], side = i ? 'black' : 'white';
    const pool = notableGmPool(sys.eco, side);
    return {
      eco: sys.eco, side, summary: (h.nextElementSibling && h.nextElementSibling.tagName === 'P') ? h.nextElementSibling.textContent.trim() : '',
      comments: (ecoVaultData[sys.eco] || {}).commentary || [],
      gmLine: [...h.parentElement.querySelectorAll('span')].some(s => s.textContent.trim().startsWith('Notable GM')),
      pool: pool ? pool.key : null, approved: pool ? eligibleNotableGms(pool) : []
    };
  }));
  const found = {};
  info.text = [];
  for (const [i, t] of texts.entries()) {
    const gm = gmShown[i];
    const issues = cardChecks.summaryIssues(t);
    if (issues.length) found[`${t.eco}|${t.side}`] = issues;
    info.text.push(`${t.side} ${t.eco}: "${t.summary}"${issues.length ? ` [${issues.join(', ')}]` : ''}; GM pool ${t.pool || 'none'}`);
    if (gm ? !t.approved.includes(gm) : t.approved.length) fails.push(`${t.side} ${t.eco} Notable GM "${gm}" is not from the approved pool (${t.pool || 'none'}: ${t.approved.join(', ') || 'no GMs'})`);
    if (t.gmLine !== !!gm) fails.push(`${t.side} ${t.eco} card ${t.gmLine ? 'shows' : 'has no'} a "Notable GM:" line, but its GM is ${gm || 'none'}`);
  }
  const cmp = cardChecks.compareKnown(found, { strict: strictCards });
  fails.push(...cmp.fails);
  info.knownText = cmp.listed;

  // Switching tabs and coming back keeps the same Notable GM
  await page.evaluate(() => switchTab('grandmasters')); await page.waitForTimeout(200);
  await page.evaluate(() => switchTab('results')); await page.waitForTimeout(300);
  const afterTabs = await gmLineTexts(page);
  if (JSON.stringify(afterTabs) !== JSON.stringify(wantTexts)) fails.push(`after switching tabs the Notable GM lines show ${JSON.stringify(afterTabs)}, expected ${JSON.stringify(wantTexts)}`);

  // Board for the chosen side
  await page.click(c.side === 'white' ? '#rep-side-white' : '#rep-side-black');
  await page.waitForTimeout(300);
  info.title = (await page.textContent('#results-system-title')).trim();
  if (!info.title.includes(shown[c.side].name) || !info.title.includes(`(${c.side.toUpperCase()})`)) fails.push(`board title "${info.title}"`);
  const start = await boardPieces(page, c.side);
  const startDiff = diffSquares(start, expectedPieces([]));
  info.orientation = startDiff.length ? `wrong on ${startDiff.join(',')}` : `${c.side} at the bottom`;
  if (startDiff.length) fails.push(`start position/orientation differs on ${startDiff.join(',')}`);
  if (shots) await page.locator('#results-chess-board').screenshot({ path: `${shots}/${c.name}-start.png` });

  // Step through the demo: the on-screen pieces must follow the line after every move
  const line = await page.evaluate(() => activeDemoMoves.map(m => m.move));
  info.demoLine = line.join(' ');
  for (let i = 0; i < line.length; i++) {
    await page.click('#btn-next-move'); await page.waitForTimeout(120);
    const d = diffSquares(await boardPieces(page, c.side), expectedPieces(line.slice(0, i + 1)));
    if (d.length) { fails.push(`after ${line[i]} (move ${i + 1}) board differs on ${d.join(',')}`); break; }
  }
  info.moveCounter = (await page.textContent('#board-move-counter')).trim();
  if (info.moveCounter !== `Move ${line.length} / ${line.length}`) fails.push(`move counter "${info.moveCounter}"`);
  if (!line.length) fails.push('demo has no moves');
  if (shots) {
    await page.locator('#results-chess-board').screenshot({ path: `${shots}/${c.name}-end.png` });
    await page.locator('#results-container').screenshot({ path: `${shots}/${c.name}-cards.png` });
  }
  // Taking the survey again into the same pool shows that pool's next GM
  if (c.retake) {
    await takeSurvey(page, label, vec);
    const again = await page.evaluate(() => ({ white: currentPicks.whiteSystem.eco, black: currentPicks.blackSystem.eco, gm: { white: currentPicks.whiteSystem.notableGm || null, black: currentPicks.blackSystem.notableGm || null } }));
    const lines = await gmLineTexts(page);
    info.gm.retake = `${again.white} ${again.gm.white || 'none'}, ${again.black} ${again.gm.black || 'none'}`;
    if (JSON.stringify(again) !== JSON.stringify(c.retake)) fails.push(`retake shows ${JSON.stringify(again)}, expected ${JSON.stringify(c.retake)}`);
    if (JSON.stringify(lines) !== JSON.stringify([again.gm.white, again.gm.black].filter(Boolean))) fails.push(`retake Notable GM lines show ${JSON.stringify(lines)}`);
  }
  await context.close();
  return { ...c, answers: vec, fails, info, errors };
}

async function runEditor(browser) {
  const { context, page, errors } = await openPage(browser);
  const fails = [], info = {};
  await page.evaluate(() => switchTab('labs')); await page.waitForTimeout(300);
  await page.locator('button[onclick="startLabsBoardEditor()"]').click();
  const read = () => page.evaluate(() => ({ bar: document.getElementById('labs-editor-evalbar-white').style.height, score: document.getElementById('labs-editor-eval-score').textContent, depth: document.getElementById('labs-editor-eval-depth').textContent }));
  // Analysis of the position on the board has finished and is shown
  const analysed = () => page.waitForFunction(() => labsEditorAnalyzingFen === labsEditorBuildFen()
    && document.getElementById('labs-editor-engine-status').textContent.trim() === 'Live Stockfish analysis ready'
    && document.getElementById('labs-editor-eval-score').textContent !== 'Eval: —', null, { timeout: 60000 }).then(() => true, () => false);
  if (!await analysed()) fails.push(`no finished evaluation of the start position (engine status "${await page.textContent('#labs-editor-engine-status')}")`);
  info.startFen = await page.evaluate(() => labsEditorBuildFen());
  info.evalStart = await read();
  // Edit mode: place a white knight on d4, then erase it
  await page.click('button[onclick="selectLabsEditorPiece(\'N\')"]');
  await page.click('#labs-editor-board [data-square="d4"]');
  info.placed = await page.evaluate(() => labsEditorPieces.d4 || null);
  if (info.placed !== 'N') fails.push(`placing a knight on d4 gave ${info.placed}`);
  await page.click('button[onclick="selectLabsEditorPiece(\'\')"]');
  await page.click('#labs-editor-board [data-square="d4"]');
  info.erased = await page.evaluate(() => labsEditorPieces.d4 || null);
  if (info.erased) fails.push(`erasing d4 left ${info.erased}`);
  // (editing a piece clears the castling rights in the FEN, so compare the piece placement only)
  if ((await page.evaluate(() => labsEditorBuildFen())).split(' ')[0] !== info.startFen.split(' ')[0]) fails.push('position not back to the start after erasing');
  // Play mode: 1.e4, then the evaluation bar must update
  await page.click('#labs-editor-mode-btn');
  await page.click('#labs-editor-board [data-square="e2"]'); await page.click('#labs-editor-board [data-square="e4"]');
  info.afterMove = await page.evaluate(() => ({ e2: labsEditorPieces.e2 || null, e4: labsEditorPieces.e4 || null }));
  if (info.afterMove.e4 !== 'P' || info.afterMove.e2) fails.push(`1.e4 not played: ${JSON.stringify(info.afterMove)}`);
  if (!await analysed()) fails.push(`no finished evaluation after 1.e4 (engine status "${await page.textContent('#labs-editor-engine-status')}")`);
  info.evalAfter = await read();
  if (info.evalStart.score === 'Eval: —' || info.evalAfter.score === 'Eval: —') fails.push('no evaluation shown');
  if (JSON.stringify(info.evalStart) === JSON.stringify(info.evalAfter)) fails.push('evaluation bar did not update after 1.e4');
  if (shots) await page.locator('#labs-board-editor').screenshot({ path: `${shots}/labs-editor.png` });
  await context.close();
  return { fails, info, errors };
}

// Navigation: click the visible button or logo, then record which tab section is showing
async function runNav(browser) {
  const { context, page, errors } = await openPage(browser);
  const fails = [], steps = [];
  const showing = () => page.evaluate(() => [...document.querySelectorAll('section[id^="tab-"]')].filter(e => e.getClientRects().length && getComputedStyle(e).display !== 'none').map(e => e.id).join(','));
  const step = async (label, selector, want) => {
    const l = page.locator(`${selector}:visible`);
    let got;
    if (!(await l.count())) got = 'nothing to click';
    else { await l.first().click({ timeout: 5000 }); await page.waitForTimeout(300); got = await showing(); }
    steps.push(`${label} -> ${got}`);
    if (got !== want) fails.push(`${label} showed "${got}", expected ${want}`);
  };
  const start = await showing();
  steps.push(`start -> ${start}`);
  if (start !== 'tab-home') fails.push(`page opened on "${start}", expected tab-home`);
  await step('home-page logo', '#tab-home img[data-logo]', 'tab-quiz');
  for (const t of ['grandmasters', 'clubs', 'play-hub', 'quiz']) await step(`header ${t}`, `#main-header [onclick="switchTab('${t}')"]`, `tab-${t}`);
  await step('header logo', '#main-header img[data-logo]', 'tab-quiz');
  await step('header home', `#main-header [onclick="switchTab('home')"]`, 'tab-home');
  await context.close();
  return { fails, steps, errors };
}

(async () => {
  if (shots) fs.mkdirSync(shots, { recursive: true });
  const browser = await chromium.launch();
  const results = [];
  for (const c of CASES) results.push(await runCase(browser, c));
  const editor = await runEditor(browser);
  const nav = await runNav(browser);
  await browser.close();

  let failed = 0;
  console.log(url ? `URL: ${url} (live: nothing blocked, all console errors count)` : `File: ${htmlPath} (offline)`);
  for (const r of results) {
    const fails = [...r.fails, ...r.errors];
    failed += fails.length;
    console.log(`\n${r.name}: ${r.style}, ${r.level}, ${r.strong ? 'strong' : 'normal'} answers ${JSON.stringify(r.answers)} -> ${fails.length ? 'FAIL' : 'PASS'}`);
    if (r.info.cards) console.log(`  White card: ${r.info.cards.whitePanel} (${r.info.cards.white.side} card)\n  Black card: ${r.info.cards.blackPanel} (${r.info.cards.black.side} card)`);
    if (r.info.preload) console.log(`  Starts from: ${r.info.preload}`);
    if (r.info.gm) console.log(`  Notable GM: White ${r.info.gm.white || 'none'}, Black ${r.info.gm.black || 'none'}${r.info.gm.modal.length ? '; ' + r.info.gm.modal.join('; ') : ''}${r.info.gm.retake ? `; retake: ${r.info.gm.retake}` : ''}`);
    if (r.info.text) console.log(`  Summary: ${r.info.text.join('\n           ')}${r.info.knownText.length ? `\n  (listed in known-card-issues.json: ${r.info.knownText.join('; ')})` : ''}`);
    if (r.info.title) console.log(`  Board: ${r.info.title}, ${r.info.orientation}; demo ${r.info.demoLine}; ${r.info.moveCounter}`);
    for (const f of fails) console.log('  - ' + f);
  }
  const efails = [...editor.fails, ...editor.errors];
  failed += efails.length;
  console.log(`\nLabs board editor -> ${efails.length ? 'FAIL' : 'PASS'}`);
  console.log(`  place N on d4: ${editor.info.placed}; erase: ${editor.info.erased || 'empty'}; 1.e4 played: e4=${editor.info.afterMove && editor.info.afterMove.e4}`);
  console.log(`  eval bar: ${editor.info.evalStart.score}, ${editor.info.evalStart.depth} (${editor.info.evalStart.bar}) -> ${editor.info.evalAfter && editor.info.evalAfter.score}, ${editor.info.evalAfter && editor.info.evalAfter.depth} (${editor.info.evalAfter && editor.info.evalAfter.bar})`);
  for (const f of efails) console.log('  - ' + f);
  const nfails = [...nav.fails, ...nav.errors];
  failed += nfails.length;
  console.log(`\nNavigation -> ${nfails.length ? 'FAIL' : 'PASS'}`);
  console.log('  ' + nav.steps.join('\n  '));
  for (const f of nfails) console.log('  - ' + f);
  console.log(failed ? `\nFAIL (${failed})` : '\nPASS');
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
