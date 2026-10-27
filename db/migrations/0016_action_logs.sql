----------------------------------------------------------------------
BEGIN;

-- Orbit activity log. Viewed by admins; written from server actions.
CREATE TABLE IF NOT EXISTS temp_action_logs (
  id SERIAL PRIMARY KEY,
  actor_id INT REFERENCES temp_users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  actor_name TEXT NOT NULL DEFAULT '',
  actor_email TEXT NOT NULL DEFAULT '',
  actor_role VARCHAR(50) NOT NULL DEFAULT '',
  action VARCHAR(50) NOT NULL,
  resource VARCHAR(50) NOT NULL,
  summary TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tal_created_at ON temp_action_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tal_actor_id ON temp_action_logs (actor_id);
CREATE INDEX IF NOT EXISTS idx_tal_action ON temp_action_logs (action);
CREATE INDEX IF NOT EXISTS idx_tal_resource ON temp_action_logs (resource);

COMMIT;
----------------------------------------------------------------------
