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
  ['a report not in the expected list', { reports: [pass('chromium', 'desktop'), pass('firefox', 'desktop'), pass('firefox', 'mobile')], deployment: 'match' }, 'FAIL'],
  ['deployment check did not finish', { reports: [pass('chromium', 'desktop'), pass('firefox', 'desktop')], deployment: 'skipped' }, 'NOT TESTED'],
  ['live reports match the expected sha256', { reports: [live(pass('chromium', 'desktop'), 'abc'), live(pass('firefox', 'desktop'), 'abc')], deployment: 'match', sha256: 'abc' }, 'PASS'],
  ['a report tested another index.html', { reports: [live(pass('chromium', 'desktop'), 'abc'), live(pass('firefox', 'desktop'), 'old')], deployment: 'match', sha256: 'abc' }, 'NOT TESTED'],
  ['a report did not test the live site', { reports: [live(pass('chromium', 'desktop'), 'abc'), pass('firefox', 'desktop')], deployment: 'match', sha256: 'abc' }, 'NOT TESTED'],
  // Gaps found in the review of c4fb516
  ['two reports for one browser/viewport (PASS and FAIL)', { reports: [pass('chromium', 'desktop'), rep('chromium', 'desktop', 'FAIL', [{ name: 'x', status: 'FAIL', fails: ['y'] }]), pass('firefox', 'desktop')], deployment: 'match' }, 'FAIL'],
  ['two PASS reports for one browser/viewport', { reports: [pass('chromium', 'desktop'), pass('chromium', 'desktop'), pass('firefox', 'desktop')], deployment: 'match' }, 'FAIL'],
  ['PASS report with a failed check', { reports: [pass('chromium', 'desktop'), rep('firefox', 'desktop', 'PASS', [{ name: 'x', status: 'FAIL', fails: ['y'] }])], deployment: 'match' }, 'FAIL'],
  ['checks is not a list', { reports: [pass('chromium', 'desktop'), rep('firefox', 'desktop', 'PASS', 'oops')], deployment: 'match' }, 'FAIL'],
  ['a check entry is null', { reports: [pass('chromium', 'desktop'), rep('firefox', 'desktop', 'PASS', [null])], deployment: 'match' }, 'FAIL'],
  ['unknown report status', { reports: [pass('chromium', 'desktop'), rep('firefox', 'desktop', 'pass', [{ name: 'x', status: 'PASS' }])], deployment: 'match' }, 'FAIL'],
  ['empty report object', { reports: [pass('chromium', 'desktop'), pass('firefox', 'desktop'), { tool: 'clickthrough.js' }], deployment: 'match' }, 'FAIL'],
  ['an unreadable report file', { reports: [pass('chromium', 'desktop'), pass('firefox', 'desktop')], unreadable: ['x/report.json: Unexpected end of JSON input'], deployment: 'match' }, 'FAIL'],
  ['matched deployment without a sha256 (command line)', { reports: [pass('chromium', 'desktop'), pass('firefox', 'desktop')], deployment: 'match', requireSha: true }, 'NOT TESTED'],
  ['only a NOT_TESTED report, the other missing', { reports: [rep('chromium', 'desktop', 'NOT_TESTED', [])], deployment: 'match' }, 'NOT TESTED'],
];
let failed = 0;
for (const [name, input, want] of cases) {
  const got = build({ expect, ...input }).verdict;
  const ok = got === want;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: verdict ${got}${ok ? '' : `, expected ${want}`}`);
}
assert.strictEqual(build({ expect, reports: [], deployment: 'match' }).rows.every(r => r.status === 'NOT TESTED'), true);
// readReports: an unreadable or foreign .json file is listed, never silently dropped
{
  const fs = require('fs'), os = require('os'), path = require('path');
  const { readReports } = require('./guardian_report');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'guardian-'));
  fs.mkdirSync(path.join(dir, 'a')); fs.mkdirSync(path.join(dir, 'b')); fs.mkdirSync(path.join(dir, 'c'));
  fs.writeFileSync(path.join(dir, 'a', 'report.json'), JSON.stringify(pass('chromium', 'desktop')));
  fs.writeFileSync(path.join(dir, 'b', 'report.json'), '{"tool": "clickthrough.js",');
  fs.writeFileSync(path.join(dir, 'c', 'report.json'), '{"something": "else"}');
  const got = readReports(dir);
  fs.rmSync(dir, { recursive: true });
  const ok = got.length === 1 && got.unreadable.length === 2;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'} readReports lists unreadable and foreign files: ${got.length} report(s), ${got.unreadable.length} unreadable`);
}
console.log(failed ? `\nFAIL (${failed})` : '\nPASS');
process.exit(failed ? 1 : 0);
