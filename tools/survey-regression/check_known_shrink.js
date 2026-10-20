// Pull-request check: known-card-issues.json may only shrink against the base branch.
// Fails if this branch's list has any card and issue type ("ECO|side" + code) that the base branch's list
// does not have, so a new defect cannot be made acceptable by listing it in the same PR.
// When the base branch has no list yet (the PR that introduces it), the list is only accepted if index.html
// is identical to the base branch: npm test then proves the list is exactly the issues the base site has.
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

const head = cardChecks.loadKnown();
let baseList = null;
try { baseList = JSON.parse(git(['show', `${base}:${rel}`])).issues || {}; } catch (e) { baseList = null; }

if (baseList === null) {
  let same = true;
  try { git(['diff', '--quiet', base, '--', 'index.html']); } catch (e) { same = false; }
  if (!same) {
    console.log(`FAIL: ${base} has no ${rel}, and index.html differs from ${base}. The first list must come with no site change.`);
    process.exit(1);
  }
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
