// Browser click-through for the results page (complements survey_regression.js, which only calls the picker).
//
// For each case it takes the survey in headless Chromium by clicking: open the survey tab, click the
// experience level, click an answer on each of the 5 questions. Then it checks, on the results page:
//   - the White and Black cards show the expected openings, each from its own side;
//   - the board shows the chosen side at the bottom (White/Black orientation);
//   - stepping through the demo moves the pieces: after every step the on-screen pieces must match the
//     line replayed in chess.js, and the move counter must reach the end.
// Finally it opens the Labs board editor and checks that placing and erasing a piece works, that a move
// can be played, and that the evaluation bar updates.
//
// Offline like survey_regression.js: every http(s) request is blocked except chess.js 0.10.3, served
// from node_modules. A fresh browser context (empty localStorage) is used for every case, so each case
// gets the first pick for its combination.
//
// Usage: node clickthrough.js [path/to/index.html] [--shots DIR]
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { Chess } = require('chess.js');

const args = process.argv.slice(2);
const shots = args.includes('--shots') ? path.resolve(args[args.indexOf('--shots') + 1]) : null;
const positional = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--shots');
const htmlPath = path.resolve(positional[0] || path.join(__dirname, '../../index.html'));
const chessLocal = require.resolve('chess.js');

// strong = 4 or more of the 5 answers are the strongest or mildest choice (lastExtremeCount >= 4)
const CASES = [
  { name: 'white-B12', style: 'patientGrinder', level: 'novice', strong: false, side: 'white', white: 'B12', black: 'C42' },
  { name: 'black-B40', style: 'strategicArchitect', level: 'novice', strong: false, side: 'black', white: 'D06', black: 'B40' },
  { name: 'white-D85', style: 'patientGrinder', level: 'advanced', strong: true, side: 'white', white: 'D85', black: 'B82' },
];

