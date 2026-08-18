-- Employee code and employment status for temp_users.
-- Run via: npm run db:migrate

BEGIN;

ALTER TABLE temp_users
  ADD COLUMN IF NOT EXISTS employee_code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS employment_status VARCHAR(20) NOT NULL DEFAULT 'active';

ALTER TABLE temp_users
  DROP CONSTRAINT IF EXISTS temp_users_employment_status_check;

ALTER TABLE temp_users
  ADD CONSTRAINT temp_users_employment_status_check
  CHECK (employment_status IN ('active', 'on_hold', 'deactivated'));

UPDATE temp_users
  SET employment_status = 'active'
  WHERE employment_status IS NULL OR employment_status = '';

COMMIT;
