-- =============================================================================
-- Give each Main (ALPHAA) Country Manager their country in temp_manager_countries,
-- so they show as owning that country under MAIN in Orbit.
--
--   * Only managers in the Main project (region 'Alphaa') with NO countries yet.
--     Managers you already ticked by hand (e.g. in the Edit form) are left alone.
--   * Uses the manager's own saved country, and only if it is a Main country
--     (Sudan, Somalia, Palestine, Turkey, Iran).
--   * Adds rows only. Changes nothing else, deletes nothing. Safe to re-run.
-- =============================================================================

BEGIN;

INSERT INTO temp_manager_countries (user_id, country)
SELECT u.id, INITCAP(TRIM(u.country))
  FROM temp_users u
 WHERE u.role = 'manager'
   AND u.region = 'Alphaa'
   AND INITCAP(TRIM(u.country)) IN ('Sudan', 'Somalia', 'Palestine', 'Turkey', 'Iran')
   AND NOT EXISTS (SELECT 1 FROM temp_manager_countries m WHERE m.user_id = u.id)
ON CONFLICT (user_id, country) DO NOTHING;

-- Report (counts only)
SELECT 'Main managers'                         AS item, count(*) AS n
  FROM temp_users WHERE role = 'manager' AND region = 'Alphaa'
UNION ALL
SELECT 'Main managers with a country now', count(DISTINCT u.id)
  FROM temp_users u JOIN temp_manager_countries m ON m.user_id = u.id
 WHERE u.role = 'manager' AND u.region = 'Alphaa'
UNION ALL
SELECT 'Main managers still without a country', count(*)
  FROM temp_users u
 WHERE u.role = 'manager' AND u.region = 'Alphaa'
   AND NOT EXISTS (SELECT 1 FROM temp_manager_countries m WHERE m.user_id = u.id);

COMMIT;
