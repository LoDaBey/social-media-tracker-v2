import { STRATEGY_PLATFORM_LABELS, STRATEGY_SCOPE_LABELS } from "@/lib/strategy-platforms";
import type { StrategyHandlerGapsProps } from "@/types/strategy";

export function StrategyHandlerGaps({ handlers }: StrategyHandlerGapsProps) {
  if (handlers.length === 0) {
    return (
      <p className="text-[13px] text-[var(--color-muted)]">
        Every current handler meets the per-handler template.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[13px] font-semibold text-[var(--color-ink)]">
        Missing vs handler template
      </p>
      <ul className="flex flex-col gap-2">
        {handlers.map((handler) => (
          <li
            key={handler.id ?? handler.fullName}
            className="rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 py-2"
          >
            <p className="text-[13px] font-semibold text-[var(--color-ink)]">
              {handler.fullName}
              {handler.vacant ? (
                <span className="ml-2 text-[12px] font-medium text-[var(--color-muted)]">
                  vacant seat
                </span>
              ) : null}
            </p>
            <p className="mt-1 text-[12px] text-[var(--color-muted)]">
              {handler.lines
                .map((line) => {
                  const scope =
                    line.scope === "all" ? "" : ` ${STRATEGY_SCOPE_LABELS[line.scope]}`;
                  return `${STRATEGY_PLATFORM_LABELS[line.platform]}${scope} ${line.actual}/${line.planned}`;
                })
                .join(" · ")}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
