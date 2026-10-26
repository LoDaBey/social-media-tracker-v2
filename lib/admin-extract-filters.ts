import {
  ALPHAA_EXCLUSIVE_SETUP_COUNTRIES,
  ALPHAA_SETUP_COUNTRIES,
  EUROPE_SETUP_COUNTRIES,
  SETUP_COUNTRIES,
  isSetupCountry,
} from "@/lib/setup-options";
import {
  baseCountryFromDisplay,
  isDualRegionCountry,
  overviewDisplayCountry,
} from "@/lib/overview-country-display";
import type {
  AdminExtractFilters,
  AdminExtractRegionFilter,
} from "@/types/admin";

export function emptyAdminExtractFilters(): AdminExtractFilters {
  return {
    region: "all",
    countries: [],
    platforms: [],
    scopes: [],
    status: "active",
    spare: "exclude",
  };
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
    return ALPHAA_SETUP_COUNTRIES.map((country) =>
      overviewDisplayCountry(country, "Alphaa")
    );
  }

  const options: string[] = [];
  for (const country of SETUP_COUNTRIES) {
    options.push(overviewDisplayCountry(country, "Africa"));
    if (isDualRegionCountry(country)) {
      options.push(overviewDisplayCountry(country, "Alphaa"));
    }
  }
  options.push(...EUROPE_SETUP_COUNTRIES);
  options.push(...ALPHAA_EXCLUSIVE_SETUP_COUNTRIES);
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
      const wantsAlphaa = country.endsWith("(ALPHAA)");
      if (!wantsAfrica && !wantsAlphaa) {
        selected.push(base);
        continue;
      }
      if (source === "temp" && wantsAfrica) selected.push(base);
      if (source === "alphaa" && wantsAlphaa) selected.push(base);
      continue;
    }
    selected.push(base);
  }

  if (selected.length === 0) return { skip: true, countries: [] };
  return { skip: false, countries: selected };
}
