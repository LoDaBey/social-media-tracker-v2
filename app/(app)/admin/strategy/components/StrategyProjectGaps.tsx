import { strategyNeedsSentence } from "@/lib/strategy-platforms";
import type { StrategyProjectGapsProps } from "@/types/strategy";

export function StrategyProjectGaps({ gaps }: StrategyProjectGapsProps) {
  if (gaps.lines.length === 0) {
    return (
      <p className="text-[13px] text-[var(--color-muted)]">
        Country total is complete ({gaps.totalPlanned} accounts).
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[13px] font-semibold text-[var(--color-ink)]">
        Country still needs
      </p>
      <p className="text-[13px] text-[var(--color-coral)]">
        {strategyNeedsSentence(gaps.lines)}
      </p>
    </div>
  );
}
