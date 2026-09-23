// ingest/batchImporter.js
// Reads every .json file in a directory (default: samples/logs/), where
// each file is either a single log object or an array of log objects, and
// inserts them via the same normalizeJson() dispatcher the HTTP endpoint
// uses — so a file and an API POST of the same payload behave identically.
//
// Run: node ingest/batchImporter.js [path/to/dir]
// Default dir: ../samples/logs relative to this file.

require('dotenv').config({ path: require('path').join(__dirname, '..', 'backend', '.env') });
const fs = require('fs');
const path = require('path');
const { normalizeJson } = require('../backend/src/normalizers');
const { insertLog } = require('../backend/src/db');

async function importFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let data;
  try {
    data = JSON.parse(content);
  } catch (err) {
    console.error(`[batch] skip ${filePath}: invalid JSON (${err.message})`);
    return { ok: 0, fail: 0 };
  }
  const records = Array.isArray(data) ? data : [data];

  let ok = 0, fail = 0;
  for (const record of records) {
    try {
      const normalized = normalizeJson(record);
      const id = await insertLog(normalized);
      ok++;
      console.log(`[batch] ${path.basename(filePath)} -> inserted id=${id} source=${normalized.source}`);
    } catch (err) {
      fail++;
      console.error(`[batch] ${path.basename(filePath)}: failed to insert record —`, err.message);
    }
  }
  return { ok, fail };
}

async function main() {
  const dir = process.argv[2] || path.join(__dirname, '..', 'samples', 'logs');
  if (!fs.existsSync(dir)) {
    console.error(`[batch] directory not found: ${dir}`);
    process.exit(1);
  }
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  if (files.length === 0) {
    console.warn(`[batch] no .json files found in ${dir}`);
    return;
  }

  let totalOk = 0, totalFail = 0;
  for (const file of files) {
    const { ok, fail } = await importFile(path.join(dir, file));
    totalOk += ok;
    totalFail += fail;
  }
  console.log(`[batch] done. inserted=${totalOk} failed=${totalFail}`);
  process.exit(totalFail > 0 ? 1 : 0);
}

main();
