// Notable GM pool governance (AGENTS.md, "Notable GM pool governance"). Used by survey_regression.js and
// tested by pool_governance.test.js.
//
// Every pool in NOTABLE_GM_POOLS must have an entry in pool-governance.json with one classification:
//   variation-level  a Variation-Level Analytical Pool: at most 5 distinct GMs, counts toward the 6-pool limit
//   family-level     a Family-Level Recommendation Pool: exempt from the 5-GM limit only when its entry holds
//                    structured evidence for every criterion F1-F5 and the owner's approval; otherwise the test fails
//   unclassified     not yet reviewed: no exemption. A pool that already had more than 5 GMs is frozen in
//                    frozenRosters: its exact GM list may not change in either direction until it is classified
// The classification comes only from pool-governance.json. A pool's key, name, size, matchScope or batch never
// classifies it or grants an exemption.
//
// These checks validate structure only (fields present, specific text, https links, codes and ids consistent). They
// cannot tell whether a cited source supports a claim; that is for human review and the owner's approval.
//
// GM identity: an entry's FIDE id when it has one that matches a GM record of the same name, otherwise the id of
// the GM record with the entry's exact name. Records with different ids are different GMs, even when
// suspectedDuplicates flags them; nothing here merges them.
const fs = require('fs');
const path = require('path');

const REGISTRY_PATH = path.join(__dirname, 'pool-governance.json');
const CLASSES = ['variation-level', 'family-level', 'unclassified'];
const CRITERIA = ['F1-family-scope', 'F2-several-variations', 'F3-family-level-evidence', 'F4-recommendation-role', 'F5-individual-review'];
const PLACEHOLDER = /^(recorded evidence|evidence|see (above|below|sources?)|same( as above)?|tbd|todo|to do|n\/?a|none|placeholder|pending|x+|-+|\.+|\?+|ok|yes|lorem ipsum.*)$/i;

function loadRegistry(file = REGISTRY_PATH) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

// Real text: at least `min` characters and not a generic placeholder
const realText = (t, min = 3) => typeof t === 'string' && t.trim().length >= min && !PLACEHOLDER.test(t.trim());
// A source reference: an https URL that is not an example host
const realSource = s => typeof s === 'string' && /^https:\/\/[^\s/]+\.[^\s/]+/.test(s) && !/^https:\/\/([^/]*\.)?example\.(com|org|net)(\/|$)/i.test(s);
const sourcesOk = list => Array.isArray(list) && list.length > 0 && list.every(realSource);

// records: [{ id, name }] -> resolve(entry) gives { id, name, via } or null
function identityResolver(records) {
  const byId = new Map(records.map(r => [String(r.id), r])), byName = new Map(records.map(r => [r.name, r]));
  return e => {
    if (e.id) {
      const r = byId.get(String(e.id));
      return r && r.name === e.gm ? { id: String(r.id), name: r.name, via: 'fide-id' } : null;
    }
    const r = byName.get(e.gm);
    return r ? { id: String(r.id), name: r.name, via: 'name' } : null;
  };
}

// Distinct GMs a pool can show, by identity: [{ id, name, via }]
function shownGms(pool, resolve) {
  const seen = new Map();
  for (const e of pool.pool) {
    if (e.status !== 'verified') continue;
    const who = resolve(e);
    if (who && !seen.has(who.id)) seen.set(who.id, who);
  }
  return [...seen.values()];
}

