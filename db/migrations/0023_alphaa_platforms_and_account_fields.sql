-- Let temp_social_media_accounts hold Main (ALPHAA) accounts:
-- the 10 extra ALPHAA platforms plus the per-account fields the ALPHAA sheet exports.
-- Only adds; never removes or rewrites rows. Safe to re-run.
-- Run via: npm run db:migrate

BEGIN;

ALTER TABLE temp_social_media_accounts
  DROP CONSTRAINT IF EXISTS temp_social_media_accounts_platform_check;

ALTER TABLE temp_social_media_accounts
  ADD CONSTRAINT temp_social_media_accounts_platform_check
  CHECK (platform IN (
    'x', 'facebook_personal', 'facebook_umbrella', 'instagram', 'tiktok',
    'threads', 'reddit', 'youtube', 'blogspot', 'telegram', 'website',
    'pinterest', 'turkkitap', 'kizlarsoruyor', 'balatarin'
  ));

-- geo_region: the ALPHAA sheet "Region" column (africa / asia / europe / levant),
-- separate from temp_users.region which is the project ('Alphaa').
ALTER TABLE temp_social_media_accounts
  ADD COLUMN IF NOT EXISTS geo_region VARCHAR(100),
  ADD COLUMN IF NOT EXISTS bio VARCHAR(500),
  ADD COLUMN IF NOT EXISTS rss VARCHAR(2083),
  ADD COLUMN IF NOT EXISTS dropbox VARCHAR(2083),
  ADD COLUMN IF NOT EXISTS is_blogs BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_golden BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_native BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS language1 VARCHAR(255),
  ADD COLUMN IF NOT EXISTS language2 VARCHAR(255);

COMMIT;
