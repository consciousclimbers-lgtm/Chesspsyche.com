// Report-only ECO audit for ChessPsyche index.html. It reads the site's opening data and compares it with a
// pinned copy of lichess-org/chess-openings in ref/ (checked against ref/SOURCE.json). It never changes the site.
//
// Usage: node eco_audit.js [index.html] [--json out.json] [--markdown out.md]
// Exit codes: 0 = audit ran (findings are reported, not failed); 2 = the audit could not run
// (reference files missing or changed, or the site data could not be read).
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { Chess } = require('chess.js');

const args = process.argv.slice(2);
const opt = name => (args.includes(name) ? args[args.indexOf(name) + 1] : null);
const htmlPath = args.find((a, i) => !a.startsWith('--') && !['--json', '--markdown'].includes(args[i - 1])) || path.join(__dirname, '../../index.html');
const refDir = path.join(__dirname, 'ref');
const die = msg => { console.log(`AUDIT NOT RUN: ${msg}`); process.exit(2); };
// Malformed site data (for example a vault entry without moves) also means the audit did not run
process.on('uncaughtException', e => die(`unexpected error (${e.message})`));

// ---- Reference: pinned files, checked by sha256 before use ----
let source;
try { source = JSON.parse(fs.readFileSync(path.join(refDir, 'SOURCE.json'), 'utf8')); } catch (e) { die(`cannot read ref/SOURCE.json (${e.message})`); }
const files = ['a', 'b', 'c', 'd', 'e'].map(x => `${x}.tsv`);
if (files.some(f => !(f in (source.sha256 || {})))) die('SOURCE.json must pin a.tsv to e.tsv');
for (const file of files) {
  let got;
  try { got = crypto.createHash('sha256').update(fs.readFileSync(path.join(refDir, file))).digest('hex'); } catch (e) { die(`cannot read ref/${file} (${e.message})`); }
  if (got !== source.sha256[file]) die(`ref/${file} has sha256 ${got.slice(0, 12)}, but SOURCE.json pins ${source.sha256[file].slice(0, 12)}; update the reference only in its own PR`);
}

const epd = fen => fen.split(' ').slice(0, 4).join(' ');
const sanList = pgn => pgn.replace(/\d+\.(\.\.)?/g, ' ').trim().split(/\s+/).filter(Boolean);
const ref = new Map();      // position -> [{eco, name}]
const refByEco = {};        // eco -> [{name, sans}]
let refRows = 0;
for (const f of files) {
  for (const row of fs.readFileSync(path.join(refDir, f), 'utf8').split('\n').slice(1)) {
    if (!row.trim()) continue;
    const [eco, name, pgn] = row.split('\t');
    const g = new Chess();
    const sans = sanList(pgn);
    for (const m of sans) g.move(m);
    const k = epd(g.fen());
    if (!ref.has(k)) ref.set(k, []);
    ref.get(k).push({ eco, name });
    (refByEco[eco] ||= []).push({ name, sans });
    refRows++;
  }
}

// ---- Site data, read from index.html without running the page ----
let src;
try { src = fs.readFileSync(htmlPath, 'utf8'); } catch (e) { die(`cannot read ${htmlPath} (${e.message})`); }
const lineOf = idx => src.slice(0, idx).split('\n').length;
function extractLiteral(name) {
  const start = src.indexOf(`const ${name} =`);
  if (start < 0) die(`const ${name} not found in ${htmlPath}`);
  const eq = src.indexOf('=', start);
  const open = [src.indexOf('{', eq), src.indexOf('[', eq)].filter(x => x >= 0).reduce((a, b) => Math.min(a, b));
  let depth = 0, i = open, q = null;
  for (; i < src.length; i++) {
    const c = src[i];
    if (q) { if (c === '\\') i++; else if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === '`') q = c;
    else if (c === '{' || c === '[') depth++;
    else if ((c === '}' || c === ']') && --depth === 0) break;
  }
  try { return { value: vm.runInNewContext('(' + src.slice(open, i + 1) + ')'), line: lineOf(start) }; } catch (e) { die(`const ${name} could not be read (${e.message})`); }
}
const names = extractLiteral('ecoNamesMap');
const vault = extractLiteral('ecoVaultData');
const side = extractLiteral('ECO_SIDE');
const archetypes = extractLiteral('archetypes');
const gmPools = extractLiteral('NOTABLE_GM_POOLS');
const profile = extractLiteral('ECO_PROFILE').value;
const archOrder = extractLiteral('ARCHETYPE_ORDER').value;
const bands = extractLiteral('LEVEL_BANDS').value;
const styleFallback = extractLiteral('STYLE_FALLBACK').value;

