-- Temp Employees — initial schema (3 tables)
-- Run via: npm run db:migrate

BEGIN;

-- =========================================================================
-- temp_users
-- =========================================================================
CREATE TABLE IF NOT EXISTS temp_users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'employee'
    CHECK (role IN ('employee', 'team_lead', 'admin')),
  phone VARCHAR(50),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  -- Compensation / cycle
  base_salary NUMERIC(10,2) NOT NULL DEFAULT 0,        -- per 30-day cycle
  pay_cycle_start_date DATE,                            -- start of current cycle
  hire_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Performance
  current_level INT NOT NULL DEFAULT 2
    CHECK (current_level BETWEEN 1 AND 6),

  -- QC reviewer (self-reference)
  team_lead_id INT REFERENCES temp_users(id) ON UPDATE CASCADE ON DELETE SET NULL,

  -- Admin-assigned target counts per platform
  target_x_count INT NOT NULL DEFAULT 0,
  target_facebook_personal_count INT NOT NULL DEFAULT 0,
  target_facebook_umbrella_count INT NOT NULL DEFAULT 0,
  target_instagram_count INT NOT NULL DEFAULT 0,
  target_tiktok_count INT NOT NULL DEFAULT 0,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_temp_users_role ON temp_users(role);
CREATE INDEX IF NOT EXISTS idx_temp_users_team_lead_id ON temp_users(team_lead_id);

-- =========================================================================
-- temp_social_media_accounts
-- =========================================================================
CREATE TABLE IF NOT EXISTS temp_social_media_accounts (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES temp_users(id) ON UPDATE CASCADE ON DELETE CASCADE,

  platform VARCHAR(50) NOT NULL
    CHECK (platform IN ('x', 'facebook_personal', 'facebook_umbrella', 'instagram', 'tiktok')),
  account_name VARCHAR(255) NOT NULL,
  account_handle VARCHAR(255),
  account_url VARCHAR(2083) NOT NULL,

  starting_followers INT NOT NULL DEFAULT 0,
  current_followers INT NOT NULL DEFAULT 0,

  status VARCHAR(50) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'archived', 'suspended')),

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE (user_id, platform, account_url)
);

CREATE INDEX IF NOT EXISTS idx_temp_sma_user_id ON temp_social_media_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_temp_sma_platform ON temp_social_media_accounts(platform);

-- =========================================================================
-- temp_growth
-- =========================================================================
CREATE TABLE IF NOT EXISTS temp_growth (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES temp_users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  social_media_account_id INT NOT NULL REFERENCES temp_social_media_accounts(id) ON UPDATE CASCADE ON DELETE CASCADE,

  submission_date DATE NOT NULL,

  -- Submitted metrics
  followers INT NOT NULL DEFAULT 0,
  posts INT NOT NULL DEFAULT 0,
  retweets_with_content INT NOT NULL DEFAULT 0,   -- X-only
  replies INT NOT NULL DEFAULT 0,
  reels INT NOT NULL DEFAULT 0,                    -- IG/FB/TikTok
  notes TEXT,

  -- Snapshot of targets for that submission day
  target_followers INT NOT NULL DEFAULT 0,
  target_posts INT NOT NULL DEFAULT 0,
  target_retweets_with_content INT NOT NULL DEFAULT 0,
  target_replies INT NOT NULL DEFAULT 0,
  target_reels INT NOT NULL DEFAULT 0,

  -- Submission state
  is_auto_reset BOOLEAN NOT NULL DEFAULT FALSE,    -- TRUE if auto-zeroed after 24h window
  submitted_at TIMESTAMP,

  -- QC review
  qc_status VARCHAR(50) NOT NULL DEFAULT 'pending'
    CHECK (qc_status IN ('pending', 'approved', 'rejected_with_deduction', 'rejected_no_deduction')),
  qc_decision_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  qc_comment TEXT,
  qc_reviewed_by INT REFERENCES temp_users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  qc_reviewed_at TIMESTAMP,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE (social_media_account_id, submission_date)
);

CREATE INDEX IF NOT EXISTS idx_temp_growth_user_id ON temp_growth(user_id);
CREATE INDEX IF NOT EXISTS idx_temp_growth_account_id ON temp_growth(social_media_account_id);
CREATE INDEX IF NOT EXISTS idx_temp_growth_submission_date ON temp_growth(submission_date);
CREATE INDEX IF NOT EXISTS idx_temp_growth_qc_status ON temp_growth(qc_status);

-- =========================================================================
-- updated_at triggers
-- =========================================================================
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_temp_users_updated_at ON temp_users;
CREATE TRIGGER trg_temp_users_updated_at
  BEFORE UPDATE ON temp_users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_temp_sma_updated_at ON temp_social_media_accounts;
CREATE TRIGGER trg_temp_sma_updated_at
  BEFORE UPDATE ON temp_social_media_accounts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_temp_growth_updated_at ON temp_growth;
CREATE TRIGGER trg_temp_growth_updated_at
  BEFORE UPDATE ON temp_growth
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

COMMIT;
