import {
  ALPHAA_EXCLUSIVE_SETUP_COUNTRIES,
  ALPHAA_SETUP_COUNTRIES,
  ASIA_EXCLUSIVE_SETUP_COUNTRIES,
  ASIA_SETUP_COUNTRIES,
  EUROPE_SETUP_COUNTRIES,
  SETUP_COUNTRIES,
  isSetupCountry,
} from "@/lib/setup-options";
import {
  baseCountryFromDisplay,
  isDualRegionCountry,
  overviewDisplayCountry,
  overviewLabeledCountry,
} from "@/lib/overview-country-display";
import { MAIN_PROJECT_LABEL } from "@/lib/project-labels";
import type {
  AdminExtractFilters,
  AdminExtractRegionFilter,
  AdminExtractRoleFilter,
} from "@/types/admin";

export const EXTRACT_ROLE_OPTIONS: {
  value: AdminExtractRoleFilter;
  label: string;
}[] = [
  { value: "employee", label: "Employee" },
  { value: "team_lead", label: "Team Leader Regional" },
  { value: "manager", label: "Country Manager" },
  { value: "op", label: "Operation Manager" },
];

export const EXTRACT_ROLES: AdminExtractRoleFilter[] = EXTRACT_ROLE_OPTIONS.map(
  (option) => option.value
);

/** Countries that appear under both Main and Asia in Data extract. */
export const EXTRACT_MAIN_ASIA_COUNTRIES = ["Palestine"] as const;

export function isExtractMainAsiaCountry(country: string) {
  return (EXTRACT_MAIN_ASIA_COUNTRIES as readonly string[]).includes(country);
}

export function emptyAdminExtractFilters(): AdminExtractFilters {
  return {
    region: "all",
    countries: [],
    platforms: [],
    scopes: [],
    roles: [],
    status: "active",
    spare: "exclude",
  };
}

export function isExtractRoleFilter(
  value: string
): value is AdminExtractRoleFilter {
  return (EXTRACT_ROLES as readonly string[]).includes(value);
}

export function extractRoleLabel(role: AdminExtractRoleFilter | null): string {
  if (!role) return "Unassigned";
  return (
    EXTRACT_ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role
  );
}

function labelAlphaaCountry(country: string): string {
  if (isDualRegionCountry(country) || isExtractMainAsiaCountry(country)) {
    return overviewLabeledCountry(country, MAIN_PROJECT_LABEL);
  }
  return country;
}

function labelAsiaCountry(country: string): string {
  if (isExtractMainAsiaCountry(country)) {
    return overviewLabeledCountry(country, "Asia");
  }
  return country;
}

export function extractCountryOptions(
  region: AdminExtractRegionFilter
): string[] {
  if (region === "Europe") return [...EUROPE_SETUP_COUNTRIES];
  if (region === "Africa") {
    return SETUP_COUNTRIES.map((country) =>
      overviewDisplayCountry(country, "Africa")
    );
  }
  if (region === "Alphaa") {
    return ALPHAA_SETUP_COUNTRIES.map(labelAlphaaCountry);
  }
  if (region === "Asia") {
    return ASIA_SETUP_COUNTRIES.map(labelAsiaCountry);
  }

  const options: string[] = [];
  for (const country of SETUP_COUNTRIES) {
    options.push(overviewDisplayCountry(country, "Africa"));
    if (isDualRegionCountry(country)) {
      options.push(overviewDisplayCountry(country, "Alphaa"));
    }
  }
  options.push(...EUROPE_SETUP_COUNTRIES);
  for (const country of ALPHAA_EXCLUSIVE_SETUP_COUNTRIES) {
    options.push(labelAlphaaCountry(country));
  }
  for (const country of ASIA_EXCLUSIVE_SETUP_COUNTRIES) {
    options.push(country);
  }
  for (const country of EXTRACT_MAIN_ASIA_COUNTRIES) {
    options.push(overviewLabeledCountry(country, "Asia"));
  }
  return options;
}

export function isExtractCountryFilter(value: string) {
  return isSetupCountry(baseCountryFromDisplay(value));
}

export function countriesForExtractSource(
  countries: string[],
  source: "temp" | "alphaa"
): { skip: boolean; countries: string[] } {
  if (countries.length === 0) return { skip: false, countries: [] };

  const selected: string[] = [];
  for (const country of countries) {
    const base = baseCountryFromDisplay(country);
    if (!base) continue;

    if (isDualRegionCountry(base)) {
      const wantsAfrica = country.endsWith("(Africa)");
      const wantsAlphaa = country.endsWith(`(${MAIN_PROJECT_LABEL})`);
      if (!wantsAfrica && !wantsAlphaa) {
        selected.push(base);
        continue;
      }
      if (source === "temp" && wantsAfrica) selected.push(base);
      if (source === "alphaa" && wantsAlphaa) selected.push(base);
      continue;
    }

    if (isExtractMainAsiaCountry(base)) {
      const wantsAsia = country.endsWith("(Asia)");
      const wantsMain = country.endsWith(`(${MAIN_PROJECT_LABEL})`);
      if (!wantsAsia && !wantsMain) {
        selected.push(base);
        continue;
      }
      if (source === "temp" && wantsAsia) selected.push(base);
      if (source === "alphaa" && wantsMain) selected.push(base);
      continue;
    }

    selected.push(base);
  }

  if (selected.length === 0) return { skip: true, countries: [] };
  return { skip: false, countries: selected };
}
