import {
  editableScopesForPlatform,
  platformTotal,
  scopeCount,
  setScopeCount,
  STRATEGY_PLATFORM_SHORT_LABELS,
  STRATEGY_SCOPE_LABELS,
  strategyDisplayScopesForBook,
} from "@/lib/strategy-platforms";
import { StrategyPlatformIcon } from "./StrategyPlatformIcon";
import type { StrategyAccountScope, StrategyPlatformCardProps } from "@/types/strategy";

const SCOPE_BAR: Record<StrategyAccountScope, string> = {
  personal: "bg-[var(--color-emerald)]",
  umbrella: "bg-[#4A8EC7]",
  native: "bg-[var(--color-gold)]",
};

const inputClass =
  "h-8 w-14 shrink-0 cursor-text rounded outline-none border border-[var(--color-hairline)] bg-[var(--color-surface)] px-1 text-center text-[13px] font-semibold tabular-nums text-[var(--color-ink)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

export function StrategyPlatformCard({
  platform,
  book,
  value,
  onChange,
  readOnly = false,
}: StrategyPlatformCardProps) {
  const scopes = strategyDisplayScopesForBook(book);
  const editable = editableScopesForPlatform(book, platform);
  const total = platformTotal(value, platform);
  const counts = Object.fromEntries(
    scopes.map((scope) => [scope, scopeCount(value, platform, scope)])
  ) as Record<StrategyAccountScope, number>;
  const maxCount = Math.max(...scopes.map((scope) => counts[scope]), 1);

  return (
    <article
      className="relative flex flex-col gap-2.5 rounded-[14px] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-hairline)]"
    >
      <header className="flex items-center gap-2">
        <StrategyPlatformIcon platform={platform} className="h-6 w-6" />
        <h4 className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[var(--color-ink)]">
          {STRATEGY_PLATFORM_SHORT_LABELS[platform]}
        </h4>
        <p className="text-[16px] font-bold tabular-nums text-[var(--color-ink)]">{total}</p>
      </header>

      <ul className="flex flex-col gap-2">
        {scopes.map((scope) => {
          const count = counts[scope];
          const canEdit = editable.includes(scope);
          const width = count <= 0 ? 0 : Math.max(10, (count / maxCount) * 100);

          return (
            <li key={scope} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-[var(--color-muted)]">
                  {STRATEGY_SCOPE_LABELS[scope]}
                </span>
                {canEdit && !readOnly ? (
                  <input
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    aria-label={`${STRATEGY_SCOPE_LABELS[scope]} ${STRATEGY_PLATFORM_SHORT_LABELS[platform]}`}
                    className={inputClass}
                    value={count}
                    onChange={(event) =>
                      onChange(
                        setScopeCount(value, platform, scope, Number(event.target.value))
                      )
                    }
                  />
                ) : (
                  <span className="w-14 text-center text-[13px] font-semibold tabular-nums text-[var(--color-muted)]">
                    {count}
                  </span>
                )}
              </div>
              <div
                className="h-1.5 overflow-hidden rounded-full bg-[var(--color-cream)]"
                aria-hidden="true"
              >
                <div
                  className={`h-1.5 rounded-full ${SCOPE_BAR[scope]}`}
                  style={{ width: `${width}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
