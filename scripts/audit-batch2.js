#!/usr/bin/env node
/**
 * scripts/audit-batch2.js
 * READ-ONLY audit of Batch 2 card assignment. Reads index.html, never writes to it.
 *
 * Usage: node scripts/audit-batch2.js [path/to/index.html] [--out report.json]
 *
 * What it checks
 *  - Every ECO code in ecoVaultData that has a single playing side (white or black) is a "card".
 *  - A card is "assigned" when NOTABLE_GM_POOLS has a pool with the same side that lists its code.
 *  - Side-lock: every code listed in a pool must have the pool's side (card.side === pool.side).
 *    Codes whose side is "either" are not part of the side-lock check; they are listed as review notes.
 *
 * Exit codes: 0 clean; 1 one or more records quarantined (side mismatch, duplicate, unknown code);
 * 2 pre-flight schema check failed (nothing is reported as assigned).
 * A different count than the expected baseline is reported in the JSON (baseline.matches) but does not
 * fail the run, so a data change shows up as a visible difference rather than a broken job.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const EXPECTED = { cards: 487, unassigned: 216, unassignedWhite: 143, unassignedBlack: 73, pools: 28 };

const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const outPath = outIdx >= 0 ? args[outIdx + 1] : null;
const qIdx = args.indexOf('--quarantine');
const quarantinePath = qIdx >= 0 ? args[qIdx + 1] : null;
const inPath = args.find((a, i) => !a.startsWith('--') && i !== outIdx + 1 && i !== qIdx + 1)
  || path.join(__dirname, '..', 'index.html');

function fail(msg) { console.error('ERROR: ' + msg); process.exit(1); }
if (!fs.existsSync(inPath)) fail('Cannot find ' + inPath);
const src = fs.readFileSync(inPath, 'utf8');

// Find `const NAME = <literal>` and return the literal text, matching brackets while skipping strings/comments.
function grabLiteral(name) {
  const m = new RegExp('(?:const|let|var)\\s+' + name + '\\s*=\\s*').exec(src);
  if (!m) fail('Could not find ' + name + ' in index.html');
  let i = m.index + m[0].length;
  const open = src[i], close = open === '{' ? '}' : open === '[' ? ']' : null;
  if (!close) fail(name + ' is not an object or array literal');
  const start = i; let depth = 0, quote = null;
  for (; i < src.length; i++) {
    const c = src[i];
    if (quote) { if (c === '\\') { i++; continue; } if (c === quote) quote = null; continue; }
    if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
    if (c === '/' && src[i + 1] === '/') { i = src.indexOf('\n', i); if (i < 0) break; continue; }
    if (c === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i); if (i < 0) break; i++; continue; }
    if (c === open) depth++;
    else if (c === close && --depth === 0) return src.slice(start, i + 1);
  }
  fail('Unbalanced brackets while reading ' + name);
}
// Evaluate in an empty sandbox: the literal cannot reach the page, files or network.
function readLiteral(name) {
  try { return vm.runInNewContext('(' + grabLiteral(name) + ')', Object.create(null), { timeout: 2000 }); }
  catch (e) { fail('Could not read ' + name + ': ' + e.message); }
}

const vault = readLiteral('ecoVaultData');
const sideTable = readLiteral('ECO_SIDE');
const pools = readLiteral('NOTABLE_GM_POOLS');
if (!Array.isArray(pools)) fail('NOTABLE_GM_POOLS is not an array');


// ---- Pre-flight schema guard (rule 4): abort before producing any assignment report if the data shape is off.
const schemaErrors = [];
const isStr = v => typeof v === 'string' && v.length > 0;
if (!vault || typeof vault !== 'object' || Array.isArray(vault)) schemaErrors.push('ecoVaultData is not an object');
else Object.entries(vault).forEach(([c, v]) => {
  if (!/^[A-E]\d{2}$/.test(c)) schemaErrors.push('ecoVaultData: bad ECO code ' + c);
  if (!v || !isStr(v.moves)) schemaErrors.push('ecoVaultData ' + c + ': moves missing or not a string');
  if (!v || !Array.isArray(v.commentary) || !v.commentary.every(isStr)) schemaErrors.push('ecoVaultData ' + c + ': commentary is not an array of strings');
});
if (!sideTable || typeof sideTable !== 'object') schemaErrors.push('ECO_SIDE is not an object');
else Object.entries(sideTable).forEach(([c, s]) => {
  if (!['white', 'black', 'either'].includes(s)) schemaErrors.push('ECO_SIDE ' + c + ': unexpected side value ' + JSON.stringify(s));
  if (vault && !vault[c]) schemaErrors.push('ECO_SIDE ' + c + ': code not in ecoVaultData');
});
pools.forEach((p, i) => {
  const w = 'NOTABLE_GM_POOLS[' + i + ']';
  if (!p || !isStr(p.key)) schemaErrors.push(w + ': key missing');
  if (!p || !['white', 'black'].includes(p.side)) schemaErrors.push(w + ': side must be white or black');
  if (!p || !Array.isArray(p.codes) || !p.codes.length || !p.codes.every(isStr)) schemaErrors.push(w + ': codes must be a non-empty array of strings');
  if (!p || !Array.isArray(p.pool) || !p.pool.every(e => e && isStr(e.gm) && isStr(e.status))) schemaErrors.push(w + ': pool entries need gm and status');
});
if (schemaErrors.length) {
  console.error('PRE-FLIGHT SCHEMA CHECK FAILED (' + schemaErrors.length + ' problem(s)); nothing assigned, no report written.');
  schemaErrors.slice(0, 20).forEach(e => console.error('  - ' + e));
  process.exit(2);
}

const sideOf = code => sideTable[code] || 'white'; // same default the site uses
const codes = Object.keys(vault);
const cards = codes.filter(c => sideOf(c) === 'white' || sideOf(c) === 'black');
const eitherSide = codes.filter(c => !cards.includes(c));

const poolFor = (code, side) => pools.find(p => p.side === side && p.codes.includes(code)) || null;
const unassigned = cards.filter(c => !poolFor(c, sideOf(c)));
const unassignedWhite = unassigned.filter(c => sideOf(c) === 'white');
const unassignedBlack = unassigned.filter(c => sideOf(c) === 'black');

const sideLockViolations = [], reviewNotes = [], unknownCodes = [], duplicates = [];
const seen = {};
pools.forEach(p => p.codes.forEach(code => {
  if (!vault[code]) { unknownCodes.push({ pool: p.key, code }); return; }
  const side = sideOf(code);
  if (side === 'either') reviewNotes.push({ pool: p.key, code, poolSide: p.side, cardSide: side, note: 'Either-side opening listed in a one-sided pool; review only, no data changed.' });
  else if (side !== p.side) sideLockViolations.push({ pool: p.key, code, poolSide: p.side, cardSide: side });
  const k = code + '|' + p.side;
  if (seen[k] && seen[k] !== p.key) duplicates.push({ code, side: p.side, pools: [seen[k], p.key] });
  seen[k] = p.key;
}));
const activePools = pools.filter(p => (p.pool || []).some(e => e.status === 'verified'));

const counts = {
  cards: cards.length, eitherSide: eitherSide.length, pools: pools.length, activePools: activePools.length,
  unassigned: unassigned.length, unassignedWhite: unassignedWhite.length, unassignedBlack: unassignedBlack.length
};
const matches = counts.cards === EXPECTED.cards && counts.unassigned === EXPECTED.unassigned &&
  counts.unassignedWhite === EXPECTED.unassignedWhite && counts.unassignedBlack === EXPECTED.unassignedBlack &&
  counts.pools === EXPECTED.pools && counts.activePools === EXPECTED.pools;

const report = {
  readOnly: true,
  source: path.basename(inPath),
  counts,
  baseline: { expected: EXPECTED, matches },
  activePoolDefinition: 'Pool with at least one entry whose status is "verified". Not cross-checked against grandmastersList.',
  sideLockViolations, duplicateAssignments: duplicates, poolCodesNotInVault: unknownCodes, reviewNotes,
  eitherSideCodes: eitherSide,
  unassignedCodes: { white: unassignedWhite, black: unassignedBlack }
};
// ---- Quarantine log (rule 1): records that fail a gate are listed here and are never treated as assigned.
const quarantined = [
  ...sideLockViolations.map(v => Object.assign({ reason: 'SIDE_MISMATCH (card.side !== pool.side)' }, v)),
  ...duplicates.map(d => Object.assign({ reason: 'DUPLICATE_ASSIGNMENT' }, d)),
  ...unknownCodes.map(u => Object.assign({ reason: 'CODE_NOT_IN_VAULT' }, u))
];
if (quarantinePath) fs.writeFileSync(quarantinePath, JSON.stringify({ readOnly: true, count: quarantined.length, quarantined }, null, 2) + '\n');
report.quarantinedCount = quarantined.length;
if (outPath) fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');

console.log('Batch 2 audit (read-only)');
console.log('  cards: ' + counts.cards + '   either-side (excluded): ' + counts.eitherSide);
console.log('  pools: ' + counts.pools + '   active pools: ' + counts.activePools);
console.log('  unassigned: ' + counts.unassigned + ' (white ' + counts.unassignedWhite + ' / black ' + counts.unassignedBlack + ')');
console.log('  quarantined: ' + quarantined.length + '   side-lock violations: ' + sideLockViolations.length + '   duplicate assignments: ' + duplicates.length +
  '   review notes: ' + reviewNotes.length + (reviewNotes.length ? ' (' + reviewNotes.map(n => n.code).join(', ') + ')' : ''));
console.log('  matches expected baseline: ' + (matches ? 'YES' : 'NO'));
if (outPath) console.log('  report written to: ' + outPath);
if (quarantinePath) console.log('  quarantine log written to: ' + quarantinePath);
process.exit(quarantined.length ? 1 : 0);
