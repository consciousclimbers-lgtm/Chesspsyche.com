// Results-card identity test for index.html: the opening name, ECO code, side, Notable GM and demo board
// of every Results card must agree.
//
// Cards: every card the survey can show. For each style x experience level x normal/strong answers, the
// survey is retaken until the White and Black candidate lists are used up (as in survey_regression.js
// check 11). The cards of the first 3 surveys (the expected.json snapshot) are marked "snapshot".
//
// For every card, against results-cards.json:
//   1. Identity: the card's ECO code and side are the ones picked, and its name is the saved name.
//   2. Notable GM: the card's GM pool is the saved pool, the pool is for the card's side and lists the
//      card's code, and the GM shown is one of the pool's approved GMs (none when there is no pool).
//   3. Source line: the card's line (the vault line, or the hand-written system's own line) is the saved line.
//   4. Board: the demo board (initResultsBoard) shows the source line's first min(20, length) plies, in
//      order, with nothing cut short and nothing added. Each ply is played with the page's own Next button
//      code and the board position after it must equal chess.js's position after the same ply.
//   5. Named opening: the board must reach the position where the line first enters the card's ECO code
//      (saved as ecoPly / ecoFen, taken from lichess-org/chess-openings). A line that never enters its own
//      code is listed under "known" and reported, not failed; the list may only shrink. A line that enters its
//      code only after ply 20 (beyond the ten full moves shown) must show the 20 plies, be listed in the page's
//      DEMO_NAMED_AFTER_CAP with that ply, and show the beyond-cap note (check 6); DEMO_NAMED_AFTER_CAP must list
//      exactly those cards.
//   6. Honest length: a line shorter than 20 plies shows the short-line note (how many of the 20 half-moves it
//      has); a 20-ply line whose named position comes later shows the beyond-cap note (at which half-move); any
//      other 20-ply line shows no note. The move counter reads "Move k / n".
//
// Self-test (--self-test): runs the same checks on a copy of index.html with the old 10-ply limit put back
// (both slice(0, DEMO_MAX_PLIES) calls set to 10) and requires that it fails, with exactly the snapshot
// cards in SHORT_BEFORE_FIX failing check 5 (the boards that stopped before their named opening on main
// 3e27fc5, the Marshall Attack C89 among them).
// It also runs them on a copy with the beyond-cap note switched off and requires that exactly the cards whose
// named position comes after ply 20 fail check 6.
//
// Usage: node results_identity.js [path/to/index.html] [--self-test]
//        node results_identity.js [path/to/index.html] --update --ref <dir with lichess a.tsv ... e.tsv>
//   --update rewrites results-cards.json. Use the lichess-org/chess-openings files at commit a6189a3 (the
//   copy eco_lines.test.js uses), e.g. https://raw.githubusercontent.com/lichess-org/chess-openings/a6189a3/a.tsv
const fs = require('fs');
const os = require('os');
const path = require('path');
const { chromium } = require('playwright');
const { Chess } = require('chess.js');

const args = process.argv.slice(2);
const update = args.includes('--update');
const selfTest = args.includes('--self-test');
const refDir = args.includes('--ref') ? args[args.indexOf('--ref') + 1] : null;
const positional = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--ref');
const htmlPath = path.resolve(positional[0] || path.join(__dirname, '../../index.html'));
const expectedPath = path.join(__dirname, 'results-cards.json');
const chessLocal = require.resolve('chess.js');
const BLOCKED_LOAD = 'Failed to load resource: net::ERR_FAILED';
const MAX_PLIES = 20;

// Snapshot cards whose 10-ply board stopped before their named opening on main 3e27fc5
const SHORT_BEFORE_FIX = ['B48|white', 'B49|black', 'B57|black', 'B58|black', 'B59|black', 'B60|white', 'B81|white',
  'B82|black', 'B83|black', 'B99|black', 'C18|black', 'C59|white', 'C88|white', 'C89|black', 'E07|white', 'E08|white',
  'E52|black', 'E53|black', 'E97|black'];

const fenKey = fen => fen.split(' ').slice(0, 4).join(' ');

