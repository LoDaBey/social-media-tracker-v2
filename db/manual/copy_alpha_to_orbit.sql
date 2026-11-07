-- =============================================================================
-- Copy old Alpha (Main) users + social_media_accounts into Orbit temp_* tables.
--
--   * Run by hand (psql / Render shell), NOT via npm run db:migrate.
--   * Requires migration 0023 to be applied first (checked below).
--   * Old Alpha tables are only READ. Nothing in them is changed or deleted.
--   * Safe to re-run: temp_legacy_map remembers every row already copied, so a
--     second run copies only new Alpha rows and never creates duplicates.
--   * DRY RUN BY DEFAULT: the last line is ROLLBACK. Read the counts it prints,
--     then change ROLLBACK to COMMIT and run again to keep the copy.
--
-- Before you run it:
--   1. Make sure the Render export / recovery point is finished.
--   2. Stop new submissions in Alpha (anything added after the copy is not copied
--      unless you re-run this script).
--   3. Review the ROLE MAP below.
-- =============================================================================

BEGIN;

-- Guard: migration 0023 must exist (extra platforms + Alpha account fields).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_name = 'temp_social_media_accounts' AND column_name = 'geo_region'
  ) THEN
    RAISE EXCEPTION 'Run migration 0023_alphaa_platforms_and_account_fields.sql first.';
  END IF;
END $$;

-- Remembers which Alpha row became which Orbit row (prevents duplicates on re-run).
CREATE TABLE IF NOT EXISTS temp_legacy_map (
  legacy_table TEXT NOT NULL,
  legacy_id    INT  NOT NULL,
  temp_id      INT  NOT NULL,
  how          TEXT NOT NULL,           -- inserted / linked_by_email / copied_or_matched_existing
  copied_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (legacy_table, legacy_id)
);

-- -----------------------------------------------------------------------------
-- ROLE MAP — edit before committing.
-- Alpha role (lower-case) -> Orbit role. A role mapped to NULL is NOT copied.
-- Copied users can sign in to Orbit with their current Alpha password, so an
-- Alpha 'admin' mapped to 'admin' gets full Orbit admin access. Decide on purpose.
-- -----------------------------------------------------------------------------
CREATE TEMP TABLE alpha_role_map (alpha_role TEXT PRIMARY KEY, orbit_role TEXT) ON COMMIT DROP;
INSERT INTO alpha_role_map VALUES
  ('handler',     'employee'),
  ('team leader', 'team_lead'),
  ('manager',     'manager'),
  ('admin',       NULL),   -- set to 'admin' only if these people should be Orbit admins
  ('hr',          NULL),   -- no HR role in Orbit
  ('qc',          NULL);   -- no QC role in Orbit

-- -----------------------------------------------------------------------------
-- 1) USERS
-- -----------------------------------------------------------------------------

-- Each Alpha holder's accounts sit in one country; use it (users.country holds
-- home cities like 'Egypt' / 'cairo', which are not project countries).
CREATE TEMP TABLE alpha_user_src ON COMMIT DROP AS
SELECT
  u.id                                        AS legacy_id,
  COALESCE(NULLIF(TRIM(u.username), ''), 'Handler ' || u.id) AS full_name,
  LOWER(TRIM(u.email))                        AS email,
  u.password                                  AS password_hash,
  m.orbit_role                                AS role,
  NULLIF(TRIM(u.phone_number), '')            AS phone,
  COALESCE(u.created_at::date, CURRENT_DATE)  AS hire_date,
  (SELECT INITCAP(TRIM(s.country)) FROM social_media_accounts s
    WHERE s.user_id = u.id AND NULLIF(TRIM(s.country), '') IS NOT NULL
    ORDER BY s.id LIMIT 1)                    AS account_country,
  NULLIF(INITCAP(TRIM(u.country)), '')        AS user_country,
  (SELECT INITCAP(TRIM(s.language1)) FROM social_media_accounts s
    WHERE s.user_id = u.id AND NULLIF(TRIM(s.language1), '') IS NOT NULL
    ORDER BY s.id LIMIT 1)                    AS language
