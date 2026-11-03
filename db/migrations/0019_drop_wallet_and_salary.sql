-- Drop wallet/salary, and rename the alphaa strategy book display name to Main.

DROP TABLE IF EXISTS temp_wallet_transactions;

ALTER TABLE temp_users
  DROP COLUMN IF EXISTS base_salary,
  DROP COLUMN IF EXISTS pay_cycle_start_date;

UPDATE strategy_projects
   SET name = 'Main',
       updated_at = NOW()
 WHERE slug = 'alphaa';
