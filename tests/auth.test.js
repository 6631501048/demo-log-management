// tests/auth.test.js
// Run: node --test tests/
process.env.JWT_SECRET = 'test_secret_for_ci';

const test = require('node:test');
const assert = require('node:assert/strict');

const { hashPassword, verifyPassword, signToken, verifyToken } = require('../backend/src/auth');

test('hashPassword produces a bcrypt hash, not the plaintext', async () => {
  const hash = await hashPassword('secret123');
  assert.notEqual(hash, 'secret123');
  assert.ok(hash.startsWith('$2'));
});

test('verifyPassword accepts the correct password and rejects wrong ones', async () => {
  const hash = await hashPassword('secret123');
  assert.equal(await verifyPassword('secret123', hash), true);
  assert.equal(await verifyPassword('wrong-password', hash), false);
});

test('signToken + verifyToken round-trip preserves role/tenant claims', () => {
  const token = signToken({
    id: 'u1', email: 'admin@demoA.local', role: 'admin',
    tenant_id: 't1', tenant_slug: 'demoA',
  });
  const decoded = verifyToken(token);
  assert.equal(decoded.email, 'admin@demoA.local');
  assert.equal(decoded.role, 'admin');
  assert.equal(decoded.tenant, 'demoA');
});

test('verifyToken rejects a garbage token', () => {
  assert.throws(() => verifyToken('not.a.valid.jwt'));
});
