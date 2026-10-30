// Tests for pool_governance.js: the pool classification rules in AGENTS.md ("Notable GM pool governance").
// Each case builds small pools, GM records and a registry in memory; pool-governance.json and index.html are not
// touched, except the last case, which reads the real pool-governance.json and checks only its shape.
//
// Usage: node pool_governance.test.js   (npm run test:pool-governance; also run first by npm test)
const { checkPoolGovernance, loadRegistry, CLASSES, CRITERIA } = require('./pool_governance');

// GM records: "GM 1" ... "GM 12" with ids "101" ... "112", plus "Solo" (200) and a suspected-duplicate pair
const RECORDS = Array.from({ length: 12 }, (_, i) => ({ id: String(101 + i), name: `GM ${i + 1}` }))
  .concat([{ id: '200', name: 'Solo' }, { id: '5008123', name: 'Humpy Koneru' }, { id: '1500840', name: 'Koneru Humpy' }]);
const gms = n => Array.from({ length: n }, (_, i) => `GM ${i + 1}`);
const idOf = name => RECORDS.find(r => r.name === name).id;
const CODES = ['C50', 'C51', 'C52'];
const pool = (key, names, extra = {}) => Object.assign({ key, codes: CODES, pool: names.map(gm => ({ gm, status: 'verified' })) }, extra);
const SRC = 'https://www.chessgames.com/perl/chessopening?eco=C50';
const evidence = names => ({
  'F1-family-scope': { family: 'Italian Game', reference: 'https://github.com/lichess-org/chess-openings', codes: CODES.slice() },
  'F2-several-variations': { variations: [
    { name: 'Giuoco Piano', codes: ['C50', 'C53'].filter(c => CODES.includes(c)), sources: [SRC] },
    { name: 'Evans Gambit', codes: ['C51', 'C52'], sources: ['https://www.chessgames.com/perl/chessopening?eco=C51'] }
  ] },
  'F3-family-level-evidence': { gms: names.map(gm => ({ gm, fideId: idOf(gm), basis: `${gm} plays the Italian Game as White in many events`, sources: [SRC] })) },
  'F4-recommendation-role': { statement: 'Recommends GMs for every Italian Game card on the White side', notAContainer: true },
  'F5-individual-review': { reviewer: 'Gemini', reviewRef: 'https://github.com/consciousclimbers-lgtm/Chesspsyche.com/pull/1#issuecomment-2' }
});
const family = names => ({ classification: 'family-level', criteria: evidence(names),
  approval: { by: 'Calvin', date: '2026-11-01', ref: 'https://github.com/consciousclimbers-lgtm/Chesspsyche.com/pull/1#issuecomment-1' } });
// family-level entry with one criterion changed by fn(criteria)
const familyWith = (names, fn) => { const e = family(names); fn(e.criteria, e); return e; };
const registry = (pools, frozen = {}, extra = {}) => Object.assign({ approver: 'Calvin', maxGmsPerVariationPool: 5, maxVariationPoolsPerGm: 6, familyLevelCriteria: CRITERIA, pools, frozenRosters: frozen }, extra);
const frozenOf = names => ({ count: names.length, gms: names.map(gm => ({ id: idOf(gm), gm })) });
const U = { classification: 'unclassified' }, V = { classification: 'variation-level' };
const has = (list, text) => list.some(x => x.includes(text));
const famCase = (name, fn, says) => ({ name, pools: [pool('A|white', gms(7))], reg: registry({ 'A|white': familyWith(gms(7), fn) }), issues: [says] });

