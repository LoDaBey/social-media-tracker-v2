"use client";

import {
  scopeCount,
  setScopeCount,
  STRATEGY_PLATFORM_KEYS,
  STRATEGY_PLATFORM_LABELS,
  STRATEGY_SCOPE_LABELS,
  STRATEGY_SCOPES,
} from "@/lib/strategy-platforms";
import type { StrategyTargetsGridProps } from "@/types/strategy";

const inputClass =
  "h-9 w-full rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-2 text-center text-[13px] tabular-nums text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]";

export function StrategyTargetsGrid({
  value,
  onChange,
  label,
}: StrategyTargetsGridProps) {
  const platforms = STRATEGY_PLATFORM_KEYS;

  return (
    <div className="overflow-x-auto rounded-[12px] border border-[var(--color-hairline)]">
      <table className="w-full min-w-[520px] border-collapse text-left" aria-label={label}>
        <thead>
          <tr className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            <th scope="col" className="px-3 py-2">
              Platform
            </th>
            {STRATEGY_SCOPES.map((scope) => (
              <th key={scope} scope="col" className="px-3 py-2">
                {STRATEGY_SCOPE_LABELS[scope]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {platforms.map((platform) => (
            <tr key={platform} className="border-t border-[var(--color-hairline)]">
              <th
                scope="row"
                className="px-3 py-1.5 text-[13px] font-semibold text-[var(--color-ink)]"
              >
                {STRATEGY_PLATFORM_LABELS[platform]}
              </th>
              {STRATEGY_SCOPES.map((scope) => (
                <td key={scope} className="px-2 py-1.5">
                  <input
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    aria-label={`${STRATEGY_PLATFORM_LABELS[platform]} ${STRATEGY_SCOPE_LABELS[scope]}`}
                    className={inputClass}
                    value={scopeCount(value, platform, scope)}
                    onChange={(event) =>
                      onChange(
                        setScopeCount(
                          value,
                          platform,
                          scope,
                          Number(event.target.value)
                        )
                      )
                    }
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
