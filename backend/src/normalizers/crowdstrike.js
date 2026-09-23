// backend/src/normalizers/crowdstrike.js
// Source: CrowdStrike sample JSON, e.g.
// { "tenant":"demoA","source":"crowdstrike","event_type":"malware_detected",
//   "host":"WIN10-01","process":"powershell.exe","severity":8,
//   "sha256":"abc...","action":"quarantine","@timestamp":"2025-08-20T08:00:00Z" }

function normalizeCrowdStrike(payload) {
  return {
    ts: payload['@timestamp'] || new Date().toISOString(),
    tenant: payload.tenant,
    source: 'crowdstrike',
    vendor: 'CrowdStrike',
    product: 'Falcon',
    event_type: payload.event_type || null,
    event_subtype: null,
    severity: payload.severity ?? null,
    action: payload.action || null,
    src_ip: payload.ip || null,
    dst_ip: null,
    user: payload.user || null,
    host: payload.host || null,
    tags: payload._tags || [],
    // keep sha256/process/etc inside raw — not promoted to columns
    raw: payload,
  };
}

module.exports = { normalizeCrowdStrike };