const cases = [
  // Explicit classification
  { name: 'unclassified pool within 5 GMs passes', pools: [pool('A|white', gms(5))], reg: registry({ 'A|white': U }), issues: [] },
  { name: 'pool with no registry entry fails', pools: [pool('A|white', gms(2))], reg: registry({}), issues: ['no entry in pool-governance.json'] },
  { name: 'registry entry for a pool that does not exist fails', pools: [], reg: registry({ 'Gone|black': U }), issues: ['which is not a pool'] },
  { name: 'unknown classification fails', pools: [pool('A|white', gms(2))], reg: registry({ 'A|white': { classification: 'macro' } }), issues: ['is not one of'] },
  // Five-GM limit
  { name: 'variation-level pool with 5 GMs passes', pools: [pool('A|white', gms(5))], reg: registry({ 'A|white': V }), issues: [] },
  { name: 'variation-level pool with 6 GMs fails', pools: [pool('A|white', gms(6))], reg: registry({ 'A|white': V }), issues: ['variation-level pool has 6 GMs; maximum is 5'] },
  { name: 'pending, unknown-name and repeated entries are not counted',
    pools: [{ key: 'A|white', codes: CODES, pool: gms(5).map(gm => ({ gm, status: 'verified' })).concat([{ gm: 'GM 6', status: 'pending' }, { gm: 'No Record', status: 'verified' }, { gm: 'GM 1', status: 'verified' }]) }],
    reg: registry({ 'A|white': V }), issues: [] },
  // F1-F5 structured evidence
  { name: 'complete structured family-level entry exempts a 7-GM pool', pools: [pool('A|white', gms(7))], reg: registry({ 'A|white': family(gms(7)) }), issues: [] },
  { name: 'family-level entry with no criteria or approval fails, so no exemption',
    pools: [pool('A|white', gms(7))], reg: registry({ 'A|white': { classification: 'family-level' } }), issues: ['family-level evidence is incomplete', 'F1: needs', 'F2: needs', 'F3: needs', 'F4: needs', 'F5: needs'] },
  famCase('the old free-text form ("recorded evidence") is rejected', c => { for (const k of CRITERIA) c[k] = 'recorded evidence'; }, 'F3: needs { gms'),
  famCase('F1 placeholder family name fails', c => { c['F1-family-scope'].family = 'TBD'; }, 'F1: family name missing or a placeholder'),
  famCase('F1 reference that is not https fails', c => { c['F1-family-scope'].reference = 'lichess openings'; }, 'F1: reference must be an https source'),
  famCase('F1 codes that differ from the pool fail', c => { c['F1-family-scope'].codes = ['C50', 'C51']; }, 'F1: codes must list exactly'),
  famCase('F3 "recorded evidence" basis is rejected', c => { c['F3-family-level-evidence'].gms[0].basis = 'recorded evidence'; }, 'GM 1 basis missing, too short or a placeholder'),
  famCase('F3 missing evidence row for a shown GM fails', c => { c['F3-family-level-evidence'].gms.pop(); }, 'F3: no evidence row for GM 7 (107)'),
  famCase('F3 row whose name does not match the FIDE id fails', c => { c['F3-family-level-evidence'].gms[0].gm = 'GM 9'; }, 'F3: row for 101 names "GM 9"'),
  famCase('F3 example.com source is rejected', c => { c['F3-family-level-evidence'].gms[0].sources = ['https://example.com/x']; }, 'GM 1 needs at least one https source'),
  famCase('F4 without notAContainer fails', c => { c['F4-recommendation-role'].notAContainer = false; }, 'F4: needs'),
  famCase('F4 placeholder statement fails', c => { c['F4-recommendation-role'].statement = 'see above'; }, 'F4: needs'),
  famCase('F5 review by the approver is not independent', c => { c['F5-individual-review'].reviewer = 'Calvin'; }, 'F5: the review must be independent'),
  famCase('approval by someone other than the owner fails', (c, e) => { e.approval.by = 'ChatGPT'; }, 'approval.by must be "Calvin"'),
  famCase('approval without an https reference fails', (c, e) => { e.approval.ref = 'chat message'; }, 'approval.ref'),
  // F2 variation rules
  famCase('F2 with one variation fails', c => { c['F2-several-variations'].variations.pop(); }, 'needs at least 2 distinct named variations (has 1)'),
  famCase('F2 duplicate variation names (case and spacing ignored) fail', c => { c['F2-several-variations'].variations[1].name = '  giuoco   PIANO '; }, 'is listed twice'),
  famCase('F2 duplicate names also leave too few distinct variations', c => { c['F2-several-variations'].variations[1].name = 'Giuoco Piano'; }, 'has 1)'),
  famCase('F2 variation with no ECO codes fails', c => { c['F2-several-variations'].variations[0].codes = []; }, 'variation "Giuoco Piano" has no ECO codes'),
  famCase('F2 variation with codes outside the pool fails', c => { c['F2-several-variations'].variations[0].codes = ['C50', 'C99']; }, 'lists codes outside the pool'),
  famCase('F2 variation with no sources fails', c => { c['F2-several-variations'].variations[1].sources = []; }, 'variation "Evans Gambit" needs at least one https source'),
  famCase('F2 variation with a non-https source fails', c => { c['F2-several-variations'].variations[1].sources = ['http://chessgames.com/x']; }, 'needs at least one https source'),
  famCase('F2 placeholder variation name fails', c => { c['F2-several-variations'].variations[1].name = 'n/a'; }, 'name missing or a placeholder'),
  // Naming never exempts
  { name: 'a "Family" key, FAMILY ONLY matchScope or familyLabels do not exempt an unclassified pool',
    pools: [pool('Italian Family Level Recommendation|white', gms(6), { matchScope: 'FAMILY ONLY', familyLabels: ['Italian'] })],
    reg: registry({ 'Italian Family Level Recommendation|white': U }), issues: ['and no frozen roster'] },
  { name: 'a FAMILY ONLY pool marked variation-level is still capped at 5',
    pools: [pool('B|black', gms(6), { matchScope: 'FAMILY ONLY' })], reg: registry({ 'B|black': V }), issues: ['maximum is 5'] },
  // Frozen over-cap rosters, both directions
  { name: 'frozen roster that matches exactly passes', pools: [pool('A|white', gms(8))], reg: registry({ 'A|white': U }, { 'A|white': frozenOf(gms(8)) }), issues: [] },
  { name: 'frozen roster with an added GM fails', pools: [pool('A|white', gms(9))], reg: registry({ 'A|white': U }, { 'A|white': frozenOf(gms(8)) }), issues: ['gained GM 9 (109) (unauthorized addition)'] },
  { name: 'frozen roster with a removed GM fails', pools: [pool('A|white', gms(7))], reg: registry({ 'A|white': U }, { 'A|white': frozenOf(gms(8)) }), issues: ['lost GM 8 (108) (unauthorized removal)'] },
  { name: 'frozen roster with a swapped GM fails both ways', pools: [pool('A|white', gms(7).concat(['GM 10']))], reg: registry({ 'A|white': U }, { 'A|white': frozenOf(gms(8)) }),
    issues: ['gained GM 10', 'lost GM 8'] },
  { name: 'frozen roster whose count disagrees with its list fails', pools: [pool('A|white', gms(8))], reg: registry({ 'A|white': U }, { 'A|white': Object.assign(frozenOf(gms(8)), { count: 9 }) }), issues: ['does not match its 8 listed GMs'] },
  { name: 'a classified pool left in frozenRosters fails', pools: [pool('A|white', gms(5))], reg: registry({ 'A|white': V }, { 'A|white': frozenOf(gms(5)) }), issues: ['must not be in frozenRosters'] },
  { name: 'frozen roster entry for a missing pool fails', pools: [], reg: registry({}, { 'Gone|white': frozenOf(gms(6)) }), issues: ['frozenRosters lists "Gone|white"'] },
  // Six-pool limit
  { name: 'GM in 7 variation-level pools fails the 6-pool limit',
    pools: gms(7).map((_, i) => pool(`P${i}|white`, ['Solo'])), reg: registry(Object.fromEntries(gms(7).map((_, i) => [`P${i}|white`, V]))),
    issues: ['Solo (200) is in 7 variation-level pools; maximum is 6'] },
  { name: 'GM in 6 variation-level pools plus 2 family-level pools passes and is CERTIFIED',
    pools: gms(8).map((_, i) => pool(`P${i}|white`, ['Solo'])),
    reg: registry(Object.fromEntries(gms(8).map((_, i) => [`P${i}|white`, i < 6 ? V : family(['Solo'])]))), issues: [], six: 'CERTIFIED' },
  { name: 'unclassified memberships give NOT CERTIFIED, not a violation or an exemption',
    pools: gms(7).map((_, i) => pool(`P${i}|white`, ['Solo'])), reg: registry(Object.fromEntries(gms(7).map((_, i) => [`P${i}|white`, U]))),
    issues: [], six: 'NOT CERTIFIED — classification incomplete', couldExceed: ['Solo 0+7'] },
  { name: 'one unclassified pool anywhere keeps the status NOT CERTIFIED',
    pools: [pool('P0|white', ['Solo']), pool('P1|white', ['GM 1'])], reg: registry({ 'P0|white': V, 'P1|white': U }), issues: [], six: 'NOT CERTIFIED — classification incomplete' },
  // Certification requires every membership to be validly classified (owner correction, 2026-10-30)
  { name: 'a missing registry entry forces NOT CERTIFIED and names the pool for the GM',
    pools: [pool('P0|white', ['Solo']), pool('P1|white', ['Solo'])], reg: registry({ 'P0|white': V }),
    issues: ['P1|white: no entry'], six: 'NOT CERTIFIED — classification incomplete', reason: 'Solo: P1|white (no registry entry)', notCertified: ['200'] },
  { name: 'an invalid classification forces NOT CERTIFIED and names the pool for the GM',
    pools: [pool('P0|white', ['Solo']), pool('P1|white', ['Solo'])], reg: registry({ 'P0|white': V, 'P1|white': { classification: 'macro' } }),
    issues: ['is not one of'], six: 'NOT CERTIFIED — classification incomplete', reason: 'P1|white (invalid classification "macro")', notCertified: ['200'] },
  { name: 'a missing classification field forces NOT CERTIFIED',
    pools: [pool('P0|white', ['Solo'])], reg: registry({ 'P0|white': {} }),
    issues: ['is not one of'], six: 'NOT CERTIFIED — classification incomplete', reason: 'P0|white (invalid classification "undefined")', notCertified: ['200'] },
  { name: 'incomplete family-level evidence forces NOT CERTIFIED, not a classified membership',
    pools: [pool('P0|white', ['Solo']), pool('P1|white', ['Solo'])],
    reg: registry({ 'P0|white': V, 'P1|white': familyWith(['Solo'], c => { c['F3-family-level-evidence'].gms[0].basis = 'recorded evidence'; }) }),
    issues: ['family-level evidence is incomplete'], six: 'NOT CERTIFIED — classification incomplete', reason: 'P1|white (family-level evidence or approval incomplete)', notCertified: ['200'] },
  { name: 'a family-level approval by someone other than the owner forces NOT CERTIFIED',
    pools: [pool('P0|white', ['Solo'])], reg: registry({ 'P0|white': familyWith(['Solo'], (c, e) => { e.approval.by = 'Gemini'; }) }),
    issues: ['approval.by'], six: 'NOT CERTIFIED — classification incomplete', reason: 'P0|white (family-level evidence or approval incomplete)', notCertified: ['200'] },
  { name: 'an unconfirmed identity (id of another GM) forces NOT CERTIFIED for the shown GM',
    pools: [{ key: 'P0|white', codes: CODES, pool: [{ gm: 'Solo', id: '101', status: 'verified' }] }], reg: registry({ 'P0|white': V }),
    issues: ['Solo has id 101'], six: 'NOT CERTIFIED — classification incomplete', reason: 'P0|white (identity not confirmed)', notCertified: ['200'] },
  { name: 'invalid registry settings force NOT CERTIFIED even with complete family evidence',
    pools: [pool('P0|white', ['Solo'])], reg: Object.assign(registry({ 'P0|white': family(['Solo']) }), { familyLevelCriteria: ['F1-family-scope'] }),
    issues: ['familyLevelCriteria must be'], six: 'NOT CERTIFIED — classification incomplete', notCertified: ['200'] },
  { name: 'all memberships validly classified gives CERTIFIED with no GM left uncertified',
    pools: [pool('P0|white', ['Solo']), pool('P1|white', ['Solo'])], reg: registry({ 'P0|white': V, 'P1|white': family(['Solo']) }),
    issues: [], six: 'CERTIFIED', certified: ['200'] },
  // Identity
  { name: 'an entry with a FIDE id and an entry by name for the same record count as one GM',
    pools: [{ key: 'A|white', codes: CODES, pool: [{ gm: 'GM 1', id: '101', status: 'verified' }, { gm: 'GM 1', status: 'verified' }].concat(gms(5).slice(1).map(gm => ({ gm, status: 'verified' }))) }],
    reg: registry({ 'A|white': V }), issues: [] },
  { name: 'an id that does not belong to the named GM fails and is not counted',
    pools: [{ key: 'A|white', codes: CODES, pool: [{ gm: 'GM 1', id: '102', status: 'verified' }] }], reg: registry({ 'A|white': V }), issues: ['GM 1 has id 102, which is not the FIDE id of a GM record with that name'] },
  { name: 'the two Humpy records count as two GMs (kept separate)',
    pools: [pool('A|white', gms(4).concat(['Humpy Koneru', 'Koneru Humpy']))], reg: registry({ 'A|white': V }), issues: ['variation-level pool has 6 GMs'] },
  { name: 'a flagged suspected duplicate is reported and both records must remain',
    pools: [], reg: registry({}, {}, { suspectedDuplicates: [{ ids: ['5008123', '1500840'], status: 'unverified' }] }), issues: [], warnings: ['5008123 and 1500840 are counted separately; not merged'] },
  { name: 'a flagged record that disappears fails',
    pools: [], reg: registry({}, {}, { suspectedDuplicates: [{ ids: ['5008123', '9999999'], status: 'unverified' }] }), issues: ['GM record 9999999 is missing'] },
];

