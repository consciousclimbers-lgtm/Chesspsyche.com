// Checks that a page load retried by clickthrough.js --url cannot hide a failure: a local server answers the
// first page load badly, then serves index.html normally, and the click-through report must say:
//   JavaScript and console errors on the first attempt -> FAIL (a retry that works does not hide them)
//   a blocked write request on the first attempt       -> FAIL (read-only guard)
//   HTTP 503 and a missing image (HTTP 404) on it     -> FAIL (a missing asset is not transient)
//   HTTP 503 on the first attempt                      -> PASS (a server error is recoverable)
//   HTTP 503, then a load that works but whose image   -> FAIL (an HTTP 4xx fails on a successful load too,
//   returns 404, with the browser's console ignored            not only through the console error)
// The served index.html loads chess.js locally and has its fonts, icons and map replaced by empty files, so
// the test needs no network. Run: npm run test:retries (about 3 minutes)
const fs = require('fs'), http = require('http'), os = require('os'), path = require('path');
const { execFile } = require('child_process');

const page = fs.readFileSync(path.join(__dirname, '../../index.html'), 'utf8')
  .replace('https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js', '/chess.min.js')
  .replace(/https:\/\/fonts\.googleapis\.com\/css2\?[^"]*/, '/empty.css')
  .replace('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css', '/empty.css')
  .replace(/https:\/\/www\.google\.com\/maps\/embed\/[^"]*/, '/empty.html');
const chess = fs.readFileSync(require.resolve('chess.js'));
// First attempt of each scenario; the scripts never become ready, so clickthrough.js retries the load
const FIRST = {
  'js-error': [200, '<html><body><script>console.error("console error on attempt 1"); throw new Error("JavaScript error on attempt 1")</script></body></html>'],
  'blocked-write': [200, '<html><body><script>fetch("/collect", { method: "POST", body: "x" }).catch(() => {})</script></body></html>'],
  'http-503-and-404': [503, '<html><body>busy<img src="/missing-asset.png"></body></html>'],
  'http-503': [503, 'busy'],
  'http-503-then-404': [503, 'busy'],
};
// Page served after the first attempt, when a scenario needs something other than the plain index.html
const NEXT = { 'http-503-then-404': page.replace('</body>', '<img src="/missing-after-retry.png" alt=""></body>') };
// Scenarios run with every browser console message ignored, so only the HTTP status can fail them
const QUIET = new Set(['http-503-then-404']);
const SCENARIOS = [
  ['js-error', 'FAIL', r => r.checks.some(c => c.status === 'FAIL' && c.fails.some(f => f.includes('attempt 1 (retried)') && f.includes('JavaScript error on attempt 1')))
    && r.checks.some(c => c.fails.some(f => f.includes('console error on attempt 1')))],
  ['blocked-write', 'FAIL', r => r.checks.some(c => c.name === 'read-only-guard' && c.status === 'FAIL')
    && r.checks.some(c => c.name !== 'read-only-guard' && c.fails.some(f => f.includes('blocked a POST')))],
  ['http-503-and-404', 'FAIL', r => r.diagnostics.retries.some(l => l.includes('HTTP 503'))
    && r.checks.some(c => c.status === 'FAIL' && c.fails.some(f => f.includes('attempt 1 (retried): HTTP 404') && f.includes('/missing-asset.png')))],
  ['http-503', 'PASS', r => r.diagnostics.retries.some(l => l.includes('HTTP 503'))],
  ['http-503-then-404', 'FAIL', r => r.diagnostics.retries.some(l => l.includes('HTTP 503'))
    && r.checks.some(c => c.status === 'FAIL' && c.fails.some(f => /^HTTP 404 .*\/missing-after-retry\.png/.test(f)))
    && !r.checks.some(c => c.fails.some(f => f.includes('console error')))],
];

function serve(mode) {
  let documents = 0;
  const server = http.createServer((req, res) => {
    const p = req.url.split('?')[0];
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(204); return res.end(); }
    if (p === '/') {
      const [status, body] = ++documents === 1 ? FIRST[mode] : [200, NEXT[mode] || page];
      res.writeHead(status, { 'Content-Type': 'text/html' }); return res.end(body);
    }
    if (p === '/chess.min.js') { res.writeHead(200, { 'Content-Type': 'application/javascript' }); return res.end(chess); }
    if (p === '/empty.css') { res.writeHead(200, { 'Content-Type': 'text/css' }); return res.end(''); }
    if (p === '/empty.html') { res.writeHead(200, { 'Content-Type': 'text/html' }); return res.end('<html></html>'); }
    res.writeHead(404); res.end();
  });
  return new Promise(ok => server.listen(0, '127.0.0.1', () => ok(server)));
}

async function run([mode, want, detail]) {
  const server = await serve(mode);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `retry-${mode}-`));
  const report = path.join(dir, 'report.json');
  // Preload that drops the click-through's console listener, as if the browser logged nothing
  const quiet = path.join(dir, 'quiet.js');
  fs.writeFileSync(quiet, `const pw = require(${JSON.stringify(require.resolve('playwright'))});
for (const type of ['chromium', 'firefox', 'webkit']) {
  const launch = pw[type].launch.bind(pw[type]);
  pw[type].launch = async (...a) => {
    const browser = await launch(...a), newContext = browser.newContext.bind(browser);
    browser.newContext = async (...o) => {
      const context = await newContext(...o), newPage = context.newPage.bind(context);
      context.newPage = async () => { const p = await newPage(), on = p.on.bind(p); p.on = (e, fn) => e === 'console' ? p : on(e, fn); return p; };
      return context;
    };
    return browser;
  };
}\n`);
  const { code, out } = await new Promise(ok => execFile(process.execPath,
    [...(QUIET.has(mode) ? ['-r', quiet] : []), path.join(__dirname, 'clickthrough.js'), '--url', `http://127.0.0.1:${server.address().port}/`, '--report', report],
    { maxBuffer: 1 << 24 }, (e, stdout, stderr) => ok({ code: e ? e.code : 0, out: stdout + stderr })));
  server.close();
  let r = null;
  try { r = JSON.parse(fs.readFileSync(report, 'utf8')); } catch (_) { /* no report */ }
  fs.rmSync(dir, { recursive: true, force: true });
  if (code === 3) return { mode, ok: false, line: `NOT TESTED ${mode}: the browser could not be started` };
  const ok = !!r && r.status === want && code === (want === 'PASS' ? 0 : 1) && detail(r);
  return { mode, ok, line: `${ok ? 'PASS' : 'FAIL'} ${mode}${QUIET.has(mode) ? ' (console ignored)' : ''} on the first page load, then a ${NEXT[mode] ? 'working load with a missing image' : 'good load'}: report ${r ? r.status : 'missing'} (exit ${code}), expected ${want}`, out };
}

(async () => {
  const results = await Promise.all(SCENARIOS.map(run));
  for (const x of results) {
    console.log(x.line);
    if (!x.ok && x.out) console.log(x.out.split('\n').filter(l => /->|retr|attempt|blocked|error/i.test(l)).slice(0, 30).map(l => '    ' + l).join('\n'));
  }
  const failed = results.filter(x => !x.ok).length;
  console.log(failed ? `\nFAIL (${failed})` : '\nPASS');
  process.exit(failed ? 1 : 0);
})();
