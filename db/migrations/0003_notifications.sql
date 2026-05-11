----------------------------------------------------------------------
BEGIN;

CREATE TABLE IF NOT EXISTS temp_notifications (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES temp_users(id) ON UPDATE CASCADE ON DELETE CASCADE,

  -- Routing / categorization
  type VARCHAR(50) NOT NULL,                  -- e.g., submission_approved, submission_rejected, bonus_received, payout_processed, level_changed, targets_changed
  category VARCHAR(50),                        -- e.g., wallet, qc, admin (used for grouping/filtering)

  -- Display content
  title TEXT NOT NULL,
  body TEXT NOT NULL,

  -- Action link
  action_route TEXT,                           -- e.g., "/wallet?highlight=tx_123"

  -- Free-form payload (deduction amount, growth_id, etc.)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Source
  created_by INT REFERENCES temp_users(id) ON UPDATE CASCADE ON DELETE SET NULL,

  -- State
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMP,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tn_user_id ON temp_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_tn_user_unread ON temp_notifications(user_id) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_tn_created_at ON temp_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tn_type ON temp_notifications(type);

COMMIT;
----------------------------------------------------------------------