let failed = 0;
for (const c of cases) {
  const r = checkPoolGovernance(c.pools, RECORDS, c.reg);
  const problems = [];
  if (!c.issues.length && r.issues.length) problems.push(`unexpected issues: ${r.issues.join(' | ')}`);
  for (const t of c.issues) if (!has(r.issues, t)) problems.push(`expected an issue containing "${t}", got: ${r.issues.join(' | ') || 'none'}`);
  for (const t of c.warnings || []) if (!has(r.warnings, t)) problems.push(`expected a warning containing "${t}", got: ${r.warnings.join(' | ') || 'none'}`);
  if (c.six && r.report.sixPool.status !== c.six) problems.push(`expected six-pool status "${c.six}", got "${r.report.sixPool.status}"`);
  if (c.reason && !Object.values(r.report.sixPool.reasons || {}).some(x => x.includes(c.reason))) problems.push(`expected a not-certified reason containing "${c.reason}", got: ${Object.values(r.report.sixPool.reasons || {}).join(' | ') || 'none'}`);
  for (const id of c.notCertified || []) if (!r.report.sixPool.notCertified.includes(id) || r.report.sixPool.certified.includes(id)) problems.push(`expected GM ${id} NOT CERTIFIED`);
  for (const id of c.certified || []) if (!r.report.sixPool.certified.includes(id) || r.report.sixPool.notCertified.includes(id)) problems.push(`expected GM ${id} CERTIFIED`);
  for (const t of c.couldExceed || []) if (!r.report.sixPool.couldExceed.includes(t)) problems.push(`expected "${t}" in could-exceed, got: ${r.report.sixPool.couldExceed.join(', ') || 'none'}`);
  console.log(`${problems.length ? 'FAIL' : 'PASS'}: ${c.name}`);
  for (const p of problems) console.log('  ' + p);
  if (problems.length) failed++;
}

