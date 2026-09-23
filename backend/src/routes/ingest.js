// backend/src/routes/ingest.js
const express = require('express');
const { normalizeJson } = require('../normalizers');
const { insertLog } = require('../db');

const router = express.Router();

// Optional shared-secret check for machine-to-machine ingest (devices don't
// log in as a user). If INGEST_API_KEY is unset, ingest stays open — useful
// for local dev / the grading demo. Set it for the SaaS deployment.
router.use((req, res, next) => {
  const required = process.env.INGEST_API_KEY;
  if (!required) return next();
  if (req.headers['x-api-key'] !== required) {
    return res.status(401).json({ ok: false, error: 'missing or invalid x-api-key' });
  }
  next();
});

// POST /ingest — accepts one JSON log object (api|crowdstrike|aws|m365|ad).
// See samples/logs/*.json for the exact shape expected of each source.
router.post('/', async (req, res) => {
  try {
    const normalized = normalizeJson(req.body);
    const id = await insertLog(normalized);
    res.status(201).json({ ok: true, id });
  } catch (err) {
    // Bad input (unsupported source, missing tenant) -> 400, not 500.
    console.error('[ingest] error:', err.message);
    res.status(400).json({ ok: false, error: err.message });
  }
});

module.exports = router;
