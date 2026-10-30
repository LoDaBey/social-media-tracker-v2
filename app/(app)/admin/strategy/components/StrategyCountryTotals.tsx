import type { StrategyCountryTotalsProps } from "@/types/strategy";

function TotalRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <p className="text-[13px] text-[var(--color-muted)]">{label}</p>
      <p className="text-[15px] font-semibold tabular-nums text-[var(--color-ink)]">
        {value}
      </p>
    </div>
  );
}

export function StrategyCountryTotals({
  allAccounts,
  target,
  actual,
  missing,
  personal,
  umbrella,
  native,
  showNative,
}: StrategyCountryTotalsProps) {
  return (
    <section aria-label="Account totals" className="px-1">
      <h3 className="text-[12px] font-semibold text-[var(--color-muted)]">Totals</h3>
      <p className="mt-2 text-[12px] text-[var(--color-muted)]">All accounts</p>
      <p className="text-[28px] font-bold leading-none tabular-nums tracking-tight text-[var(--color-ink)]">
        {allAccounts}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px]">
        <span className="text-[var(--color-muted)]">
          On books{" "}
          <span className="font-semibold tabular-nums text-[var(--color-ink)]">
            {actual}
          </span>
          <span className="text-[var(--color-muted)]"> / {target}</span>
        </span>
        {missing > 0 ? (
          <span className="rounded-md bg-[var(--color-coral-tint)] px-1.5 py-0.5 font-semibold tabular-nums text-[var(--color-coral)]">
            {missing} missing
          </span>
        ) : null}
      </div>
      <div className="mt-3 border-t border-[var(--color-hairline)] pt-1">
        <TotalRow label="Personal" value={personal} />
        <TotalRow label="Umbrella" value={umbrella} />
        {showNative ? <TotalRow label="Native" value={native} /> : null}
      </div>
    </section>
  );
}
