import { ArrowDown, ArrowUp } from "lucide-react";
import type { WalletSummary } from "@/types/wallet";

type Props = {
  wallet: WalletSummary;
};

function formatEgp(value: number) {
  return Math.round(value).toLocaleString("en-US");
}

export function WalletHero({ wallet }: Props) {
  return (
    <div className="mx-auto w-full max-w-[960px] pt-8">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-muted)]">
        Wallet — current cycle
      </p>

      <div className="mt-2 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-end gap-2 text-[var(--color-ink)] tabular-nums">
            <span className="pb-3 text-[24px] font-semibold text-[var(--color-muted)]">EGP</span>
            <span className="text-[72px] font-extrabold leading-none tracking-tight">
              {formatEgp(wallet.netBalance)}
            </span>
          </div>
          <p className="mt-2 text-[14px] font-medium text-[var(--color-muted)]">
            Pays out in {wallet.daysToPayout} days · 30-day cycle
          </p>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-2 lg:w-[280px]">
          <div
            className="rounded-[12px] border border-[var(--color-hairline)] bg-[var(--color-surface)] px-[18px] py-[14px]"
            style={{ boxShadow: "0 1px 2px rgba(20,20,20,.04)" }}
          >
            <p className="text-[12px] font-medium text-[var(--color-muted)]">Base salary</p>
            <p className="mt-1 text-[16px] font-bold tabular-nums text-[var(--color-ink)]">
              {formatEgp(wallet.baseSalary)} EGP
            </p>
          </div>
          <div
            className="rounded-[12px] border border-[var(--color-hairline)] bg-[var(--color-surface)] px-[18px] py-[14px]"
            style={{ boxShadow: "0 1px 2px rgba(20,20,20,.04)" }}
          >
            <p className="text-[12px] font-medium text-[var(--color-muted)]">Bonuses</p>
            <p className="mt-1 flex items-center gap-1 text-[16px] font-bold tabular-nums text-[var(--color-gold)]">
              <ArrowUp className="h-4 w-4" aria-hidden="true" />+
              {formatEgp(wallet.bonusesTotal)} EGP
            </p>
          </div>
          <div
            className="rounded-[12px] border border-[var(--color-hairline)] bg-[var(--color-surface)] px-[18px] py-[14px]"
            style={{ boxShadow: "0 1px 2px rgba(20,20,20,.04)" }}
          >
            <p className="text-[12px] font-medium text-[var(--color-muted)]">Deductions</p>
            <p className="mt-1 flex items-center gap-1 text-[16px] font-bold tabular-nums text-[var(--color-coral)]">
              <ArrowDown className="h-4 w-4" aria-hidden="true" />−
              {formatEgp(wallet.deductionsTotal)} EGP
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