async function openPage(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  await context.route(/^https?:\/\//, r => r.abort());
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/chess.js/0.10.3/chess.min.js', r => r.fulfill({ path: chessLocal, contentType: 'application/javascript' }));
  await page.goto('file://' + htmlPath);
  await page.waitForFunction(() => typeof window.Chess === 'function' && typeof archetypes === 'object');
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
  await page.locator("[onclick=\"switchTab('quiz')\"]:visible").first().click();
  await page.getByText(label, { exact: true }).click();
  for (let q = 0; q < 5; q++) {
    await page.waitForFunction(n => currentQuestionIdx === n && document.querySelectorAll('#quiz-container button.option-card').length === 3 && !isAdvancing, q);
    const idx = await page.evaluate(v => { const it = currentRun[currentQuestionIdx]; return it.options.findIndex(o => o.points === v[SURVEY_AREAS.indexOf(it.area)]); }, vec);
    await page.locator('#quiz-container button.option-card').nth(idx).click();
  }
  await page.waitForSelector('#tab-results:not([style*="display: none"]) #results-chess-board .square', { timeout: 10000 });
  await page.waitForTimeout(400);

  info.scored = await page.evaluate(() => ({ level: skillLevelKey, extremeAnswers: lastExtremeCount }));
  if (info.scored.level !== c.level || (info.scored.extremeAnswers >= 4) !== c.strong) fails.push(`survey scored ${JSON.stringify(info.scored)}`);
  // Cards on the page, and which side each card object belongs to (hand-written slot side, else vault side)
  const shown = await page.evaluate(() => {
    const slotSide = new Map();
    for (const a of Object.values(archetypes)) for (const s of Object.values(a.systems)) { slotSide.set(s.whiteSystem, 'white'); slotSide.set(s.blackSystem, 'black'); }
    const side = sys => slotSide.get(sys) || (ecoVault.find(e => e.eco === sys.eco) || {}).side;
    const titles = [...document.querySelectorAll('#results-container h3.gradient-text')].map(h => h.textContent.trim());
    const ecos = [...document.querySelectorAll('#results-container span.text-accentGold')].map(s => s.textContent.trim()).filter(x => x.startsWith('ECO'));
    return {
      whitePanel: `${ecos[0]} ${titles[0]}`, blackPanel: `${ecos[1]} ${titles[1]}`,
      white: { eco: currentPicks.whiteSystem.eco, name: currentPicks.whiteSystem.name, side: side(currentPicks.whiteSystem) },
      black: { eco: currentPicks.blackSystem.eco, name: currentPicks.blackSystem.name, side: side(currentPicks.blackSystem) },
    };
  });
  info.cards = shown;
  for (const s of ['white', 'black']) {
    if (shown[s].eco !== c[s]) fails.push(`${s} pick ${shown[s].eco}, expected ${c[s]}`);
    if (shown[s].side !== s && shown[s].side !== 'either') fails.push(`${s} card "${shown[s].name}" is a ${shown[s].side} card`);
    if (!shown[`${s}Panel`].includes(`ECO: ${c[s]}`) || !shown[`${s}Panel`].includes(shown[s].name)) fails.push(`${s} panel shows "${shown[`${s}Panel`]}"`);
  }

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
  await context.close();
  return { ...c, answers: vec, fails, info, errors };
}

async function runEditor(browser) {
  const { context, page, errors } = await openPage(browser);
  const fails = [], info = {};
  await page.evaluate(() => switchTab('labs')); await page.waitForTimeout(300);
  await page.locator('button[onclick="startLabsBoardEditor()"]').click();
  const read = () => page.evaluate(() => ({ bar: document.getElementById('labs-editor-evalbar-white').style.height, score: document.getElementById('labs-editor-eval-score').textContent }));
  await page.waitForTimeout(4000);
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
  await page.waitForTimeout(500);
  info.afterMove = await page.evaluate(() => ({ e2: labsEditorPieces.e2 || null, e4: labsEditorPieces.e4 || null }));
  if (info.afterMove.e4 !== 'P' || info.afterMove.e2) fails.push(`1.e4 not played: ${JSON.stringify(info.afterMove)}`);
  await page.waitForTimeout(5000);
  info.evalAfter = await read();
  if (info.evalStart.score === 'Eval: —' || info.evalAfter.score === 'Eval: —') fails.push('no evaluation shown');
  if (JSON.stringify(info.evalStart) === JSON.stringify(info.evalAfter)) fails.push('evaluation bar did not update after 1.e4');
  if (shots) await page.locator('#labs-board-editor').screenshot({ path: `${shots}/labs-editor.png` });
  await context.close();
  return { fails, info, errors };
}

(async () => {
  if (shots) fs.mkdirSync(shots, { recursive: true });
  const browser = await chromium.launch();
  const results = [];
  for (const c of CASES) results.push(await runCase(browser, c));
  const editor = await runEditor(browser);
  await browser.close();

  let failed = 0;
  console.log(`File: ${htmlPath}`);
  for (const r of results) {
    const fails = [...r.fails, ...r.errors.map(e => `page error: ${e}`)];
    failed += fails.length;
    console.log(`\n${r.name}: ${r.style}, ${r.level}, ${r.strong ? 'strong' : 'normal'} answers ${JSON.stringify(r.answers)} -> ${fails.length ? 'FAIL' : 'PASS'}`);
    if (r.info.cards) console.log(`  White card: ${r.info.cards.whitePanel} (${r.info.cards.white.side} card)\n  Black card: ${r.info.cards.blackPanel} (${r.info.cards.black.side} card)`);
    if (r.info.title) console.log(`  Board: ${r.info.title}, ${r.info.orientation}; demo ${r.info.demoLine}; ${r.info.moveCounter}`);
    for (const f of fails) console.log('  - ' + f);
  }
  const efails = [...editor.fails, ...editor.errors.map(e => `page error: ${e}`)];
  failed += efails.length;
  console.log(`\nLabs board editor -> ${efails.length ? 'FAIL' : 'PASS'}`);
  console.log(`  place N on d4: ${editor.info.placed}; erase: ${editor.info.erased || 'empty'}; 1.e4 played: e4=${editor.info.afterMove && editor.info.afterMove.e4}`);
  console.log(`  eval bar: ${editor.info.evalStart.score} (${editor.info.evalStart.bar}) -> ${editor.info.evalAfter && editor.info.evalAfter.score} (${editor.info.evalAfter && editor.info.evalAfter.bar})`);
  for (const f of efails) console.log('  - ' + f);
  console.log(failed ? `\nFAIL (${failed})` : '\nPASS');
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
