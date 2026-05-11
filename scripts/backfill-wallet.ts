import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function main() {
  const { pool } = await import("../lib/db");

  const dedResult = await pool.query<{ n: string }>(
    `WITH ins AS (
       INSERT INTO temp_wallet_transactions (
         user_id,
         type,
         amount,
         reason,
         cycle_start_date,
         related_growth_id,
         created_by
       )
       SELECT
         g.user_id,
         'deduction',
         -g.qc_decision_amount,
         'Rejected submission · '
           || COALESCE(sma.account_handle, '(account)')
           || ' · '
           || g.submission_date::text,
         COALESCE(u.pay_cycle_start_date, g.submission_date),
         g.id,
         g.qc_reviewed_by
       FROM temp_growth g
       JOIN temp_social_media_accounts sma ON sma.id = g.social_media_account_id
       JOIN temp_users u ON u.id = g.user_id
       WHERE g.qc_status = 'rejected_with_deduction'
         AND g.qc_decision_amount > 0
       ON CONFLICT (related_growth_id) WHERE (type = 'deduction') DO NOTHING
       RETURNING id
     )
     SELECT COUNT(*)::text AS n FROM ins`
  );

  const baseResult = await pool.query<{ n: string }>(
    `WITH ins AS (
       INSERT INTO temp_wallet_transactions (
         user_id,
         type,
         amount,
         reason,
         cycle_start_date,
         related_growth_id,
         created_by
       )
       SELECT
         u.id,
         'base_salary',
         u.base_salary,
         'Base salary',
         u.pay_cycle_start_date,
         NULL,
         NULL
       FROM temp_users u
       WHERE u.is_active = TRUE
         AND u.pay_cycle_start_date IS NOT NULL
       ON CONFLICT (user_id, cycle_start_date) WHERE (type = 'base_salary') DO NOTHING
       RETURNING id
     )
     SELECT COUNT(*)::text AS n FROM ins`
  );

  const nDed = Number(dedResult.rows[0]?.n ?? 0);
  const nBase = Number(baseResult.rows[0]?.n ?? 0);

  console.log(`Backfilled ${nDed} deductions, ${nBase} base salaries.`);

  await pool.end();
}

main()
  .then(() => {
    process.exitCode = 0;
  })
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
