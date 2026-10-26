-- Align ALPHAA project totals with `102626 Alpha Strategy- Updated .xlsx`
-- Alpha Main Asset (one row per country). Handler templates stay as they are.
-- Idempotent: re-running sets the same JSON.

BEGIN;

UPDATE alphaa_country_plans
   SET project_targets = '{"twitter":{"personal":120,"umbrella":12},"facebook":{"personal":12,"umbrella":12},"tiktok":{"personal":24}}'::jsonb,
       total_accounts = 180,
       resources = 13,
       updated_at = CURRENT_TIMESTAMP
 WHERE country = 'Sudan';

UPDATE alphaa_country_plans
   SET project_targets = '{"twitter":{"personal":74,"umbrella":2},"facebook":{"personal":18,"umbrella":2},"instagram":{"personal":8,"umbrella":2},"threads":{"personal":8,"umbrella":2},"blogspot":{"personal":7},"youtube":{"personal":7,"umbrella":2},"tiktok":{"personal":8,"umbrella":2},"website":{"umbrella":2}}'::jsonb,
       total_accounts = 144,
       resources = 10,
       updated_at = CURRENT_TIMESTAMP
 WHERE country = 'Somalia';

UPDATE alphaa_country_plans
   SET project_targets = '{"twitter":{"personal":30,"umbrella":2},"facebook":{"personal":3,"umbrella":1},"instagram":{"personal":3,"umbrella":3},"threads":{"personal":3},"blogspot":{"personal":3},"youtube":{"personal":3,"umbrella":2},"tiktok":{"personal":3},"telegram":{"native":1}}'::jsonb,
       total_accounts = 57,
       resources = 3,
       updated_at = CURRENT_TIMESTAMP
 WHERE country = 'Palestine';

UPDATE alphaa_country_plans
   SET project_targets = '{"twitter":{"personal":42,"umbrella":5},"facebook":{"personal":4,"umbrella":5},"instagram":{"personal":4,"umbrella":5},"threads":{"personal":4,"umbrella":5},"reddit":{"personal":4,"umbrella":5},"youtube":{"umbrella":1},"tiktok":{"personal":3,"umbrella":2},"blogspot":{"umbrella":5},"website":{"umbrella":1},"pinterest":{"umbrella":1},"turkkitap":{"native":9},"kizlarsoruyor":{"native":5}}'::jsonb,
       total_accounts = 110,
       resources = 6,
       updated_at = CURRENT_TIMESTAMP
 WHERE country = 'Turkey';

UPDATE alphaa_country_plans
   SET project_targets = '{"twitter":{"personal":77,"umbrella":11},"facebook":{"personal":7,"umbrella":11},"instagram":{"personal":7,"umbrella":11},"threads":{"personal":11,"umbrella":11},"reddit":{"personal":7,"umbrella":4},"youtube":{"umbrella":4},"tiktok":{"personal":14,"umbrella":4},"website":{"umbrella":4},"balatarin":{"native":28}}'::jsonb,
       total_accounts = 211,
       resources = 11,
       updated_at = CURRENT_TIMESTAMP
 WHERE country = 'Iran';

COMMIT;
