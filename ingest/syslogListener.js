// ingest/syslogListener.js
// Standalone process: listens for syslog on UDP and TCP, classifies each
// line as firewall|network by which key=value fields are present, then
// normalizes and inserts into Postgres.
//
// Run: node ingest/syslogListener.js
// (Requires backend/node_modules — see backend/package.json. Deployed as
// its own container/process in docker-compose — see Phase 6.)
//
// NOTE on tenant: raw syslog carries no tenant field. For this demo, each
// listener instance is associated with one tenant via SYSLOG_DEFAULT_TENANT
// (real deployments would map by source IP / collector config instead —
// documented as a known simplification in docs/architecture.md).

require('dotenv').config({ path: require('path').join(__dirname, '..', 'backend', '.env') });
const dgram = require('dgram');
const net = require('net');
const { parseSyslogLine } = require('../backend/src/normalizers/syslogParser');
const { normalizeFirewall } = require('../backend/src/normalizers/firewall');
const { normalizeNetwork } = require('../backend/src/normalizers/network');
const { insertLog } = require('../backend/src/db');

const UDP_PORT = parseInt(process.env.SYSLOG_UDP_PORT || '5514', 10);
const TCP_PORT = parseInt(process.env.SYSLOG_TCP_PORT || '5514', 10);
const DEFAULT_TENANT = process.env.SYSLOG_DEFAULT_TENANT || 'demoA';

function classifyAndNormalize(line) {
  const parsed = parseSyslogLine(line);
  const { kv } = parsed;
  // Heuristic: firewall messages have action+src, network messages have if+event.
  if (kv.action && (kv.src || kv.dst)) {
    return normalizeFirewall(parsed, DEFAULT_TENANT);
  }
  if (kv.if && kv.event) {
    return normalizeNetwork(parsed, DEFAULT_TENANT);
  }
  // Fallback: still store it as a generic "network" event rather than drop it.
  return normalizeNetwork(parsed, DEFAULT_TENANT);
}

async function handleLine(line, proto, rinfo) {
  const trimmed = line.trim();
  if (!trimmed) return;
  try {
    const normalized = classifyAndNormalize(trimmed);
    const id = await insertLog(normalized);
    console.log(`[syslog:${proto}] inserted id=${id} source=${normalized.source} from=${rinfo}`);
  } catch (err) {
    console.error(`[syslog:${proto}] failed to process line: "${trimmed}" —`, err.message);
  }
}

// --- UDP ---
const udpServer = dgram.createSocket('udp4');
udpServer.on('message', (msg, rinfo) => {
  handleLine(msg.toString('utf8'), 'udp', `${rinfo.address}:${rinfo.port}`);
});
udpServer.on('listening', () => {
  const addr = udpServer.address();
  console.log(`[syslog] UDP listening on ${addr.address}:${addr.port}`);
});
udpServer.bind(UDP_PORT);

// --- TCP ---
const tcpServer = net.createServer((socket) => {
  let buffer = '';
  socket.on('data', (chunk) => {
    buffer += chunk.toString('utf8');
    let idx;
    while ((idx = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      handleLine(line, 'tcp', socket.remoteAddress);
    }
  });
});
tcpServer.listen(TCP_PORT, () => {
  console.log(`[syslog] TCP listening on :${TCP_PORT}`);
});
