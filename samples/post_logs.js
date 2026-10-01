#!/usr/bin/env node
// samples/post_logs.js
// Node.js equivalent of post_logs.py — use this if Python isn't set up
// (e.g. Windows without a real Python install). Posts every sample JSON
// log file to POST /ingest. Handles files with a single object or an
// array of objects (e.g. samples/logs/ad_events.json).
//
// Usage:
//   node post_logs.js
//   node post_logs.js --url http://localhost:3000/ingest

const fs = require('fs');
const path = require('path');

function parseArgs() {
  const args = { url: 'http://localhost:3000/ingest', dir: path.join(__dirname, 'logs') };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 2) {
    if (argv[i] === '--url') args.url = argv[i + 1];
    if (argv[i] === '--dir') args.dir = argv[i + 1];
  }
  return args;
}

async function postOne(url, record) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    const body = await res.json().catch(() => ({}));
    return { ok: res.ok, body };
  } catch (err) {
    return { ok: false, body: { error: err.message } };
  }
}

async function main() {
  const { url, dir } = parseArgs();
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  if (files.length === 0) {
    console.error(`No .json files found in ${dir}`);
    process.exit(1);
  }

  let ok = 0, fail = 0;
  for (const file of files) {
    const content = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    const records = Array.isArray(content) ? content : [content];
    for (const record of records) {
      const result = await postOne(url, record);
      const status = result.ok ? 'OK ' : 'FAIL';
      console.log(`[${status}] ${file} source=${record.source} -> ${JSON.stringify(result.body)}`);
      result.ok ? ok++ : fail++;
    }
  }
  console.log(`\nDone. ok=${ok} fail=${fail}`);
  process.exit(fail ? 1 : 0);
}

main();