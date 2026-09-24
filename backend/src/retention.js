// backend/src/retention.js
// Satisfies the assignment's retention requirement (§2.2): "กำหนดเก็บข้อมูล
// ขั้นต่ำ 7 วัน (ลบ/rollover/partition อย่างใดอย่างหนึ่ง)". This uses the
// simplest option — periodic DELETE — which is sufficient for demo data
// volumes. A real deployment at scale would prefer partition-drop instead
// (cheaper than row-by-row DELETE), noted here for the record.

const { pool } = require('./db');

async function runRetentionSweep() {
  const days = parseInt(process.env.RETENTION_DAYS || '7', 10);
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM logs WHERE ts < now() - ($1 || ' days')::interval`,
      [days]
    );
    if (rowCount > 0) {
      console.log(`[retention] deleted ${rowCount} log(s) older than ${days} days`);
    }
  } catch (err) {
    console.error('[retention] sweep failed:', err.message);
  }
}

/** Runs once at boot, then every `intervalMs` (default: once per day). */
function startRetentionLoop(intervalMs = 24 * 60 * 60 * 1000) {
  console.log(`[retention] loop started (every ${intervalMs}ms, keeping ${process.env.RETENTION_DAYS || 7} days)`);
  runRetentionSweep(); // run once at boot too, so a short-lived demo VM still gets one sweep
  return setInterval(() => runRetentionSweep(), intervalMs);
}

module.exports = { runRetentionSweep, startRetentionLoop };
