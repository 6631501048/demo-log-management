// backend/src/normalizers/network.js
// Source: Router/network device syslog, e.g.
// <190>Aug 20 13:01:02 r1 if=ge-0/0/1 event=link-down mac=aa:bb:cc:dd:ee:ff
//   reason=carrier-loss

const { toIso } = require('./syslogParser');

function normalizeNetwork(parsed, tenant) {
  const { kv, host, severity8, raw } = parsed;
  return {
    ts: toIso(parsed.timestampRaw),
    tenant,
    source: 'network',
    vendor: null,
    product: null,
    event_type: kv.event || 'network_event',
    event_subtype: kv.if || null,
    severity: severity8 ?? null,
    action: null,
    src_ip: null,
    dst_ip: null,
    user: null,
    host,
    tags: [],
    raw: { ...kv, host, raw_line: raw },
  };
}

module.exports = { normalizeNetwork };
