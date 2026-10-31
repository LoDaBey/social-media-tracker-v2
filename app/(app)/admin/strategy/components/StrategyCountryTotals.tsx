import { StrategyTotalsHero } from "./StrategyTotalsHero";
import { StrategyTotalsRow } from "./StrategyTotalsRow";
import type { StrategyCountryTotalsProps } from "@/types/strategy";

export function StrategyCountryTotals({
  allAccounts,
  personal,
  umbrella,
  native,
  showNative,
}: StrategyCountryTotalsProps) {
  return (
    <section
      aria-label="Planned holdings"
      className="rounded-[16px] bg-[var(--color-cream-tint)] p-4"
    >
      <h3 className="text-[13px] font-semibold text-[var(--color-ink)]">
        Totals
      </h3>
      <div className="mt-3">
        <StrategyTotalsHero value={allAccounts} />
      </div>
      <div className="mt-4 flex flex-col gap-3">
        <StrategyTotalsRow kind="personal" value={personal} />
        <StrategyTotalsRow kind="umbrella" value={umbrella} />
        {showNative ? <StrategyTotalsRow kind="native" value={native} /> : null}
      </div>
    </section>
  );
}
