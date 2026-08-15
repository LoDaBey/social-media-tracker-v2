"use client";

import { CountryFlag } from "@/lib/country-icons";
import type { ManagerTeamHeaderProps } from "@/types/manager";

export function ManagerTeamHeader({
  holderCount,
  pendingCount,
  overall,
  countries,
}: ManagerTeamHeaderProps) {
  const showCountries = countries.length > 1;

  return (
    <header className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[32px] font-extrabold tracking-tight text-[var(--color-ink)]">
          Your team
        </h1>
        <span
          className="inline-flex rounded-lg bg-[var(--color-emerald)] px-3 py-1.5 text-[14px] font-bold tabular-nums text-white"
          aria-label={`${overall.added} of ${overall.assigned} assigned accounts across all countries`}
        >
          {overall.added} / {overall.assigned}
        </span>
      </div>
      {showCountries ? (
        <div className="flex flex-wrap gap-2" aria-label="Account totals by country">
          {countries.map((item) => (
            <span
              key={item.country}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-2.5 py-1.5 text-[13px] font-semibold text-[var(--color-ink)]"
            >
              <CountryFlag country={item.country} title={item.country} className="h-4 w-6" />
              {item.country}
              <span className="tabular-nums text-[var(--color-muted)]">
                {item.added} / {item.assigned}
              </span>
            </span>
          ))}
        </div>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-[15px] text-[var(--color-muted)]">
          Account holders in your countries. Expand a row to see saved accounts,
          or use + to continue setup.
        </p>
        <p className="text-[13px] font-semibold text-[var(--color-muted)]">
          {holderCount} holders · {pendingCount} setup pending
        </p>
      </div>
    </header>
  );
}
