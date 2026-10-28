// Notable GM pools against the GM records (the data behind the GM pop-up). Read-only report, no browser.
//
// Usage: node gm_sync_report.js ../../index.html
//
// For every pool entry it prints the matching GM record and that record's system for the pool's side.
// Pools with recordLabels are synchronized with GM records. Evidence classes:
//   DIRECT       the profile's side-specific system lists a recordLabel
//   FAMILY ONLY  it lists a broader familyLabels value (needs a targeted check)
//   FAMILY GAMES an explicit side-specific game-database record is in family-repertoire-evidence.json
//   NOT ON CARD  neither the profile nor the game-evidence registry supports it
//   NO SYSTEM    no profile system for that side and no explicit family-game evidence
// Pools without recordLabels are matched by name only and reported, not classed.
// The survey regression test enforces identity plus DIRECT or explicit FAMILY GAMES evidence for verified entries.
const fs = require('fs');
const path = require('path');
const familyEvidence = JSON.parse(fs.readFileSync(path.join(__dirname, 'family-repertoire-evidence.json'), 'utf8')).entries;

function grab(lines, start) {
  const s = lines.findIndex(l => l.startsWith(start));
  if (s < 0) throw new Error(`could not find "${start}"`);
  let e = s;
  while (!/^\];/.test(lines[e])) e++;
  return lines.slice(s, e + 1).join('\n');
}

const lines = fs.readFileSync(process.argv[2] || '../../index.html', 'utf8').split('\n');
const { raw, pools } = Function(grab(lines, 'const rawGrandmastersList = [') + '\n' + grab(lines, 'const NOTABLE_GM_POOLS = [') +
  '\nreturn { raw: rawGrandmastersList, pools: NOTABLE_GM_POOLS };')();
// Same as the page: the last record per name wins, and inside a record the last "system" key wins
const byName = new Map(raw.map(g => [g.name, g]));
const byId = new Map(raw.map(g => [g.id, g]));

function classify(p, g, e) {
  const hasFamilyGames = familyEvidence.some(f =>
    f.poolKey === p.key && f.side === p.side && p.recordLabels.includes(f.family) &&
    f.gm === e.gm && f.fideId === e.id && Array.isArray(f.sources) && f.sources.some(url => /^https:\/\//.test(url))
  );
  if (hasFamilyGames) return 'FAMILY GAMES';
  const sys = g && g.system ? g.system[p.side] : undefined;
  if (sys == null) return 'NO SYSTEM';
  const labels = sys.split(' / ');
  if (labels.some(l => p.recordLabels.includes(l))) return 'DIRECT';
  if (labels.some(l => (p.familyLabels || []).includes(l))) return 'FAMILY ONLY';
  return 'NOT ON CARD';
}

const counts = {};
for (const p of pools) {
  const synced = Array.isArray(p.recordLabels);
  console.log(`\n${p.key}${synced ? ` (synchronized; recordLabels: ${p.recordLabels.join(', ')}; familyLabels: ${(p.familyLabels || []).join(', ') || '-'})` : ' (not synchronized)'}`);
  for (const e of p.pool) {
    const g = synced ? byId.get(e.id) : byName.get(e.gm);
    const ident = !g ? 'NO RECORD' : g.name !== e.gm ? `ID GIVES "${g.name}"` : `id ${g.id}`;
    const cls = synced && g && g.name === e.gm ? classify(p, g, e) : synced ? 'IDENTITY' : '';
    if (synced) counts[`${e.status} ${cls}`] = (counts[`${e.status} ${cls}`] || 0) + 1;
    const sys = g && g.system ? g.system[p.side] : undefined;
    console.log(`  ${e.status.padEnd(8)} ${(cls || '-').padEnd(11)} ${e.gm.padEnd(28)} ${ident.padEnd(12)} ${p.side} system: ${sys == null ? '-' : sys}`);
  }
}
console.log('\nSynchronized entries by status and class:', JSON.stringify(counts));