// The real registry: agreed limits and criteria, valid classifications, the Humpy pair flagged, rosters well formed
const real = loadRegistry();
const realProblems = [];
if (real.maxGmsPerVariationPool !== 5 || real.maxVariationPoolsPerGm !== 6) realProblems.push('limits must be 5 GMs and 6 pools');
if (JSON.stringify(real.familyLevelCriteria) !== JSON.stringify(CRITERIA)) realProblems.push(`familyLevelCriteria must be ${CRITERIA.join(', ')}`);
for (const [k, e] of Object.entries(real.pools || {})) if (!CLASSES.includes(e.classification)) realProblems.push(`${k}: classification "${e.classification}"`);
if (!(real.suspectedDuplicates || []).some(d => JSON.stringify((d.ids || []).slice().sort()) === JSON.stringify(['1500840', '5008123']))) realProblems.push('the Humpy Koneru pair 5008123 / 1500840 must stay flagged');
for (const [k, f] of Object.entries(real.frozenRosters || {})) if (!Array.isArray(f.gms) || f.gms.some(g => !g.id || !g.gm)) realProblems.push(`${k}: frozen roster entries need id and gm`);
console.log(`${realProblems.length ? 'FAIL' : 'PASS'}: pool-governance.json has the agreed limits, criteria, classifications, flags and rosters`);
for (const p of realProblems) console.log('  ' + p);
if (realProblems.length) failed++;

console.log(failed ? `\nFAIL (${failed} of ${cases.length + 1})` : `\nPASS (${cases.length + 1} cases)`);
process.exit(failed ? 1 : 0);
