-- OP scoped access: one strategy project + assigned countries
-- Run via: npm run db:migrate

BEGIN;

ALTER TABLE temp_users
  ADD COLUMN IF NOT EXISTS op_project_slug VARCHAR(100);

CREATE TABLE IF NOT EXISTS temp_op_countries (
  user_id INT NOT NULL REFERENCES temp_users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  country VARCHAR(100) NOT NULL,
  PRIMARY KEY (user_id, country)
);

CREATE INDEX IF NOT EXISTS idx_temp_op_countries_country
  ON temp_op_countries(country);

CREATE INDEX IF NOT EXISTS idx_temp_users_op_project_slug
  ON temp_users(op_project_slug)
  WHERE op_project_slug IS NOT NULL;

COMMIT;
