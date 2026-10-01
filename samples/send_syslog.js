#!/usr/bin/env node
// samples/send_syslog.js
// Node.js equivalent of send_syslog.sh — use this instead when `nc` isn't
// available (e.g. Git Bash on Windows doesn't ship netcat by default).
// Sends the same sample syslog lines via UDP or TCP for testing.
//
// Usage:
//   node send_syslog.js              # UDP to 127.0.0.1:5514
//   node send_syslog.js udp 127.0.0.1 514
//   node send_syslog.js tcp 127.0.0.1 514

const fs = require('fs');
const path = require('path');
const dgram = require('dgram');
const net = require('net');

const proto = (process.argv[2] || 'udp').toLowerCase();
const host = process.argv[3] || '127.0.0.1';
const port = parseInt(process.argv[4] || '5514', 10);
const dir = path.join(__dirname, 'syslog');

function readLines(file) {
  return fs.readFileSync(path.join(dir, file), 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

async function sendUdp(lines) {
  const socket = dgram.createSocket('udp4');
  for (const line of lines) {
    await new Promise((resolve, reject) => {
      socket.send(line, port, host, (err) => (err ? reject(err) : resolve()));
    });
    console.log('  sent:', line);
    await new Promise((r) => setTimeout(r, 200));
  }
  socket.close();
}

async function sendTcp(lines) {
  const socket = net.createConnection(port, host);
  await new Promise((resolve, reject) => {
    socket.once('connect', resolve);
    socket.once('error', reject);
  });
  for (const line of lines) {
    socket.write(line + '\n');
    console.log('  sent:', line);
    await new Promise((r) => setTimeout(r, 200));
  }
  socket.end();
}

async function main() {
  console.log(`Sending sample syslog lines via ${proto} to ${host}:${port} ...`);
  const lines = [...readLines('firewall.log'), ...readLines('network.log')];
  if (proto === 'tcp') {
    await sendTcp(lines);
  } else {
    await sendUdp(lines);
  }
  console.log('Done. Check the syslogListener.js console output and the dashboard/DB.');
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});