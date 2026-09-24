// backend/src/routes/alerts.js
const express = require('express');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /alerts?limit=&offset=  — same tenant-scoping rule as /logs:
// viewer forced to own tenant; admin may pass ?tenant=<slug>.
router.get('/', async (req, res) => {
  let tenant = req.user.tenant;
  if (req.user.role === 'admin' && req.query.tenant) {
    tenant = req.query.tenant;
  }
  const limit = Math.min(parseInt(req.query.limit || '50', 10) || 50, 200);
  const offset = Math.max(parseInt(req.query.offset || '0', 10) || 0, 0);

  try {
    const { rows } = await pool.query(
      `
      SELECT a.id, a.triggered_at, a.details, a.notified, ar.name AS rule_name
      FROM alerts a
      JOIN alert_rules ar ON ar.id = a.rule_id
      JOIN tenants t ON t.id = a.tenant_id
      WHERE t.slug = $1
      ORDER BY a.triggered_at DESC
      LIMIT $2 OFFSET $3
      `,
      [tenant, limit, offset]
    );
    res.json({ ok: true, count: rows.length, results: rows });
  } catch (err) {
    console.error('[alerts] query error:', err.message);
    res.status(500).json({ ok: false, error: 'internal error' });
  }
});

module.exports = router;
