// backend/src/routes/ingest.js
const express = require('express');
const { normalizeJson } = require('../normalizers');
const { insertLog } = require('../db');

const router = express.Router();

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