FROM users u
LEFT JOIN alpha_role_map m ON m.alpha_role = LOWER(TRIM(u.role))
WHERE NOT EXISTS (
  SELECT 1 FROM temp_legacy_map lm
   WHERE lm.legacy_table = 'users' AND lm.legacy_id = u.id
);

-- 1a) Same email already in Orbit -> link to that person, do not create a second one.
INSERT INTO temp_legacy_map (legacy_table, legacy_id, temp_id, how)
SELECT 'users', s.legacy_id, t.id, 'linked_by_email'
  FROM alpha_user_src s
  JOIN temp_users t ON LOWER(TRIM(t.email)) = s.email
 WHERE s.role IS NOT NULL;

-- 1b) Everyone else with a mapped role -> new temp_users row in region 'Alphaa'.
INSERT INTO temp_users
  (full_name, email, password_hash, role, phone, is_active, hire_date,
   current_level, region, country, language, employment_status)
SELECT s.full_name, s.email, s.password_hash, s.role, s.phone, TRUE, s.hire_date,
       2, 'Alphaa', COALESCE(s.account_country, s.user_country), s.language, 'active'
  FROM alpha_user_src s
 WHERE s.role IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM temp_users t WHERE LOWER(TRIM(t.email)) = s.email);

INSERT INTO temp_legacy_map (legacy_table, legacy_id, temp_id, how)
SELECT 'users', s.legacy_id, t.id, 'inserted'
  FROM alpha_user_src s
  JOIN temp_users t ON LOWER(TRIM(t.email)) = s.email
 WHERE s.role IS NOT NULL
ON CONFLICT (legacy_table, legacy_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2) SOCIAL MEDIA ACCOUNTS (only for users copied/linked above)
-- -----------------------------------------------------------------------------
CREATE TEMP TABLE alpha_account_src ON COMMIT DROP AS
SELECT
  s.id                                   AS legacy_id,
  um.temp_id                             AS user_id,
  CASE
    WHEN LOWER(TRIM(s.platform)) IN ('twitter', 'x') THEN 'x'
    WHEN LOWER(TRIM(s.platform)) = 'facebook' AND s.umberlla THEN 'facebook_umbrella'
    WHEN LOWER(TRIM(s.platform)) = 'facebook' THEN 'facebook_personal'
    ELSE LOWER(TRIM(s.platform))
  END                                    AS platform,
  COALESCE(NULLIF(TRIM(s.acc_name), ''), NULLIF(TRIM(s.acc_username), ''), 'Pending') AS account_name,
  NULLIF(TRIM(s.acc_username), '')       AS username,
  NULLIF(TRIM(s.acc_url), '')            AS account_url,
  NULLIF(TRIM(s.acc_email), '')          AS account_email,
  s.acc_password_hash                    AS account_password,
  NULLIF(TRIM(s.acc_mobile), '')         AS mobile_number,
  CASE WHEN s.direction IN ('GH-G', 'GH-R') THEN s.direction END AS category,
  CASE WHEN s.umberlla THEN 'umbrella' ELSE 'personal' END       AS account_scope,
  CASE LOWER(TRIM(COALESCE(s.acc_state, '')))
    WHEN 'suspended' THEN 'suspended'
    WHEN 'archived'  THEN 'archived'
    ELSE 'active'
  END                                    AS status,
  COALESCE(s.spare_acc, FALSE)           AS is_spare,
  NULLIF(LOWER(TRIM(s.region)), '')      AS geo_region,
  s.acc_bio                              AS bio,
  s.rss, s.dropbox,
  COALESCE(s.blogs,  FALSE)              AS is_blogs,
  COALESCE(s.golden, FALSE)              AS is_golden,
  COALESCE(s.native, FALSE)              AS is_native,
  s.language1, s.language2,
  s.created_at
FROM social_media_accounts s
JOIN temp_legacy_map um ON um.legacy_table = 'users' AND um.legacy_id = s.user_id
WHERE NOT EXISTS (
  SELECT 1 FROM temp_legacy_map lm
   WHERE lm.legacy_table = 'social_media_accounts' AND lm.legacy_id = s.id
);

