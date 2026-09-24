-- 001_init.sql
-- Phase 1: Core schema for Log Management demo
-- Run against a fresh PostgreSQL 15+ database.

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- for gen_random_uuid()

-- =========================================================
-- Tenants
-- =========================================================
CREATE TABLE tenants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE,        -- e.g. 'demoA' — matches "tenant" field in incoming logs
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================
-- Users (AuthN/AuthZ)
-- =========================================================
CREATE TYPE user_role AS ENUM ('admin', 'viewer');

CREATE TABLE users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email          TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  role           user_role NOT NULL DEFAULT 'viewer',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_tenant ON users(tenant_id);

-- =========================================================
-- Logs (core table — see docs/architecture.md for field mapping rationale)
-- =========================================================
CREATE TABLE logs (
  id             BIGSERIAL PRIMARY KEY,
  ts             TIMESTAMPTZ NOT NULL,           -- @timestamp
  tenant         TEXT NOT NULL,                  -- denormalized slug, indexed for fast filter
  source         TEXT NOT NULL,                  -- firewall|crowdstrike|aws|m365|ad|api|network
  vendor         TEXT,
  product        TEXT,
  event_type     TEXT,
  event_subtype  TEXT,
  severity       SMALLINT CHECK (severity BETWEEN 0 AND 10),
  action         TEXT,                           -- allow|deny|create|delete|login|logout|alert
  src_ip         INET,
  dst_ip         INET,
  "user"         TEXT,
  host           TEXT,
  tags           TEXT[] DEFAULT '{}',
  raw            JSONB NOT NULL DEFAULT '{}',     -- full original/normalized payload (process, url,
                                                   -- http_method, status_code, rule_name, rule_id,
                                                   -- cloud.*, src_port, dst_port, protocol, etc.)
  ingested_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Query patterns to optimize for: filter by tenant + time range (always),
-- then optionally source / event_type / severity, then full-text/JSON search on raw.
CREATE INDEX idx_logs_tenant_ts   ON logs (tenant, ts DESC);
CREATE INDEX idx_logs_source      ON logs (source);
CREATE INDEX idx_logs_event_type  ON logs (event_type);
CREATE INDEX idx_logs_severity    ON logs (severity);
CREATE INDEX idx_logs_src_ip      ON logs (src_ip);
CREATE INDEX idx_logs_raw_gin     ON logs USING GIN (raw jsonb_path_ops);
CREATE INDEX idx_logs_tags_gin    ON logs USING GIN (tags);

-- =========================================================
-- Alert rules + fired alerts
-- =========================================================
CREATE TABLE alert_rules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  -- rule config kept generic (JSONB) so new rule types don't need a migration
  -- e.g. {"type":"repeated_failed_login","threshold":5,"window_minutes":5,"group_by":"src_ip"}
  config      JSONB NOT NULL,
  enabled     BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE alerts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id      UUID NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE,
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  details      JSONB NOT NULL DEFAULT '{}',   -- matched log ids, count, src_ip, etc.
  notified     BOOLEAN NOT NULL DEFAULT false -- whether webhook/email was sent
);

CREATE INDEX idx_alerts_tenant_ts ON alerts (tenant_id, triggered_at DESC);

-- =========================================================
-- Retention helper (Phase 6): delete logs older than N days.
-- Called from a scheduled job — see backend/README once implemented.
-- =========================================================
-- Example (not run automatically here):
-- DELETE FROM logs WHERE ts < now() - INTERVAL '7 days';