// Checks that guardian_report.js never reads as a pass unless every expected browser/viewport ran and passed
// against the expected commit. Run: npm run test:guardian-report
const assert = require('assert');
const { build } = require('./guardian_report');

const rep = (browser, viewport, status, checks) => ({ tool: 'clickthrough.js', browser, viewport, status, checks });
const live = (r, sha) => ({ ...r, live: true, expectSha256: sha });
const pass = (b, v) => rep(b, v, 'PASS', [{ name: 'white-B12', status: 'PASS', fails: [] }]);
const expect = ['chromium-desktop', 'firefox-desktop'];
const cases = [
  ['all ran and passed', { reports: [pass('chromium', 'desktop'), pass('firefox', 'desktop')], deployment: 'match' }, 'PASS'],
  ['one check failed', { reports: [pass('chromium', 'desktop'), rep('firefox', 'desktop', 'FAIL', [{ name: 'navigation', status: 'FAIL', fails: ['x'] }])], deployment: 'match' }, 'FAIL'],
  ['browser could not start', { reports: [pass('chromium', 'desktop'), rep('firefox', 'desktop', 'NOT_TESTED', [])], deployment: 'match' }, 'NOT TESTED'],
  ['a report is missing', { reports: [pass('chromium', 'desktop')], deployment: 'match' }, 'NOT TESTED'],
  ['PASS with no checks', { reports: [pass('chromium', 'desktop'), rep('firefox', 'desktop', 'PASS', [])], deployment: 'match' }, 'NOT TESTED'],
  ['site serves another commit', { reports: [pass('chromium', 'desktop'), pass('firefox', 'desktop')], deployment: 'mismatch' }, 'FAIL'],
  ['site unreachable', { reports: [], deployment: 'unreachable' }, 'FAIL'],
  ['newer commit on main', { reports: [], deployment: 'superseded' }, 'NOT TESTED'],
  ['deployment check did not finish', { reports: [pass('chromium', 'desktop'), pass('firefox', 'desktop')], deployment: 'skipped' }, 'NOT TESTED'],
  ['live reports match the expected sha256', { reports: [live(pass('chromium', 'desktop'), 'abc'), live(pass('firefox', 'desktop'), 'abc')], deployment: 'match', sha256: 'abc' }, 'PASS'],
  ['a report tested another index.html', { reports: [live(pass('chromium', 'desktop'), 'abc'), live(pass('firefox', 'desktop'), 'old')], deployment: 'match', sha256: 'abc' }, 'NOT TESTED'],
  ['a report did not test the live site', { reports: [live(pass('chromium', 'desktop'), 'abc'), pass('firefox', 'desktop')], deployment: 'match', sha256: 'abc' }, 'NOT TESTED'],
];
let failed = 0;
for (const [name, input, want] of cases) {
  const got = build({ expect, ...input }).verdict;
  const ok = got === want;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: verdict ${got}${ok ? '' : `, expected ${want}`}`);
}
assert.strictEqual(build({ expect, reports: [], deployment: 'match' }).rows.every(r => r.status === 'NOT TESTED'), true);
console.log(failed ? `\nFAIL (${failed})` : '\nPASS');
process.exit(failed ? 1 : 0);