INSERT INTO temp_social_media_accounts
  (user_id, platform, account_name, account_handle, account_url, username,
   account_email, account_password, mobile_number, category, account_scope,
   status, is_spare, geo_region, bio, rss, dropbox, is_blogs, is_golden,
   is_native, language1, language2, created_at)
SELECT user_id, platform, account_name, username, account_url, username,
       account_email, account_password, mobile_number, category, account_scope,
       status, is_spare, geo_region, bio, rss, dropbox, is_blogs, is_golden,
       is_native, language1, language2, COALESCE(created_at, CURRENT_TIMESTAMP)
  FROM alpha_account_src a
 WHERE a.platform IN ('x', 'facebook_personal', 'facebook_umbrella', 'instagram', 'tiktok',
                      'threads', 'reddit', 'youtube', 'blogspot', 'telegram', 'website',
                      'pinterest', 'turkkitap', 'kizlarsoruyor', 'balatarin')
ON CONFLICT (user_id, platform, account_url) DO NOTHING;

INSERT INTO temp_legacy_map (legacy_table, legacy_id, temp_id, how)
SELECT 'social_media_accounts', a.legacy_id, t.id, 'copied_or_matched_existing'
  FROM alpha_account_src a
  JOIN temp_social_media_accounts t
    ON t.user_id = a.user_id
   AND t.platform = a.platform
   AND t.account_url IS NOT DISTINCT FROM a.account_url
ON CONFLICT (legacy_table, legacy_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 3) REPORT (counts only)
-- -----------------------------------------------------------------------------
SELECT 'alpha users this run'                          AS item, count(*) AS n FROM alpha_user_src
UNION ALL SELECT 'users skipped: role mapped to NULL', count(*) FROM alpha_user_src WHERE role IS NULL
UNION ALL SELECT 'users linked to existing Orbit person (same email)', count(*) FROM temp_legacy_map WHERE legacy_table = 'users' AND how = 'linked_by_email' AND copied_at = CURRENT_TIMESTAMP
UNION ALL SELECT 'users inserted into temp_users', count(*) FROM temp_legacy_map WHERE legacy_table = 'users' AND how = 'inserted' AND copied_at = CURRENT_TIMESTAMP
UNION ALL SELECT 'users with no country (fix in Orbit)', count(*) FROM temp_users t JOIN temp_legacy_map m ON m.temp_id = t.id AND m.legacy_table = 'users' WHERE t.country IS NULL
UNION ALL SELECT 'alpha accounts this run', count(*) FROM alpha_account_src
UNION ALL SELECT 'accounts copied', count(*) FROM temp_legacy_map WHERE legacy_table = 'social_media_accounts' AND copied_at = CURRENT_TIMESTAMP
UNION ALL SELECT 'accounts NOT copied (unknown platform or duplicate URL)', (SELECT count(*) FROM alpha_account_src) - (SELECT count(*) FROM temp_legacy_map WHERE legacy_table = 'social_media_accounts' AND copied_at = CURRENT_TIMESTAMP)
UNION ALL SELECT 'accounts placed on a non-Main person (linked by email)', count(*) FROM temp_social_media_accounts t JOIN temp_legacy_map m ON m.temp_id = t.id AND m.legacy_table = 'social_media_accounts' JOIN temp_users u ON u.id = t.user_id WHERE u.region <> 'Alphaa'
UNION ALL SELECT 'alpha accounts skipped (owner not copied)', count(*) FROM social_media_accounts s WHERE NOT EXISTS (SELECT 1 FROM temp_legacy_map m WHERE m.legacy_table = 'users' AND m.legacy_id = s.user_id);

-- Optional: people whose NAME matches an Orbit person but whose email differs
-- (possible duplicates). Run separately and check by hand:
--   SELECT u.id AS alpha_id, u.username, u.email, t.id AS orbit_id, t.email AS orbit_email
--     FROM users u JOIN temp_users t ON LOWER(TRIM(t.full_name)) = LOWER(TRIM(u.username))
--    WHERE LOWER(TRIM(t.email)) <> LOWER(TRIM(u.email));

ROLLBACK;  -- dry run. Change to COMMIT to keep the copy.
