// tests/normalizers.test.js
// Run: node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeJson } = require('../backend/src/normalizers');
const { parseSyslogLine } = require('../backend/src/normalizers/syslogParser');
const { normalizeFirewall } = require('../backend/src/normalizers/firewall');
const { normalizeNetwork } = require('../backend/src/normalizers/network');

test('normalizeJson: api source maps fields correctly', () => {
  const n = normalizeJson({
    tenant: 'demoA', source: 'api', event_type: 'app_login_failed',
    user: 'alice', ip: '203.0.113.7', reason: 'wrong_password',
    '@timestamp': '2025-08-20T07:20:00Z',
  });
  assert.equal(n.tenant, 'demoA');
  assert.equal(n.source, 'api');
  assert.equal(n.user, 'alice');
  assert.equal(n.src_ip, '203.0.113.7');
  assert.equal(n.action, 'deny'); // inferred from event_type containing "failed"
  assert.equal(n.ts, '2025-08-20T07:20:00Z');
});

test('normalizeJson: crowdstrike source keeps sha256 in raw, not promoted to column', () => {
  const n = normalizeJson({
    tenant: 'demoA', source: 'crowdstrike', event_type: 'malware_detected',
    host: 'WIN10-01', process: 'powershell.exe', severity: 8,
    sha256: 'abc123', action: 'quarantine', '@timestamp': '2025-08-20T08:00:00Z',
  });
  assert.equal(n.host, 'WIN10-01');
  assert.equal(n.severity, 8);
  assert.equal(n.action, 'quarantine');
  assert.equal(n.raw.sha256, 'abc123'); // not a column, but preserved in raw
  assert.equal(n.raw.process, 'powershell.exe');
});

test('normalizeJson: aws source pulls cloud.service into product', () => {
  const n = normalizeJson({
    tenant: 'demoB', source: 'aws',
    cloud: { service: 'iam', account_id: '123456789012', region: 'ap-southeast-1' },
    event_type: 'CreateUser', user: 'admin', '@timestamp': '2025-08-20T09:10:00Z',
  });
  assert.equal(n.product, 'iam');
  assert.equal(n.vendor, 'AWS');
  assert.equal(n.raw.cloud.account_id, '123456789012');
});

test('normalizeJson: m365 maps status=Success to action=login', () => {
  const n = normalizeJson({
    tenant: 'demoB', source: 'm365', event_type: 'UserLoggedIn',
    user: 'bob@demo.local', ip: '198.51.100.23', status: 'Success',
    workload: 'Exchange', '@timestamp': '2025-08-20T10:05:00Z',
  });
  assert.equal(n.action, 'login');
  assert.equal(n.product, 'Exchange');
});

test('normalizeJson: ad maps EventID 4625 to deny action + severity 6', () => {
  const n = normalizeJson({
    tenant: 'demoA', source: 'ad', event_id: 4625, event_type: 'LogonFailed',
    user: 'demo\\eve', host: 'DC01', ip: '203.0.113.77', logon_type: 3,
    '@timestamp': '2025-08-20T11:11:11Z',
  });
  assert.equal(n.action, 'deny');
  assert.equal(n.severity, 6);
  assert.equal(n.event_subtype, '4625');
});

test('normalizeJson: unsupported source throws', () => {
  assert.throws(
    () => normalizeJson({ tenant: 'demoA', source: 'not_a_real_source' }),
    /unsupported source/
  );
});

test('normalizeJson: missing tenant throws', () => {
  assert.throws(
    () => normalizeJson({ source: 'api' }),
    /tenant is required/
  );
});

test('syslog: firewall line parses action/src/dst and multi-word msg', () => {
  const line = '<134>Aug 20 12:44:56 fw01 vendor=demo product=ngfw action=deny src=10.0.1.10 dst=8.8.8.8 spt=5353 dpt=53 proto=udp msg=DNS blocked policy=Block-DNS';
  const parsed = parseSyslogLine(line);
  const n = normalizeFirewall(parsed, 'demoA');

  assert.equal(n.source, 'firewall');
  assert.equal(n.action, 'deny');
  assert.equal(n.src_ip, '10.0.1.10');
  assert.equal(n.dst_ip, '8.8.8.8');
  assert.equal(n.host, 'fw01');
  assert.equal(n.raw.msg, 'DNS blocked'); // multi-word value accumulated correctly
  assert.equal(n.raw.policy, 'Block-DNS'); // next key correctly separated
});

test('syslog: network line parses link-down event', () => {
  const line = '<190>Aug 20 13:01:02 r1 if=ge-0/0/1 event=link-down mac=aa:bb:cc:dd:ee:ff reason=carrier-loss';
  const parsed = parseSyslogLine(line);
  const n = normalizeNetwork(parsed, 'demoA');

  assert.equal(n.source, 'network');
  assert.equal(n.event_type, 'link-down');
  assert.equal(n.event_subtype, 'ge-0/0/1');
  assert.equal(n.host, 'r1');
  assert.equal(n.raw.reason, 'carrier-loss');
});
