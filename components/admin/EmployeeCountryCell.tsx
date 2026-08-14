"use client";

import { CountryFlag } from "@/lib/country-icons";
import type { EmployeeCountryCellProps } from "@/types/admin";

export function EmployeeCountryCell({ countries }: EmployeeCountryCellProps) {
  if (countries.length === 0) {
    return <span className="text-[14px] text-[var(--color-muted)]">—</span>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      {countries.map((country) => (
        <span
          key={country}
          className="inline-flex items-center gap-2 text-[14px] font-semibold text-[var(--color-ink)]"
        >
          <CountryFlag country={country} title={country} className="h-4 w-6" />
          {country}
        </span>
      ))}
    </div>
  );
}
