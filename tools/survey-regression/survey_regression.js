// Survey regression test for index.html.
//
// Checks, against expected.json:
//   1. Protected code is byte-identical: index.html with the opening-data block removed
//      (from "const ecoNamesMap = {" up to the survey picker) must hash to the saved value.
//      This covers the demo board, evaluation bar, pieces, board editor, results board,
//      player labels, navigation and survey logic.
//   2. Survey picks: every style x experience level x normal/strong answers, three
//      consecutive runs each, must give the saved White/Black ECO codes.
//   3. Recommendation cards: each card must come from the side it was picked for, and its
//      line must be legal. Known pre-existing exceptions are listed in expected.json and
//      reported, not failed.
//   4. The page loads with no JavaScript errors.
//
// chess.js 0.10.3 (the version index.html loads from cdnjs) is served from node_modules,
// so the test runs offline and gives the same result as the live page.
//
// Usage: node survey_regression.js [path/to/index.html] [--update]
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { chromium } = require('playwright');
const { Chess } = require('chess.js');

const args = process.argv.slice(2);
const update = args.includes('--update');
const htmlPath = path.resolve(args.find(a => !a.startsWith('--')) || path.join(__dirname, '../../index.html'));
const expectedPath = path.join(__dirname, 'expected.json');
const chessLocal = require.resolve('chess.js');

function protectedHash(html) {
  const lines = html.split('\n');
  const start = lines.findIndex(l => l.startsWith('const ecoNamesMap = {'));
  const end = lines.findIndex(l => l.startsWith('// ---- Picks one White and one Black opening'));
  if (start < 0 || end < 0 || end < start) throw new Error('could not find the opening-data block markers');
  const rest = lines.slice(0, start).concat(lines.slice(end)).join('\n');
  return crypto.createHash('sha256').update(rest).digest('hex');
}

async function runSurvey(file) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/chess.js/0.10.3/chess.min.js', r => r.fulfill({ path: chessLocal, contentType: 'application/javascript' }));
  await page.goto('file://' + file);
  await page.waitForFunction(() => typeof archetypes === 'object' && typeof choosePicksForRun === 'function');
  const res = await page.evaluate(() => {
    if (typeof window.Chess !== 'function') throw new Error('chess.js did not load');
    const slotSide = new Map();
    for (const a of Object.values(archetypes)) for (const s of Object.values(a.systems)) {
      slotSide.set(s.whiteSystem, 'white'); slotSide.set(s.blackSystem, 'black');
    }
    const card = (sys, want) => sys && {
      eco: sys.eco, want,
      side: slotSide.get(sys) || (ecoVault.find(e => e.eco === sys.eco) || {}).side,
      moves: sys.variations[0].moves.map(m => m.move)
    };
    const out = {};
    for (const arch of Object.keys(archetypes)) for (const lvl of Object.keys(LEVEL_BANDS)) for (const strong of [0, 4]) {
      localStorage.removeItem(PICKS_KEY); skillLevelKey = lvl; lastExtremeCount = strong;
      const runs = [];
      for (let run = 0; run < 3; run++) {
        choosePicksForRun(arch);
        runs.push([card(currentPicks.whiteSystem, 'white'), card(currentPicks.blackSystem, 'black')]);
      }
      out[`${arch}|${lvl}|${strong ? 'strong' : 'normal'}`] = runs;
    }
    localStorage.removeItem(PICKS_KEY);
    return out;
  });
  await browser.close();
  return { res, errors };
}

(async () => {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const hash = protectedHash(html);
  const { res, errors } = await runSurvey(htmlPath);
  const picks = {};
  for (const [cfg, runs] of Object.entries(res)) picks[cfg] = runs.map(([w, b]) => `${w ? w.eco : '-'}/${b ? b.eco : '-'}`).join(' ');

  const sideIssues = new Set(), illegal = [];
  for (const [cfg, runs] of Object.entries(res)) for (const pair of runs) for (const c of pair) {
    if (!c) continue;
    if (c.side !== c.want && c.side !== 'either') sideIssues.add(`${c.eco} shown as ${c.want}, card is ${c.side}`);
    const g = new Chess();
    for (const san of c.moves) if (!g.move(san)) { illegal.push(`${cfg}: ${c.eco} illegal at ${san}`); break; }
  }

  if (update) {
    const prev = fs.existsSync(expectedPath) ? JSON.parse(fs.readFileSync(expectedPath, 'utf8')) : {};
    fs.writeFileSync(expectedPath, JSON.stringify({
      protectedHash: hash,
      knownSideIssues: prev.knownSideIssues || [...sideIssues].sort(),
      picks
    }, null, 1) + '\n');
    console.log(`Updated ${path.relative(process.cwd(), expectedPath)} from ${htmlPath}`);
    return;
  }

  const exp = JSON.parse(fs.readFileSync(expectedPath, 'utf8'));
  const fails = [];
  if (hash !== exp.protectedHash) fails.push(`protected code changed (sha256 ${hash.slice(0, 12)}, expected ${exp.protectedHash.slice(0, 12)})`);
  const cfgs = new Set([...Object.keys(exp.picks), ...Object.keys(picks)]);
  for (const cfg of cfgs) if (picks[cfg] !== exp.picks[cfg]) fails.push(`picks ${cfg}: got "${picks[cfg]}", expected "${exp.picks[cfg]}"`);
  const known = new Set(exp.knownSideIssues);
  for (const s of sideIssues) if (!known.has(s)) fails.push(`side mismatch: ${s}`);
  fails.push(...illegal);
  if (errors.length) fails.push(...errors.map(e => `page error: ${e}`));

  console.log(`File: ${htmlPath}`);
  console.log(`Protected code hash: ${hash === exp.protectedHash ? 'unchanged' : 'CHANGED'}`);
  console.log(`Survey combinations: ${cfgs.size} (x3 runs), ${[...cfgs].filter(c => picks[c] === exp.picks[c]).length} match`);
  console.log(`Card side issues: ${sideIssues.size} (${[...sideIssues].filter(s => known.has(s)).length} known, pre-existing)`);
  for (const s of [...sideIssues].filter(s => known.has(s))) console.log(`  known: ${s}`);
  for (const s of exp.knownSideIssues.filter(s => !sideIssues.has(s))) console.log(`  known issue no longer seen (remove from expected.json): ${s}`);
  console.log(`Page errors: ${errors.length}`);
  if (fails.length) {
    console.log(`\nFAIL (${fails.length})`);
    for (const f of fails) console.log('  - ' + f);
    process.exit(1);
  }
  console.log('\nPASS');
})().catch(e => { console.error(e); process.exit(1); });
