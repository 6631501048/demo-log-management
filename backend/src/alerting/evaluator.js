// backend/src/alerting/evaluator.js
// Evaluates enabled alert_rules against recent logs. Currently implements
// one rule type — "repeated_failed_login" — which is exactly the example
// scenario the assignment suggests (§2.2): repeated failed logins from the
// same IP within N minutes. The config shape is generic JSONB so more rule
// types can be added later without a schema change.

const { pool } = require('../db');
const { notify } = require('./notifier');

// Whitelisted group-by columns — config.group_by is user-controlled (comes
// from the alert_rules table), so it must never be interpolated into SQL
// without validation.
const ALLOWED_GROUP_BY = { src_ip: 'src_ip', user: '"user"', host: 'host' };

async function loadEnabledRules() {
  const { rows } = await pool.query(`
    SELECT ar.id, ar.name, ar.config, ar.tenant_id, t.slug AS tenant_slug
    FROM alert_rules ar
    JOIN tenants t ON t.id = ar.tenant_id
    WHERE ar.enabled = true
  `);
  return rows;
}

async function evaluateRepeatedFailedLogin(rule) {
  const { threshold, window_minutes, group_by, event_type } = rule.config;
  const groupCol = ALLOWED_GROUP_BY[group_by];
  if (!groupCol) {
    console.warn(`[alerting] rule "${rule.name}": unsupported group_by "${group_by}", skipping`);
    return [];
  }

  const { rows: groups } = await pool.query(
    `
    SELECT ${groupCol} AS group_key, COUNT(*) AS cnt, array_agg(id) AS log_ids, MAX(ts) AS last_ts
    FROM logs
    WHERE tenant = $1
      AND event_type = $2
      AND ts >= now() - ($3 || ' minutes')::interval
      AND ${groupCol} IS NOT NULL
    GROUP BY ${groupCol}
    HAVING COUNT(*) >= $4
    `,
    [rule.tenant_slug, event_type, window_minutes, threshold]
  );

  const fired = [];
  for (const g of groups) {
    // Dedup: don't re-fire for the same rule+group while a prior alert for
    // it is still "fresh" (within the same window) — avoids spamming one
    // alert per cron tick for an ongoing streak.
    const { rows: existing } = await pool.query(
      `
      SELECT id FROM alerts
      WHERE rule_id = $1
        AND details->>'group_key' = $2
        AND triggered_at >= now() - ($3 || ' minutes')::interval
      LIMIT 1
      `,
      [rule.id, String(g.group_key), window_minutes]
    );
    if (existing.length > 0) continue;

    const details = {
      group_by,
      group_key: g.group_key,
      count: Number(g.cnt),
      threshold,
      window_minutes,
      log_ids: g.log_ids,
      event_type,
    };
    const { rows: inserted } = await pool.query(
      `INSERT INTO alerts (rule_id, tenant_id, details) VALUES ($1,$2,$3)
       RETURNING id, rule_id, tenant_id, triggered_at, details, notified`,
      [rule.id, rule.tenant_id, details]
    );
    fired.push({ ...inserted[0], tenant_slug: rule.tenant_slug });
  }
  return fired;
}

async function evaluateRule(rule) {
  switch (rule.config?.type) {
    case 'repeated_failed_login':
      return evaluateRepeatedFailedLogin(rule);
    default:
      console.warn(`[alerting] rule "${rule.name}": unknown type "${rule.config?.type}", skipping`);
      return [];
  }
}

/** Runs one evaluation pass across all enabled rules for all tenants. */
async function runEvaluationCycle() {
  const rules = await loadEnabledRules();
  let totalFired = 0;
  for (const rule of rules) {
    try {
      const firedAlerts = await evaluateRule(rule);
      for (const alert of firedAlerts) {
        const result = await notify(alert, rule);
        await pool.query('UPDATE alerts SET notified = $1 WHERE id = $2', [
          result.webhook === 'sent' || result.email === 'sent',
          alert.id,
        ]);
        totalFired++;
      }
    } catch (err) {
      console.error(`[alerting] error evaluating rule "${rule.name}":`, err.message);
    }
  }
  if (totalFired > 0) {
    console.log(`[alerting] evaluation cycle: ${totalFired} new alert(s) fired`);
  }
  return totalFired;
}

/** Starts the periodic evaluation loop. Returns the interval handle. */
function startAlertLoop(intervalMs) {
  console.log(`[alerting] evaluation loop started (every ${intervalMs}ms)`);
  return setInterval(() => {
    runEvaluationCycle().catch((err) => console.error('[alerting] cycle failed:', err.message));
  }, intervalMs);
}

module.exports = { runEvaluationCycle, startAlertLoop, evaluateRule, loadEnabledRules };
