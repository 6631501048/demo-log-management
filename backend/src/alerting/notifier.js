// backend/src/alerting/notifier.js
// Sends a fired alert to a webhook and/or email, depending on which env
// vars are configured. Both are optional — if neither is set, the alert is
// still stored in the DB and visible on the Alerts page (UI notification),
// which alone satisfies the assignment's "แสดงในหน้า Alert หรือส่ง Webhook/Email"
// requirement (it says "or").

const nodemailer = require('nodemailer');

let mailTransport = null;
function getMailTransport() {
  if (mailTransport) return mailTransport;
  if (!process.env.SMTP_HOST) return null;
  mailTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });
  return mailTransport;
}

/**
 * @param {object} alert - row from `alerts` table
 * @param {object} rule - row from `alert_rules` table
 */
async function notify(alert, rule) {
  const results = { webhook: null, email: null };

  const webhookUrl = process.env.ALERT_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rule: rule.name,
          tenant: alert.tenant_slug,
          triggered_at: alert.triggered_at,
          details: alert.details,
        }),
      });
      results.webhook = res.ok ? 'sent' : `failed (${res.status})`;
    } catch (err) {
      results.webhook = `error: ${err.message}`;
    }
  }

  const transport = getMailTransport();
  if (transport && process.env.ALERT_EMAIL_TO) {
    try {
      await transport.sendMail({
        from: process.env.SMTP_USER || 'alerts@log-management.local',
        to: process.env.ALERT_EMAIL_TO,
        subject: `[Alert] ${rule.name} — tenant ${alert.tenant_slug}`,
        text: `Rule "${rule.name}" fired.\n\nDetails: ${JSON.stringify(alert.details, null, 2)}`,
      });
      results.email = 'sent';
    } catch (err) {
      results.email = `error: ${err.message}`;
    }
  }

  if (!webhookUrl && !process.env.ALERT_EMAIL_TO) {
    console.log(`[alerting] rule "${rule.name}" fired (UI-only — no webhook/email configured)`);
  }

  return results;
}

module.exports = { notify };
