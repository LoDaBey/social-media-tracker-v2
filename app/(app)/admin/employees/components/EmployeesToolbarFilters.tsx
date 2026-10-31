"use client";

import { useMemo, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EmployeesToolbarSelect } from "@/app/(app)/admin/employees/components/EmployeesToolbarSelect";
import {
  ALL_SETUP_COUNTRIES,
  employeeListRegionFromSlug,
  employeeListRegionSlug,
  isCountryInEmployeeListRegion,
  setupCountriesForRegion,
} from "@/lib/setup-options";

const ROLE_OPTIONS = [
  { value: "employee", label: "Employees" },
  { value: "team_lead", label: "Team leaders regional" },
  { value: "manager", label: "Regional managers" },
  { value: "op", label: "OP" },
];

const REGION_OPTIONS = [
  { value: "africa", label: "Africa" },
  { value: "europe", label: "Europe" },
  { value: "alphaa", label: "ALPHAA" },
];

export function EmployeesToolbarFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();
  const role = sp.get("role") ?? "";
  const region = employeeListRegionFromSlug(sp.get("region") ?? undefined);
  const countryRaw = sp.get("country") ?? "";
  const country = isCountryInEmployeeListRegion(countryRaw, region)
    ? countryRaw
    : "";

  const countryOptions = useMemo(
    () =>
      [
        ...(region === "all"
          ? ALL_SETUP_COUNTRIES
          : setupCountriesForRegion(region)),
      ].sort((a, b) => a.localeCompare(b)),
    [region]
  );

  function push(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(sp.toString());
    for (const [key, value] of Object.entries(next)) {
      if (!value) params.delete(key);
      else params.set(key, value);
    }
    const query = params.toString();
    startTransition(() => {
      router.push(query ? `/admin/employees?${query}` : "/admin/employees");
    });
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <EmployeesToolbarSelect
        label="Region"
        value={region === "all" ? "" : employeeListRegionSlug(region)}
        ariaLabel="Filter by region"
        allLabel="All"
        options={REGION_OPTIONS}
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
