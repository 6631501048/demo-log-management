// backend/src/server.js
require('dotenv').config();
const express = require('express');
const ingestRouter = require('./routes/ingest');
const authRouter = require('./routes/auth');
const logsRouter = require('./routes/logs');

const app = express();
app.use(express.json({ limit: '2mb' }));

app.get('/healthz', (req, res) => res.json({ ok: true }));

app.use('/ingest', ingestRouter);
app.use('/auth', authRouter);
app.use('/logs', logsRouter); // requires Bearer token — see middleware/auth.js

// NOTE: alert rule CRUD + evaluation cron job are added in Phase 5.

const PORT = process.env.APP_PORT || 3000;
app.listen(PORT, () => {
  console.log(`[server] listening on :${PORT}`);
});

module.exports = app;
