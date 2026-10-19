// Read-only ECO audit for ChessPsyche index.html.
// Usage: node eco_audit.js <index.html> <lichess-ref-dir> [--json out.json]
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { Chess } = require('chess.js');

const [htmlPath, refDir] = process.argv.slice(2);
const jsonOut = process.argv.includes('--json') ? process.argv[process.argv.indexOf('--json') + 1] : null;
const src = fs.readFileSync(htmlPath, 'utf8');

// Extract `const NAME = {...};` by brace matching (string-aware).
function extractLiteral(name) {
  const start = src.indexOf(`const ${name} =`);
  if (start < 0) throw new Error(`not found: ${name}`);
  const open = src.indexOf('{', start);
  let depth = 0, i = open, q = null;
  for (; i < src.length; i++) {
    const c = src[i];
    if (q) { if (c === '\\') i++; else if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === '`') q = c;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) break;
  }
  return { value: vm.runInNewContext('(' + src.slice(open, i + 1) + ')'), line: src.slice(0, start).split('\n').length };
}
const lineOf = idx => src.slice(0, idx).split('\n').length;

const names = extractLiteral('ecoNamesMap');
const vault = extractLiteral('ecoVaultData');
const side = extractLiteral('ECO_SIDE');
const archetypes = extractLiteral('archetypes');

// Lichess reference: position (first 4 FEN fields) -> [{eco,name,plies}]
const epd = fen => fen.split(' ').slice(0, 4).join(' ');
const sanList = pgn => pgn.replace(/\d+\.(\.\.)?/g, ' ').trim().split(/\s+/).filter(Boolean);
const ref = new Map();
const refByEco = {};
for (const f of ['a', 'b', 'c', 'd', 'e']) {
  for (const row of fs.readFileSync(path.join(refDir, f + '.tsv'), 'utf8').split('\n').slice(1)) {
    if (!row.trim()) continue;
    const [eco, name, pgn] = row.split('\t');
    const g = new Chess();
    for (const m of sanList(pgn)) g.move(m);
    const k = epd(g.fen());
    if (!ref.has(k)) ref.set(k, []);
    ref.get(k).push({ eco, name, pgn });
    (refByEco[eco] ||= []).push({ name, pgn });
  }
}

// Play a SAN list; report illegal moves, from/to mismatches, and the deepest reference classification.
function analyse(moves) {
  const g = new Chess();
  let cls = null, clsPly = 0, error = null;
  const fromTo = [];
  for (let i = 0; i < moves.length; i++) {
    const m = moves[i];
    let r;
    try { r = g.move(m.san); } catch (e) { error = `ply ${i + 1} (${m.san}) is illegal`; break; }
    if (m.from && (r.from !== m.from || r.to !== m.to)) fromTo.push(`ply ${i + 1} ${m.san}: data says ${m.from}-${m.to}, actual ${r.from}-${r.to}`);
    const hit = ref.get(epd(g.fen()));
    if (hit) { cls = hit; clsPly = i + 1; }
  }
  return { error, fromTo, cls, clsPly, plies: moves.length, pgn: g.pgn() };
}
const ecoMatch = (cls, eco) => cls && cls.some(c => c.eco === eco);

const report = { recommendations: [], vault: [] };

