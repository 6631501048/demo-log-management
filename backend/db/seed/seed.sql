-- seed.sql
-- Phase 1: minimal seed so backend has something to auth/query against
-- during Phase 2-3 development. Passwords are placeholders — real hashing
-- happens in backend/scripts/create_user.js (Phase 3), this is just to
-- unblock early testing.

INSERT INTO tenants (slug, name) VALUES
  ('demoA', 'Demo Tenant A'),
  ('demoB', 'Demo Tenant B')
ON CONFLICT (slug) DO NOTHING;

-- NOTE: password_hash below is a placeholder bcrypt hash for the string
-- "password123" — replace via backend/scripts/create_user.js once written.
INSERT INTO users (tenant_id, email, password_hash, role)
SELECT id, 'admin@demoA.local', '$2b$10$PLACEHOLDER_REPLACE_IN_PHASE3', 'admin'
FROM tenants WHERE slug = 'demoA'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (tenant_id, email, password_hash, role)
SELECT id, 'viewer@demoA.local', '$2b$10$PLACEHOLDER_REPLACE_IN_PHASE3', 'viewer'
FROM tenants WHERE slug = 'demoA'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (tenant_id, email, password_hash, role)
SELECT id, 'admin@demoB.local', '$2b$10$PLACEHOLDER_REPLACE_IN_PHASE3', 'admin'
FROM tenants WHERE slug = 'demoB'
ON CONFLICT (email) DO NOTHING;

-- Example alert rule matching the assignment's suggested scenario:
-- "repeated failed logins from same IP within 5 minutes"
INSERT INTO alert_rules (tenant_id, name, description, config)
SELECT id,
       'Repeated failed login',
       'Triggers when 5+ failed logins occur from the same src_ip within 5 minutes',
       '{"type":"repeated_failed_login","threshold":5,"window_minutes":5,"group_by":"src_ip","event_type":"LogonFailed"}'::jsonb
FROM tenants WHERE slug = 'demoA';
