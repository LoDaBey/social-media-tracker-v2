-- Weekly account check-up. Every week (Monday to Sunday, Cairo time) the Country
-- Manager confirms each account once: OK (still active, working, no issues) or
-- Problem (with a short note). A new week starts empty, so nothing is reset by hand.
-- Also adds the admin "Weekly checks" page to the Access matrix.
-- Only creates / inserts; safe to re-run.
-- Run via: npm run db:migrate (or run this file alone)

BEGIN;

CREATE TABLE IF NOT EXISTS temp_account_weekly_checks (
  account_id INT NOT NULL REFERENCES temp_social_media_accounts (id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('ok', 'issue')),
  note TEXT,
  checked_by INT REFERENCES temp_users (id) ON DELETE SET NULL,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (account_id, week_start)
);

CREATE INDEX IF NOT EXISTS temp_account_weekly_checks_week_idx
  ON temp_account_weekly_checks (week_start);

INSERT INTO admin_permission_pages (page_key, label, sort_order) VALUES
  ('checks', 'Weekly checks', 55)
ON CONFLICT (page_key) DO UPDATE
SET label = EXCLUDED.label,
    sort_order = EXCLUDED.sort_order;

INSERT INTO admin_role_permission_defaults
  (role, page_key, can_create, can_read, can_update, can_delete)
VALUES
  ('admin', 'checks', TRUE,  TRUE, TRUE,  TRUE),
  ('hoo',   'checks', FALSE, TRUE, FALSE, FALSE),
  ('op',    'checks', FALSE, TRUE, FALSE, FALSE)
ON CONFLICT (role, page_key) DO NOTHING;

COMMIT;
