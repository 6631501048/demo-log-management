// backend/src/db.js
// Shared PostgreSQL connection pool. Used by ingest routes, search routes
// (Phase 3), and the ingest/ scripts (syslog listener, batch importer).

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  database: process.env.POSTGRES_DB || 'logmgmt',
  user: process.env.POSTGRES_USER || 'logmgmt_user',
  password: process.env.POSTGRES_PASSWORD || 'changeme',
});

pool.on('error', (err) => {
  // Idle client errors shouldn't crash the process — log and continue.
  console.error('[db] unexpected error on idle client', err);
});

/**
 * Insert one normalized log row.
 * @param {object} n - normalized log object (see normalizers/index.js)
 * @returns {Promise<number>} inserted row id
 */
async function insertLog(n) {
  const text = `
    INSERT INTO logs
      (ts, tenant, source, vendor, product, event_type, event_subtype,
       severity, action, src_ip, dst_ip, "user", host, tags, raw)
    VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
    RETURNING id
  `;
  const values = [
    n.ts, n.tenant, n.source, n.vendor || null, n.product || null,
    n.event_type || null, n.event_subtype || null, n.severity ?? null,
    n.action || null, n.src_ip || null, n.dst_ip || null, n.user || null,
    n.host || null, n.tags || [], n.raw || {},
  ];
  const { rows } = await pool.query(text, values);
  return rows[0].id;
}

/**
 * Fetch a user by email, joined with their tenant slug (needed for JWT claim
 * and for scoping log queries). Returns undefined if not found.
 */
async function getUserByEmail(email) {
  const text = `
    SELECT u.id, u.email, u.password_hash, u.role, u.tenant_id, t.slug AS tenant_slug
    FROM users u
    JOIN tenants t ON t.id = u.tenant_id
    WHERE u.email = $1
  `;
  const { rows } = await pool.query(text, [email]);
  return rows[0];
}

module.exports = { pool, insertLog, getUserByEmail };
