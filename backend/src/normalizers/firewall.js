// backend/src/normalizers/firewall.js
// Source: Firewall/NGFW syslog, e.g.
// <134>Aug 20 12:44:56 fw01 vendor=demo product=ngfw action=deny src=10.0.1.10
//   dst=8.8.8.8 spt=5353 dpt=53 proto=udp msg=DNS blocked policy=Block-DNS
//
// `parsed` is the output of syslogParser.parseSyslogLine(). `tenant` is
// supplied by the listener config (see ingest/syslogListener.js) since
// syslog itself carries no tenant field — see docs/architecture.md §4.

const { toIso } = require('./syslogParser');

function normalizeFirewall(parsed, tenant) {
  const { kv, host, severity8, raw } = parsed;
  return {
    ts: toIso(parsed.timestampRaw),
    tenant,
    source: 'firewall',
    vendor: kv.vendor || null,
    product: kv.product || null,
    event_type: 'firewall_event',
    event_subtype: kv.policy || null,
    severity: severity8 ?? null,
    action: kv.action || null,
    src_ip: kv.src || null,
    dst_ip: kv.dst || null,
    user: null,
    host,
    tags: [],
    raw: { ...kv, host, raw_line: raw },
  };
}

module.exports = { normalizeFirewall };