// 1. Recommendation slots (archetypes × levels × white/black)
const slotEcos = {};
for (const [arch, a] of Object.entries(archetypes.value)) {
  for (const [lvl, s] of Object.entries(a.systems || {})) {
    for (const slot of ['whiteSystem', 'blackSystem']) {
      const sys = s[slot]; if (!sys) continue;
      const moves = (sys.variations?.[0]?.moves || []).map(m => ({ san: m.move, from: m.from, to: m.to }));
      const r = analyse(moves);
      const declaredSide = side.value[sys.eco];
      const slotSide = slot === 'whiteSystem' ? 'white' : 'black';
      const issues = [];
      if (r.error) issues.push(r.error);
      issues.push(...r.fromTo);
      if (!ecoMatch(r.cls, sys.eco)) issues.push(`line classifies as ${r.cls ? [...new Set(r.cls.map(c => c.eco))].join('/') + ' "' + r.cls[0].name + '"' : 'nothing'} (after ply ${r.clsPly}), not ${sys.eco}`);
      if (declaredSide && declaredSide !== 'either' && declaredSide !== slotSide) issues.push(`slot is ${slotSide} but ECO_SIDE[${sys.eco}] = ${declaredSide}`);
      if (r.plies < 20) issues.push(`only ${r.plies} plies (${Math.ceil(r.plies / 2)} moves); 10 full moves = 20 plies`);
      const idx = src.indexOf(`name: ${JSON.stringify(sys.name)}, eco: "${sys.eco}"`);
      const entry = { slot: `${arch}.${lvl}.${slot}`, line: idx >= 0 ? lineOf(idx) : null, eco: sys.eco, name: sys.name, vaultName: names.value[sys.eco], pgn: r.pgn, issues };
      (slotEcos[sys.eco] ||= []).push(entry.slot);
      report.recommendations.push(entry);
    }
  }
}
report.duplicateSlotEcos = Object.fromEntries(Object.entries(slotEcos).filter(([, v]) => v.length > 1));

// 2. ECO vault (500 entries)
for (const [eco, d] of Object.entries(vault.value)) {
  const moves = sanList(d.moves).map(san => ({ san }));
  const r = analyse(moves);
  const issues = [];
  if (r.error) issues.push(r.error);
  if (!ecoMatch(r.cls, eco)) issues.push(`line classifies as ${r.cls ? [...new Set(r.cls.map(c => c.eco))].join('/') + ' "' + r.cls[0].name + '"' : 'nothing'} (after ply ${r.clsPly})`);
  if ((d.commentary || []).length !== moves.length) issues.push(`commentary has ${(d.commentary || []).length} entries for ${moves.length} plies`);
  const idx = src.indexOf(`"${eco}": { moves:`, src.indexOf('const ecoVaultData'));
  report.vault.push({ eco, line: lineOf(idx), name: names.value[eco], moves: d.moves, plies: moves.length, refNames: (refByEco[eco] || []).slice(0, 2).map(x => x.name), issues });
}

// Summary
const recBad = report.recommendations.filter(r => r.issues.length);
const vaultBad = report.vault.filter(v => v.issues.some(i => !i.startsWith('commentary')));
console.log(`Sources: ecoNamesMap L${names.line}, ecoVaultData L${vault.line}, ECO_SIDE L${side.line}, archetypes L${archetypes.line}`);
console.log(`Reference: lichess-org/chess-openings, ${ref.size} positions\n`);
console.log(`== Recommendation slots: ${report.recommendations.length} total, ${recBad.length} with issues`);
for (const r of report.recommendations) {
  console.log(`\n[L${r.line}] ${r.slot}  ${r.eco} "${r.name}"`);
  console.log(`   ${r.pgn}`);
  for (const i of r.issues) console.log(`   - ${i}`);
}
console.log(`\n== Duplicate ECO codes across slots:`);
for (const [eco, v] of Object.entries(report.duplicateSlotEcos)) console.log(`   ${eco}: ${v.join(', ')}`);
const plyHist = {};
report.vault.forEach(v => plyHist[v.plies] = (plyHist[v.plies] || 0) + 1);
console.log(`\n== ECO vault: ${report.vault.length} entries; ${report.vault.filter(v => v.issues.some(i => i.startsWith('ply'))).length} with illegal moves; ${vaultBad.length} not reaching their own code`);
console.log(`   plies per line: ${JSON.stringify(plyHist)}`);
console.log(`   commentary/move count mismatches: ${report.vault.filter(v => v.issues.some(i => i.startsWith('commentary'))).length}`);
for (const code of ['E98', 'E99', 'B80', 'D35', 'D43', 'D05', 'E20']) {
  const v = report.vault.find(x => x.eco === code);
  console.log(`   ${code} [L${v.line}] "${v.name}" | ${v.moves} | ref: ${v.refNames.join('; ')} | ${v.issues.join('; ') || 'ok'}`);
}
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(report, null, 2));