// Problems with a family-level entry's evidence and approval ([] when complete)
function familyLevelGaps(entry, pool, gms, registry) {
  const gaps = [], c = entry.criteria || {}, codes = new Set(pool.codes || []);
  const f1 = c['F1-family-scope'];
  if (!f1 || typeof f1 !== 'object') gaps.push('F1: needs { family, reference, codes }');
  else {
    if (!realText(f1.family)) gaps.push('F1: family name missing or a placeholder');
    if (!realSource(f1.reference)) gaps.push('F1: reference must be an https source');
    const listed = Array.isArray(f1.codes) ? f1.codes : [];
    if (listed.length !== codes.size || !listed.every(x => codes.has(x)) || new Set(listed).size !== listed.length) gaps.push('F1: codes must list exactly the pool\'s codes');
  }
  const f2 = c['F2-several-variations'];
  const vars = f2 && Array.isArray(f2.variations) ? f2.variations : null;
  if (!vars) gaps.push('F2: needs { variations: [{ name, codes, sources }] }');
  else {
    const names = new Set();
    vars.forEach((v, i) => {
      const label = `F2 variation ${i + 1}`;
      if (!v || !realText(v.name)) { gaps.push(`${label}: name missing or a placeholder`); return; }
      const key = v.name.trim().toLowerCase().replace(/\s+/g, ' ');
      if (names.has(key)) gaps.push(`F2: variation "${v.name}" is listed twice`);
      names.add(key);
      if (!Array.isArray(v.codes) || !v.codes.length) gaps.push(`F2: variation "${v.name}" has no ECO codes`);
      else if (!v.codes.every(x => codes.has(x))) gaps.push(`F2: variation "${v.name}" lists codes outside the pool`);
      if (!sourcesOk(v.sources)) gaps.push(`F2: variation "${v.name}" needs at least one https source`);
    });
    if (names.size < 2) gaps.push(`F2: needs at least 2 distinct named variations (has ${names.size})`);
  }
  const f3 = c['F3-family-level-evidence'];
  const rows = f3 && Array.isArray(f3.gms) ? f3.gms : null;
  if (!rows) gaps.push('F3: needs { gms: [{ gm, fideId, basis, sources }] }');
  else for (const g of gms) {
    const row = rows.find(r => r && String(r.fideId) === g.id);
    if (!row) { gaps.push(`F3: no evidence row for ${g.name} (${g.id})`); continue; }
    if (row.gm !== g.name) gaps.push(`F3: row for ${g.id} names "${row.gm}", record is "${g.name}"`);
    if (!realText(row.basis, 12)) gaps.push(`F3: ${g.name} basis missing, too short or a placeholder`);
    if (!sourcesOk(row.sources)) gaps.push(`F3: ${g.name} needs at least one https source`);
  }
  const f4 = c['F4-recommendation-role'];
  if (!f4 || !realText(f4.statement, 12) || f4.notAContainer !== true) gaps.push('F4: needs { statement, notAContainer: true }');
  const f5 = c['F5-individual-review'];
  if (!f5 || !realText(f5.reviewer) || !realSource(f5.reviewRef)) gaps.push('F5: needs { reviewer, reviewRef (https) }');
  else if (f5.reviewer === registry.approver) gaps.push('F5: the review must be independent of the approver');
  const a = entry.approval || {};
  if (a.by !== registry.approver) gaps.push(`approval.by must be "${registry.approver}"`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(a.date || '')) gaps.push('approval.date (YYYY-MM-DD)');
  if (!realSource(a.ref)) gaps.push('approval.ref (https link to the approval)');
  return gaps;
}

