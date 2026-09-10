"use client";

import { useMemo } from "react";
import { AdminCountrySelect } from "@/components/admin/AdminCountrySelect";
import { CountryFlag } from "@/lib/country-icons";
import {
  isCountryInEmployeeListRegion,
  setupCountriesForRegion,
  setupRegionForCountry,
} from "@/lib/setup-options";
import type { BulkImportHolderStepProps } from "@/types/admin";

const fieldClass =
  "cursor-pointer rounded-lg outline-none border border-[var(--color-hairline)] bg-[var(--color-cream-tint)] px-3 py-2.5 text-[15px] font-medium text-[var(--color-ink)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]";

export function BulkImportHolderStep({
  holders,
  holderId,
  region,
  country,
  onHolderIdChange,
  onRegionChange,
  onCountryChange,
}: BulkImportHolderStepProps) {
  const countryOptions = useMemo(
    () =>
      region
        ? [...setupCountriesForRegion(region)].sort((a, b) => a.localeCompare(b))
        : undefined,
    [region]
  );

  const assignedRegion = country ? setupRegionForCountry(country) : "";

  return (
    <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="flex min-w-0 flex-col gap-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-muted)]">
        Account holder
        <select
          value={holderId}
          aria-label="Select account holder"
          onChange={(event) => onHolderIdChange(event.target.value)}
          className={fieldClass}
        >
          <option value="">Select an account holder</option>
          {holders.map((holder) => (
            <option key={holder.id} value={holder.id}>
              {holder.full_name}
              {holder.country ? ` — ${holder.country}` : ""}
            </option>
          ))}
        </select>
      </label>
      <label className="flex min-w-0 flex-col gap-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-muted)]">
        Region
        <select
          value={region}
          aria-label="Select region"
          onChange={(event) => {
            const nextRegion = event.target.value as "" | "Africa" | "Balkan";
            onRegionChange(nextRegion);
            if (
              country &&
              nextRegion &&
              !isCountryInEmployeeListRegion(country, nextRegion)
            ) {
              onCountryChange("");
            }
          }}
          className={fieldClass}
        >
          <option value="">Select a region</option>
          <option value="Africa">Africa</option>
          <option value="Balkan">Balkan</option>
        </select>
      </label>
      <label className="flex min-w-0 flex-col gap-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-muted)] sm:col-span-2">
        Country
        <AdminCountrySelect
          value={country}
          countries={countryOptions}
          disabled={!region}
          ariaLabel="Select country for bulk import"
          onChange={onCountryChange}
        />
      </label>
      {country ? (
        <p className="sm:col-span-2 inline-flex items-center gap-2 text-[13px] text-[var(--color-muted)]">
          <CountryFlag country={country} title={country} className="h-4 w-6" />
          Accounts in this file will be assigned to this holder in {country}
          {assignedRegion ? ` (${assignedRegion})` : ""}.
        </p>
      ) : null}
    </div>
  );
}
