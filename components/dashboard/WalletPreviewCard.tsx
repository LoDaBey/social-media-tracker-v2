import Link from "next/link";
import { ArrowDown, ArrowUp, CalendarDays } from "lucide-react";
import type { WalletSummary } from "@/lib/wallet";

type Props = {
  wallet: WalletSummary;
};

function formatEgp(value: number) {
  return Math.round(value).toLocaleString("en-US");
}

export function WalletPreviewCard({ wallet }: Props) {
  return (
    <section
      className="relative bg-[var(--color-surface)] border border-[var(--color-hairline)] p-7 md:basis-[60%]"
      style={{
        borderRadius: "var(--radius-card)",
        boxShadow: "0 1px 2px rgba(20,20,20,.04), 0 12px 32px rgba(20,20,20,.05)",
      }}
      aria-label="Wallet summary"
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-muted)]">
        This Month&apos;s Wallet
      </p>

      <div className="mt-3 flex items-end gap-2 text-[var(--color-ink)] tabular-nums">
        <span className="pb-2 text-[22px] font-semibold text-[var(--color-muted)]">EGP</span>
        <strong className="text-[44px] font-extrabold leading-none">
          {formatEgp(wallet.netBalance)}
        </strong>
      </div>

      <div className="mt-6 flex flex-wrap gap-2 pr-0 sm:pr-36">
        {wallet.bonusesCount > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF5D8] px-3 py-2 text-[12px] font-semibold text-[var(--color-gold)]">
            <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
            +{wallet.bonusesCount}{" "}
            {wallet.bonusesCount === 1 ? "bonus" : "bonuses"}
          </span>
        ) : null}

        {wallet.deductionsCount > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-coral-tint)] px-3 py-2 text-[12px] font-semibold text-[var(--color-coral)]">
            <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
            −{wallet.deductionsCount}{" "}
            {wallet.deductionsCount === 1 ? "deduction" : "deductions"}
          </span>
        ) : null}

        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-cream-tint)] px-3 py-2 text-[12px] font-semibold text-[var(--color-muted)]">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
          {wallet.daysToPayout} days to payout
        </span>
      </div>

      <div className="mt-7 flex justify-end sm:absolute sm:bottom-7 sm:right-7 sm:mt-0">
        <Link
          href="/wallet"
          aria-label="Open wallet"
          className="cursor-pointer rounded-lg px-3 py-2 text-[14px] font-semibold text-[var(--color-emerald)] outline-none transition-colors hover:bg-[var(--color-emerald-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
        >
          Open wallet →
        </Link>
      </div>
    </section>
  );
}
