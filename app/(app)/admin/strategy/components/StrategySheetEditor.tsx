"use client";

import {
  scopeCount,
  setScopeCount,
  STRATEGY_PLATFORM_SHORT_LABELS,
  targetsGrandTotal,
} from "@/lib/strategy-platforms";
import type { StrategySheetEditorProps } from "@/types/strategy";

const inputClass =
  "h-8 w-12 rounded outline-none border border-[var(--color-hairline)] bg-[var(--color-surface)] px-1 text-center text-[13px] tabular-nums text-[var(--color-ink)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]";

export function StrategySheetEditor({
  value,
  onChange,
  label,
  groups,
}: StrategySheetEditorProps) {
  const total = targetsGrandTotal(value);

  return (
    <div className="overflow-x-auto" aria-label={label}>
      <table className="w-max border-collapse text-left">
        <thead>
          <tr className="text-[11px] font-semibold text-[var(--color-muted)]">
            {groups.map((group) => (
              <th
                key={`${group.label}-${group.scope}`}
                colSpan={group.platforms.length}
                scope="colgroup"
                className="px-1 pb-1 pr-3 font-semibold"
              >
                {group.label}
              </th>
            ))}
            <th scope="col" className="px-2 pb-1 text-right">
              Total
            </th>
          </tr>
          <tr className="text-[11px] font-medium text-[var(--color-muted)]">
            {groups.flatMap((group) =>
              group.platforms.map((platform) => (
                <th
                  key={`${group.label}-${group.scope}-${platform}`}
                  scope="col"
                  className="px-1 pb-1 text-center font-medium"
                >
                  {STRATEGY_PLATFORM_SHORT_LABELS[platform]}
                </th>
              ))
            )}
            <th scope="col" className="px-2 pb-1" />
          </tr>
        </thead>
        <tbody>
          <tr>
            {groups.flatMap((group) =>
              group.platforms.map((platform) => (
                <td key={`${group.label}-${group.scope}-${platform}`} className="px-1 py-0.5">
                  <input
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    aria-label={`${group.label} ${STRATEGY_PLATFORM_SHORT_LABELS[platform]}`}
                    className={inputClass}
                    value={scopeCount(value, platform, group.scope)}
                    onChange={(event) =>
                      onChange(
                        setScopeCount(
                          value,
                          platform,
                          group.scope,
                          Number(event.target.value)
                        )
                      )
                    }
                  />
                </td>
              ))
            )}
            <td className="px-2 text-right text-[13px] font-semibold tabular-nums text-[var(--color-ink)]">
              {total}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
