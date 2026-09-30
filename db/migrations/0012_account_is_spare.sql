-- Mark Africa/Balkan accounts as spare (excluded from plan KPIs, kept on handlers)
BEGIN;

ALTER TABLE temp_social_media_accounts
  ADD COLUMN IF NOT EXISTS is_spare BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_temp_sma_is_spare
  ON temp_social_media_accounts(is_spare)
  WHERE is_spare = TRUE;

COMMIT;
