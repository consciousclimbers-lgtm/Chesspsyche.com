// Survey-pick regression test for index.html.
//
// Scope: not an end-to-end survey test. It calls the page's picker, choosePicksForRun(style),
// directly, after setting the inputs the survey would set (skillLevelKey, lastExtremeCount).
// It does not click through or submit the survey UI, score answers or render the results page;
// that code is covered only by the protected-code hash in check 1.
//
// Checks, against expected.json:
//   1. Protected code is byte-identical: index.html with the opening-data block removed
//      (from "const ecoNamesMap = {" up to the survey picker) must hash to the saved value.
//      This covers the demo board, evaluation bar, pieces, board editor, results board,
//      player labels, navigation and survey logic.
//   2. Survey picks: every style x experience level x normal/strong answers, three
//      consecutive choosePicksForRun calls each, must give the saved White/Black ECO codes.
//   3. Recommendation cards: each card must come from the side it was picked for, and its
//      line must be legal. Known pre-existing exceptions are listed in expected.json and
//      reported, not failed.
//   4. The page loads with no JavaScript errors and no console errors. Console messages
//      "Failed to load resource: net::ERR_FAILED" are expected: they are the requests this test
//      blocks to stay offline.
//   5. Question bank: every area in SURVEY_AREAS has 10 questions, each with a question text and
//      non-empty low/mid/high answer lists; no question or answer text is empty or repeated.
//      buildSurveyRun() must give one question per area with answers worth 1, 2 and 3 points,
//      taken from that question's low/mid/high lists.
//   6. Scoring: all 243 answer combinations (1-3 points in each of the 5 areas) must map to the
//      style saved in expected.json ("scoring"), through the page's getArchetypeFromPoints.
//
// Against gm-baseline.json (kept apart from expected.json so the picks snapshot is untouched):
//   7. Notable GM: the GM named on every White and Black card, for every combination and run.
//   8. Hand-written Notable GM names: the notableGm of all 36 hand-written systems in archetypes.
//      The Labs GM drill finds a GM's opening through these names.
//   9. Labs GM drill: for each GM in the Labs picker (the first 30 of grandmastersList), the moves
//      startGmDrill(name) loads.
//
// Against known-card-issues.json (rules in card_checks.js):
//  11. Every reachable card: for each style x level x normal/strong, surveys are retaken until the
//      White and Black candidate lists are used up (not just 3 runs). Every card that can appear must
//      come from its side, have a legal line and a Notable GM from its approved pool (or none when it
//      has no pool), and a real summary: not empty, not the "Starts with" fallback, not a copied move
//      comment, not a comment on the other side's move. Summary issues listed in
//      known-card-issues.json are reported, not failed; a listed issue that no longer occurs fails.
//
// Determinism: the picker (ecoCandidatesFor / pickEcoCode / choosePicksForRun) has no
// randomness; its only state is the retake history in localStorage. Math.random is used
// elsewhere on the page (question order, answer order), so before any page script runs the
// test replaces it with a seeded generator, gives every run a fresh browser context (empty
// localStorage), and clears the saved picks before each combination. The simulation is then run
// --repeat times with the same seed (all runs must match each other and expected.json) and
// once more with a different seed, which must give the same picks too.
//
// chess.js 0.10.3 (the version index.html loads from cdnjs) is served from node_modules,
// every other http(s) request is blocked, so the test makes no network requests.
//
// Usage: node survey_regression.js [path/to/index.html] [--update] [--update-gm-baseline] [--repeat N]
//                                  [--strict-cards] [--prune-known-card-issues]
//   --update              rewrites expected.json only (never gm-baseline.json)
//   --update-gm-baseline  rewrites gm-baseline.json only (npm run update:gm-baseline); cannot be combined with --update
//   --strict-cards        ignores known-card-issues.json, to show every card issue the checks catch
//   --prune-known-card-issues  removes entries that no longer occur from known-card-issues.json;
//                         it never adds an entry (a new issue has to be fixed or added by hand in review)
//   --init-known-card-issues  creates known-card-issues.json from today's issues; refuses if it exists
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { chromium } = require('playwright');
const { Chess } = require('chess.js');
const cardChecks = require('./card_checks');

const args = process.argv.slice(2);
const update = args.includes('--update');
const updateGm = args.includes('--update-gm-baseline');
const strictCards = args.includes('--strict-cards');
const pruneKnown = args.includes('--prune-known-card-issues');
if (update && updateGm) { console.error('Use --update (expected.json) or --update-gm-baseline (gm-baseline.json), not both.'); process.exit(1); }
const repeat = args.includes('--repeat') ? Math.max(1, parseInt(args[args.indexOf('--repeat') + 1], 10) || 1) : 3;
const SEED = 20261019, OTHER_SEED = 7;
const positional = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--repeat');
const htmlPath = path.resolve(positional[0] || path.join(__dirname, '../../index.html'));
const expectedPath = path.join(__dirname, 'expected.json');
const gmBaselinePath = path.join(__dirname, 'gm-baseline.json');
const chessLocal = require.resolve('chess.js');
// Console message Chromium logs for each request this test aborts to stay offline
const BLOCKED_LOAD = 'Failed to load resource: net::ERR_FAILED';

