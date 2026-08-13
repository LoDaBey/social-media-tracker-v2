-- Move category from temp_users onto each social account
-- Run via: npm run db:migrate

BEGIN;

ALTER TABLE temp_social_media_accounts
  ADD COLUMN IF NOT EXISTS category VARCHAR(20);

ALTER TABLE temp_social_media_accounts
  DROP CONSTRAINT IF EXISTS temp_sma_category_check;

ALTER TABLE temp_social_media_accounts
  ADD CONSTRAINT temp_sma_category_check
  CHECK (category IS NULL OR category IN ('GH-G', 'GH-R'));

ALTER TABLE temp_users
  DROP CONSTRAINT IF EXISTS temp_users_category_check;

ALTER TABLE temp_users
  DROP COLUMN IF EXISTS category;

COMMIT;
