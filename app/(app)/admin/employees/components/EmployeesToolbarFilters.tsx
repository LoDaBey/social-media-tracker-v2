"use client";

import { useMemo } from "react";
import { useInstantSearchParams } from "@/hooks/useInstantSearchParams";
import { EmployeesToolbarSelect } from "@/app/(app)/admin/employees/components/EmployeesToolbarSelect";
import {
  employeeListRegionFromSlug,
  employeeListRegionSlug,
  isCountryInEmployeeListRegion,
} from "@/lib/setup-options";
import { MAIN_PROJECT_LABEL } from "@/lib/project-labels";
import type { EmployeesToolbarFiltersProps } from "@/types/admin";

const ROLE_OPTIONS = [
  { value: "employee", label: "Employees" },
  { value: "team_lead", label: "Team leaders regional" },
  { value: "manager", label: "Country managers" },
  { value: "op", label: "Operation managers" },
  { value: "hoo", label: "Heads of Department" },
];

const REGION_OPTIONS = [
  { value: "africa", label: "Africa" },
  { value: "europe", label: "Europe" },
  { value: "alphaa", label: MAIN_PROJECT_LABEL },
  { value: "asia", label: "Asia" },
];

export function EmployeesToolbarFilters({
  filterCountries,
}: EmployeesToolbarFiltersProps) {
  const { params: sp, update: push } = useInstantSearchParams();
  const role = sp.get("role") ?? "";
  const region = employeeListRegionFromSlug(sp.get("region") ?? undefined);
  const countryRaw = sp.get("country") ?? "";
  const country = isCountryInEmployeeListRegion(countryRaw, region)
    ? countryRaw
    : "";

  // Only projects and countries that have accounts (already limited for OPs).
  const regionOptions = useMemo(() => {
    const present = new Set(filterCountries.map((item) => item.region));
    return REGION_OPTIONS.filter((option) =>
      present.has(
        employeeListRegionFromSlug(option.value) as (typeof filterCountries)[number]["region"]
      )
    );
  }, [filterCountries]);
  const countryOptions = useMemo(
    () =>
      [
        ...new Set(
          filterCountries
            .filter((item) => region === "all" || item.region === region)
            .map((item) => item.country)
        ),
      ].sort((a, b) => a.localeCompare(b)),
    [filterCountries, region]
  );

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <EmployeesToolbarSelect
        label="Region"
        value={region === "all" ? "" : employeeListRegionSlug(region)}
        ariaLabel="Filter by region"
        allLabel="All"
        options={regionOptions}
        onChange={(value) => {
          const nextRegion = employeeListRegionFromSlug(value || undefined);
          const nextCountry =
            country &&
            nextRegion !== "all" &&
            !isCountryInEmployeeListRegion(country, nextRegion)
              ? undefined
              : country || undefined;
          push({
            region: value || undefined,
            country: nextCountry,
          });
        }}
      />
      <EmployeesToolbarSelect
        label="Country"
        value={country}
        ariaLabel="Filter by country"
        allLabel="All"
        options={countryOptions.map((item) => ({
          value: item,
          label: item,
          country: item,
        }))}
        onChange={(value) => push({ country: value || undefined })}
      />
      <EmployeesToolbarSelect
        label="Role"
        value={role}
        ariaLabel="Filter by role"
        allLabel="All"
        options={ROLE_OPTIONS}
        onChange={(value) => push({ role: value || undefined })}
      />
    </div>
  );
}
