// tests/rbac.test.js
// Integration test: real HTTP requests against a minimal Express app using
// the actual middleware (not mocked) — verifies the RBAC contract that
// tenant isolation depends on. Run: node --test tests/
process.env.JWT_SECRET = 'test_secret_for_ci';

const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

const { requireAuth, requireRole } = require('../backend/src/middleware/auth');
const { signToken } = require('../backend/src/auth');

function buildTestApp() {
  const app = express();
  app.get('/protected', requireAuth, (req, res) => res.json({ ok: true, user: req.user }));
  app.get('/admin-only', requireAuth, requireRole('admin'), (req, res) => res.json({ ok: true }));
  return app;
}

test('requireAuth rejects requests with no token', async () => {
  const app = buildTestApp();
  const server = app.listen(0);
  const port = server.address().port;
  try {
    const res = await fetch(`http://localhost:${port}/protected`);
    assert.equal(res.status, 401);
  } finally {
    server.close();
  }
});

test('requireAuth accepts a valid token and attaches req.user', async () => {
  const app = buildTestApp();
  const server = app.listen(0);
  const port = server.address().port;
  try {
    const token = signToken({ id: 'u2', email: 'viewer@demoA.local', role: 'viewer', tenant_id: 't1', tenant_slug: 'demoA' });
    const res = await fetch(`http://localhost:${port}/protected`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.user.role, 'viewer');
    assert.equal(body.user.tenant, 'demoA');
  } finally {
    server.close();
  }
});

test('requireRole("admin") blocks a viewer with 403', async () => {
  const app = buildTestApp();
  const server = app.listen(0);
  const port = server.address().port;
  try {
    const token = signToken({ id: 'u2', email: 'viewer@demoA.local', role: 'viewer', tenant_id: 't1', tenant_slug: 'demoA' });
    const res = await fetch(`http://localhost:${port}/admin-only`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(res.status, 403);
  } finally {
    server.close();
  }
});

test('requireRole("admin") allows an admin', async () => {
  const app = buildTestApp();
  const server = app.listen(0);
  const port = server.address().port;
  try {
    const token = signToken({ id: 'u1', email: 'admin@demoA.local', role: 'admin', tenant_id: 't1', tenant_slug: 'demoA' });
    const res = await fetch(`http://localhost:${port}/admin-only`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(res.status, 200);
  } finally {
    server.close();
  }
});
