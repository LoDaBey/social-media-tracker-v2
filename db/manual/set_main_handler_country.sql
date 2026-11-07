-- =============================================================================
-- Mark the Alpha handler who already existed in Orbit (linked by email, e.g. an
-- Asia Operation Manager) as ALSO a Main handler, so their copied Alpha accounts
-- show on the Main pages. Their Orbit role and project do not change.
--
--   * Run by hand AFTER migration 0024 (adds temp_users.main_country).
--   * Reads the old Alpha tables only; changes nothing in them.
--   * Safe to re-run.
-- =============================================================================

BEGIN;

UPDATE temp_users t
   SET main_country = (
         SELECT INITCAP(TRIM(s.country))
           FROM social_media_accounts s
          WHERE s.user_id = m.legacy_id
            AND NULLIF(TRIM(s.country), '') IS NOT NULL
          ORDER BY s.id
          LIMIT 1
       )
  FROM temp_legacy_map m
 WHERE m.temp_id = t.id
   AND m.legacy_table = 'users'
   AND m.how = 'linked_by_email'
   AND t.region <> 'Alphaa';

-- Report (counts only)
SELECT 'people now also Main handlers' AS item, count(*) AS n
  FROM temp_users WHERE NULLIF(TRIM(main_country), '') IS NOT NULL;

COMMIT;
