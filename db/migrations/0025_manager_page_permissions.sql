-- Country Manager pages in the Access matrix: "Your team", "Planned coverage",
-- "Spare accounts" on /manager. Defaults keep what CMs can already do today.
-- Only inserts rows; safe to re-run (never overwrites a changed default).
-- Run via: npm run db:migrate (or run this file alone)

BEGIN;

INSERT INTO admin_permission_pages (page_key, label, sort_order) VALUES
  ('manager_team', 'Your team (employees & accounts)', 110),
  ('manager_coverage', 'Planned coverage', 120),
  ('manager_spare', 'Spare accounts', 130)
ON CONFLICT (page_key) DO UPDATE
SET label = EXCLUDED.label,
    sort_order = EXCLUDED.sort_order;

INSERT INTO admin_role_permission_defaults
  (role, page_key, can_create, can_read, can_update, can_delete)
VALUES
  ('manager', 'manager_team',     TRUE,  TRUE, TRUE,  TRUE),
  ('manager', 'manager_coverage', FALSE, TRUE, FALSE, FALSE),
  ('manager', 'manager_spare',    FALSE, TRUE, TRUE,  FALSE)
ON CONFLICT (role, page_key) DO NOTHING;

COMMIT;
