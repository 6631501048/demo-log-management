// backend/src/normalizers/aws.js
// Source: AWS CloudTrail (abridged) sample JSON, e.g.
// { "tenant":"demoB","source":"aws",
//   "cloud":{"service":"iam","account_id":"123456789012","region":"ap-southeast-1"},
//   "event_type":"CreateUser","user":"admin","@timestamp":"2025-08-20T09:10:00Z",
//   "raw": {"eventName":"CreateUser","requestParameters":{"userName":"temp-user"}} }

function normalizeAws(payload) {
  return {
    ts: payload['@timestamp'] || new Date().toISOString(),
    tenant: payload.tenant,
    source: 'aws',
    vendor: 'AWS',
    product: payload.cloud?.service || null,
    event_type: payload.event_type || null,
    event_subtype: null,
    severity: payload.severity ?? null,
    action: payload.action || null,
    src_ip: payload.src_ip || null,
    dst_ip: null,
    user: payload.user || null,
    host: null,
    tags: payload._tags || [],
    // cloud.account_id / cloud.region / cloud.service and the inner
    // CloudTrail `raw` payload all live inside this JSONB blob.
    raw: payload,
  };
}

module.exports = { normalizeAws };
