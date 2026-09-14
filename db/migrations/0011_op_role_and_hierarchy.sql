-- OP role and manager → OP reporting (Employee → TL → Manager → OP → Admin)
-- Run via: npm run db:migrate

BEGIN;

ALTER TABLE temp_users
  DROP CONSTRAINT IF EXISTS temp_users_role_check;

ALTER TABLE temp_users
  ADD CONSTRAINT temp_users_role_check
  CHECK (role IN ('employee', 'team_lead', 'admin', 'manager', 'op'));

ALTER TABLE temp_users
  ADD COLUMN IF NOT EXISTS op_id INT REFERENCES temp_users(id)
    ON UPDATE CASCADE ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_temp_users_op_id ON temp_users(op_id);

-- Employees report to team leaders only (manager regional is via the team lead).
UPDATE temp_users
   SET manager_id = NULL
 WHERE role = 'employee';

COMMIT;
