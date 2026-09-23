// backend/src/normalizers/api.js
// Source: generic HTTP API JSON, e.g.
// { "tenant":"demoA","source":"api","event_type":"app_login_failed",
//   "user":"alice","ip":"203.0.113.7","reason":"wrong_password",
//   "@timestamp":"2025-08-20T07:20:00Z" }

function normalizeApi(payload) {
  return {
    ts: payload['@timestamp'] || new Date().toISOString(),
    tenant: payload.tenant,
    source: 'api',
    vendor: payload.vendor || null,
    product: payload.product || null,
    event_type: payload.event_type || null,
    event_subtype: payload.event_subtype || null,
    severity: payload.severity ?? null,
    action: payload.action || (payload.event_type?.includes('failed') ? 'deny' : null),
    src_ip: payload.ip || payload.src_ip || null,
    dst_ip: null,
    user: payload.user || null,
    host: payload.host || null,
    tags: payload._tags || [],
    raw: payload,
  };
}

module.exports = { normalizeApi };
