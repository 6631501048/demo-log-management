// backend/src/routes/logs.js
const express = require('express');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const MAX_LIMIT = 500;
const ALLOWED_SOURCES = ['firewall', 'network', 'api', 'crowdstrike', 'aws', 'm365', 'ad'];

// GET /logs?source=&event_type=&severity_min=&from=&to=&q=&limit=&offset=
// - viewer: forced to their own tenant, `tenant` query param (if any) is ignored
// - admin:  may pass ?tenant=<slug> to view a specific tenant; omitted = own tenant
router.get('/', async (req, res) => {
  const { source, event_type, severity_min, from, to, q } = req.query;
  const limit = Math.min(parseInt(req.query.limit || '100', 10) || 100, MAX_LIMIT);
  const offset = Math.max(parseInt(req.query.offset || '0', 10) || 0, 0);

  // --- tenant scoping (security-critical: enforced server-side, not client-controlled) ---
  let tenant = req.user.tenant;
  if (req.user.role === 'admin' && req.query.tenant) {
    tenant = req.query.tenant; // admin may cross tenants explicitly
  }
  // viewer role: `tenant` is always req.user.tenant, any ?tenant= param is silently ignored

  const conditions = ['tenant = $1'];
  const values = [tenant];

  if (source) {
    if (!ALLOWED_SOURCES.includes(source)) {
      return res.status(400).json({ ok: false, error: `invalid source. one of: ${ALLOWED_SOURCES.join(', ')}` });
    }
    values.push(source);
    conditions.push(`source = $${values.length}`);
  }
  if (event_type) {
    values.push(event_type);
    conditions.push(`event_type = $${values.length}`);
  }
  if (severity_min) {
    values.push(parseInt(severity_min, 10));
    conditions.push(`severity >= $${values.length}`);
  }
  if (from) {
    values.push(from);
    conditions.push(`ts >= $${values.length}`);
  }
  if (to) {
    values.push(to);
    conditions.push(`ts <= $${values.length}`);
  }
  if (q) {
    // simple full-text-ish search across the raw JSONB blob
    values.push(`%${q}%`);
    conditions.push(`raw::text ILIKE $${values.length}`);
  }

  values.push(limit);
  const limitIdx = values.length;
  values.push(offset);
  const offsetIdx = values.length;

  const text = `
    SELECT id, ts, tenant, source, vendor, product, event_type, event_subtype,
           severity, action, src_ip, dst_ip, "user", host, tags, raw
    FROM logs
    WHERE ${conditions.join(' AND ')}
    ORDER BY ts DESC
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;

  try {
    const { rows } = await pool.query(text, values);
    res.json({ ok: true, count: rows.length, results: rows });
  } catch (err) {
    console.error('[logs] query error:', err.message);
    res.status(500).json({ ok: false, error: 'internal error' });
  }
});

// GET /logs/summary?from=&to=  — dashboard aggregates for the caller's tenant
// (admin may override with ?tenant=<slug>, same rule as above)
router.get('/summary', async (req, res) => {
  let tenant = req.user.tenant;
  if (req.user.role === 'admin' && req.query.tenant) {
    tenant = req.query.tenant;
  }
  const from = req.query.from || null;
  const to = req.query.to || null;

  const timeFilter = [];
  const baseValues = [tenant];
  if (from) { baseValues.push(from); timeFilter.push(`ts >= $${baseValues.length}`); }
  if (to)   { baseValues.push(to);   timeFilter.push(`ts <= $${baseValues.length}`); }
  const timeClause = timeFilter.length ? ` AND ${timeFilter.join(' AND ')}` : '';

  try {
    const [topIp, topUser, topEventType, timeline] = await Promise.all([
      pool.query(
        `SELECT src_ip, COUNT(*) AS count FROM logs
         WHERE tenant = $1 AND src_ip IS NOT NULL${timeClause}
         GROUP BY src_ip ORDER BY count DESC LIMIT 10`,
        baseValues
      ),
      pool.query(
        `SELECT "user", COUNT(*) AS count FROM logs
         WHERE tenant = $1 AND "user" IS NOT NULL${timeClause}
         GROUP BY "user" ORDER BY count DESC LIMIT 10`,
        baseValues
      ),
      pool.query(
        `SELECT event_type, COUNT(*) AS count FROM logs
         WHERE tenant = $1 AND event_type IS NOT NULL${timeClause}
         GROUP BY event_type ORDER BY count DESC LIMIT 10`,
        baseValues
      ),
      pool.query(
        `SELECT date_trunc('hour', ts) AS bucket, COUNT(*) AS count FROM logs
         WHERE tenant = $1${timeClause}
         GROUP BY bucket ORDER BY bucket ASC`,
        baseValues
      ),
    ]);

    res.json({
      ok: true,
      tenant,
      top_ip: topIp.rows,
      top_user: topUser.rows,
      top_event_type: topEventType.rows,
      timeline: timeline.rows,
    });
  } catch (err) {
    console.error('[logs/summary] query error:', err.message);
    res.status(500).json({ ok: false, error: 'internal error' });
  }
});

module.exports = router;
