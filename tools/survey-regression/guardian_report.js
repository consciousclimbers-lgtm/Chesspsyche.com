// Live Guardian report: combines the JSON reports that `clickthrough.js --report` writes (one per browser
// and viewport) with the deployment check into one verdict, printed as Markdown.
//
// Every expected browser/viewport gets exactly one label:
//   PASS        its report exists, every check ran and passed;
//   FAIL        its report lists a failed check;
//   NOT TESTED  the browser could not be started, its job did not run, or it left no report.
// The overall verdict is PASS only when the deployment check found the expected commit live AND every
// expected browser/viewport is PASS. Anything else exits 1, so the run never reads as a success.
// With --sha256, a report counts only if it tested the live site with that exact index.html sha256
// (clickthrough.js --url --expect-sha256); any other report is NOT TESTED. From the command line, a matched
// deployment with no --sha256 is NOT TESTED.
// A report that cannot be read, is malformed, is one of several for the same browser/viewport, or is for a
// browser/viewport missing from the expected list is a FAIL: it is never ignored.
//
// Usage: node guardian_report.js --reports DIR --expect chromium-desktop,firefox-desktop,...
//          --deployment match|mismatch|superseded|unreachable|skipped [--deployment-note TEXT]
//          [--commit SHA] [--sha256 HASH] [--site URL]
const fs = require('fs');
const path = require('path');

// Returns the reports, and the .json files that could not be read as one (listed in out.unreadable)
function readReports(dir) {
  const out = [];
  out.unreadable = [];
  const walk = d => {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.json')) {
        let r;
        try { r = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { out.unreadable.push(`${p}: ${e.message}`); continue; }
        if (r && r.tool === 'clickthrough.js') out.push(r);
        else out.unreadable.push(`${p}: not a clickthrough.js report`);
      }
    }
  };
  walk(dir);
  return out;
}

const STATUSES = ['PASS', 'FAIL', 'NOT_TESTED'];
const wellFormed = r => STATUSES.includes(r.status) && Array.isArray(r.checks)
  && r.checks.every(c => c && typeof c.name === 'string' && ['PASS', 'FAIL'].includes(c.status) && (c.fails === undefined || Array.isArray(c.fails)));

function build({ reports, expect, deployment, note, commit, site, sha256, unreadable = [], requireSha = false }) {
  const rows = expect.map(key => {
    const [browser, viewport] = key.split('-');
    const found = reports.filter(x => x && x.browser === browser && x.viewport === viewport);
    const r = found[0];
    if (found.length > 1) return { browser, viewport, status: 'FAIL', detail: `${found.length} reports for this browser/viewport (expected one)` };
    if (!r) return { browser, viewport, status: 'NOT TESTED', detail: deployment === 'match' ? 'no report: the job did not run or stopped before writing one' : 'not run: the deployment check did not pass' };
    if (!wellFormed(r)) return { browser, viewport, status: 'FAIL', detail: `malformed report (status ${JSON.stringify(r.status)}, checks ${Array.isArray(r.checks) ? 'with a malformed entry' : 'missing'})` };
    if (requireSha && deployment === 'match' && !sha256) return { browser, viewport, status: 'NOT TESTED', detail: 'no expected index.html sha256 to check the report against' };
    if (sha256 && (r.live !== true || r.expectSha256 !== sha256)) return { browser, viewport, status: 'NOT TESTED', detail: `report did not check the live site against index.html sha256 ${sha256.slice(0, 12)}` };
    if (r.status === 'NOT_TESTED') return { browser, viewport, status: 'NOT TESTED', detail: r.reason || 'browser could not be started' };
    const failed = r.checks.filter(c => c.status !== 'PASS');
    const retries = ((r.diagnostics || {}).retries || []).length;
    // A report that claims PASS must contain checks that all passed; anything else is not a pass
    if (r.status === 'PASS' && r.checks.length && !failed.length) return { browser, viewport, status: 'PASS', detail: `${r.checks.length} checks passed (${r.browserVersion || 'version unknown'})${retries ? `; ${retries} page-load retr${retries > 1 ? 'ies' : 'y'} before passing` : ''}` };
    if (r.status === 'PASS' && !r.checks.length) return { browser, viewport, status: 'NOT TESTED', detail: 'report has no checks' };
    return { browser, viewport, status: 'FAIL', detail: failed.map(c => `${c.name}: ${(c.fails || [])[0] || 'failed'}${(c.fails || []).length > 1 ? ` (+${c.fails.length - 1} more)` : ''}`).join('; ') || 'failed' };
  });
  // A report for a browser/viewport that is not in the expected list (a matrix entry added without updating
  // the list) is never ignored: it is shown, and it fails the verdict
  for (const r of reports) {
    if (r && expect.includes(`${r.browser}-${r.viewport}`)) continue;
    rows.push({ browser: String((r || {}).browser), viewport: String((r || {}).viewport), status: 'FAIL', detail: 'report for a browser/viewport missing from the expected list (EXPECTED_RUNS)' });
  }
  for (const u of unreadable) rows.push({ browser: '?', viewport: '?', status: 'FAIL', detail: `unreadable report file ${u}` });
  const deployOk = deployment === 'match';
  const verdict = !deployOk ? (deployment === 'mismatch' || deployment === 'unreachable' ? 'FAIL' : 'NOT TESTED')
    : rows.some(r => r.status === 'FAIL') ? 'FAIL' : rows.some(r => r.status === 'NOT TESTED') ? 'NOT TESTED' : 'PASS';
  const lines = [
    `## Live Guardian: ${verdict}`,
    '',
    `Site: ${site || 'unknown'}  `,
    `Expected commit: ${commit ? '`' + commit.slice(0, 12) + '`' : 'unknown'}  `,
    `Deployment check: ${deployOk ? 'PASS' : deployment === 'mismatch' || deployment === 'unreachable' ? 'FAIL' : 'NOT TESTED'} (${deployment}${note ? `: ${note}` : ''})`,
    '',
    '| Browser | Viewport | Result | Details |',
    '|---|---|---|---|',
    ...rows.map(r => `| ${r.browser} | ${r.viewport} | **${r.status}** | ${r.detail.replace(/\|/g, '\\|')} |`),
    '',
    verdict === 'PASS' ? 'Every expected browser and viewport ran against the expected commit and passed.'
      : 'Not a successful live check. Screenshots, traces and logs are in the run\'s artifacts. The Guardian changes nothing: fixes go through a normal pull request (AGENTS.md, RELEASE.md).',
  ];
  return { verdict, rows, markdown: lines.join('\n') };
}

module.exports = { build, readReports };

if (require.main === module) {
  const args = process.argv.slice(2);
  const opt = n => args.includes(n) ? args[args.indexOf(n) + 1] : null;
  const expect = (opt('--expect') || '').split(',').filter(Boolean);
  if (!expect.length || !opt('--deployment')) { console.error('Usage: see the top of guardian_report.js'); process.exit(2); }
  const reports = readReports(opt('--reports') || 'reports');
  const out = build({ reports, unreadable: reports.unreadable, requireSha: true, expect, deployment: opt('--deployment'), note: opt('--deployment-note'), commit: opt('--commit'), site: opt('--site'), sha256: opt('--sha256') });
  console.log(out.markdown);
  process.exit(out.verdict === 'PASS' ? 0 : 1);
}