function protectedHash(html) {
  const lines = html.split('\n');
  const start = lines.findIndex(l => l.startsWith('const ecoNamesMap = {'));
  const end = lines.findIndex(l => l.startsWith('// ---- Picks one White and one Black opening'));
  if (start < 0 || end < 0 || end < start) throw new Error('could not find the opening-data block markers');
  const rest = lines.slice(0, start).concat(lines.slice(end)).join('\n');
  return crypto.createHash('sha256').update(rest).digest('hex');
}

async function runSurvey(browser, file, seed) {
  const context = await browser.newContext();   // fresh, empty localStorage for every run
  await context.addInitScript(s => {
    // mulberry32: replaces Math.random before any page script runs
    let a = s >>> 0;
    Math.random = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }, seed);
  // Offline: block every http(s) request (Google Fonts, Font Awesome, ...), except
  // chess.js, which the page route below serves from node_modules
  const blocked = new Set();
  await context.route(/^https?:\/\//, r => { blocked.add(new URL(r.request().url()).host); r.abort(); });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(`page error: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error' && m.text() !== BLOCKED_LOAD) errors.push(`console error: ${m.text()}`); });
  await page.route('**/chess.js/0.10.3/chess.min.js', r => r.fulfill({ path: chessLocal, contentType: 'application/javascript' }));
  await page.goto('file://' + file);
  await page.waitForFunction(() => typeof archetypes === 'object' && typeof choosePicksForRun === 'function');
  const res = await page.evaluate(() => {
    if (typeof window.Chess !== 'function') throw new Error('chess.js did not load');
    // Hand-written systems are matched on code and side (cards are copies that carry the rotated Notable GM)
    const handSide = new Set();
    for (const a of Object.values(archetypes)) for (const s of Object.values(a.systems)) {
      handSide.add(`${s.whiteSystem.eco}|white`); handSide.add(`${s.blackSystem.eco}|black`);
    }
    const approved = (eco, side) => { const p = notableGmPool(eco, side); return p ? eligibleNotableGms(p) : []; };
    const written = typeof ECO_SUMMARIES === 'object' ? ECO_SUMMARIES : {};
    const card = (sys, want) => sys && {
      eco: sys.eco, want,
      side: handSide.has(`${sys.eco}|${want}`) ? want : (ecoVault.find(e => e.eco === sys.eco) || {}).side,
      moves: sys.variations[0].moves.map(m => m.move),
      gm: sys.notableGm || null,
      gmApproved: sys.notableGm ? approved(sys.eco, want).includes(sys.notableGm) : !approved(sys.eco, want).length,
      summaryWritten: handSide.has(`${sys.eco}|${want}`) || (written[`${sys.eco}|${want}`] || {}).summary === sys.summary
    };
    const out = {};
    for (const arch of Object.keys(archetypes)) for (const lvl of Object.keys(LEVEL_BANDS)) for (const strong of [0, 4]) {
      localStorage.removeItem(PICKS_KEY); localStorage.removeItem(GM_ROTATION_KEY); skillLevelKey = lvl; lastExtremeCount = strong;
      const runs = [];
      for (let run = 0; run < 3; run++) {
        choosePicksForRun(arch);
        runs.push([card(currentPicks.whiteSystem, 'white'), card(currentPicks.blackSystem, 'black')]);
      }
      out[`${arch}|${lvl}|${strong ? 'strong' : 'normal'}`] = runs;
    }
    localStorage.removeItem(PICKS_KEY); localStorage.removeItem(GM_ROTATION_KEY);
    return out;
  });
  // Every reachable card: retake each combination until both candidate lists are used up
  // (pickEcoCode stops on the last candidate, so two identical runs in a row mean the end)
  const reach = await page.evaluate(() => {
    const handSide = new Set();
    for (const a of Object.values(archetypes)) for (const s of Object.values(a.systems)) {
      handSide.add(`${s.whiteSystem.eco}|white`); handSide.add(`${s.blackSystem.eco}|black`);
    }
    const cards = {}, combos = {};
    for (const arch of Object.keys(archetypes)) for (const lvl of Object.keys(LEVEL_BANDS)) for (const strong of [0, 4]) {
      localStorage.removeItem(PICKS_KEY); localStorage.removeItem(GM_ROTATION_KEY); skillLevelKey = lvl; lastExtremeCount = strong;
      let prev = '', run = 0;
      for (run = 1; run <= 400; run++) {
        choosePicksForRun(arch);
        const now = `${currentPicks.whiteSystem.eco}/${currentPicks.blackSystem.eco}`;
        for (const want of ['white', 'black']) {
          const sys = currentPicks[want + 'System'];
          const key = `${sys.eco}|${want}`;
          if (cards[key]) { cards[key].firstRun = Math.min(cards[key].firstRun, run); continue; }
          const pool = notableGmPool(sys.eco, want), approved = pool ? eligibleNotableGms(pool) : [];
          cards[key] = {
            eco: sys.eco, side: want, firstRun: run, firstSeen: `${arch}|${lvl}|${strong ? 'strong' : 'normal'} run ${run}`,
            cardSide: handSide.has(key) ? want : (ecoVault.find(e => e.eco === sys.eco) || {}).side,
            handWritten: handSide.has(key), summary: sys.summary, comments: (ecoVaultData[sys.eco] || {}).commentary || [],
            moves: sys.variations[0].moves.map(m => m.move), gm: sys.notableGm || null,
            gmOk: sys.notableGm ? approved.includes(sys.notableGm) : !approved.length,
            summaryWritten: handSide.has(key) || (ECO_SUMMARIES[key] || {}).summary === sys.summary
          };
        }
        if (now === prev) break;
        prev = now;
      }
      combos[`${arch}|${lvl}|${strong ? 'strong' : 'normal'}`] = run;
    }
    localStorage.removeItem(PICKS_KEY); localStorage.removeItem(GM_ROTATION_KEY); currentPicks = null;
    return { cards, combos };
  });
  // Validate source-backed summary data independently of the three-run snapshot.
  const summaryAudit = await page.evaluate(() => {
    const issues = [], seen = new Set(), hand = new Set();
    for (const a of Object.values(archetypes)) for (const s of Object.values(a.systems)) {
      hand.add(s.whiteSystem.eco + '|white'); hand.add(s.blackSystem.eco + '|black');
    }
    const written = typeof ECO_SUMMARIES === 'object' ? ECO_SUMMARIES : {};
    for (const [key, e] of Object.entries(written)) {
      const parts = key.split('|'), code = parts[0], side = parts[1], v = ecoVault.find(x => x.eco === code);
      if (parts.length !== 2 || !/^[A-E][0-9]{2}$/.test(code) || !['white', 'black'].includes(side)) { issues.push(key + ': invalid ECO|side key'); continue; }
      if (!v) { issues.push(key + ': not in the opening vault'); continue; }
      if (v.side !== side && v.side !== 'either') issues.push(key + ': wrong side for vault opening (' + v.side + ')');
      if (hand.has(key)) issues.push(key + ': duplicates a hand-written system');
      const t = String(e.summary || '');
      if (!/^[A-Z].{59,229}\.$/.test(t) || /[a-z)]\. [A-Z]/.test(t)) issues.push(key + ': summary is not one sentence of 60–230 characters');
      if (/^Starts with/.test(t)) issues.push(key + ': uses the generic move-list fallback');
      const notes = (v.commentary || []).map(c => String(c).split(' — ').slice(1).join(' — ').toLowerCase()).filter(n => n.split(' ').length >= 4);
      if (notes.some(n => t.toLowerCase().includes(n))) issues.push(key + ': repeats vault move commentary');
      if (seen.has(t)) issues.push(key + ': duplicates another summary');
      seen.add(t);
      if (!/^https:\/\/[^\s]+$/.test(e.source || '')) issues.push(key + ': missing HTTPS source');
    }
    return { count: Object.keys(written).length, issues };
  });
  // Notable GM pools: data checks, fair round-robin, stability on re-render and reload, women's representation
  const rotation = await page.evaluate(() => {
    const issues = [], warnings = [];
    const names = new Set(grandmastersList.map(g => g.name));
    const women = [...new Set(grandmastersList.filter(g => g.gender === 'female').map(g => g.name))];
    const owner = {}, poolsPerGm = {}, keys = new Set();
    for (const p of NOTABLE_GM_POOLS) {
      if (!p.key || keys.has(p.key)) issues.push(`pool key "${p.key}" missing or repeated`);
      keys.add(p.key);
      if (!['white', 'black'].includes(p.side)) issues.push(`${p.key}: side "${p.side}"`);
      if (!p.codes.length || !p.pool.length) issues.push(`${p.key}: no codes or no GMs`);
      for (const c of p.codes) {
        const v = ecoVault.find(e => e.eco === c);
        if (!v) issues.push(`${p.key}: ${c} is not in the opening vault`);
        else if (v.side !== p.side && v.side !== 'either') issues.push(`${p.key}: ${c} is a ${v.side} opening`);
        if (owner[`${c}|${p.side}`]) issues.push(`${c} (${p.side}) is in two pools: ${owner[`${c}|${p.side}`]} and ${p.key}`);
        owner[`${c}|${p.side}`] = p.key;
      }
      const seen = new Set();
      for (const e of p.pool) {
        if (!e.gm || !/^https:\/\//.test(e.source || '') || !e.status) issues.push(`${p.key}: entry ${JSON.stringify(e)} needs gm, an https source and status`);
        if (seen.has(e.gm)) issues.push(`${p.key}: ${e.gm} listed twice`);
        seen.add(e.gm);
        if (e.status === 'verified' && !names.has(e.gm)) issues.push(`${p.key}: ${e.gm} has no GM record`);
        if (e.status === 'verified') poolsPerGm[e.gm] = (poolsPerGm[e.gm] || 0) + 1;
        // Pools synchronized with the GM records: the entry's FIDE id must give the same name, and a verified
        // entry's record must list one of the pool's recordLabels for this side (the pop-up's "system")
        if (p.recordLabels) {
          const g = grandmastersList.find(r => r.id === e.id);
          if (!g || g.name !== e.gm) issues.push(`${p.key}: ${e.gm} (id ${e.id}) does not match a GM record`);
          else if (e.status === 'verified' && !String((g.system || {})[p.side] || '').split(' / ').some(l => p.recordLabels.includes(l)))
            issues.push(`${p.key}: ${e.gm} is verified, but the GM record's ${p.side} system "${(g.system || {})[p.side] || '-'}" lists none of ${p.recordLabels.join(', ')}`);
        }
      }
    }
    for (const [g, n] of Object.entries(poolsPerGm)) if (n > 6) warnings.push(`${g} is in ${n} pools (more than 6)`);
    const considered = new Map(NOTABLE_GM_CONSIDERED.map(c => [c.gm, c]));
    for (const w of women) {
      const c = considered.get(w);
      if (!c) { issues.push(`female GM ${w} is not in NOTABLE_GM_CONSIDERED`); continue; }
      const actual = NOTABLE_GM_POOLS.filter(p => p.pool.some(e => e.gm === w && e.status === 'verified')).map(p => p.key).sort();
      if (JSON.stringify(actual) !== JSON.stringify(c.pools.slice().sort())) issues.push(`NOTABLE_GM_CONSIDERED ${w}: lists ${c.pools}, pools have ${actual}`);
    }
    // Fair round-robin: n completed surveys show every GM once, survey n+1 repeats survey 1, no advance on re-render
    const cycles = {};
    for (const p of NOTABLE_GM_POOLS) {
      localStorage.removeItem(GM_ROTATION_KEY);
      const gms = eligibleNotableGms(p), code = p.codes[0], seq = [];
      if (notableGmFor(code, p.side, false) !== gms[gmPoolOffset(p.key) % gms.length]) issues.push(`${p.key}: wrong starting GM before any survey`);
      for (let i = 0; i <= gms.length; i++) {
        seq.push(notableGmFor(code, p.side, true));
        if (notableGmFor(code, p.side, false) !== seq[i] || notableGmFor(p.codes[p.codes.length - 1], p.side, false) !== seq[i]) issues.push(`${p.key}: GM changes without a new survey`);
      }
      if (new Set(seq.slice(0, gms.length)).size !== gms.length) issues.push(`${p.key}: ${gms.length} surveys showed ${seq.slice(0, gms.length)}`);
      if (seq[gms.length] !== seq[0]) issues.push(`${p.key}: survey ${gms.length + 1} showed ${seq[gms.length]}, expected ${seq[0]}`);
      cycles[p.key] = seq.join(', ');
    }
    // Through the page: a completed survey, then a re-render and a reload (no saved currentPicks)
    const pages = {};
    for (const arch of Object.keys(archetypes)) {
      localStorage.removeItem(PICKS_KEY); localStorage.removeItem(GM_ROTATION_KEY); skillLevelKey = 'intermediate'; lastExtremeCount = 0;
      const shown = [];
      for (let run = 0; run < 2; run++) {
        choosePicksForRun(arch);
        const first = [currentPicks.whiteSystem.notableGm, currentPicks.blackSystem.notableGm];
        const again = getScaledOpeningsForUser(archetypes[arch]);
        currentPicks = null;
        const reload = getScaledOpeningsForUser(archetypes[arch]);
        const r = [reload.whiteSystem.notableGm, reload.blackSystem.notableGm];
        if (again.whiteSystem.notableGm !== first[0] || again.blackSystem.notableGm !== first[1]) issues.push(`${arch}: Notable GM changed on re-render`);
        if (r[0] !== first[0] || r[1] !== first[1]) issues.push(`${arch} run ${run + 1}: reload shows ${r}, results showed ${first}`);
        shown.push(first.map(g => g || '-').join(' / '));
      }
      pages[arch] = shown.join(' | ');
      if (JSON.stringify(loadOpeningPicks()).includes('notableGm')) issues.push('rotation state leaked into the saved picks');
    }
    localStorage.removeItem(PICKS_KEY); localStorage.removeItem(GM_ROTATION_KEY); currentPicks = null;
    const entries = NOTABLE_GM_POOLS.flatMap(p => p.pool.filter(e => e.status === 'verified'));
    const womenSet = new Set(women);
    return {
      issues, warnings, cycles, pages,
      report: {
        pools: NOTABLE_GM_POOLS.length, entries: entries.length, womenEntries: entries.filter(e => womenSet.has(e.gm)).length,
        womenInPools: women.filter(w => poolsPerGm[w]).length, women: women.length,
        noWomen: NOTABLE_GM_POOLS.filter(p => !p.pool.some(e => womenSet.has(e.gm))).map(p => p.key),
        mostPools: Object.entries(poolsPerGm).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([g, n]) => `${g} ${n}`),
        womenNames: women
      }
    };
  });
  const bank = await page.evaluate(() => {
    const issues = [], seen = new Set(), counts = {};
    const text = (t, where) => {
      if (typeof t !== 'string' || !t.trim()) issues.push(`${where}: empty text`);
      else if (seen.has(t)) issues.push(`${where}: repeated text "${t}"`);
      else seen.add(t);
    };
    const keys = Object.keys(surveyQuestionBank);
    if (JSON.stringify(keys.slice().sort()) !== JSON.stringify(SURVEY_AREAS.slice().sort())) issues.push(`bank areas ${keys} do not match SURVEY_AREAS ${SURVEY_AREAS}`);
    for (const area of SURVEY_AREAS) {
      const items = surveyQuestionBank[area] || [];
      counts[area] = items.length;
      if (items.length !== 10) issues.push(`${area}: ${items.length} questions, expected 10`);
      items.forEach((it, i) => {
        text(it.q, `${area} #${i + 1} question`);
        for (const lvl of ['low', 'mid', 'high']) {
          if (!Array.isArray(it[lvl]) || !it[lvl].length) issues.push(`${area} #${i + 1}: no ${lvl} answers`);
          else it[lvl].forEach(t => text(t, `${area} #${i + 1} ${lvl} answer`));
        }
      });
    }
    // 200 survey runs as the page builds them
    for (let n = 0; n < 200 && issues.length < 20; n++) {
      const run = buildSurveyRun();
      if (run.length !== SURVEY_AREAS.length || new Set(run.map(r => r.area)).size !== SURVEY_AREAS.length) { issues.push(`buildSurveyRun gave areas ${run.map(r => r.area)}`); continue; }
      for (const r of run) {
        const item = (surveyQuestionBank[r.area] || []).find(it => it.q === r.q);
        if (!item) { issues.push(`buildSurveyRun: question "${r.q}" is not in the ${r.area} bank`); continue; }
        if (JSON.stringify(r.options.map(o => o.points).sort()) !== '[1,2,3]') issues.push(`buildSurveyRun: "${r.q}" answers worth ${r.options.map(o => o.points)}`);
        for (const o of r.options) if (!(item[['low', 'mid', 'high'][o.points - 1]] || []).includes(o.text)) issues.push(`buildSurveyRun: "${o.text}" is not a ${o.points}-point answer to "${r.q}"`);
      }
    }
    const scoring = {};
    for (let i = 0; i < 243; i++) {
      const v = [0, 1, 2, 3, 4].map(k => Math.floor(i / 3 ** (4 - k)) % 3 + 1);
      scoring[v.join('')] = getArchetypeFromPoints(v) || null;
    }
    return { issues, counts, scoring };
  });
  // Hand-written Notable GM names and the Labs GM drill that depends on them (run last: it changes Labs state)
  const labs = await page.evaluate(() => {
    const handWritten = [];
    for (const [arch, a] of Object.entries(archetypes)) for (const [lvl, s] of Object.entries(a.systems))
      for (const side of ['whiteSystem', 'blackSystem']) handWritten.push(`${arch}|${lvl}|${side}|${s[side].eco}: ${s[side].notableGm || '-'}`);
    const drill = {};
    for (const gm of grandmastersList.slice(0, 30)) { startGmDrill(gm.name); drill[gm.name] = labsGmMoves.join(' ') || '-'; }
    const names = new Set(grandmastersList.map(g => g.name));
    return { handWritten, drill, names: [...names] };
  });
  await context.close();
  const picks = {};
  const notableGm = {};
  for (const [cfg, runs] of Object.entries(res)) picks[cfg] = runs.map(([w, b]) => `${w ? w.eco : '-'}/${b ? b.eco : '-'}`).join(' ');
  for (const [cfg, runs] of Object.entries(res)) notableGm[cfg] = runs.map(([w, b]) => `${(w && w.gm) || '-'} / ${(b && b.gm) || '-'}`).join(' | ');
  return { res, picks, notableGm, labs, rotation, bank, reach, summaryAudit, errors, blocked: [...blocked] };
}

