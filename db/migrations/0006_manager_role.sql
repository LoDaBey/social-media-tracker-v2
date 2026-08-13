-- Manager role, manager assignment, and multi-country support
-- Run via: npm run db:migrate

BEGIN;

-- Expand role check to include manager
ALTER TABLE temp_users
  DROP CONSTRAINT IF EXISTS temp_users_role_check;

ALTER TABLE temp_users
  ADD CONSTRAINT temp_users_role_check
  CHECK (role IN ('employee', 'team_lead', 'admin', 'manager'));

-- Parallel reporting line to team_lead_id
ALTER TABLE temp_users
  ADD COLUMN IF NOT EXISTS manager_id INT REFERENCES temp_users(id)
    ON UPDATE CASCADE ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_temp_users_manager_id ON temp_users(manager_id);

-- Managers may own multiple countries
CREATE TABLE IF NOT EXISTS temp_manager_countries (
  user_id INT NOT NULL REFERENCES temp_users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  country VARCHAR(100) NOT NULL,
  PRIMARY KEY (user_id, country)
);

CREATE INDEX IF NOT EXISTS idx_temp_manager_countries_country
  ON temp_manager_countries(country);

COMMIT;
