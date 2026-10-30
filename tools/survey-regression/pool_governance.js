// Notable GM pool governance (AGENTS.md, "Notable GM pool governance"). Used by survey_regression.js and
// tested by pool_governance.test.js.
//
// Every pool in NOTABLE_GM_POOLS must have an entry in pool-governance.json with one classification:
//   variation-level  a Variation-Level Analytical Pool: at most 5 distinct GMs, counts toward the 6-pool limit
//   family-level     a Family-Level Recommendation Pool: exempt from the 5-GM limit only when its entry records
//                    every family-level criterion and the owner's approval; otherwise the test fails
//   unclassified     not yet reviewed: no exemption. If it has more than 5 GMs it must be listed in
//                    pendingOverCap, and its GM count may not rise above the listed number
// The classification comes only from pool-governance.json. A pool's key, name, size, matchScope or batch never
// classifies it or grants an exemption.
//
// GMs are counted as the page shows them: verified entries whose name is an exact GM record name, by name.
const fs = require('fs');
const path = require('path');

const REGISTRY_PATH = path.join(__dirname, 'pool-governance.json');
const CLASSES = ['variation-level', 'family-level', 'unclassified'];

function loadRegistry(file = REGISTRY_PATH) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

// Distinct GMs a pool can show
function shownGms(pool, names) {
  return [...new Set(pool.pool.filter(e => e.status === 'verified' && names.has(e.gm)).map(e => e.gm))];
}

// What a family-level entry still lacks before its exemption applies ([] when complete)
function familyLevelGaps(entry, registry) {
  const gaps = [];
  const criteria = entry.criteria || {};
  for (const id of registry.familyLevelCriteria || []) {
    if (typeof criteria[id] !== 'string' || !criteria[id].trim()) gaps.push(`criterion ${id}`);
  }
  const a = entry.approval || {};
  if (a.by !== registry.approver) gaps.push(`approval.by "${registry.approver}"`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(a.date || '')) gaps.push('approval.date (YYYY-MM-DD)');
  if (!/^https:\/\//.test(a.ref || '')) gaps.push('approval.ref (https link to the approval)');
  return gaps;
}

// pools: [{ key, pool: [{ gm, status }] }]; names: GM record names; registry: pool-governance.json
function checkPoolGovernance(pools, names, registry) {
  const issues = [], warnings = [];
  const nameSet = new Set(names);
  const maxGms = registry.maxGmsPerVariationPool, maxPools = registry.maxVariationPoolsPerGm;
  if (!Number.isInteger(maxGms) || !Number.isInteger(maxPools)) issues.push('pool-governance.json needs integer maxGmsPerVariationPool and maxVariationPoolsPerGm');
  if (!Array.isArray(registry.familyLevelCriteria) || !registry.familyLevelCriteria.length) issues.push('pool-governance.json needs a non-empty familyLevelCriteria list');
  if (!registry.approver) issues.push('pool-governance.json needs an approver');
  const entries = registry.pools || {}, pending = registry.pendingOverCap || {};
  const keys = new Set(pools.map(p => p.key));
  for (const k of Object.keys(entries)) if (!keys.has(k)) issues.push(`pool-governance.json lists "${k}", which is not a pool`);
  for (const k of Object.keys(pending)) if (!keys.has(k)) issues.push(`pendingOverCap lists "${k}", which is not a pool`);

  const counts = { 'variation-level': 0, 'family-level': 0, 'family-level (exempt)': 0, unclassified: 0 };
  const variationPools = {}, allTracked = {};
  for (const p of pools) {
    const gms = shownGms(p, nameSet), n = gms.length;
    const entry = entries[p.key];
    if (!entry) { issues.push(`${p.key}: no entry in pool-governance.json (every pool needs an explicit classification)`); continue; }
    const cls = entry.classification;
    if (!CLASSES.includes(cls)) { issues.push(`${p.key}: classification "${cls}" is not one of ${CLASSES.join(', ')}`); continue; }
    counts[cls]++;
    for (const g of gms) (allTracked[g] = allTracked[g] || []).push(p.key);
    if (cls === 'variation-level') {
      for (const g of gms) (variationPools[g] = variationPools[g] || []).push(p.key);
      if (n > maxGms) issues.push(`${p.key}: variation-level pool has ${n} GMs; maximum is ${maxGms}`);
      if (p.key in pending) issues.push(`${p.key}: classified, so it must not be in pendingOverCap`);
    } else if (cls === 'family-level') {
      const gaps = familyLevelGaps(entry, registry);
      if (gaps.length) issues.push(`${p.key}: family-level classification is incomplete, so no exemption applies (missing ${gaps.join(', ')})`);
      else counts['family-level (exempt)']++;
      if (p.key in pending) issues.push(`${p.key}: classified, so it must not be in pendingOverCap`);
    } else if (n > maxGms) {
      if (!(p.key in pending)) issues.push(`${p.key}: unclassified pool has ${n} GMs (more than ${maxGms}) and is not in pendingOverCap; classify it or keep it at ${maxGms} or fewer`);
      else if (n > pending[p.key]) issues.push(`${p.key}: unclassified pool grew to ${n} GMs; pendingOverCap allows at most ${pending[p.key]} until it is classified`);
      else if (n < pending[p.key]) warnings.push(`${p.key}: now ${n} GMs; lower its pendingOverCap entry from ${pending[p.key]}`);
    } else if (p.key in pending) warnings.push(`${p.key}: now ${n} GMs (within ${maxGms}); remove it from pendingOverCap`);
  }
  for (const [g, list] of Object.entries(variationPools)) {
    if (list.length > maxPools) issues.push(`${g} is in ${list.length} variation-level pools; maximum is ${maxPools}`);
  }
  // Reported, not failed: GMs over the limit if every unclassified pool they are in turned out variation-level
  const atRisk = Object.entries(allTracked).map(([g, list]) => [g, list.filter(k => entries[k] && entries[k].classification !== 'family-level').length])
    .filter(([, n]) => n > maxPools).map(([g, n]) => `${g} ${n}`);
  return { issues, warnings, report: { pools: pools.length, counts, pending: Object.keys(pending).length, atRisk } };
}

module.exports = { REGISTRY_PATH, CLASSES, loadRegistry, shownGms, familyLevelGaps, checkPoolGovernance };