(async () => {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const hash = protectedHash(html);
  const browser = await chromium.launch();
  const runs = [];
  for (let i = 0; i < repeat; i++) runs.push(await runSurvey(browser, htmlPath, SEED));
  const otherSeed = await runSurvey(browser, htmlPath, OTHER_SEED);
  await browser.close();
  const { res, picks, bank, notableGm, labs, rotation, reach, summaryAudit } = runs[0];
  const gmNow = { notableGm, handWritten: labs.handWritten, labsDrill: labs.drill };
  const errors = [...new Set([...runs, otherSeed].flatMap(r => r.errors))];
  const blocked = [...new Set([...runs, otherSeed].flatMap(r => r.blocked))].sort();
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const repeatOk = runs.every(r => same(r.picks, picks) && same(r.res, res) && same(r.labs, labs) && same(r.rotation, rotation) && same(r.reach, reach));
  const seedOk = same(otherSeed.picks, picks) && same(otherSeed.notableGm, notableGm) && same(otherSeed.labs, labs) && same(otherSeed.rotation, rotation) && same(otherSeed.reach, reach);

  // Every reachable card (check 11)
  const reachCards = Object.values(reach.cards);
  const reachFails = [], cardFound = {};
  for (const c of reachCards) {
    const key = `${c.eco}|${c.side}`;
    if (c.cardSide !== c.side && c.cardSide !== 'either') reachFails.push(`card ${key} (${c.firstSeen}) is a ${c.cardSide} card`);
    if (!c.gmOk) reachFails.push(`card ${key} (${c.firstSeen}) shows Notable GM "${c.gm || '-'}", not from its approved pool`);
    // Every reachable generated card must use the exact written ECO|side summary.
    // Hand-written systems are intentionally exempt because their summaries are authored inline.
    if (!c.handWritten && !c.summaryWritten) reachFails.push(`card ${key} (${c.firstSeen}) does not use its matching ECO_SUMMARIES entry`);
    const g = new Chess();
    for (const san of c.moves) if (!g.move(san)) { reachFails.push(`card ${key} (${c.firstSeen}) illegal at ${san}`); break; }
    const issues = cardChecks.summaryIssues(c);
    if (issues.length) cardFound[key] = issues;
  }
  const cardCmp = cardChecks.compareKnown(cardFound, { strict: strictCards, checkedAll: true, types: cardChecks.SUMMARY_TYPES });
  if (args.includes('--init-known-card-issues')) {
    // One-off: creates the list from today's issues; refuses to overwrite it (use the prune option)
    if (fs.existsSync(cardChecks.KNOWN_PATH)) { console.error(`${cardChecks.KNOWN_PATH} exists; it is only created once. Use --prune-known-card-issues.`); process.exit(1); }
    cardChecks.writeKnown(cardFound);
    console.log(`Created ${path.relative(process.cwd(), cardChecks.KNOWN_PATH)} with ${Object.keys(cardFound).length} cards.`);
    return;
  }
  if (pruneKnown) {
    if (strictCards) { console.error('--prune-known-card-issues cannot be combined with --strict-cards.'); process.exit(1); }
    const removed = cardChecks.pruneKnown(cardFound, cardChecks.SUMMARY_TYPES);
    console.log(`Removed ${removed} summary entries that no longer occur from ${path.relative(process.cwd(), cardChecks.KNOWN_PATH)}; nothing was added. (Notable GM line entries are pruned by clickthrough.js --prune-known-card-issues.)`);
    return;
  }

  const sideIssues = new Set(), illegal = [];
  for (const [cfg, runs] of Object.entries(res)) for (const pair of runs) for (const c of pair) {
    if (!c) continue;
    if (c.side !== c.want && c.side !== 'either') sideIssues.add(`${c.eco} shown as ${c.want}, card is ${c.side}`);
    if (!c.handWritten && !c.summaryWritten) illegal.push(`${cfg}: ${c.eco} (${c.want}) does not use its matching ECO_SUMMARIES entry`);
    if (!c.gmApproved) illegal.push(`${cfg}: ${c.eco} (${c.want}) shows Notable GM "${c.gm || '-'}", not from its approved pool`);
    const g = new Chess();
    for (const san of c.moves) if (!g.move(san)) { illegal.push(`${cfg}: ${c.eco} illegal at ${san}`); break; }
  }

  if (updateGm) {
    if (!repeatOk || !seedOk || errors.length || bank.issues.length) { console.error('Not updating: survey results were not repeatable, the page threw errors, or the question bank has issues.'); process.exit(1); }
    fs.writeFileSync(gmBaselinePath, JSON.stringify(gmNow, null, 1) + '\n');
    console.log(`Updated ${path.relative(process.cwd(), gmBaselinePath)} from ${htmlPath}`);
    return;
  }

  if (update) {
    if (!repeatOk || !seedOk || errors.length || bank.issues.length) { console.error('Not updating: survey results were not repeatable, the page threw errors, or the question bank has issues.'); process.exit(1); }
    const prev = fs.existsSync(expectedPath) ? JSON.parse(fs.readFileSync(expectedPath, 'utf8')) : {};
    fs.writeFileSync(expectedPath, JSON.stringify({
      protectedHash: hash,
      knownSideIssues: prev.knownSideIssues || [...sideIssues].sort(),
      picks,
      scoring: bank.scoring
    }, null, 1) + '\n');
    console.log(`Updated ${path.relative(process.cwd(), expectedPath)} from ${htmlPath}`);
    return;
  }

  const exp = JSON.parse(fs.readFileSync(expectedPath, 'utf8'));
  const fails = [];
  if (!repeatOk) fails.push(`survey results differ between the ${repeat} runs with seed ${SEED}`);
  if (!seedOk) fails.push(`survey picks change with a different Math.random seed (${OTHER_SEED})`);
  if (hash !== exp.protectedHash) fails.push(`protected code changed (sha256 ${hash.slice(0, 12)}, expected ${exp.protectedHash.slice(0, 12)})`);
  const cfgs = new Set([...Object.keys(exp.picks), ...Object.keys(picks)]);
  for (const cfg of cfgs) if (picks[cfg] !== exp.picks[cfg]) fails.push(`picks ${cfg}: got "${picks[cfg]}", expected "${exp.picks[cfg]}"`);
  const known = new Set(exp.knownSideIssues);
  for (const s of sideIssues) if (!known.has(s)) fails.push(`side mismatch: ${s}`);
  fails.push(...illegal);
  if (errors.length) fails.push(...errors);
  fails.push(...bank.issues.map(i => `question bank: ${i}`));
  const expScoring = exp.scoring || {};
  const vecs = new Set([...Object.keys(expScoring), ...Object.keys(bank.scoring)]);
  const scoreDiffs = [...vecs].filter(v => bank.scoring[v] !== expScoring[v]);
  if (!exp.scoring) fails.push('expected.json has no "scoring" snapshot (run npm run update)');
  else for (const v of scoreDiffs) fails.push(`scoring ${v}: got ${bank.scoring[v]}, expected ${expScoring[v]}`);
  const gmExp = fs.existsSync(gmBaselinePath) ? JSON.parse(fs.readFileSync(gmBaselinePath, 'utf8')) : null;
  const diffKeys = (got, want, label) => {
    const keys = new Set([...Object.keys(want), ...Object.keys(got)]);
    let n = 0;
    for (const k of keys) if (got[k] !== want[k]) { n++; fails.push(`${label} ${k}: got "${got[k]}", expected "${want[k]}"`); }
    return keys.size - n;
  };
  let gmMatch = 0, drillMatch = 0, handOk = false;
  if (!gmExp) fails.push('gm-baseline.json is missing (run node survey_regression.js --update-gm-baseline)');
  else {
    gmMatch = diffKeys(notableGm, gmExp.notableGm || {}, 'Notable GM');
    drillMatch = diffKeys(labs.drill, gmExp.labsDrill || {}, 'Labs GM drill');
    handOk = same(labs.handWritten, gmExp.handWritten);
    if (!handOk) fails.push(`hand-written notableGm names changed: ${labs.handWritten.filter(x => !(gmExp.handWritten || []).includes(x)).join('; ') || 'order changed'}`);
  }
  fails.push(...rotation.issues.map(i => `Notable GM pools: ${i}`));
  fails.push(...summaryAudit.issues.map(i => `Opening summaries: ${i}`));
  fails.push(...reachFails, ...cardCmp.fails);
  const shownGms = new Set(Object.values(res).flat().flat().filter(c => c && c.gm).map(c => c.gm));
  const names = new Set(labs.names);
  const noRecord = [...shownGms].filter(g => !names.has(g)).sort();
  const styleCounts = {};
  for (const s of Object.values(bank.scoring)) styleCounts[s] = (styleCounts[s] || 0) + 1;

  console.log(`File: ${htmlPath}`);
  console.log(`Repeat runs (seed ${SEED}): ${repeat}, identical: ${repeatOk ? 'yes' : 'NO'}; different seed (${OTHER_SEED}) gives same picks: ${seedOk ? 'yes' : 'NO'}`);
  console.log(`Picks fingerprint: sha256 ${crypto.createHash('sha256').update(JSON.stringify(picks)).digest('hex').slice(0, 16)}`);
  console.log(`Network: offline (blocked requests to ${blocked.join(', ') || 'nothing'}; chess.js 0.10.3 served from node_modules)`);
  console.log(`Protected code hash: ${hash === exp.protectedHash ? 'unchanged' : 'CHANGED'}`);
  console.log(`Survey combinations: ${cfgs.size} (x3 runs), ${[...cfgs].filter(c => picks[c] === exp.picks[c]).length} match`);
  console.log(`Card side issues: ${sideIssues.size} (${[...sideIssues].filter(s => known.has(s)).length} known, pre-existing)`);
  for (const s of [...sideIssues].filter(s => known.has(s))) console.log(`  known: ${s}`);
  for (const s of exp.knownSideIssues.filter(s => !sideIssues.has(s))) console.log(`  known issue no longer seen (remove from expected.json): ${s}`);
  console.log(`Question bank: ${Object.entries(bank.counts).map(([a, n]) => `${a} ${n}`).join(', ')}; 200 built survey runs checked; ${bank.issues.length} issues`);
  console.log(`Scoring: ${vecs.size} answer combinations, ${vecs.size - scoreDiffs.length} match (${Object.entries(styleCounts).map(([s, n]) => `${s} ${n}`).join(', ')})`);
  console.log(`Notable GM on cards: ${Object.keys(notableGm).length} combinations (x3 runs), ${gmMatch} match gm-baseline.json; ${shownGms.size} different GMs shown, ${noRecord.length} with no GM record (${noRecord.join(', ') || 'none'})`);
  console.log(`Opening summaries: ${summaryAudit.count} entries, ${summaryAudit.issues.length} validation issues; reachable generated cards checked for coverage`);
  console.log(`Hand-written Notable GM names: ${labs.handWritten.length}, ${handOk ? 'unchanged' : 'CHANGED'}`);
  console.log(`Labs GM drill: ${Object.keys(labs.drill).length} picker GMs, ${drillMatch} match gm-baseline.json (${Object.values(labs.drill).filter(m => m !== '-').length} load an opening)`);
  const rp = rotation.report, womenSet = new Set(rp.womenNames);
  const shownList = Object.values(res).flat().flat().filter(c => c && c.gm).map(c => c.gm);
  console.log(`Notable GM pools: ${rp.pools} pools, ${rp.entries} approved entries, ${rotation.issues.length} issues; every pool cycles through all its GMs before repeating, and keeps its GM on re-render and reload`);
  console.log(`  women: ${rp.womenEntries} of ${rp.entries} pool entries (${Math.round(100 * rp.womenEntries / rp.entries)}%), ${rp.womenInPools} of ${rp.women} female GM records in a pool; ${shownList.filter(g => womenSet.has(g)).length} of ${shownList.length} Notable GMs shown in the snapshot are women (reported, not a quota)`);
  console.log(`  pools with no women: ${rp.noWomen.join(', ') || 'none'}; most pools: ${rp.mostPools.join(', ')}`);
  for (const w of rotation.warnings) console.log(`  warning: ${w}`);
  const bySide = s => reachCards.filter(c => c.side === s);
  const early = reachCards.filter(c => c.firstRun <= 5);
  const runsTaken = Object.values(reach.combos);
  console.log(`Every reachable card: ${Object.keys(reach.combos).length} combinations retaken until their lists end (${Math.min(...runsTaken)}-${Math.max(...runsTaken)} surveys); ${bySide('white').length} White and ${bySide('black').length} Black cards (${early.length} reachable within 5 surveys); ${reachFails.length} side/legality/Notable GM issues`);
  console.log(`  summaries: ${cardChecks.countLine(cardFound)}; ${Object.keys(cardFound).filter(k => reach.cards[k].firstRun <= 5).length} of the cards are reachable within 5 surveys`);
  console.log(`  known-card-issues.json: ${strictCards ? 'ignored (--strict-cards)' : `${cardCmp.listed.length} findings listed, ${cardCmp.fails.length} not listed or stale`}`);
  console.log(`Page and console errors: ${errors.length}`);
  if (fails.length) {
    console.log(`\nFAIL (${fails.length})`);
    for (const f of fails) console.log('  - ' + f);
    process.exit(1);
  }
  console.log('\nPASS');
})().catch(e => { console.error(e); process.exit(1); });
