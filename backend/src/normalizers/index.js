// backend/src/normalizers/index.js
// Central dispatch for JSON-shaped sources (used by the HTTP /ingest
// endpoint and the batch file importer). Syslog sources (firewall,
// network) are dispatched separately in ingest/syslogListener.js since
// they arrive as raw text lines, not JSON — see firewall.js / network.js.

const { normalizeApi } = require('./api');
const { normalizeCrowdStrike } = require('./crowdstrike');
const { normalizeAws } = require('./aws');
const { normalizeM365 } = require('./m365');
const { normalizeAd } = require('./ad');

const JSON_NORMALIZERS = {
  api: normalizeApi,
  crowdstrike: normalizeCrowdStrike,
  aws: normalizeAws,
  m365: normalizeM365,
  ad: normalizeAd,
};

/**
 * @param {object} payload - parsed JSON body, must include `source` and `tenant`
 * @returns {object} normalized log row ready for db.insertLog()
 * @throws {Error} if `source` is missing/unsupported or `tenant` is missing
 */
function normalizeJson(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('payload must be a JSON object');
  }
  if (!payload.tenant) {
    throw new Error('payload.tenant is required');
  }
  const fn = JSON_NORMALIZERS[payload.source];
  if (!fn) {
    throw new Error(
      `unsupported source "${payload.source}". expected one of: ${Object.keys(JSON_NORMALIZERS).join(', ')}`
    );
  }
  return fn(payload);
}

module.exports = { normalizeJson, JSON_NORMALIZERS };
