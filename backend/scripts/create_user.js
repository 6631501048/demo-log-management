// backend/scripts/create_user.js
// Creates (or updates the password of) a user with a real bcrypt hash —
// resolves the TODO left in backend/db/seed/seed.sql from Phase 1.
//
// Usage:
//   node scripts/create_user.js --email admin@demoA.local --password secret123 --role admin --tenant demoA
//   node scripts/create_user.js --email viewer@demoA.local --password secret123 --role viewer --tenant demoA

require('dotenv').config();
const { pool } = require('../src/db');
const { hashPassword } = require('../src/auth');

function parseArgs() {
  const args = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 2) {
    args[argv[i].replace(/^--/, '')] = argv[i + 1];
  }
  return args;
}

async function main() {
  const { email, password, role, tenant } = parseArgs();
  if (!email || !password || !role || !tenant) {
    console.error('Usage: node scripts/create_user.js --email <e> --password <p> --role <admin|viewer> --tenant <slug>');
    process.exit(1);
  }
  if (!['admin', 'viewer'].includes(role)) {
    console.error('--role must be "admin" or "viewer"');
    process.exit(1);
  }

  const { rows: tenantRows } = await pool.query('SELECT id FROM tenants WHERE slug = $1', [tenant]);
  if (tenantRows.length === 0) {
    console.error(`No tenant with slug "${tenant}". Create it first (see backend/db/seed/seed.sql).`);
    process.exit(1);
  }
  const tenantId = tenantRows[0].id;
  const hash = await hashPassword(password);

  await pool.query(
    `INSERT INTO users (tenant_id, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role`,
    [tenantId, email, hash, role]
  );

  console.log(`OK: ${email} (${role}, tenant=${tenant}) — password set.`);
  await pool.end();
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});