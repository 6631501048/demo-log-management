// backend/src/normalizers/m365.js
// Source: Microsoft 365 Unified Audit Log (abridged) sample JSON, e.g.
// { "tenant":"demoB","source":"m365","event_type":"UserLoggedIn",
//   "user":"bob@demo.local","ip":"198.51.100.23","status":"Success",
//   "workload":"Exchange","@timestamp":"2025-08-20T10:05:00Z" }

function normalizeM365(payload) {
  return {
    ts: payload['@timestamp'] || new Date().toISOString(),
    tenant: payload.tenant,
    source: 'm365',
    vendor: 'Microsoft',
    product: payload.workload || 'M365',
    event_type: payload.event_type || null,
    event_subtype: null,
    severity: payload.severity ?? null,
    action: payload.status === 'Success' ? 'login' : (payload.status ? 'deny' : null),
    src_ip: payload.ip || null,
    dst_ip: null,
    user: payload.user || null,
    host: null,
    tags: payload._tags || [],
    raw: payload,
  };
}

module.exports = { normalizeM365 };
