#!/usr/bin/env node
// samples/test_rbac.js
// Logs in as a viewer and an admin, then both try GET /logs?tenant=demoB.
// Expected: viewer only ever sees demoA rows (the ?tenant= override is
// ignored server-side); admin actually sees demoB rows. No manual token
// copy-pasting required — this is what testing_guide.md section 5 checks.
//
// Usage: node samples/test_rbac.js [--url http://localhost:3000]

const base = (Object.fromEntries(
  process.argv.slice(2).reduce((acc, arg, i, arr) => {
    if (arg.startsWith('--')) acc.push([arg.slice(2), arr[i + 1]]);
    return acc;
  }, [])
).url) || 'http://localhost:3000';

async function login(email, password) {
  const res = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(`login failed for ${email}: ${json.error}`);
  return json.token;
}

async function queryLogs(token, tenantParam) {
  const res = await fetch(`${base}/logs?tenant=${tenantParam}&limit=5`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

async function main() {
  console.log('--- Logging in as viewer@demoA.local ---');
  const viewerToken = await login('viewer@demoA.local', 'secret123');
  const viewerResult = await queryLogs(viewerToken, 'demoB');
  console.log(`viewer asked for ?tenant=demoB -> got ${viewerResult.count} result(s)`);
  console.log(viewerResult.results.map((r) => ({ source: r.source, tenant: r.tenant })));
  const viewerLeaked = viewerResult.results.some((r) => r.tenant !== 'demoA');
  console.log(viewerLeaked ? '❌ FAIL: viewer saw another tenant\'s data!' : '✅ PASS: viewer only saw its own tenant (demoA), override ignored');

  console.log('\n--- Logging in as admin@demoA.local ---');
  const adminToken = await login('admin@demoA.local', 'secret123');
  const adminResult = await queryLogs(adminToken, 'demoB');
  console.log(`admin asked for ?tenant=demoB -> got ${adminResult.count} result(s)`);
  console.log(adminResult.results.map((r) => ({ source: r.source, tenant: r.tenant })));
  const adminCrossed = adminResult.count > 0 && adminResult.results.every((r) => r.tenant === 'demoB');
  console.log(adminCrossed ? '✅ PASS: admin successfully viewed demoB (cross-tenant override works)' : '❌ FAIL or empty: admin could not view demoB');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});