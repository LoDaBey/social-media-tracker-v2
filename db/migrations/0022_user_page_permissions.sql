-- Per-page CRUD permissions for admin workspace roles.
-- Role defaults mirror current product behavior; per-user rows override defaults.
-- Run via: npm run db:migrate

BEGIN;

CREATE TABLE IF NOT EXISTS admin_permission_pages (
  page_key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS admin_role_permission_defaults (
  role TEXT NOT NULL,
  page_key TEXT NOT NULL REFERENCES admin_permission_pages (page_key) ON DELETE CASCADE,
  can_create BOOLEAN NOT NULL DEFAULT FALSE,
  can_read BOOLEAN NOT NULL DEFAULT FALSE,
  can_update BOOLEAN NOT NULL DEFAULT FALSE,
  can_delete BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (role, page_key),
  CONSTRAINT admin_role_permission_defaults_role_check
    CHECK (role IN ('employee', 'team_lead', 'manager', 'op', 'hoo', 'admin'))
);

CREATE TABLE IF NOT EXISTS temp_user_permissions (
  user_id INT NOT NULL REFERENCES temp_users (id) ON DELETE CASCADE,
  page_key TEXT NOT NULL REFERENCES admin_permission_pages (page_key) ON DELETE CASCADE,
  can_create BOOLEAN NOT NULL DEFAULT FALSE,
  can_read BOOLEAN NOT NULL DEFAULT FALSE,
  can_update BOOLEAN NOT NULL DEFAULT FALSE,
  can_delete BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, page_key)
);

CREATE INDEX IF NOT EXISTS temp_user_permissions_user_id_idx
  ON temp_user_permissions (user_id);

INSERT INTO admin_permission_pages (page_key, label, sort_order) VALUES
  ('overview', 'Overview', 10),
  ('employees', 'Employees', 20),
  ('extract', 'Data extract', 30),
  ('spare', 'Spare accounts', 40),
  ('strategy', 'Strategy', 50),
  ('activity', 'Activity', 60)
ON CONFLICT (page_key) DO UPDATE
SET label = EXCLUDED.label,
    sort_order = EXCLUDED.sort_order;

-- Wipe and re-seed role defaults so migration is the source of truth for baselines.
DELETE FROM admin_role_permission_defaults;

-- Admin: full CRUD on every admin page.
INSERT INTO admin_role_permission_defaults
  (role, page_key, can_create, can_read, can_update, can_delete)
VALUES
  ('admin', 'overview',  TRUE,  TRUE, TRUE,  TRUE),
  ('admin', 'employees', TRUE,  TRUE, TRUE,  TRUE),
  ('admin', 'extract',   TRUE,  TRUE, TRUE,  TRUE),
  ('admin', 'spare',     TRUE,  TRUE, TRUE,  TRUE),
  ('admin', 'strategy',  TRUE,  TRUE, TRUE,  TRUE),
  ('admin', 'activity',  TRUE,  TRUE, TRUE,  TRUE);

-- Head of Department: edit most surfaces; Strategy is read-only.
INSERT INTO admin_role_permission_defaults
  (role, page_key, can_create, can_read, can_update, can_delete)
VALUES
  ('hoo', 'overview',  FALSE, TRUE, TRUE,  FALSE),
  ('hoo', 'employees', TRUE,  TRUE, TRUE,  TRUE),
  ('hoo', 'extract',   FALSE, TRUE, FALSE, FALSE),
  ('hoo', 'spare',     FALSE, TRUE, TRUE,  FALSE),
  ('hoo', 'strategy',  FALSE, TRUE, FALSE, FALSE),
  ('hoo', 'activity',  FALSE, TRUE, FALSE, FALSE);

-- Operation Manager: read-only across scoped admin workspace.
INSERT INTO admin_role_permission_defaults
  (role, page_key, can_create, can_read, can_update, can_delete)
VALUES
  ('op', 'overview',  FALSE, TRUE, FALSE, FALSE),
  ('op', 'employees', FALSE, TRUE, FALSE, FALSE),
  ('op', 'extract',   FALSE, TRUE, FALSE, FALSE),
  ('op', 'spare',     FALSE, TRUE, FALSE, FALSE),
  ('op', 'strategy',  FALSE, TRUE, FALSE, FALSE),
  ('op', 'activity',  FALSE, TRUE, FALSE, FALSE);

-- Country Manager / Team Lead / Employee: no admin workspace pages by default.
INSERT INTO admin_role_permission_defaults
  (role, page_key, can_create, can_read, can_update, can_delete)
VALUES
  ('manager', 'overview',  FALSE, FALSE, FALSE, FALSE),
  ('manager', 'employees', FALSE, FALSE, FALSE, FALSE),
  ('manager', 'extract',   FALSE, FALSE, FALSE, FALSE),
  ('manager', 'spare',     FALSE, FALSE, FALSE, FALSE),
  ('manager', 'strategy',  FALSE, FALSE, FALSE, FALSE),
  ('manager', 'activity',  FALSE, FALSE, FALSE, FALSE),
  ('team_lead', 'overview',  FALSE, FALSE, FALSE, FALSE),
  ('team_lead', 'employees', FALSE, FALSE, FALSE, FALSE),
  ('team_lead', 'extract',   FALSE, FALSE, FALSE, FALSE),
  ('team_lead', 'spare',     FALSE, FALSE, FALSE, FALSE),
  ('team_lead', 'strategy',  FALSE, FALSE, FALSE, FALSE),
  ('team_lead', 'activity',  FALSE, FALSE, FALSE, FALSE),
  ('employee', 'overview',  FALSE, FALSE, FALSE, FALSE),
  ('employee', 'employees', FALSE, FALSE, FALSE, FALSE),
  ('employee', 'extract',   FALSE, FALSE, FALSE, FALSE),
  ('employee', 'spare',     FALSE, FALSE, FALSE, FALSE),
  ('employee', 'strategy',  FALSE, FALSE, FALSE, FALSE),
  ('employee', 'activity',  FALSE, FALSE, FALSE, FALSE);

COMMIT;
