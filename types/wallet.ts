export type WalletTransactionType =
  | "base_salary"
  | "level_adjustment"
  | "bonus"
  | "deduction"
  | "payout";

export type WalletSummary = {
  baseSalary: number;
  /** Signed level adjustment total for this cycle (from ledger). */
  levelAdjustmentTotal: number;
  /** Alias of levelAdjustmentTotal for existing call sites. */
  levelAdjustment: number;
  bonusesTotal: number;
  bonusesCount: number;
  /** Positive magnitude of deductions this cycle. */
  deductionsTotal: number;
  deductionsCount: number;
  netBalance: number;
  daysToPayout: number;
  cycleStart: Date | null;
  cycleEnd: Date | null;
};

export type WalletTransactionListRow = {
  id: number;
  type: WalletTransactionType;
  amount: string;
  reason: string;
  cycle_start_date: string;
  related_growth_id: number | null;
  created_by: number | null;
  created_at: string;
  qc_comment: string | null;
  created_by_name: string | null;
};

export type WalletHistoryCycleAggregate = {
  cycle_start_date: string;
  net: string;
  opened: string;
  txn_count: string;
  is_paid: boolean;
};

export type WalletDailyGrowthStatus = {
  submission_date: string;
  has_approved: boolean;
  has_reset: boolean;
};
