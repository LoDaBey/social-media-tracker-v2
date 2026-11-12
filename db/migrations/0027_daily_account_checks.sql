-- Account checks become daily: every day (Cairo time) the Country Manager confirms
-- each account once. The table keeps its name; week_start becomes check_date.
-- Rows saved under 0026 keep their Monday date. Safe to re-run.
-- Run via: npm run db:migrate (or run this file alone)

BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_name = 'temp_account_weekly_checks' AND column_name = 'week_start'
  ) THEN
    ALTER TABLE temp_account_weekly_checks RENAME COLUMN week_start TO check_date;
  END IF;
END $$;

DROP INDEX IF EXISTS temp_account_weekly_checks_week_idx;
CREATE INDEX IF NOT EXISTS temp_account_weekly_checks_date_idx
  ON temp_account_weekly_checks (check_date);

-- Daily-missed notifications are looked up by OP + type.
CREATE INDEX IF NOT EXISTS idx_tn_user_type ON temp_notifications (user_id, type);

UPDATE admin_permission_pages SET label = 'Daily checks' WHERE page_key = 'checks';

COMMIT;
