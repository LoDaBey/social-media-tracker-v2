-- Allow bulk-imported accounts to land without a URL so managers can complete it.
-- Run via: npm run db:migrate

BEGIN;

ALTER TABLE temp_social_media_accounts
  ALTER COLUMN account_url DROP NOT NULL;

COMMIT;
