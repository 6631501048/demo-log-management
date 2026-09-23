// backend/src/routes/auth.js
const express = require('express');
const { getUserByEmail } = require('../db');
const { verifyPassword, signToken } = require('../auth');

const router = express.Router();

// POST /auth/login  { email, password } -> { ok, token, user }
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ ok: false, error: 'email and password are required' });
  }
  try {
    const user = await getUserByEmail(email);
    if (!user) {
      // Same error for "no such user" and "wrong password" — don't leak which.
      return res.status(401).json({ ok: false, error: 'invalid email or password' });
    }
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ ok: false, error: 'invalid email or password' });
    }
    const token = signToken(user);
    res.json({
      ok: true,
      token,
      user: { email: user.email, role: user.role, tenant: user.tenant_slug },
    });
  } catch (err) {
    console.error('[auth/login] error:', err.message);
    res.status(500).json({ ok: false, error: 'internal error' });
  }
});

module.exports = router;
