// Pull-request check: known-card-issues.json may only shrink against the base branch.
// Fails if this branch adds a card/issue that the base did not know. One narrow migration is allowed:
// an existing card with any prior summary issue may be reclassified as "generic-summary" when a neutral,
// unsourced Black fallback replaces the prior defect. The survey test verifies that this type really occurs.
// When the base branch has no list yet (the PR that introduces it), the list is only accepted if index.html
// is identical to the base branch: npm test then proves the list is exactly the issues the base site has.
// If the base branch has the file but it cannot be read or is not a valid list, the check fails (fail closed).
// This branch's list must exist and be a valid list too; a missing, unreadable or malformed one fails.
//
// Usage: node check_known_shrink.js [--base REF] [--list FILE]
//   --base  default origin/main; CI passes the fetched base branch
//   --list  this branch's list (default known-card-issues.json); used by check_known_shrink.test.js
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const cardChecks = require('./card_checks');

const args = process.argv.slice(2);
const base = args.includes('--base') ? args[args.indexOf('--base') + 1] : 'origin/main';
const listPath = args.includes('--list') ? path.resolve(args[args.indexOf('--list') + 1]) : cardChecks.KNOWN_PATH;
const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const rel = path.relative(root, cardChecks.KNOWN_PATH).split(path.sep).join('/');
const git = a => execFileSync('git', a, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

const fail = msg => { console.log(`FAIL: ${msg}`); process.exit(1); };
// A list is valid JSON with an "issues" object whose values are arrays of strings; returns the reason it isn't
const listProblem = text => {
  let parsed;
  try { parsed = JSON.parse(text); } catch (e) { return `is not valid JSON (${e.message})`; }
  const issues = parsed && parsed.issues;
  if (!issues || typeof issues !== 'object' || Array.isArray(issues) || !Object.values(issues).every(v => Array.isArray(v) && v.every(c => typeof c === 'string')))
    return 'has no valid "issues" object ({"ECO|side": ["issue type", ...]})';
  return null;
};

// This branch's list: must exist, be readable and be a valid list (no silent empty list)
const listName = path.relative(root, listPath).split(path.sep).join('/');
if (!fs.existsSync(listPath)) fail(`this branch has no ${listName}; the list must exist (an empty list is {"issues": {}})`);
let headText;
try { headText = fs.readFileSync(listPath, 'utf8'); } catch (e) { fail(`this branch's ${listName} cannot be read: ${e.message}`); }
const headProblem = listProblem(headText);
if (headProblem) fail(`this branch's ${listName} ${headProblem}`);
const head = JSON.parse(headText).issues;

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
  const problem = listProblem(raw);
  if (problem) fail(`${rel} on ${base} ${problem}; the comparison cannot be trusted`);
  baseList = JSON.parse(raw).issues;
}

if (baseList === null) {
  let same = true;
  try { git(['diff', '--quiet', base, '--', 'index.html']); } catch (e) { same = false; }
  if (!same) fail(`${base} has no ${rel}, and index.html differs from ${base}. The first list must come with no site change.`);
  console.log(`PASS: ${base} has no ${rel} yet; index.html is identical to ${base}, so npm test checks the list against the base site (${cardChecks.countLine(head)}).`);
  process.exit(0);
}

const rawAdded = cardChecks.additions(head, baseList);
const reclassified = rawAdded.filter(entry => {
  const match = entry.match(/^(.*) (generic-summary)$/);
  return match && match[1].endsWith('|black') && ['fallback', 'move-comment', 'wrong-side'].some(type => (baseList[match[1]] || []).includes(type));
});
const added = rawAdded.filter(entry => !reclassified.includes(entry));
const removed = cardChecks.additions(baseList, head);
const findingCount = issues => Object.values(issues).reduce((n, codes) => n + codes.length, 0);
console.log(`Base ${base}: ${cardChecks.countLine(baseList)}`);
console.log(`This branch: ${cardChecks.countLine(head)}`);
console.log(`Removed/replaced prior issue types: ${removed.length}${removed.length ? ` (${removed.join('; ')})` : ''}`);
console.log(`Reclassified known Black cards to generic-summary (still unresolved): ${reclassified.length}`);
console.log(`Net issue-finding reduction: ${findingCount(baseList) - findingCount(head)}`);
if (added.length) {
  console.log(`\nFAIL: ${added.length} entries are not in the base branch list. The list can only shrink; fix these instead of listing them:`);
  for (const a of added) console.log('  - ' + a);
  process.exit(1);
}
console.log('\nPASS: nothing added');
