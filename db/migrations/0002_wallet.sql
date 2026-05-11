BEGIN;

CREATE TABLE IF NOT EXISTS temp_wallet_transactions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES temp_users(id) ON UPDATE CASCADE ON DELETE CASCADE,

  -- Event type
  type VARCHAR(50) NOT NULL
    CHECK (type IN ('base_salary', 'level_adjustment', 'bonus', 'deduction', 'payout')),

  -- Signed: positive for credits, negative for debits.
  amount NUMERIC(10,2) NOT NULL,

  -- Human-readable reason shown in the wallet activity list.
  reason TEXT NOT NULL,

  -- Cycle this transaction belongs to (lets us group history by cycle).
  cycle_start_date DATE NOT NULL,

  -- Optional linkage to a temp_growth row (when the event was a deduction).
  related_growth_id INT REFERENCES temp_growth(id) ON UPDATE CASCADE ON DELETE SET NULL,

  -- Who created the transaction (admin/team_lead for manual events; NULL for system events).
  created_by INT REFERENCES temp_users(id) ON UPDATE CASCADE ON DELETE SET NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_twt_user_id ON temp_wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_twt_cycle_start ON temp_wallet_transactions(cycle_start_date);
CREATE INDEX IF NOT EXISTS idx_twt_type ON temp_wallet_transactions(type);
CREATE INDEX IF NOT EXISTS idx_twt_user_cycle ON temp_wallet_transactions(user_id, cycle_start_date);

-- Prevent duplicate deduction rows for the same growth submission.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_twt_deduction_per_growth
  ON temp_wallet_transactions (related_growth_id)
  WHERE type = 'deduction';

-- At most one base_salary credit per user per cycle (backfill / recordBaseSalary idempotency).
CREATE UNIQUE INDEX IF NOT EXISTS uniq_twt_base_salary_per_cycle
  ON temp_wallet_transactions (user_id, cycle_start_date)
  WHERE type = 'base_salary';

COMMIT;
