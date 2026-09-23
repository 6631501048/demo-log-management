// backend/src/middleware/auth.js
const { verifyToken } = require('../auth');

/** Requires a valid Bearer token. Attaches req.user = {sub, email, role, tenant_id, tenant}. */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ ok: false, error: 'missing or malformed Authorization header' });
  }
  try {
    req.user = verifyToken(token);
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, error: 'invalid or expired token' });
  }
}

/** Requires req.user.role to be one of `roles`. Must run after requireAuth. */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ ok: false, error: 'insufficient role' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
