import { STRATEGY_PLATFORM_LABELS, STRATEGY_SCOPE_LABELS } from "@/lib/strategy-platforms";
import type { StrategyProjectGapsProps } from "@/types/strategy";

export function StrategyProjectGaps({ gaps }: StrategyProjectGapsProps) {
  if (gaps.lines.length === 0) {
    return (
      <p className="text-[13px] text-[var(--color-muted)]">
        This project matches the current plan ({gaps.totalPlanned} accounts).
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[13px] font-semibold text-[var(--color-ink)]">
        Missing vs project plan
      </p>
      <ul className="flex flex-col gap-1">
        {gaps.lines.map((line) => (
          <li
            key={`${line.platform}-${line.scope}`}
            className="text-[13px] text-[var(--color-ink)]"
          >
            <span className="font-semibold">
              {STRATEGY_PLATFORM_LABELS[line.platform]}
              {line.scope === "all" ? "" : ` ${STRATEGY_SCOPE_LABELS[line.scope]}`}
            </span>
            {": "}
            {line.actual} / {line.planned}
            <span className="text-[var(--color-coral)]">
              {" "}
              ({line.missing} missing)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
