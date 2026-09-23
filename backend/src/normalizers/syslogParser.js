// backend/src/normalizers/syslogParser.js
// Parses lines like:
//   <134>Aug 20 12:44:56 fw01 vendor=demo product=ngfw action=deny src=10.0.1.10
//     dst=8.8.8.8 spt=5353 dpt=53 proto=udp msg=DNS blocked policy=Block-DNS
//
// This is intentionally lightweight (not a full RFC3164/5424 parser) — good
// enough for the demo's key=value style device logs. Multi-word values
// (e.g. `msg=DNS blocked`) are supported by the token-accumulation approach
// below: a token without "=" is appended to the previous key's value.

const PRI_RE = /^<(\d+)>/;
// "Aug 20 12:44:56" — no year in RFC3164, so we assume current year.
const TS_RE = /^([A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+(\S+)\s+(.*)$/;

function parseSyslogLine(line) {
  const trimmed = line.trim();
  const priMatch = PRI_RE.exec(trimmed);
  const pri = priMatch ? parseInt(priMatch[1], 10) : null;
  const rest = priMatch ? trimmed.slice(priMatch[0].length) : trimmed;

  const tsMatch = TS_RE.exec(rest);
  let timestampRaw = null;
  let host = null;
  let body = rest;
  if (tsMatch) {
    timestampRaw = tsMatch[1];
    host = tsMatch[2];
    body = tsMatch[3];
  }

  // severity = pri % 8 (per RFC3164); facility = floor(pri/8)
  const severity8 = pri != null ? pri % 8 : null;

  // Token-accumulation key=value parsing (handles multi-word values).
  const kv = {};
  let currentKey = null;
  for (const token of body.split(/\s+/)) {
    const eq = token.indexOf('=');
    if (eq > 0) {
      currentKey = token.slice(0, eq);
      kv[currentKey] = token.slice(eq + 1);
    } else if (currentKey && token) {
      kv[currentKey] += ' ' + token;
    }
  }

  return {
    pri,
    severity8,
    timestampRaw,
    host,
    kv,
    raw: line,
  };
}

/** RFC3164 has no year — reconstruct an ISO timestamp using current year. */
function toIso(timestampRaw) {
  if (!timestampRaw) return new Date().toISOString();
  const withYear = `${timestampRaw} ${new Date().getUTCFullYear()}`;
  const d = new Date(withYear + ' UTC');
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

module.exports = { parseSyslogLine, toIso };
