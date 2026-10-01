#!/usr/bin/env node
// samples/trigger_alert_test.js
// Posts 5 LogonFailed events from the same src_ip, timestamped to NOW
// (not the assignment's static 2025-08-20 sample dates), so the
// `repeated_failed_login` alert rule (threshold=5, window=5min) actually
// has a chance to fire when tested live — the static ad_events.json dates
// are fixed in the past and will fall outside any "last N minutes" window
// by the time anyone actually runs this demo.
//
// Usage:
//   node samples/trigger_alert_test.js
//   node samples/trigger_alert_test.js --url http://localhost:3000/ingest --tenant demoA

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, arg, i, arr) => {
    if (arg.startsWith('--')) acc.push([arg.slice(2), arr[i + 1]]);
    return acc;
  }, [])
);
const url = args.url || 'http://localhost:3000/ingest';
const tenant = args.tenant || 'demoA';
const srcIp = args.ip || '203.0.113.77';

async function postOne(offsetSeconds) {
  const ts = new Date(Date.now() - offsetSeconds * 1000).toISOString();
  const body = {
    tenant, source: 'ad', event_id: 4625, event_type: 'LogonFailed',
    user: 'demo\\eve', host: 'DC01', ip: srcIp, logon_type: 3,
    '@timestamp': ts,
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  console.log(`[${res.ok ? 'OK ' : 'FAIL'}] ts=${ts} ->`, json);
}

async function main() {
  console.log(`Posting 5 LogonFailed events from ${srcIp} (tenant=${tenant}) with timestamps in the last ~2 minutes...`);
  // Spread across the last 2 minutes so they're well inside the rule's 5-minute window.
  const offsets = [110, 85, 60, 30, 0];
  for (const off of offsets) {
    await postOne(off);
  }
  console.log('\nDone. Wait up to 60s (ALERT_CHECK_INTERVAL_MS) then check:');
  console.log('  docker compose exec postgres psql -U logmgmt_user -d logmgmt -c "SELECT * FROM alerts;"');
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});