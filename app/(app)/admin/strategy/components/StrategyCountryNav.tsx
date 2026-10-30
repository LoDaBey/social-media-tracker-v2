"use client";

import { CountryFlag } from "@/lib/country-icons";
import type { StrategyCountryNavProps } from "@/types/strategy";

export function StrategyCountryNav({
  countries,
  selectedCountry,
  onSelect,
}: StrategyCountryNavProps) {
  return (
    <nav
      className="flex gap-1 overflow-x-auto p-2 lg:h-full lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden"
      aria-label="Countries"
    >
      {countries.map((item) => {
        const selected = item.country === selectedCountry;
        return (
          <button
            key={item.country}
            type="button"
            aria-current={selected ? "true" : undefined}
            aria-label={`Show ${item.country} strategy`}
            onClick={() => onSelect(item.country)}
            className={[
              "flex min-w-[148px] cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] lg:min-w-0 lg:w-full",
              selected
                ? "bg-[var(--color-surface)] text-[var(--color-ink)] shadow-[inset_3px_0_0_var(--color-emerald)]"
                : "text-[var(--color-muted)] hover:bg-[var(--color-surface)]/70 hover:text-[var(--color-ink)]",
            ].join(" ")}
          >
            <CountryFlag country={item.country} />
            <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">
              {item.country}
            </span>
            <span className="text-[12px] font-medium tabular-nums">
              {item.totalAccounts}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