// Collects every reachable card from the page and plays each one on the demo board
async function readCards(browser, file) {
  const context = await browser.newContext();
  await context.route(/^https?:\/\//, r => r.abort());
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(`page error: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error' && m.text() !== BLOCKED_LOAD) errors.push(`console error: ${m.text()}`); });
  await page.route('**/chess.js/0.10.3/chess.min.js', r => r.fulfill({ path: chessLocal, contentType: 'application/javascript' }));
  await page.goto('file://' + file);
  await page.waitForFunction(() => typeof archetypes === 'object' && typeof choosePicksForRun === 'function');
  const cards = await page.evaluate(() => {
    if (typeof window.Chess !== 'function') throw new Error('chess.js did not load');
    const hand = {};
    for (const a of Object.values(archetypes)) for (const s of Object.values(a.systems)) {
      hand[`${s.whiteSystem.eco}|white`] = s.whiteSystem; hand[`${s.blackSystem.eco}|black`] = s.blackSystem;
    }
    const found = {};
    for (const arch of Object.keys(archetypes)) for (const lvl of Object.keys(LEVEL_BANDS)) for (const strong of [0, 4]) {
      localStorage.removeItem(PICKS_KEY); localStorage.removeItem(GM_ROTATION_KEY); skillLevelKey = lvl; lastExtremeCount = strong;
      let prev = '';
      for (let run = 1; run <= 400; run++) {
        choosePicksForRun(arch);
        for (const side of ['white', 'black']) {
          const sys = currentPicks[side + 'System'], key = `${sys.eco}|${side}`;
          if (!found[key]) found[key] = { key, pickedEco: sys.eco, side, sys, snapshot: false, firstSeen: `${arch}|${lvl}|${strong ? 'strong' : 'normal'} run ${run}` };
          if (run <= 3) found[key].snapshot = true;
        }
        const now = `${currentPicks.whiteSystem.eco}/${currentPicks.blackSystem.eco}`;
        if (now === prev) break;
        prev = now;
      }
    }
    localStorage.removeItem(PICKS_KEY); localStorage.removeItem(GM_ROTATION_KEY); currentPicks = null;
    window.__cards = found;
    return Object.keys(found);
  });
  // The results page, so the demo board and its controls exist; then each card is put on the board
  await page.evaluate(() => { skillLevelKey = 'intermediate'; lastExtremeCount = 0; choosePicksForRun('tacticalFirebrand'); renderResultsDashboard('tacticalFirebrand', archetypes.tacticalFirebrand); });
  await page.waitForTimeout(400);
  const out = await page.evaluate(keys => {
    const hand = {};
    for (const a of Object.values(archetypes)) for (const s of Object.values(a.systems)) {
      hand[`${s.whiteSystem.eco}|white`] = s.whiteSystem; hand[`${s.blackSystem.eco}|black`] = s.blackSystem;
    }
    playMoveSound = () => {};   // no audio in the test
    const namedAfterCap = typeof DEMO_NAMED_AFTER_CAP === 'object' ? DEMO_NAMED_AFTER_CAP : {};
    window.__namedAfterCap = namedAfterCap;
    return keys.map(key => {
      const c = window.__cards[key], sys = c.sys, [eco, side] = key.split('|');
      const isHand = !!hand[key] && hand[key].eco === sys.eco && hand[key].name === sys.name;
      const source = isHand ? hand[key].variations[0].moves.map(m => m.move)
        : ((ecoVaultData[eco] || {}).moves || '').split(/\s+/).filter(x => x && !/^\d+\./.test(x));
      const pool = notableGmPool(eco, side);
      resultsRepertoireSide = side;
      initResultsBoard({ whiteSystem: sys, blackSystem: sys });
      const note = document.getElementById('results-line-note');
      const shown = activeDemoMoves.map(m => ({ move: m.move, from: m.from, to: m.to }));
      const fens = [], counters = [document.getElementById('board-move-counter').textContent];
      for (let i = 0; i < shown.length; i++) { nextBoardMove(); fens.push(demoGame.fen()); counters.push(document.getElementById('board-move-counter').textContent); }
      return {
        key, eco: sys.eco, side, snapshot: c.snapshot, firstSeen: c.firstSeen, name: sys.name, handWritten: isHand,
        gm: sys.notableGm || null, pool: pool ? pool.key : null, poolSide: pool ? pool.side : null,
        poolHasCode: pool ? pool.codes.includes(eco) : null, poolGms: pool ? eligibleNotableGms(pool) : [],
        source, shown, fens, counters,
        note: note ? note.textContent : null, noteHidden: note ? note.classList.contains('hidden') : null,
        expectedNote: typeof demoLineNote === 'function' ? demoLineNote(shown.length, namedAfterCap[key]) : null
      };
    });
  }, cards);
  const namedAfterCap = await page.evaluate(() => window.__namedAfterCap);
  await context.close();
  return { cards: out, namedAfterCap, errors };
}

// First ply at which the line enters a position lichess lists under the card's ECO code
function loadReference(dir) {
  const ref = new Map();
  for (const f of 'abcde') {
    for (const row of fs.readFileSync(path.join(dir, f + '.tsv'), 'utf8').trim().split('\n').slice(1)) {
      const [eco, name, pgn] = row.split('\t');
      const g = new Chess();
      if (!pgn.split(/\s+/).filter(x => !/^\d+\.$/.test(x)).every(s => g.move(s))) continue;
      const k = fenKey(g.fen());
      if (!ref.has(k)) ref.set(k, []);
      ref.get(k).push({ eco, name });
    }
  }
  return ref;
}
function enterEco(line, eco, ref) {
  const g = new Chess();
  for (let i = 0; i < line.length; i++) {
    if (!g.move(line[i])) return null;
    const hit = (ref.get(fenKey(g.fen())) || []).find(r => r.eco === eco);
    if (hit) return { ecoPly: i + 1, ecoFen: fenKey(g.fen()), ecoName: hit.name };
  }
  return null;
}

function check(cards, exp, namedAfterCap) {
  const fails = [], known = [], short = [], notReached = [], beyondCap = [];
  const want = exp.cards;
  const keys = new Set([...Object.keys(want), ...cards.map(c => c.key)]);
  const byKey = Object.fromEntries(cards.map(c => [c.key, c]));
  for (const key of keys) {
    const c = byKey[key], w = want[key];
    if (!c) { fails.push(`${key}: in results-cards.json but no longer reachable`); continue; }
    if (!w) { fails.push(`${key}: reachable but not in results-cards.json`); continue; }
    const [eco, side] = key.split('|');
    const f = m => fails.push(`${key} (${c.firstSeen}): ${m}`);
    // 1. identity
    if (c.eco !== eco || c.side !== side) f(`card shows ${c.eco} ${c.side}`);
    if (c.name !== w.name) f(`name "${c.name}", expected "${w.name}"`);
    if (c.handWritten !== w.handWritten) f(`hand-written ${c.handWritten}, expected ${w.handWritten}`);
    // 2. Notable GM
    if (c.pool !== w.pool) f(`GM pool ${c.pool}, expected ${w.pool}`);
    if (c.pool && (c.poolSide !== side || !c.poolHasCode)) f(`GM pool ${c.pool} is for ${c.poolSide} / does not list ${eco}`);
    if (c.gm ? !c.poolGms.includes(c.gm) : c.poolGms.length > 0) f(`Notable GM "${c.gm || '-'}" is not from its pool (${c.poolGms.join(', ') || 'none'})`);
    // 3. source line
    if (c.source.join(' ') !== w.line) f(`source line "${c.source.join(' ')}", expected "${w.line}"`);
    // 4. board shows the source line, up to 20 plies, and the position after every ply matches chess.js
    const n = Math.min(MAX_PLIES, c.source.length);
    const shown = c.shown.map(m => m.move);
    if (shown.join(' ') !== c.source.slice(0, n).join(' ')) f(`board shows ${shown.length} plies "${shown.join(' ')}", expected the first ${n} of the source line`);
    const g = new Chess();
    for (let i = 0; i < c.shown.length; i++) {
      const m = g.move(c.shown[i].move);
      if (!m) { f(`ply ${i + 1} ${c.shown[i].move} is illegal`); break; }
      if (m.from !== c.shown[i].from || m.to !== c.shown[i].to) f(`ply ${i + 1} ${m.san} highlights ${c.shown[i].from}-${c.shown[i].to}, chess.js plays ${m.from}-${m.to}`);
      if (fenKey(c.fens[i]) !== fenKey(g.fen())) { f(`board after ply ${i + 1} is ${c.fens[i]}, chess.js gives ${g.fen()}`); break; }
    }
    // 5. the board reaches the named opening
    if (w.ecoPly == null) known.push(`${key}: line never enters ${eco} in the reference`);
    else if (w.ecoPly > MAX_PLIES) {
      beyondCap.push(`${key} (half-move ${w.ecoPly})`);
      if (c.shown.length !== MAX_PLIES) { notReached.push(key); f(`board shows ${c.shown.length} plies; its named position comes at ply ${w.ecoPly}, so all ${MAX_PLIES} must be shown`); }
    }
    else if (c.shown.length < w.ecoPly) { notReached.push(key); f(`board stops after ${c.shown.length} plies, before ${eco} (${w.ecoName}) which the line enters at ply ${w.ecoPly}`); }
    else if (fenKey(c.fens[w.ecoPly - 1]) !== w.ecoFen) { notReached.push(key); f(`board position at ply ${w.ecoPly} is not the saved ${eco} position`); }
    // 6. honest length note and move counter
    const note = n < MAX_PLIES ? `This line shows ${n} of ${MAX_PLIES} half-moves (to move ${Math.ceil(n / 2)}). A verified line to move 10 is not in our data yet.`
      : w.ecoPly > MAX_PLIES ? `The board is capped at ten full moves. The named opening position comes later in this line, at half-move ${w.ecoPly} (move ${Math.ceil(w.ecoPly / 2)}).` : '';
    if (c.expectedNote !== note) f(`demoLineNote(${n}) gives "${c.expectedNote}", expected "${note}"`);
    if ((c.note || '') !== note || c.noteHidden !== !note) f(`line note shows "${c.note}"${c.noteHidden ? ' (hidden)' : ''}, expected "${note}"`);
    const counters = c.counters.map((t, k) => t === `Move ${k} / ${c.shown.length}`);
    if (!counters.every(Boolean)) f(`move counter reads ${JSON.stringify(c.counters)}`);
    if (c.shown.length < MAX_PLIES) short.push(key);
  }
  // The page's list of cards whose named position comes after the cap must be exactly the reference's
  const wantCap = Object.fromEntries(Object.entries(want).filter(([, w]) => w.ecoPly > MAX_PLIES).map(([k, w]) => [k, w.ecoPly]));
  for (const k of new Set([...Object.keys(wantCap), ...Object.keys(namedAfterCap || {})]))
    if ((namedAfterCap || {})[k] !== wantCap[k]) fails.push(`DEMO_NAMED_AFTER_CAP ${k}: page has ${(namedAfterCap || {})[k]}, reference gives ${wantCap[k]}`);
  const knownList = exp.known || [];
  for (const k of known) if (!knownList.includes(k)) fails.push(`not listed as known: ${k}`);
  for (const k of knownList) if (!known.includes(k)) fails.push(`listed as known but no longer occurs (remove it): ${k}`);
  return { fails, known, short, notReached, beyondCap };
}

(async () => {
  let file = htmlPath, selfTestB = null;
  if (selfTest) {
    // Two broken copies: (a) the old 10-ply limit; (b) no beyond-cap note
    const html = fs.readFileSync(htmlPath, 'utf8');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'results-identity-'));
    const n = html.split('.slice(0, DEMO_MAX_PLIES)').length - 1;
    if (n !== 2) { console.log(`FAIL: expected 2 "slice(0, DEMO_MAX_PLIES)" calls in ${htmlPath}, found ${n}`); process.exit(1); }
    const capLine = 'if (namedAtPly > DEMO_MAX_PLIES) return';
    if (html.split(capLine).length !== 2) { console.log(`FAIL: expected one "${capLine}" in ${htmlPath}`); process.exit(1); }
    file = path.join(dir, 'ten-plies.html');
    fs.writeFileSync(file, html.split('.slice(0, DEMO_MAX_PLIES)').join('.slice(0, 10)'));
    const noNote = path.join(dir, 'no-beyond-cap-note.html');
    fs.writeFileSync(noNote, html.split(capLine).join('if (false) return'));
    const browser = await chromium.launch();
    const b = await readCards(browser, noNote);
    await browser.close();
    const exp = JSON.parse(fs.readFileSync(expectedPath, 'utf8'));
    const rb = check(b.cards, exp, b.namedAfterCap);
    const noteFails = [...new Set(rb.fails.filter(x => /line note shows/.test(x)).map(x => x.split(' ')[0]))].sort();
    const capCards = Object.entries(exp.cards).filter(([, w]) => w.ecoPly > MAX_PLIES).map(([k]) => k).sort();
    selfTestB = { ok: capCards.length > 0 && JSON.stringify(noteFails) === JSON.stringify(capCards), noteFails, capCards };
  }
  const browser = await chromium.launch();
  const { cards, namedAfterCap, errors } = await readCards(browser, file);
  await browser.close();

  if (update) {
    if (!refDir) { console.error('--update needs --ref <dir with the lichess a.tsv ... e.tsv files>'); process.exit(1); }
    if (errors.length) { console.error('Not updating: the page threw errors.\n' + errors.join('\n')); process.exit(1); }
    const ref = loadReference(refDir);
    const out = {}, known = [];
    for (const c of cards.sort((a, b) => a.key.localeCompare(b.key))) {
      const hit = enterEco(c.source, c.eco, ref);
      if (!hit) known.push(`${c.key}: line never enters ${c.eco} in the reference`);
      out[c.key] = { name: c.name, snapshot: c.snapshot, handWritten: c.handWritten, pool: c.pool, plies: c.source.length,
        line: c.source.join(' '), ecoPly: hit ? hit.ecoPly : null, ecoFen: hit ? hit.ecoFen : null, ecoName: hit ? hit.ecoName : null };
    }
    fs.writeFileSync(expectedPath, JSON.stringify({
      about: 'Every Results card the survey can show, keyed "ECO|side": its name, Notable GM pool, source line, and the ply and position at which the line first enters its ECO code in lichess-org/chess-openings (commit a6189a3). Written by node results_identity.js --update --ref <dir>; checked by npm run test:results-identity. "known" lists lines that never enter their own code; it may only shrink.',
      known, cards: out }, null, 1) + '\n');
    console.log(`Updated ${path.relative(process.cwd(), expectedPath)}: ${cards.length} cards, ${known.length} known`);
    return;
  }

  const exp = JSON.parse(fs.readFileSync(expectedPath, 'utf8'));
  const r = check(cards, exp, namedAfterCap);
  r.fails.push(...errors);
  const snap = cards.filter(c => c.snapshot);
  const lenCounts = {};
  for (const c of cards) { const b = c.shown.length >= 20 ? '20' : c.shown.length >= 15 ? '15-19' : c.shown.length >= 10 ? '10-14' : c.shown.length >= 5 ? '5-9' : '1-4'; lenCounts[b] = (lenCounts[b] || 0) + 1; }

  if (selfTest) {
    const snapKeys = new Set(snap.map(c => c.key));
    const caught = [...new Set(r.notReached)].filter(k => snapKeys.has(k)).sort();
    const okA = r.fails.length > 0 && JSON.stringify(caught) === JSON.stringify(SHORT_BEFORE_FIX.slice().sort()) && caught.includes('C89|black');
    console.log(`Self-test (a): index.html with the 10-ply limit put back (${file})`);
    console.log(`  ${r.fails.length} failures; ${caught.length} snapshot cards stop before their named opening: ${caught.join(', ')}`);
    console.log(`  all reachable cards stopping before their named opening: ${[...new Set(r.notReached)].length}`);
    console.log(okA ? '  PASS (the test catches the 10-ply limit, including the Marshall Attack C89)' : `  FAIL: expected exactly ${SHORT_BEFORE_FIX.join(', ')}`);
    console.log('Self-test (b): index.html with the beyond-cap note switched off');
    console.log(`  cards failing the line-note check: ${selfTestB.noteFails.join(', ') || 'none'}`);
    console.log(selfTestB.ok ? `  PASS (the test catches all ${selfTestB.capCards.length} cards whose named position comes after the cap)` : `  FAIL: expected exactly ${selfTestB.capCards.join(', ')}`);
    const ok = okA && selfTestB.ok;
    console.log(ok ? 'PASS' : 'FAIL');
    process.exit(ok ? 0 : 1);
  }

  console.log(`File: ${htmlPath}`);
  console.log(`Cards: ${cards.length} reachable (${cards.filter(c => c.side === 'white').length} White, ${cards.filter(c => c.side === 'black').length} Black), ${snap.length} in the 3-survey snapshot; ${cards.filter(c => c.handWritten).length} hand-written`);
  console.log(`Board line lengths (plies): ${Object.entries(lenCounts).map(([k, v]) => `${k}: ${v}`).join(', ')}; ${r.short.length} cards show the short-line note (${snap.filter(c => r.short.includes(c.key)).length} in the snapshot)`);
  console.log(`Cards with a Notable GM pool: ${cards.filter(c => c.pool).length}; known lines that never enter their own code: ${r.known.length}`);
  console.log(`Named position after the 20-ply cap (beyond-cap note shown): ${r.beyondCap.length}: ${r.beyondCap.join(', ')}`);
  for (const k of r.known) console.log(`  known: ${k}`);
  console.log(`Page and console errors: ${errors.length}`);
  if (r.fails.length) { console.log(`\nFAIL (${r.fails.length})`); for (const x of r.fails.slice(0, 60)) console.log('  ' + x); if (r.fails.length > 60) console.log(`  ... ${r.fails.length - 60} more`); process.exit(1); }
  console.log('\nPASS');
})().catch(e => { console.error(e); process.exit(1); });
