-- Head of Department (HOO) — full admin workspace access across all projects
-- Run via: npm run db:migrate

BEGIN;

ALTER TABLE temp_users
  DROP CONSTRAINT IF EXISTS temp_users_role_check;

ALTER TABLE temp_users
  ADD CONSTRAINT temp_users_role_check
  CHECK (role IN ('employee', 'team_lead', 'admin', 'manager', 'op', 'hoo'));

COMMIT;
