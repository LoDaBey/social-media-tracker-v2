-- User work profile (country / category / language) + per-account credentials
-- Run via: npm run db:migrate

BEGIN;

ALTER TABLE temp_users
  ADD COLUMN IF NOT EXISTS region VARCHAR(50) NOT NULL DEFAULT 'Africa',
  ADD COLUMN IF NOT EXISTS country VARCHAR(100),
  ADD COLUMN IF NOT EXISTS category VARCHAR(20),
  ADD COLUMN IF NOT EXISTS language VARCHAR(100);

ALTER TABLE temp_users
  DROP CONSTRAINT IF EXISTS temp_users_category_check;

ALTER TABLE temp_users
  ADD CONSTRAINT temp_users_category_check
  CHECK (category IS NULL OR category IN ('GH-G', 'GH-R'));

ALTER TABLE temp_social_media_accounts
  ADD COLUMN IF NOT EXISTS username VARCHAR(255),
  ADD COLUMN IF NOT EXISTS account_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS account_password VARCHAR(255),
  ADD COLUMN IF NOT EXISTS email_password VARCHAR(255),
  ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(50);

COMMIT;
