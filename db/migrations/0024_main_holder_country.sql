-- Lets one Orbit person also be a Main (ALPHAA) handler, e.g. an Operation
-- Manager in Asia who still holds Main accounts. When set, Main pages count this
-- person and their accounts under this country. Empty = no change.
-- Only adds a column; safe to re-run.
-- Run via: npm run db:migrate (or run this file alone)

BEGIN;

ALTER TABLE temp_users
  ADD COLUMN IF NOT EXISTS main_country VARCHAR(100);

COMMIT;
