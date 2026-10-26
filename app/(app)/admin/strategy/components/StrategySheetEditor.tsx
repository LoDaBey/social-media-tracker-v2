"use client";

import {
  scopeCount,
  setScopeCount,
  STRATEGY_PLATFORM_SHORT_LABELS,
  targetsGrandTotal,
} from "@/lib/strategy-platforms";
import type { StrategySheetEditorProps } from "@/types/strategy";

const inputClass =
  "h-8 w-14 rounded outline-none border border-[var(--color-hairline)] bg-[var(--color-surface)] px-1 text-center text-[13px] tabular-nums text-[var(--color-ink)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]";

export function StrategySheetEditor({
  value,
  onChange,
  label,
  groups,
}: StrategySheetEditorProps) {
  const total = targetsGrandTotal(value);

  return (
    <div className="overflow-x-auto rounded-[12px] border border-[var(--color-hairline)] bg-[var(--color-surface)]">
      <table className="w-max border-collapse text-left" aria-label={label}>
        <thead>
          <tr className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            {groups.map((group) => (
              <th
                key={`${group.label}-${group.scope}`}
                colSpan={group.platforms.length}
                scope="colgroup"
                className="border-b border-r border-[var(--color-hairline)] px-2 py-1.5 text-center last:border-r-0"
              >
                {group.label}
              </th>
            ))}
            <th
              scope="col"
              className="border-b border-[var(--color-hairline)] px-2 py-1.5 text-center"
            >
              Total
            </th>
          </tr>
          <tr className="text-[11px] font-semibold text-[var(--color-muted)]">
            {groups.flatMap((group) =>
              group.platforms.map((platform) => (
                <th
                  key={`${group.label}-${group.scope}-${platform}`}
                  scope="col"
                  className="border-r border-[var(--color-hairline)] px-1 py-1.5 text-center font-medium last:border-r-0"
                >
                  {STRATEGY_PLATFORM_SHORT_LABELS[platform]}
                </th>
              ))
            )}
            <th scope="col" className="px-2 py-1.5 text-center">
              —
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            {groups.flatMap((group) =>
              group.platforms.map((platform) => (
                <td
                  key={`${group.label}-${group.scope}-${platform}`}
                  className="border-r border-[var(--color-hairline)] px-1 py-1 last:border-r-0"
                >
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
            <td className="px-2 py-1 text-center text-[13px] font-semibold tabular-nums text-[var(--color-ink)]">
              {total}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
