-- seed.sql
-- Tenants + an example alert rule. User accounts are NOT seeded here —
-- create them with real bcrypt hashes via backend/scripts/create_user.js
-- after running this file, e.g.:
--   node scripts/create_user.js --email admin@demoA.local --password secret123 --role admin --tenant demoA
--   node scripts/create_user.js --email viewer@demoA.local --password secret123 --role viewer --tenant demoA

INSERT INTO tenants (slug, name) VALUES
  ('demoA', 'Demo Tenant A'),
  ('demoB', 'Demo Tenant B')
ON CONFLICT (slug) DO NOTHING;

-- Example alert rule matching the assignment's suggested scenario:
-- "repeated failed logins from same IP within 5 minutes"
INSERT INTO alert_rules (tenant_id, name, description, config)
SELECT id,
       'Repeated failed login',
       'Triggers when 5+ failed logins occur from the same src_ip within 5 minutes',
       '{"type":"repeated_failed_login","threshold":5,"window_minutes":5,"group_by":"src_ip","event_type":"LogonFailed"}'::jsonb
FROM tenants WHERE slug = 'demoA';