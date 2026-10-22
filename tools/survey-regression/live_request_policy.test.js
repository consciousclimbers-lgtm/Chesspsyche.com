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

console.log('PASS: live request policy (read-only methods, viewport exception, mocked telemetry, and fail-closed writes)');
