// Tests for pool_governance.js: the pool classification rules in AGENTS.md ("Notable GM pool governance").
// Each case builds small pools and a registry in memory; pool-governance.json and index.html are not touched,
// except the last case, which reads the real pool-governance.json and checks only its shape.
//
// Usage: node pool_governance.test.js   (npm run test:pool-governance; also run first by npm test)
const { checkPoolGovernance, loadRegistry, CLASSES } = require('./pool_governance');

const gms = n => Array.from({ length: n }, (_, i) => `GM ${i + 1}`);
const pool = (key, names, extra = {}) => Object.assign({ key, pool: names.map(gm => ({ gm, status: 'verified' })) }, extra);
const NAMES = gms(12).concat(['Solo']);
const CRITERIA = ['F1-family-scope', 'F2-several-variations', 'F3-family-level-evidence', 'F4-recommendation-role', 'F5-individual-review'];
const completeFamily = () => ({
  classification: 'family-level',
  criteria: Object.fromEntries(CRITERIA.map(c => [c, 'recorded evidence'])),
  approval: { by: 'Calvin', date: '2026-11-01', ref: 'https://github.com/consciousclimbers-lgtm/Chesspsyche.com/pull/1#issuecomment-1' }
});
const registry = (pools, pending = {}) => ({ approver: 'Calvin', maxGmsPerVariationPool: 5, maxVariationPoolsPerGm: 6, familyLevelCriteria: CRITERIA, pools, pendingOverCap: pending });
const has = (list, text) => list.some(x => x.includes(text));

const cases = [
  { name: 'unclassified pool within 5 GMs passes',
    pools: [pool('A|white', gms(5))], reg: registry({ 'A|white': { classification: 'unclassified' } }), issues: [] },
  { name: 'pool with no registry entry fails',
    pools: [pool('A|white', gms(2))], reg: registry({}), issues: ['no entry in pool-governance.json'] },
  { name: 'registry entry for a pool that does not exist fails',
    pools: [], reg: registry({ 'Gone|black': { classification: 'unclassified' } }), issues: ['which is not a pool'] },
  { name: 'unknown classification fails',
    pools: [pool('A|white', gms(2))], reg: registry({ 'A|white': { classification: 'macro' } }), issues: ['is not one of'] },
  { name: 'variation-level pool with 5 GMs passes',
    pools: [pool('A|white', gms(5))], reg: registry({ 'A|white': { classification: 'variation-level' } }), issues: [] },
  { name: 'variation-level pool with 6 GMs fails',
    pools: [pool('A|white', gms(6))], reg: registry({ 'A|white': { classification: 'variation-level' } }), issues: ['variation-level pool has 6 GMs; maximum is 5'] },
  { name: 'pending, unknown-name and repeated entries are not counted as GMs',
    pools: [{ key: 'A|white', pool: gms(5).map(gm => ({ gm, status: 'verified' })).concat([{ gm: 'GM 6', status: 'pending' }, { gm: 'No Record', status: 'verified' }, { gm: 'GM 1', status: 'verified' }]) }],
    reg: registry({ 'A|white': { classification: 'variation-level' } }), issues: [] },
  { name: 'complete family-level entry exempts a 7-GM pool',
    pools: [pool('A|white', gms(7))], reg: registry({ 'A|white': completeFamily() }), issues: [] },
  { name: 'family-level entry with no criteria or approval fails, so no exemption',
    pools: [pool('A|white', gms(7))], reg: registry({ 'A|white': { classification: 'family-level' } }), issues: ['family-level classification is incomplete'] },
  { name: 'family-level entry with one blank criterion fails',
    pools: [pool('A|white', gms(3))], reg: registry({ 'A|white': Object.assign(completeFamily(), { criteria: Object.assign(completeFamily().criteria, { 'F3-family-level-evidence': ' ' }) }) }),
    issues: ['criterion F3-family-level-evidence'] },
  { name: 'family-level approval by someone other than the owner fails',
    pools: [pool('A|white', gms(3))], reg: registry({ 'A|white': Object.assign(completeFamily(), { approval: { by: 'ChatGPT', date: '2026-11-01', ref: 'https://example.com/x' } }) }),
    issues: ['approval.by "Calvin"'] },
  { name: 'a "Family" pool name, FAMILY ONLY matchScope or familyLabels do not exempt an unclassified pool',
    pools: [pool('Italian Family Level Recommendation|white', gms(6), { matchScope: 'FAMILY ONLY', familyLabels: ['Italian'] })],
    reg: registry({ 'Italian Family Level Recommendation|white': { classification: 'unclassified' } }), issues: ['is not in pendingOverCap'] },
  { name: 'a FAMILY ONLY pool marked variation-level is still capped at 5',
    pools: [pool('B|black', gms(6), { matchScope: 'FAMILY ONLY' })], reg: registry({ 'B|black': { classification: 'variation-level' } }), issues: ['maximum is 5'] },
  { name: 'unclassified over-cap pool listed in pendingOverCap passes',
    pools: [pool('A|white', gms(8))], reg: registry({ 'A|white': { classification: 'unclassified' } }, { 'A|white': 8 }), issues: [] },
  { name: 'unclassified pending pool that grows fails',
    pools: [pool('A|white', gms(9))], reg: registry({ 'A|white': { classification: 'unclassified' } }, { 'A|white': 8 }), issues: ['grew to 9 GMs'] },
  { name: 'unclassified pending pool that shrinks passes with a warning',
    pools: [pool('A|white', gms(7))], reg: registry({ 'A|white': { classification: 'unclassified' } }, { 'A|white': 8 }), issues: [], warnings: ['lower its pendingOverCap entry'] },
  { name: 'a classified pool left in pendingOverCap fails',
    pools: [pool('A|white', gms(5))], reg: registry({ 'A|white': { classification: 'variation-level' } }, { 'A|white': 8 }), issues: ['must not be in pendingOverCap'] },
  { name: 'GM in 7 variation-level pools fails the 6-pool limit',
    pools: gms(7).map((_, i) => pool(`P${i}|white`, ['Solo'])), reg: registry(Object.fromEntries(gms(7).map((_, i) => [`P${i}|white`, { classification: 'variation-level' }]))),
    issues: ['Solo is in 7 variation-level pools; maximum is 6'] },
  { name: 'GM in 6 variation-level pools plus 2 family-level pools passes',
    pools: gms(8).map((_, i) => pool(`P${i}|white`, ['Solo'])),
    reg: registry(Object.fromEntries(gms(8).map((_, i) => [`P${i}|white`, i < 6 ? { classification: 'variation-level' } : completeFamily()]))), issues: [] },
  { name: 'unclassified memberships are reported, not failed, against the 6-pool limit',
    pools: gms(7).map((_, i) => pool(`P${i}|white`, ['Solo'])), reg: registry(Object.fromEntries(gms(7).map((_, i) => [`P${i}|white`, { classification: 'unclassified' }]))),
    issues: [], atRisk: ['Solo 7'] },
];

