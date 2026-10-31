import { Layers } from "lucide-react";
import type { StrategyTotalsHeroProps } from "@/types/strategy";

export function StrategyTotalsHero({ value }: StrategyTotalsHeroProps) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[var(--color-emerald-tint)] text-[var(--color-emerald)]"
        aria-hidden="true"
      >
        <Layers className="h-5 w-5" strokeWidth={2.25} />
      </span>
      <div className="min-w-0">
        <p className="text-[12px] font-medium text-[var(--color-muted)]">
          All Accounts
        </p>
        <p className="text-[26px] font-extrabold leading-none tabular-nums tracking-tight text-[var(--color-ink)]">
          {value}
        </p>
      </div>
    </div>
  );
}
