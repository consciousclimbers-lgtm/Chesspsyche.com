// Notable GM pools against the GM records (the data behind the GM pop-up). Read-only report, no browser.
//
// Usage: node gm_sync_report.js ../../index.html
//
// For every pool entry it prints the matching GM record and that record's system for the pool's side.
// Pools with recordLabels (Batch 2) are synchronized with the records, and each entry is classed:
//   DIRECT       the record's system lists one of the pool's recordLabels (may be "verified")
//   FAMILY ONLY  it lists only a broader familyLabels entry (needs a targeted check before "verified")
//   NOT ON CARD  it lists neither (a gap: needs its own evidence)
//   NO SYSTEM    the record has no system for this side
// Pools without recordLabels (Batch 1) are matched by name only and reported, not classed.
// npm test fails if a synchronized entry's id and name disagree, or a "verified" one is not DIRECT.
const fs = require('fs');

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

function classify(p, g) {
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
    const cls = synced && g && g.name === e.gm ? classify(p, g) : synced ? 'IDENTITY' : '';
    if (synced) counts[`${e.status} ${cls}`] = (counts[`${e.status} ${cls}`] || 0) + 1;
    const sys = g && g.system ? g.system[p.side] : undefined;
    console.log(`  ${e.status.padEnd(8)} ${(cls || '-').padEnd(11)} ${e.gm.padEnd(28)} ${ident.padEnd(12)} ${p.side} system: ${sys == null ? '-' : sys}`);
  }
}
console.log('\nSynchronized entries by status and class:', JSON.stringify(counts));
