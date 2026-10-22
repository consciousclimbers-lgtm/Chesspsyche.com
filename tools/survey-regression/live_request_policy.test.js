'use strict';

const assert = require('assert');
const { classifyLiveRequest } = require('./live_request_policy');

assert.strictEqual(classifyLiveRequest('GET', 'https://example.com/').action, 'continue');
assert.strictEqual(classifyLiveRequest('HEAD', 'https://example.com/').action, 'continue');
assert.strictEqual(classifyLiveRequest('OPTIONS', 'https://example.com/').action, 'continue');

const viewport = 'https://maps.googleapis.com/$rpc/google.internal.maps.mapsjs.v1.MapsJsInternalService/GetViewportInfo';
assert.strictEqual(classifyLiveRequest('POST', viewport).action, 'continue');

const telemetry = 'https://maps.googleapis.com/maps_api_js_slo/log?hasfast=true';
const mocked = classifyLiveRequest('POST', telemetry);
assert.strictEqual(mocked.action, 'mock');
assert.strictEqual(mocked.status, 204);
assert.match(mocked.reason, /no network write/);
assert.strictEqual(classifyLiveRequest('POST', 'https://example.com/submit').action, 'block');
assert.strictEqual(classifyLiveRequest('PUT', 'https://maps.googleapis.com/maps_api_js_slo/log?hasfast=true').action, 'block');
assert.strictEqual(classifyLiveRequest('POST', 'https://maps.googleapis.com.evil.test/maps_api_js_slo/log?hasfast=true').action, 'block');
assert.strictEqual(classifyLiveRequest('POST', 'https://maps.googleapis.com/maps_api_js_slo/other?hasfast=true').action, 'block');

// URL edge cases: every variant below must stay blocked. Only the exact https URLs above are approved or mocked.
const viewportBase = viewport;
const telemetryBase = 'https://maps.googleapis.com/maps_api_js_slo/log';
const mustBlock = {
  'explicit port, viewport': viewportBase.replace('maps.googleapis.com', 'maps.googleapis.com:443'),
  'explicit port, telemetry': telemetryBase.replace('maps.googleapis.com', 'maps.googleapis.com:443') + '?hasfast=true',
  'other port, telemetry': telemetryBase.replace('maps.googleapis.com', 'maps.googleapis.com:8443') + '?hasfast=true',
  'credentials, viewport': viewportBase.replace('https://', 'https://user:pw@'),
  'credentials, telemetry': telemetryBase.replace('https://', 'https://user:pw@') + '?hasfast=true',
  'host after @, telemetry': 'https://maps.googleapis.com@evil.test/maps_api_js_slo/log?hasfast=true',
  'http scheme, telemetry': telemetryBase.replace('https:', 'http:') + '?hasfast=true',
  'http scheme, viewport': viewportBase.replace('https:', 'http:'),
  'query on viewport': viewportBase + '?hasfast=true',
  'fragment on viewport': viewportBase + '#x',
  'trailing slash, viewport': viewportBase + '/',
  'trailing slash, telemetry': telemetryBase + '/?hasfast=true',
  'path suffix, telemetry': telemetryBase + 'x?hasfast=true',
  'path prefix, telemetry': 'https://maps.googleapis.com/x/maps_api_js_slo/log?hasfast=true',
  'encoded slash, telemetry': 'https://maps.googleapis.com/maps_api_js_slo%2Flog?hasfast=true',
  'dot segment, telemetry': 'https://maps.googleapis.com/maps_api_js_slo/../log?hasfast=true',
  'subdomain prefix, telemetry': 'https://evil.maps.googleapis.com/maps_api_js_slo/log?hasfast=true',
  'subdomain prefix, viewport': viewportBase.replace('https://', 'https://evil.'),
  'uppercase host, telemetry': 'https://MAPS.GOOGLEAPIS.COM/maps_api_js_slo/log?hasfast=true',
  'fragment after query, telemetry': telemetryBase + '?hasfast=true#x',
  'space in query, telemetry': telemetryBase + '?hasfast=true https://evil.test/',
  'newline in query, telemetry': telemetryBase + '?hasfast=true\nhttps://evil.test/',
  'tab in query, telemetry': telemetryBase + '?a=1\tb=2',
  'trailing newline, viewport': viewportBase + '\n',
  'empty URL': '',
};
for (const [name, url] of Object.entries(mustBlock)) {
  assert.strictEqual(classifyLiveRequest('POST', url).action, 'block', `POST must stay blocked: ${name}`);
}

// Other write methods stay blocked on both approved URLs, and a missing or odd method fails closed.
for (const method of ['PUT', 'PATCH', 'DELETE', 'TRACE', 'CONNECT', '', undefined, null]) {
  assert.strictEqual(classifyLiveRequest(method, viewportBase).action, 'block', `viewport with ${method}`);
  assert.strictEqual(classifyLiveRequest(method, telemetry).action, 'block', `telemetry with ${method}`);
}
assert.strictEqual(classifyLiveRequest('POST', undefined).action, 'block');
assert.strictEqual(classifyLiveRequest('POST', null).action, 'block');

// Narrow positives that must keep working: telemetry with or without an ordinary query string, any method case.
assert.strictEqual(classifyLiveRequest('POST', telemetryBase).action, 'mock');
assert.strictEqual(classifyLiveRequest('POST', telemetryBase + '?').action, 'mock');
assert.strictEqual(classifyLiveRequest('post', telemetry).action, 'mock');
assert.strictEqual(classifyLiveRequest('post', viewport).action, 'continue');
// A mocked request is never passed through: only the viewport POST and read-only methods continue.
assert.notStrictEqual(classifyLiveRequest('POST', telemetry).action, 'continue');

console.log('PASS: live request policy (read-only methods, viewport exception, mocked telemetry, and fail-closed writes)');
