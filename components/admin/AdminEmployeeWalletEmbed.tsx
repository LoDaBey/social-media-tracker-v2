import { redirect } from "next/navigation";
import { queryOne } from "@/lib/db";
import { computeWallet } from "@/lib/wallet";
import { fetchWalletTransactionsThisCycle } from "@/lib/wallet-page-data";
import { normalizePgDateColumn } from "@/lib/cairo-date";
import type { TempUser } from "@/types/db";
import { WalletHero } from "@/components/wallet/WalletHero";
import { TransactionRow } from "@/components/wallet/TransactionRow";
import { IssueBonusForm } from "@/components/admin/IssueBonusForm";
import { ProcessPayoutBar } from "@/components/admin/ProcessPayoutBar";

type Props = {
  userId: number;
};

export async function AdminEmployeeWalletEmbed({ userId }: Props) {
  const user = await queryOne<TempUser>(
    `SELECT * FROM temp_users WHERE id = $1`,
    [userId]
  );
  if (!user) redirect("/admin/employees");

  const cycleStartStr = normalizePgDateColumn(user.pay_cycle_start_date);
  const [wallet, transactions] = await Promise.all([
    computeWallet(user),
    fetchWalletTransactionsThisCycle(userId, cycleStartStr),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="text-[14px] text-[var(--color-muted)]">
          Current cycle wallet for{" "}
          <span className="font-semibold text-[var(--color-ink)]">{user.full_name}</span>.
        </p>
        <div className="flex flex-col items-end gap-3">
          <IssueBonusForm userId={userId} />
          <ProcessPayoutBar
            userId={userId}
            daysToPayout={wallet.daysToPayout}
            canForce
          />
        </div>
      </div>

      <WalletHero wallet={wallet} />

      <section aria-label="This cycle activity for employee">
        <h2 className="text-[18px] font-bold text-[var(--color-ink)]">Activity</h2>
        <div className="mt-4 flex flex-col gap-2">
          {transactions.length === 0 ? (
            <p className="py-10 text-center text-[14px] text-[var(--color-muted)]">
              No wallet activity this cycle.
            </p>
          ) : (
            transactions.map((row) => <TransactionRow key={row.id} row={row} />)
          )}
        </div>
      </section>
    </div>
  );
}