let failed = 0;
for (const c of cases) {
  const r = checkPoolGovernance(c.pools, NAMES, c.reg);
  const problems = [];
  if (!c.issues.length && r.issues.length) problems.push(`unexpected issues: ${r.issues.join(' | ')}`);
  for (const t of c.issues) if (!has(r.issues, t)) problems.push(`expected an issue containing "${t}", got: ${r.issues.join(' | ') || 'none'}`);
  for (const t of c.warnings || []) if (!has(r.warnings, t)) problems.push(`expected a warning containing "${t}", got: ${r.warnings.join(' | ') || 'none'}`);
  for (const t of c.atRisk || []) if (!r.report.atRisk.includes(t)) problems.push(`expected "${t}" in the 6-pool report, got: ${r.report.atRisk.join(', ') || 'none'}`);
  console.log(`${problems.length ? 'FAIL' : 'PASS'}: ${c.name}`);
  for (const p of problems) console.log('  ' + p);
  if (problems.length) failed++;
}

// The real registry: agreed limits and criteria, valid classifications
const real = loadRegistry();
const realProblems = [];
if (real.maxGmsPerVariationPool !== 5 || real.maxVariationPoolsPerGm !== 6) realProblems.push('limits must be 5 GMs and 6 pools');
if (JSON.stringify(real.familyLevelCriteria) !== JSON.stringify(CRITERIA)) realProblems.push(`familyLevelCriteria must be ${CRITERIA.join(', ')}`);
for (const [k, e] of Object.entries(real.pools || {})) if (!CLASSES.includes(e.classification)) realProblems.push(`${k}: classification "${e.classification}"`);
console.log(`${realProblems.length ? 'FAIL' : 'PASS'}: pool-governance.json has the agreed limits, criteria and valid classifications`);
for (const p of realProblems) console.log('  ' + p);
if (realProblems.length) failed++;

console.log(failed ? `\nFAIL (${failed} of ${cases.length + 1})` : `\nPASS (${cases.length + 1} cases)`);
process.exit(failed ? 1 : 0);
