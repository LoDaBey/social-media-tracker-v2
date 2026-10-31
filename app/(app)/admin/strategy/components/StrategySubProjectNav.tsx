"use client";

import { CountryFlag } from "@/lib/country-icons";
import type { StrategySubProjectNavProps } from "@/types/strategy";

export function StrategySubProjectNav({
  projects,
  selectedKey,
  onSelect,
}: StrategySubProjectNavProps) {
  return (
    <nav
      className="flex flex-wrap gap-1.5"
      aria-label="Sub-projects"
    >
      {projects.map((item) => {
        const selected = item.key === selectedKey;
        return (
          <button
            key={item.key}
            type="button"
            aria-current={selected ? "true" : undefined}
            aria-label={`Show ${item.name} sub-project`}
            onClick={() => onSelect(item.key)}
            className={[
              "inline-flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]",
              selected
                ? "bg-[var(--color-surface)] text-[var(--color-ink)] shadow-[inset_0_0_0_1px_var(--color-emerald)]"
                : "text-[var(--color-muted)] hover:bg-[var(--color-surface)]/80 hover:text-[var(--color-ink)]",
            ].join(" ")}
          >
            <CountryFlag country={item.name} />
            <span className="text-[13px] font-semibold">{item.name}</span>
            <span className="text-[12px] font-medium tabular-nums">
              {item.totalAccounts}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
