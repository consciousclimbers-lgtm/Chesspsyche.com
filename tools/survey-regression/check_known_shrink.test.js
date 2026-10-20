// Tests for check_known_shrink.js: this branch's list must exist and be a valid list, or the check fails.
// Each case writes a list to a temporary folder and runs the check on it with --list; the real list is not touched.
// The base is HEAD, which has a valid list, so only this branch's list differs between cases.
//
// Usage: node check_known_shrink.test.js   (npm run test:known-shrink)
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const cardChecks = require('./card_checks');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'known-shrink-'));
const real = fs.readFileSync(cardChecks.KNOWN_PATH, 'utf8');
const write = (name, text) => { const p = path.join(tmp, name); fs.writeFileSync(p, text); return p; };
fs.mkdirSync(path.join(tmp, 'directory.json'));

const cases = [
  { name: 'missing list fails', list: path.join(tmp, 'absent.json'), exit: 1, says: 'the list must exist' },
  { name: 'directory in place of the list fails', list: path.join(tmp, 'directory.json'), exit: 1, says: 'cannot be read' },
  { name: 'invalid JSON fails', list: write('invalid.json', '{"issues": {"A40|black": ["fallback"]'), exit: 1, says: 'is not valid JSON' },
  { name: 'no "issues" object fails', list: write('no-issues.json', '{"about": "x"}'), exit: 1, says: 'no valid "issues" object' },
  { name: '"issues" as an array fails', list: write('array.json', '{"issues": [["fallback"]]}'), exit: 1, says: 'no valid "issues" object' },
  { name: 'a value that is not an array fails', list: write('not-array.json', '{"issues": {"A40|black": "fallback"}}'), exit: 1, says: 'no valid "issues" object' },
  { name: 'a non-string issue type fails', list: write('not-string.json', '{"issues": {"A40|black": [1]}}'), exit: 1, says: 'no valid "issues" object' },
  { name: 'JSON null fails', list: write('null.json', 'null'), exit: 1, says: 'no valid "issues" object' },
  { name: 'valid list identical to the base passes', list: write('valid.json', real), exit: 0, says: 'PASS: nothing added' },
];

let failed = 0;
for (const c of cases) {
  const r = spawnSync(process.execPath, [path.join(__dirname, 'check_known_shrink.js'), '--base', 'HEAD', '--list', c.list], { encoding: 'utf8' });
  const out = (r.stdout + r.stderr).trim();
  const ok = r.status === c.exit && out.includes(c.says);
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${c.name} (exit ${r.status}, expected ${c.exit})`);
  console.log('  ' + (out.split('\n').find(l => /^(PASS|FAIL)/.test(l)) || out.split('\n').pop()));
}
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\n${failed ? 'FAIL' : 'PASS'}: ${cases.length - failed}/${cases.length} cases`);
process.exit(failed ? 1 : 0);
