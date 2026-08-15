-- Flag bulk-imported holders so managers must review setup before it is complete.
-- Run via: npm run db:migrate

BEGIN;

ALTER TABLE temp_users
  ADD COLUMN IF NOT EXISTS setup_needs_review BOOLEAN NOT NULL DEFAULT FALSE;

COMMIT;
