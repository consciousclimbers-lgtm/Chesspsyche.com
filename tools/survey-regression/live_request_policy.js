'use strict';

// The live browser guard never sends the telemetry POST below to Google.
// It mocks that exact endpoint locally with an empty 204 response instead.
// The existing GetViewportInfo POST is retained as an explicitly reviewed read-only exception.
const READ_ONLY_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const READ_ONLY_POSTS = [
  /^https:\/\/maps\.googleapis\.com\/\$rpc\/google\.internal\.maps\.mapsjs\.v1\.MapsJsInternalService\/GetViewportInfo$/
];
const MOCKED_TELEMETRY_POSTS = [
  /^https:\/\/maps\.googleapis\.com\/maps_api_js_slo\/log(?:\?[^#\s]*)?$/
];

function classifyLiveRequest(method, url) {
  const verb = String(method || '').toUpperCase();
  const target = String(url || '');
  if (READ_ONLY_METHODS.has(verb)) return { action: 'continue', reason: 'read-only method' };
  if (verb === 'POST' && READ_ONLY_POSTS.some(re => re.test(target))) {
    return { action: 'continue', reason: 'approved viewport-read POST' };
  }
  if (verb === 'POST' && MOCKED_TELEMETRY_POSTS.some(re => re.test(target))) {
    return { action: 'mock', status: 204, reason: 'external telemetry is stubbed; no network write' };
  }
  return { action: 'block', reason: 'write request not explicitly approved' };
}

module.exports = { classifyLiveRequest, READ_ONLY_METHODS, READ_ONLY_POSTS, MOCKED_TELEMETRY_POSTS };
