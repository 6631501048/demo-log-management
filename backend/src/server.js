// backend/src/server.js
require('dotenv').config();
const express = require('express');
const ingestRouter = require('./routes/ingest');

const app = express();
app.use(express.json({ limit: '2mb' }));

app.get('/healthz', (req, res) => res.json({ ok: true }));

app.use('/ingest', ingestRouter);

// NOTE: /auth and /logs (search) routes are added in Phase 3.

const PORT = process.env.APP_PORT || 3000;
app.listen(PORT, () => {
  console.log(`[server] listening on :${PORT}`);
});

module.exports = app;
