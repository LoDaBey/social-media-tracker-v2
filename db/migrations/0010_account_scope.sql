-- Per-account Personal vs Umbrella flag (sheet export + manager edits)
BEGIN;

ALTER TABLE temp_social_media_accounts
  ADD COLUMN IF NOT EXISTS account_scope VARCHAR(20) NOT NULL DEFAULT 'personal'
    CHECK (account_scope IN ('personal', 'umbrella'));

UPDATE temp_social_media_accounts
   SET account_scope = 'umbrella'
 WHERE platform = 'facebook_umbrella';

COMMIT;
