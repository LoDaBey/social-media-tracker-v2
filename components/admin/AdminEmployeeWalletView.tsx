"use client";

import { WalletHero } from "@/components/wallet/WalletHero";
import { TransactionRow } from "@/components/wallet/TransactionRow";
import { IssueBonusForm } from "@/components/admin/IssueBonusForm";
import { ProcessPayoutBar } from "@/components/admin/ProcessPayoutBar";
import type { AdminEmployeeWalletViewProps } from "@/types/admin";

export function AdminEmployeeWalletView({
  userId,
  fullName,
  wallet,
  transactions,
  onWalletChanged,
}: AdminEmployeeWalletViewProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="text-[14px] text-[var(--color-muted)]">
          Current cycle wallet for{" "}
          <span className="font-semibold text-[var(--color-ink)]">{fullName}</span>.
        </p>
        <div className="flex flex-col items-end gap-3">
          <IssueBonusForm userId={userId} onSuccess={onWalletChanged} />
          <ProcessPayoutBar
            userId={userId}
            daysToPayout={wallet.daysToPayout}
            canForce
            onSuccess={onWalletChanged}
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
