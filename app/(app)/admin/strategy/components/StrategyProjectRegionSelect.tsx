"use client";

import { uniqueStrategyProjectRegions } from "@/lib/strategy-regions";
import type {
  StrategyProjectRegion,
  StrategyProjectRegionSelectProps,
} from "@/types/strategy";

export function StrategyProjectRegionSelect({
  id,
  value,
  options,
  required = false,
  layout = "stack",
  onChange,
}: StrategyProjectRegionSelectProps) {
  const stacked = layout === "stack";
  const suggestions = uniqueStrategyProjectRegions(
    value ? [...options, value] : options
  );

  return (
    <label
      htmlFor={id}
      className={
        stacked
          ? "flex min-w-0 flex-col gap-1.5 text-[12px] font-semibold text-[var(--color-muted)]"
          : "flex min-w-0 items-center gap-2 text-[12px] font-medium text-[var(--color-muted)]"
      }
    >
      Project region
      <select
        id={id}
        required={required}
        value={value}
        aria-label="Project region"
        onChange={(event) =>
          onChange(event.target.value as StrategyProjectRegion | "")
        }
        className={
          stacked
            ? "h-10 w-full cursor-pointer rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 text-[14px] font-medium text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
            : "h-9 min-w-[168px] cursor-pointer rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 text-[13px] text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
        }
      >
        <option value="">Select a region</option>
        {suggestions.map((region) => (
          <option key={region} value={region}>
            {region}
          </option>
        ))}
      </select>
    </label>
  );
}
