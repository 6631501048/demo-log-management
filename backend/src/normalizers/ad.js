// backend/src/normalizers/ad.js
// Source: Microsoft AD/Windows Security Event (abridged) sample JSON, e.g.
// { "tenant":"demoA","source":"ad","event_id":4625,"event_type":"LogonFailed",
//   "user":"demo\\eve","host":"DC01","ip":"203.0.113.77","logon_type":3,
//   "@timestamp":"2025-08-20T11:11:11Z" }
//
// EventID reference (subset relevant to this demo):
//   4624 = successful logon, 4625 = failed logon

const EVENT_ID_SEVERITY = {
  4624: 2,  // informational
  4625: 6,  // failed logon — worth flagging
};

function normalizeAd(payload) {
  const eventId = payload.event_id ?? null;
  return {
    ts: payload['@timestamp'] || new Date().toISOString(),
    tenant: payload.tenant,
    source: 'ad',
    vendor: 'Microsoft',
    product: 'Windows Security',
    event_type: payload.event_type || (eventId ? `EventID_${eventId}` : null),
    event_subtype: eventId != null ? String(eventId) : null,
    severity: payload.severity ?? EVENT_ID_SEVERITY[eventId] ?? null,
    action: eventId === 4625 ? 'deny' : (eventId === 4624 ? 'login' : null),
    src_ip: payload.ip || null,
    dst_ip: null,
    user: payload.user || null,
    host: payload.host || null,
    tags: payload._tags || [],
    raw: payload,
  };
}

module.exports = { normalizeAd };
