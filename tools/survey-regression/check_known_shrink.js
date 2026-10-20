// Pull-request check: known-card-issues.json may only shrink against the base branch.
// Fails if this branch's list has any card and issue type ("ECO|side" + code) that the base branch's list
// does not have, so a new defect cannot be made acceptable by listing it in the same PR.
// When the base branch has no list yet (the PR that introduces it), the list is only accepted if index.html
// is identical to the base branch: npm test then proves the list is exactly the issues the base site has.
// If the base branch has the file but it cannot be read or is not a valid list, the check fails (fail closed).
//
// Usage: node check_known_shrink.js [--base REF]   (default origin/main; CI passes the fetched base branch)
const { execFileSync } = require('child_process');
const path = require('path');
const cardChecks = require('./card_checks');

const args = process.argv.slice(2);
const base = args.includes('--base') ? args[args.indexOf('--base') + 1] : 'origin/main';
const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const rel = path.relative(root, cardChecks.KNOWN_PATH).split(path.sep).join('/');
const git = a => execFileSync('git', a, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

const fail = msg => { console.log(`FAIL: ${msg}`); process.exit(1); };
let head;
try { head = cardChecks.loadKnown(); } catch (e) { fail(`this branch's ${path.basename(cardChecks.KNOWN_PATH)} cannot be read or parsed: ${e.message}`); }

// The base ref must resolve; otherwise nothing can be compared
try { git(['rev-parse', '--verify', '--quiet', `${base}^{commit}`]); } catch (e) { fail(`base ref ${base} cannot be resolved, so the list cannot be compared (fetch the base branch first)`); }

// Only a file that is genuinely absent from the base tree gets the bootstrap exception: git ls-tree
// succeeds with no output for it. A git error, a non-file entry, or a file that cannot be read or is not
// a valid list fails closed, with the reason.
let baseList = null;
let entry;
try { entry = git(['ls-tree', base, '--', rel]).trim(); } catch (e) { fail(`cannot list ${rel} on ${base}: ${String(e.stderr || e.message).trim()}`); }
const present = entry !== '';
if (present && !/^100(644|755) blob /.test(entry)) fail(`${rel} on ${base} is not a regular file (${entry}); the comparison cannot be trusted`);
if (present) {
  let raw;
  try { raw = git(['show', `${base}:${rel}`]); } catch (e) { fail(`${rel} exists on ${base} but cannot be read: ${String(e.stderr || e.message).trim()}`); }
  let parsed;
  try { parsed = JSON.parse(raw); } catch (e) { fail(`${rel} on ${base} is not valid JSON (${e.message}); the comparison cannot be trusted`); }
  const issues = parsed && parsed.issues;
  const valid = issues && typeof issues === 'object' && !Array.isArray(issues) && Object.values(issues).every(v => Array.isArray(v) && v.every(c => typeof c === 'string'));
  if (!valid) fail(`${rel} on ${base} has no valid "issues" object ({"ECO|side": ["issue type", ...]}); the comparison cannot be trusted`);
  baseList = issues;
}

if (baseList === null) {
  let same = true;
  try { git(['diff', '--quiet', base, '--', 'index.html']); } catch (e) { same = false; }
  if (!same) fail(`${base} has no ${rel}, and index.html differs from ${base}. The first list must come with no site change.`);
  console.log(`PASS: ${base} has no ${rel} yet; index.html is identical to ${base}, so npm test checks the list against the base site (${cardChecks.countLine(head)}).`);
  process.exit(0);
}

const added = cardChecks.additions(head, baseList);
const removed = cardChecks.additions(baseList, head);
console.log(`Base ${base}: ${cardChecks.countLine(baseList)}`);
console.log(`This branch: ${cardChecks.countLine(head)}`);
console.log(`Removed: ${removed.length}${removed.length ? ` (${removed.join('; ')})` : ''}`);
if (added.length) {
  console.log(`\nFAIL: ${added.length} entries are not in the base branch list. The list can only shrink; fix these instead of listing them:`);
  for (const a of added) console.log('  - ' + a);
  process.exit(1);
}
console.log('\nPASS: nothing added');