// pools: [{ key, codes, pool: [{ gm, id, status }] }]; records: [{ id, name }]; registry: pool-governance.json
function checkPoolGovernance(pools, records, registry) {
  const issues = [], warnings = [];
  const resolve = identityResolver(records);
  const maxGms = registry.maxGmsPerVariationPool, maxPools = registry.maxVariationPoolsPerGm;
  if (!Number.isInteger(maxGms) || !Number.isInteger(maxPools)) issues.push('pool-governance.json needs integer maxGmsPerVariationPool and maxVariationPoolsPerGm');
  if (JSON.stringify(registry.familyLevelCriteria) !== JSON.stringify(CRITERIA)) issues.push(`pool-governance.json familyLevelCriteria must be ${CRITERIA.join(', ')}`);
  if (!registry.approver) issues.push('pool-governance.json needs an approver');
  const registryOk = !issues.length;
  const entries = registry.pools || {}, frozen = registry.frozenRosters || {};
  const keys = new Set(pools.map(p => p.key));
  for (const k of Object.keys(entries)) if (!keys.has(k)) issues.push(`pool-governance.json lists "${k}", which is not a pool`);
  for (const k of Object.keys(frozen)) if (!keys.has(k)) issues.push(`frozenRosters lists "${k}", which is not a pool`);

  // Suspected duplicate identities: reported every run; both records must still exist separately
  const recIds = new Set(records.map(r => String(r.id)));
  const duplicates = (registry.suspectedDuplicates || []).map(d => {
    const ids = (d.ids || []).map(String);
    if (ids.length < 2 || new Set(ids).size !== ids.length) issues.push(`suspectedDuplicates: needs 2 or more distinct ids, got ${ids.join(', ')}`);
    for (const id of ids) if (!recIds.has(id)) issues.push(`suspectedDuplicates: GM record ${id} is missing; records under review must be kept separately until the owner approves a reconciliation`);
    return { ids, status: d.status || 'unverified' };
  });

  const counts = { 'variation-level': 0, 'family-level': 0, 'family-level (exempt)': 0, unclassified: 0 };
  // id -> { name, variation: [pool keys], incomplete: [{ pool, reason }] }. A membership is "incomplete" when its
  // pool has no entry, an invalid classification, incomplete family-level evidence or approval, or is unclassified,
  // or when the GM's identity in that pool cannot be confirmed. Incomplete memberships block certification.
  const memberships = {};
  const member = (id, name) => memberships[id] = memberships[id] || { name, variation: [], incomplete: [] };
  const byName = new Map(records.map(r => [r.name, r]));
  const via = { 'fide-id': 0, name: 0 };
  let incompletePools = 0;
  for (const p of pools) {
    const gms = shownGms(p, resolve), n = gms.length;
    for (const g of gms) via[g.via]++;
    // Shown on the site by name, but the entry's id belongs to someone else: identity cannot be confirmed
    const unconfirmed = [];
    for (const e of p.pool) if (e.status === 'verified' && e.id && !resolve(e)) {
      issues.push(`${p.key}: ${e.gm} has id ${e.id}, which is not the FIDE id of a GM record with that name`);
      const r = byName.get(e.gm);
      if (r && !gms.some(g => g.id === String(r.id))) unconfirmed.push(r);
    }
    for (const r of unconfirmed) member(String(r.id), r.name).incomplete.push({ pool: p.key, reason: 'identity not confirmed' });
    const entry = entries[p.key];
    const cls = entry ? entry.classification : undefined;
    let reason = null;
    if (!entry) { issues.push(`${p.key}: no entry in pool-governance.json (every pool needs an explicit classification)`); reason = 'no registry entry'; }
    else if (!CLASSES.includes(cls)) { issues.push(`${p.key}: classification "${cls}" is not one of ${CLASSES.join(', ')}`); reason = `invalid classification "${cls}"`; }
    else counts[cls]++;
    if (!reason && cls !== 'unclassified' && p.key in frozen) issues.push(`${p.key}: classified, so it must not be in frozenRosters`);
    if (reason) {
      // nothing more can be checked for this pool
    } else if (cls === 'variation-level') {
      if (n > maxGms) issues.push(`${p.key}: variation-level pool has ${n} GMs; maximum is ${maxGms}`);
    } else if (cls === 'family-level') {
      const gaps = registryOk ? familyLevelGaps(entry, p, gms, registry) : ['registry settings invalid'];
      if (gaps.length) { issues.push(`${p.key}: family-level evidence is incomplete, so no exemption applies (${gaps.join('; ')})`); reason = 'family-level evidence or approval incomplete'; }
      else counts['family-level (exempt)']++;
    } else {
      reason = 'unclassified';
      if (p.key in frozen) {
        // Frozen over-cap roster: the exact GM list may not change in either direction
        const want = new Map((frozen[p.key].gms || []).map(g => [String(g.id), g.gm]));
        const have = new Map(gms.map(g => [g.id, g.name]));
        const added = [...have].filter(([id]) => !want.has(id)).map(([id, nm]) => `${nm} (${id})`);
        const removed = [...want].filter(([id]) => !have.has(id)).map(([id, nm]) => `${nm} (${id})`);
        if (added.length) issues.push(`${p.key}: frozen roster gained ${added.join(', ')} (unauthorized addition)`);
        if (removed.length) issues.push(`${p.key}: frozen roster lost ${removed.join(', ')} (unauthorized removal)`);
        if (frozen[p.key].count !== want.size) issues.push(`${p.key}: frozenRosters count ${frozen[p.key].count} does not match its ${want.size} listed GMs`);
      } else if (n > maxGms) {
        issues.push(`${p.key}: unclassified pool has ${n} GMs (more than ${maxGms}) and no frozen roster; classify it or keep it at ${maxGms} or fewer`);
      }
    }
    if (reason || unconfirmed.length) incompletePools++;
    for (const g of gms) {
      const m = member(g.id, g.name);
      if (reason) m.incomplete.push({ pool: p.key, reason });
      else if (cls === 'variation-level') m.variation.push(p.key);
    }
  }

  // Six-pool limit: confirmed variation-level memberships always fail above the limit. A GM is CERTIFIED only when
  // every one of their memberships is validly classified (variation-level, or family-level with complete evidence
  // and approval); any incomplete membership gives NOT CERTIFIED, neither an exemption nor a confirmed violation.
  const sixPool = { certified: [], notCertified: [], couldExceed: [], reasons: {} };
  for (const [id, m] of Object.entries(memberships)) {
    if (m.variation.length > maxPools) issues.push(`${m.name} (${id}) is in ${m.variation.length} variation-level pools; maximum is ${maxPools}`);
    if (m.incomplete.length) {
      sixPool.notCertified.push(id);
      sixPool.reasons[id] = `${m.name}: ` + m.incomplete.map(x => `${x.pool} (${x.reason})`).join(', ');
      if (m.variation.length + m.incomplete.length > maxPools) sixPool.couldExceed.push(`${m.name} ${m.variation.length}+${m.incomplete.length}`);
    } else sixPool.certified.push(id);
  }
  const complete = registryOk && incompletePools === 0;
  sixPool.incompletePools = incompletePools;
  sixPool.status = complete ? 'CERTIFIED' : 'NOT CERTIFIED — classification incomplete';
  for (const d of duplicates) warnings.push(`suspected duplicate identity (${d.status}): GM records ${d.ids.join(' and ')} are counted separately; not merged`);
  return { issues, warnings, report: { pools: pools.length, counts, frozen: Object.keys(frozen).length, via, sixPool, duplicates } };
}

module.exports = { REGISTRY_PATH, CLASSES, CRITERIA, PLACEHOLDER, loadRegistry, identityResolver, shownGms, familyLevelGaps, checkPoolGovernance };
