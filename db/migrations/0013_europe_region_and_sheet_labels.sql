-- Align temp tracker country/language/region labels with Google Sheets
-- (Africa + Europe). Does not touch legacy ALPHAA social_media_accounts.
BEGIN;

-- Region rename: Balkan → Europe
UPDATE temp_users
   SET region = 'Europe'
 WHERE LOWER(TRIM(region)) = 'balkan';

-- Country label used on the Africa sheet dropdown
UPDATE temp_users
   SET country = 'Borkina'
 WHERE country = 'Burkina Faso';

UPDATE temp_manager_countries
   SET country = 'Borkina'
 WHERE country = 'Burkina Faso';

-- Language label used on the Europe sheet dropdown
UPDATE temp_users
   SET language = 'Macdonian'
 WHERE language = 'Macedonian';

COMMIT;
