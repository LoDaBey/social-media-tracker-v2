import { query } from "@/lib/db";
import type {
  WalletDailyGrowthStatus,
  WalletHistoryCycleAggregate,
  WalletTransactionListRow,
} from "@/types/wallet";

export async function fetchWalletTransactionsThisCycle(
  userId: number,
  cycleStartDate: string | null
): Promise<WalletTransactionListRow[]> {
  if (!cycleStartDate) return [];
  return query<WalletTransactionListRow>(
    `SELECT twt.id,
            twt.type,
            twt.amount::text,
            twt.reason,
            twt.cycle_start_date::text,
            twt.related_growth_id,
            twt.created_by,
            twt.created_at::text,
            tg.qc_comment,
            creator.full_name AS created_by_name
       FROM temp_wallet_transactions twt
       LEFT JOIN temp_growth tg ON tg.id = twt.related_growth_id
       LEFT JOIN temp_users creator ON creator.id = twt.created_by
      WHERE twt.user_id = $1
        AND twt.cycle_start_date = $2::date
      ORDER BY twt.created_at DESC`,
    [userId, cycleStartDate.slice(0, 10)]
  );
}

export async function fetchWalletHistoryCycles(
  userId: number,
  currentCycleStart: string | null
): Promise<WalletHistoryCycleAggregate[]> {
  const rows = await query<{
    cycle_start_date: string;
    net: string | null;
    opened: string;
    txn_count: string;
    is_paid: boolean | null;
  }>(
    `SELECT cycle_start_date::text,
            SUM(amount)::text AS net,
            MIN(created_at)::text AS opened,
            COUNT(*)::text AS txn_count,
            BOOL_OR(type = 'payout') AS is_paid
       FROM temp_wallet_transactions
      WHERE user_id = $1
        AND ($2::date IS NULL OR cycle_start_date <> $2::date)
      GROUP BY cycle_start_date
      ORDER BY cycle_start_date DESC`,
    [userId, currentCycleStart ? currentCycleStart.slice(0, 10) : null]
  );

  return rows.map((r) => ({
    cycle_start_date: r.cycle_start_date,
    net: r.net ?? "0",
    opened: r.opened,
    txn_count: r.txn_count,
    is_paid: Boolean(r.is_paid),
  }));
}

export async function fetchWalletDailyGrowthStatus(
  userId: number,
  cycleStartDate: string | null
): Promise<WalletDailyGrowthStatus[]> {
  if (!cycleStartDate) return [];
  return query<WalletDailyGrowthStatus>(
    `SELECT g.submission_date::text,
            BOOL_OR(g.qc_status = 'approved') AS has_approved,
            BOOL_OR(g.is_auto_reset) AS has_reset
       FROM temp_growth g
      WHERE g.user_id = $1
        AND g.submission_date >= $2::date
        AND g.submission_date < ($2::date + interval '30 days')
      GROUP BY g.submission_date`,
    [userId, cycleStartDate.slice(0, 10)]
  );
}
