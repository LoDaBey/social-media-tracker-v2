import type { PoolClient } from "pg";
import { LEVEL_LABELS } from "@/lib/level-labels";

export async function recordDeduction(
  client: PoolClient,
  args: {
    user_id: number;
    growth_id: number;
    amount: number;
    reason: string;
    created_by: number | null;
  }
): Promise<number | null> {
  const cycleRow = await client.query<{ d: string }>(
    `SELECT COALESCE(u.pay_cycle_start_date, g.submission_date)::date::text AS d
       FROM temp_users u
       JOIN temp_growth g ON g.user_id = u.id AND g.id = $2
      WHERE u.id = $1`,
    [args.user_id, args.growth_id]
  );
  const cycleStart = cycleRow.rows[0]?.d;
  if (!cycleStart) {
    throw new Error("recordDeduction: could not resolve cycle_start_date");
  }

  const ins = await client.query<{ id: number }>(
    `INSERT INTO temp_wallet_transactions (
       user_id, type, amount, reason, cycle_start_date, related_growth_id, created_by
     ) VALUES ($1, 'deduction', $2, $3, $4::date, $5, $6)
     RETURNING id`,
    [
      args.user_id,
      -Math.abs(Number(args.amount)),
      args.reason,
      cycleStart,
      args.growth_id,
      args.created_by,
    ]
  );
  return ins.rows[0]?.id ?? null;
}

export async function recordBonus(
  client: PoolClient,
  args: {
    user_id: number;
    amount: number;
    reason: string;
    created_by: number | null;
  }
) {
  const cycleRow = await client.query<{ d: string | null }>(
    `SELECT pay_cycle_start_date::date::text AS d FROM temp_users WHERE id = $1`,
    [args.user_id]
  );
  const cycleStart = cycleRow.rows[0]?.d;
  if (!cycleStart) {
    throw new Error("recordBonus: user has no pay_cycle_start_date");
  }

  await client.query(
    `INSERT INTO temp_wallet_transactions (
       user_id, type, amount, reason, cycle_start_date, related_growth_id, created_by
     ) VALUES ($1, 'bonus', $2, $3, $4::date, NULL, $5)`,
    [args.user_id, Math.abs(Number(args.amount)), args.reason, cycleStart, args.created_by]
  );
}

export async function recordBaseSalary(
  client: PoolClient,
  args: { user_id: number; cycle_start_date: string; amount: number }
) {
  const existing = await client.query(
    `SELECT 1 FROM temp_wallet_transactions
      WHERE user_id = $1
        AND type = 'base_salary'
        AND cycle_start_date = $2::date
      LIMIT 1`,
    [args.user_id, args.cycle_start_date]
  );
  if (existing.rowCount && existing.rowCount > 0) return;

  await client.query(
    `INSERT INTO temp_wallet_transactions (
       user_id, type, amount, reason, cycle_start_date, related_growth_id, created_by
     ) VALUES ($1, 'base_salary', $2, $3, $4::date, NULL, NULL)`,
    [args.user_id, Math.abs(Number(args.amount)), "Base salary", args.cycle_start_date]
  );
}

export async function recordLevelAdjustment(
  client: PoolClient,
  args: {
    user_id: number;
    cycle_start_date: string;
    amount: number;
    fromLevel: number;
    toLevel: number;
  }
) {
  const fromLabel = LEVEL_LABELS[args.fromLevel] ?? String(args.fromLevel);
  const toLabel = LEVEL_LABELS[args.toLevel] ?? String(args.toLevel);
  const reason = `Level adjustment: ${fromLabel} → ${toLabel}`;

  await client.query(
    `INSERT INTO temp_wallet_transactions (
       user_id, type, amount, reason, cycle_start_date, related_growth_id, created_by
     ) VALUES ($1, 'level_adjustment', $2, $3, $4::date, NULL, NULL)`,
    [args.user_id, Number(args.amount), reason, args.cycle_start_date]
  );
}

export async function recordPayout(
  client: PoolClient,
  args: { user_id: number; cycle_start_date: string; netAmount: number }
) {
  await client.query(
    `INSERT INTO temp_wallet_transactions (
       user_id, type, amount, reason, cycle_start_date, related_growth_id, created_by
     ) VALUES ($1, 'payout', $2, $3, $4::date, NULL, NULL)`,
    [
      args.user_id,
      -Math.abs(Number(args.netAmount)),
      "Cycle payout",
      args.cycle_start_date,
    ]
  );
}