// Codes the survey picked in the committed regression baseline (first three surveys of every style, level and answer set)
const picked = { white: new Set(), black: new Set() };
try {
  const exp = JSON.parse(fs.readFileSync(path.join(__dirname, '../survey-regression/expected.json'), 'utf8'));
  for (const v of Object.values(exp.picks || {})) for (const pair of v.split(' ')) { const [w, b] = pair.split('/'); picked.white.add(w); picked.black.add(b); }
} catch (e) { /* optional: without it no finding is tagged as a survey pick */ }

// ---- Helpers ----
const norm = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/defence/g, 'defense').replace(/'s\b/g, '').replace(/gruenfeld/g, 'grunfeld').replace(/[^a-z0-9]+/g, ' ').trim();
// Distinctive words of a name: generic words such as "defense" or "variation" do not count
const GENERIC = new Set('a an the of with and defense opening game variation variations attack system systems line lines main mainline mainlines classical modern accepted declined gambit'.split(' '));
const words = s => norm(s).split(' ').filter(w => w && !GENERIC.has(w) && !/^\d/.test(w));
const codesAt = cls => [...new Set(cls.map(c => c.eco))].join('/');

// Play a SAN list. Reports the first illegal move, from/to mismatches, the deepest reference classification,
// and the first ply at which the line stands on a position the reference assigns to `eco`.
function play(sans, eco, fromTo) {
  const g = new Chess();
  let error = null, last = null, lastPly = 0, reachedAt = 0;
  const mismatch = [];
  for (let i = 0; i < sans.length; i++) {
    let r;
    try { r = g.move(sans[i]); } catch (e) { error = `ply ${i + 1} (${sans[i]}) is illegal`; break; }
    if (fromTo && fromTo[i] && (r.from !== fromTo[i].from || r.to !== fromTo[i].to)) mismatch.push(`ply ${i + 1} ${sans[i]}: data says ${fromTo[i].from}-${fromTo[i].to}, actual ${r.from}-${r.to}`);
    const hit = ref.get(epd(g.fen()));
    if (hit) { last = hit; lastPly = i + 1; if (!reachedAt && hit.some(c => c.eco === eco)) reachedAt = i + 1; }
  }
  return { error, mismatch, last, lastPly, reachedAt, plies: sans.length };
}
const endsIn = r => (r.last ? `${codesAt(r.last)} "${r.last[0].name}" (ply ${r.lastPly})` : 'no classified position');
// Is `sans` a prefix of a reference line for `eco`? (the line is right but stops before the code's position)
const prefixOfRef = (sans, eco) => (refByEco[eco] || []).some(r => sans.length < r.sans.length && sans.every((m, i) => m === r.sans[i]));
// Side heuristic: in the reference's shortest line for the code, an odd ply count means White's move defines it
function refSide(eco) {
  const lines = refByEco[eco];
  if (!lines) return null;
  const shortest = lines.reduce((a, b) => (b.sans.length < a.sans.length ? b : a));
  return shortest.sans.length % 2 ? 'white' : 'black';
}
// match: every distinctive word of the site name is in one reference name for the code;
// partial: some are; differs: none are (or the site name has none and the reference names do not contain it)
function nameCheck(siteName, eco) {
  const w = words(siteName);
  const overlap = r => { const rw = new Set(norm(r).split(' ')); return w.filter(x => rw.has(x)).length; };
  const refs = [...new Set((refByEco[eco] || []).map(r => r.name))].sort((a, b) => overlap(b) - overlap(a) || a.length - b.length);
  if (!refs.length) return { verdict: 'no reference name', refs };
  const refWords = refs.map(r => new Set(norm(r).split(' ')));
  if (!w.length) return { verdict: refs.some(r => norm(r).includes(norm(siteName))) ? 'match' : 'differs', refs };
  if (refWords.some(rw => w.every(x => rw.has(x)))) return { verdict: 'match', refs };
  const best = Math.max(...refWords.map(rw => w.filter(x => rw.has(x)).length));
  return { verdict: best ? 'partial' : 'differs', refs, missing: w.filter(x => !refWords.some(rw => rw.has(x))) };
}

const refList = nm => `"${nm.refs.slice(0, 3).join('" / "')}"${nm.refs.length > 3 ? ` (+${nm.refs.length - 3} more)` : ''}${nm.missing && nm.missing.length ? `; not in any: ${nm.missing.join(', ')}` : ''}`;
const findings = [];
const add = (area, eco, check, level, detail, extra = {}) =>
  findings.push({ area, eco, check, level, detail, surveyPick: picked.white.has(eco) || picked.black.has(eco), ...extra });

// ---- 1. ECO vault: the 500 openings behind the ECO list, Arena, drills and every generated survey card ----
const vaultRows = [];
const movesSeen = {};
for (const [eco, d] of Object.entries(vault.value)) {
  const sans = sanList(d.moves);
  const r = play(sans, eco);
  const name = names.value[eco] || eco;
  const line = lineOf(src.indexOf(`"${eco}": { moves:`, src.indexOf('const ecoVaultData')));
  const nm = nameCheck(name, eco);
  const declared = side.value[eco] || 'white (default)';
  const heur = refSide(eco);
  if (r.error) add('vault', eco, 'legal moves', 'error', r.error, { line });
  else if (!r.reachedAt) {
    if (prefixOfRef(sans, eco)) add('vault', eco, 'reaches its code', 'warn', `correct moves, but stops after ${sans.length} plies, before the position the reference gives ${eco}`, { line });
    else add('vault', eco, 'reaches its code', 'error', `follows a different line; ends in ${endsIn(r)}`, { line });
  } else {
    if (!r.last.some(c => c.eco === eco)) add('vault', eco, 'ends in its code', 'warn', `passes through ${eco} at ply ${r.reachedAt}, then continues; ends in ${endsIn(r)}`, { line });
    if (r.reachedAt > 10) add('vault', eco, 'card demo reaches its code', 'info', `a generated survey card plays the first 10 plies; ${eco} is reached at ply ${r.reachedAt}`, { line });
  }
  if (nm.verdict === 'differs' || nm.verdict === 'partial') add('vault', eco, nm.verdict === 'differs' ? 'name' : 'name (partly matches)', nm.verdict === 'differs' ? 'warn' : 'info', `"${name}" vs reference ${refList(nm)}`, { line });
  if (nm.verdict === 'no reference name') add('vault', eco, 'name', 'info', `the reference has no entry for ${eco}`, { line });
  if (heur && declared !== 'either' && declared !== heur) add('vault', eco, 'side (heuristic)', 'info', `ECO_SIDE says ${declared}; the reference's defining move is ${heur}'s`, { line });
  if ((d.commentary || []).length !== sans.length) add('vault', eco, 'commentary count', 'info', `${(d.commentary || []).length} comments for ${sans.length} plies`, { line });
  (movesSeen[sans.join(' ')] ||= []).push({ eco, line });
  vaultRows.push({ eco, line, name, moves: d.moves, plies: sans.length, side: declared, reaches: r.reachedAt ? `ply ${r.reachedAt}` : 'no', refNames: nm.refs.slice(0, 3) });
}
for (const [mv, seen] of Object.entries(movesSeen)) if (seen.length > 1) for (const { eco, line } of seen) add('vault', eco, 'duplicate line', 'warn', `same moves as ${seen.filter(x => x.eco !== eco).map(x => x.eco).join(', ')}: ${mv}`, { line });
for (const eco of Object.keys(side.value)) if (!(eco in vault.value)) add('vault', eco, 'orphan ECO_SIDE entry', 'info', 'ECO_SIDE has this code but ecoVaultData does not');
for (const eco of Object.keys(names.value)) if (!(eco in vault.value)) add('vault', eco, 'orphan name', 'info', 'ecoNamesMap has this code but ecoVaultData does not');

// ---- 2. Hand-written recommendation slots (archetypes x levels x White/Black) ----
const slotRows = [];
const slotEcos = {};
for (const [arch, a] of Object.entries(archetypes.value)) {
  for (const [lvl, s] of Object.entries(a.systems || {})) {
    for (const slot of ['whiteSystem', 'blackSystem']) {
      const sys = s[slot];
      if (!sys) continue;
      const mv = sys.variations?.[0]?.moves || [];
      const r = play(mv.map(m => m.move), sys.eco, mv.map(m => ({ from: m.from, to: m.to })));
      const slotSide = slot === 'whiteSystem' ? 'white' : 'black';
      const where = `${arch}.${lvl}.${slot}`;
      const idx = src.indexOf(`name: ${JSON.stringify(sys.name)}, eco: "${sys.eco}"`);
      const line = idx >= 0 ? lineOf(idx) : null;
      if (r.error) add('slot', sys.eco, 'legal moves', 'error', `${where}: ${r.error}`, { line });
      for (const m of r.mismatch) add('slot', sys.eco, 'from/to squares', 'error', `${where}: ${m}`, { line });
      if (!r.error && !r.reachedAt) add('slot', sys.eco, 'reaches its code', 'error', `${where}: ends in ${endsIn(r)}`, { line });
      if (!r.error && r.reachedAt && !r.last.some(c => c.eco === sys.eco)) add('slot', sys.eco, 'ends in its code', 'warn', `${where}: passes through ${sys.eco} at ply ${r.reachedAt}, then continues; ends in ${endsIn(r)}`, { line });
      if (!r.error && r.reachedAt > 10) add('slot', sys.eco, 'results demo reaches its code', 'info', `${where}: the results-board demo plays the first 10 plies; ${sys.eco} is reached at ply ${r.reachedAt}`, { line });
      const declared = side.value[sys.eco];
      if (declared && declared !== 'either' && declared !== slotSide) add('slot', sys.eco, 'side', 'warn', `${where} is a ${slotSide} card, but ECO_SIDE[${sys.eco}] = ${declared}, so the ECO list and Arena say "You play as ${declared}"`, { line });
      const nm = nameCheck(sys.name, sys.eco);
      if (nm.verdict === 'differs' || nm.verdict === 'partial') add('slot', sys.eco, nm.verdict === 'differs' ? 'name' : 'name (partly matches)', nm.verdict === 'differs' ? 'warn' : 'info', `${where}: "${sys.name}" vs reference ${refList(nm)}`, { line });
      (slotEcos[`${sys.eco}|${slotSide}`] ||= []).push(where);
      slotRows.push({ slot: where, line, eco: sys.eco, name: sys.name, plies: r.plies, reaches: r.reachedAt ? `ply ${r.reachedAt}` : 'no' });
    }
  }
}
for (const [k, v] of Object.entries(slotEcos)) if (v.length > 1) add('slot', k.split('|')[0], 'duplicate slot code', 'info', `${k} is used by ${v.join(', ')}`);

// ---- 3. Notable GM pools: the GM is looked up by (picked ECO code, card side), so that pair must name the opening shown ----
// The card is the hand-written slot for that code and side if one exists, otherwise the vault entry (first 10 plies on
// the board). The survey only picks vault codes whose ECO_SIDE is the card's side or "either".
// Codes the survey can ever pick for a side, mirroring ecoCandidatesFor and pickEcoCode in index.html: for each
// style, level band and "strong" stretch, the first non-empty list of the style and its fallbacks, side-only codes
// first and "either" codes only when there are none; retakes walk the whole list, so every listed code is reachable.
function pickableCodes(sd) {
  const out = new Set();
  const candidates = (arch, lo, hi) => {
    for (const st of [arch, ...(styleFallback[arch] || [])]) for (const sides of [[sd], [sd, 'either']]) {
      const list = Object.keys(vault.value).filter(c => profile[c] && archOrder[profile[c][0]] === st && sides.includes(side.value[c] || 'white') && profile[c][1] >= lo && profile[c][1] <= hi);
      if (list.length) return list;
    }
    return [];
  };
  for (const arch of Object.keys(archetypes.value)) for (const band of Object.values(bands)) for (const strong of [0, 1]) {
    let list = candidates(arch, band[0], Math.min(5, band[1] + strong));
    if (!list.length) list = candidates(arch, 1, 5);
    list.forEach(c => out.add(c));
  }
  return out;
}
const pickable = { white: pickableCodes('white'), black: pickableCodes('black') };
const poolRows = [];
const poolKeys = {};
const slotFor = (eco, sd) => { for (const a of Object.values(archetypes.value)) for (const s of Object.values(a.systems || {})) { const x = s[sd === 'white' ? 'whiteSystem' : 'blackSystem']; if (x && x.eco === eco) return x; } return null; };
for (const p of gmPools.value) {
  const verified = (p.pool || []).filter(e => e.status === 'verified').length;
  const line = lineOf(src.indexOf(`key: ${JSON.stringify(p.key)}`));
  for (const eco of p.codes || []) {
    const sd = p.side;
    (poolKeys[`${eco}|${sd}`] ||= []).push(p.key);
    const slot = slotFor(eco, sd);
    const v = vault.value[eco];
    const declared = side.value[eco] || 'white';
    const surveyCanPick = pickable[sd].has(eco);
    const where = `${p.key} -> ${eco}|${sd}`;
    const extra = { line, pool: p.key, verified };
    let status = 'ok';
    if (!slot && !v) { add('gm pool', eco, 'card exists', 'warn', `${where}: no vault entry or ${sd} slot has this code, so no card can show it`, extra); poolRows.push({ pool: p.key, eco, side: sd, card: 'none', status: 'no card' }); continue; }
    if (!surveyCanPick && !slot) { add('gm pool', eco, 'reachable', 'warn', `${where}: the survey never picks ${eco} for a ${sd} card (ECO_SIDE ${declared}${profile[eco] ? '' : ', no ECO_PROFILE entry'}), so this key is never used`, extra); status = 'unreachable'; }
    else if (!surveyCanPick) add('gm pool', eco, 'reachable', 'info', `${where}: the survey never picks ${eco} for ${sd}; only the hand-written ${sd} slot on the safety-net path shows it`, extra);
    const sans = slot ? (slot.variations?.[0]?.moves || []).map(m => m.move) : sanList(v.moves);
    const shown = slot ? sans : sans.slice(0, 10);
    const cardName = slot ? slot.name : (names.value[eco] || eco);
    const r = play(sans, eco), rs = play(shown, eco);
    if (r.error) { add('gm pool', eco, 'card line', 'error', `${where}: ${r.error}`, extra); status = 'line'; }
    else if (!r.reachedAt) { add('gm pool', eco, 'card line', 'warn', `${where}: the ${slot ? 'slot' : 'vault'} line never reaches ${eco}; ends in ${endsIn(r)}`, extra); status = 'line'; }
    else if (!r.last.some(c => c.eco === eco)) { add('gm pool', eco, 'card line', 'warn', `${where}: the line passes through ${eco}, then ends in ${endsIn(r)}`, extra); status = 'line'; }
    else if (!rs.reachedAt) add('gm pool', eco, 'board demo', 'info', `${where}: the board shows ${shown.length} plies; ${eco} is reached at ply ${r.reachedAt}`, extra);
    const nm = nameCheck(cardName, eco);
    if (nm.verdict === 'differs') { add('gm pool', eco, 'card name', 'warn', `${where}: card says "${cardName}" vs reference ${refList(nm)}`, extra); if (status === 'ok') status = 'name'; }
    if (slot && v && declared !== 'either' && declared !== sd) add('gm pool', eco, 'side label', 'warn', `${where}: the ${sd} card is right, but ECO_SIDE[${eco}] = ${declared}, so the ECO list and Arena show the other colour`, extra);
    poolRows.push({ pool: p.key, eco, side: sd, card: slot ? 'slot' : 'vault', name: cardName, reaches: r.reachedAt ? `ply ${r.reachedAt}` : 'no', status });
  }
}
for (const [k, v] of Object.entries(poolKeys)) if (v.length > 1) add('gm pool', k.split('|')[0], 'one pool per code and side', 'warn', `${k} is in ${v.join(', ')}; only the first is ever used`);

// ---- Report ----
const rank = { error: 0, warn: 1, info: 2 };
findings.sort((a, b) => rank[a.level] - rank[b.level] || (b.surveyPick - a.surveyPick) || a.area.localeCompare(b.area) || a.eco.localeCompare(b.eco));
const count = f => findings.filter(f).length;
const byCheck = {};
for (const f of findings) { const k = `${f.area} | ${f.check} | ${f.level}`; byCheck[k] = (byCheck[k] || 0) + 1; }
const totals = `${findings.length} findings: ${count(f => f.level === 'error')} error, ${count(f => f.level === 'warn')} warn, ${count(f => f.level === 'info')} info; ${count(f => f.surveyPick && f.level !== 'info')} errors or warnings are on survey-picked codes`;

const head = [
  `Site: ${path.relative(process.cwd(), htmlPath) || htmlPath}; ecoNamesMap L${names.line}, ecoVaultData L${vault.line} (${Object.keys(vault.value).length} codes), ECO_SIDE L${side.line}, archetypes L${archetypes.line} (${slotRows.length} slots)`,
  `Reference: ${source.repo} at ${source.commit} (${source.license}); ${refRows} lines, ${ref.size} positions; sha256 of all five files verified`,
  `Survey-pickable codes (simulated): ${pickable.white.size} White, ${pickable.black.size} Black`,
  `Notable GM pools: L${gmPools.line}, ${gmPools.value.length} pools, ${poolRows.length} code|side keys, ${poolRows.filter(r => r.status === 'ok').length} with a clean card`,
  `Survey picks tagged from tools/survey-regression/expected.json: ${picked.white.size} White and ${picked.black.size} Black codes`,
  'Move counts are in plies (one ply is one side\'s move; 10 full moves = 20 plies). Classification is by position, so transpositions count.',
];
console.log(['ECO audit (report only)', ...head].join('\n'));
console.log(`\n${totals}`);
for (const [k, n] of Object.entries(byCheck).sort()) console.log(`  ${k}: ${n}`);
console.log('\nErrors and warnings (survey picks first):');
for (const f of findings.filter(f => f.level !== 'info')) console.log(`  [${f.level}] ${f.area} ${f.eco}${f.line ? ` L${f.line}` : ''}${f.surveyPick ? ' (survey pick)' : ''} ${f.check}: ${f.detail}`);
console.log('\nInfo:');
for (const f of findings.filter(f => f.level === 'info')) console.log(`  [info] ${f.area} ${f.eco}${f.line ? ` L${f.line}` : ''} ${f.check}: ${f.detail}`);
console.log('\nThis audit reports only; it does not fail on findings.');

if (opt('--json')) fs.writeFileSync(opt('--json'), JSON.stringify({ source, html: htmlPath, counts: byCheck, findings, vault: vaultRows, slots: slotRows, gmPools: poolRows }, null, 2) + '\n');
if (opt('--markdown')) {
  const cell = s => String(s).replace(/\|/g, '\\|');
  const md = ['## ECO audit (report only)', '', ...head.map(h => `- ${h}`), '', `**${totals}.**`, '',
    '| Area | Check | Level | Count |', '|---|---|---|---|',
    ...Object.entries(byCheck).sort().map(([k, n]) => `| ${k} | ${n} |`), '',
    '### Errors and warnings on survey-picked codes', '', '| Level | Area | ECO | Line | Check | Detail |', '|---|---|---|---|---|---|',
    ...findings.filter(f => f.surveyPick && f.level !== 'info').map(f => `| ${f.level} | ${f.area} | ${f.eco} | ${f.line || ''} | ${f.check} | ${cell(f.detail)} |`), '',
    'The full list is in the eco-audit artifact. This job reports only and never fails on findings.'];
  fs.writeFileSync(opt('--markdown'), md.join('\n') + '\n');
}
