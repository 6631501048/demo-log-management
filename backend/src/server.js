// backend/src/server.js
require('dotenv').config();
const express = require('express');
const ingestRouter = require('./routes/ingest');
const authRouter = require('./routes/auth');
const logsRouter = require('./routes/logs');
const alertsRouter = require('./routes/alerts');
const { startAlertLoop } = require('./alerting/evaluator');
const { startRetentionLoop } = require('./retention');

const app = express();
app.use(express.json({ limit: '2mb' }));

app.get('/healthz', (req, res) => res.json({ ok: true }));

app.use('/ingest', ingestRouter);
app.use('/auth', authRouter);
app.use('/logs', logsRouter); // requires Bearer token — see middleware/auth.js
app.use('/alerts', alertsRouter); // requires Bearer token

const PORT = process.env.APP_PORT || 3000;
app.listen(PORT, () => {
  console.log(`[server] listening on :${PORT}`);
});

// Background alert evaluation loop (see backend/src/alerting/evaluator.js).
// Skips itself in test/CI contexts where DISABLE_ALERT_LOOP is set.
if (!process.env.DISABLE_ALERT_LOOP) {
  const intervalMs = parseInt(process.env.ALERT_CHECK_INTERVAL_MS || '60000', 10);
  startAlertLoop(intervalMs);
}

if (!process.env.DISABLE_RETENTION_LOOP) {
  startRetentionLoop();
}

module.exports = app;