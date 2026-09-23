// backend/src/auth.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme_use_a_long_random_string';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

/**
 * @param {{id:string, email:string, role:'admin'|'viewer', tenant_id:string, tenant_slug:string}} user
 */
function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenant_id: user.tenant_id,
      tenant: user.tenant_slug, // matches logs.tenant (slug), used for filtering
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET); // throws if invalid/expired
}

module.exports = { hashPassword, verifyPassword, signToken, verifyToken };
