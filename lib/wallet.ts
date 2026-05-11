import type { TempUser } from "@/types/db";
import type { WalletSummary } from "@/types/wallet";
import { normalizePgDateColumn } from "@/lib/cairo-date";
import { query } from "@/lib/db";

export type { WalletSummary } from "@/types/wallet";

const CYCLE_LENGTH_DAYS = 30;

type TypeAggRow = {
  type: string;
  cnt: string;
  total: string | null;
};

export async function computeWallet(user: TempUser): Promise<WalletSummary> {
  const cycleStartStr = normalizePgDateColumn(user.pay_cycle_start_date);

  let cycleStart: Date | null = null;
  let cycleEnd: Date | null = null;
  let daysToPayout = CYCLE_LENGTH_DAYS;

  if (cycleStartStr) {
    cycleStart = new Date(`${cycleStartStr}T12:00:00.000Z`);
    cycleEnd = new Date(cycleStart);
    cycleEnd.setDate(cycleEnd.getDate() + CYCLE_LENGTH_DAYS);
    const today = new Date();
    const diff = Math.floor(
      (cycleEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    daysToPayout = Math.max(0, Math.min(CYCLE_LENGTH_DAYS, diff));
  }

  const rows: TypeAggRow[] = cycleStartStr
    ? await query<TypeAggRow>(
        `SELECT type::text,
                COUNT(*)::text AS cnt,
                SUM(amount)::text AS total
           FROM temp_wallet_transactions
          WHERE user_id = $1
            AND cycle_start_date = $2::date
          GROUP BY type`,
        [user.id, cycleStartStr]
      )
    : [];

  let baseSalary = 0;
  let levelAdjustmentTotal = 0;
  let bonusesTotal = 0;
  let bonusesCount = 0;
  let deductionsTotal = 0;
  let deductionsCount = 0;
  let netBalance = 0;

  for (const row of rows) {
    const total = Number(row.total ?? 0);
    const count = Number(row.cnt ?? 0);
    netBalance += total;

    switch (row.type) {
      case "base_salary":
        baseSalary += total;
        break;
      case "level_adjustment":
        levelAdjustmentTotal += total;
        break;
      case "bonus":
        bonusesTotal += total;
        bonusesCount += count;
        break;
      case "deduction":
        deductionsTotal += Math.abs(total);
        deductionsCount += count;
        break;
      case "payout":
        break;
      default:
        break;
    }
  }

  if (!cycleStartStr) {
    netBalance = 0;
    daysToPayout = CYCLE_LENGTH_DAYS;
    cycleStart = null;
    cycleEnd = null;
  }

  return {
    baseSalary,
    levelAdjustmentTotal,
    levelAdjustment: levelAdjustmentTotal,
    bonusesTotal,
    bonusesCount,
    deductionsTotal,
    deductionsCount,
    netBalance,
    daysToPayout,
    cycleStart,
    cycleEnd,
  };
}
