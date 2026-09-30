import {
  ADMIN_COUNTRY_PLANS,
  EUROPE_COUNTRY_PLANS,
} from "@/lib/admin-country-targets";
import { ALPHAA_COUNTRY_PLANS } from "@/lib/alphaa-country-targets";
import {
  baseCountryFromDisplay,
  isDualRegionCountry,
  overviewDisplayCountry,
} from "@/lib/overview-country-display";
import type { AdminCountryPlan } from "@/types/admin";
import type { AdminRegion, AdminRegionSlug } from "@/types/admin";

export {
  baseCountryFromDisplay,
  DUAL_REGION_COUNTRIES,
  isDualRegionCountry,
  overviewDisplayCountry,
} from "@/lib/overview-country-display";
export type { OverviewCountrySource } from "@/lib/overview-country-display";

export const EUROPE_COUNTRIES = [
  "Slovakia",
  "Moldova",
  "Slovenia",
  "Macedonia",
  "Bulgaria",
  "Bosnia",
] as const;

/** @deprecated Use EUROPE_COUNTRIES */
export const BALKAN_COUNTRIES = EUROPE_COUNTRIES;

/** Legacy ALPHAA coverage + sheet export (social_media_accounts). */
export const ALPHAA_COUNTRIES = [
  "Sudan",
  "Somalia",
  "Palestine",
  "Turkey",
  "Iran",
] as const;

export const AFRICA_PLAN_COUNTRIES = ADMIN_COUNTRY_PLANS.map(
  (plan) => plan.country
);

export type CountryRegion = "Africa" | "Europe" | "Alphaa";

export function adminRegionFromSlug(value: string | undefined): AdminRegion {
  if (value === "europe" || value === "balkan") return "Europe";
  if (value === "africa") return "Africa";
  if (value === "alphaa") return "Alphaa";
  return "Overview";
}

export function adminRegionSlug(region: AdminRegion): AdminRegionSlug {
  if (region === "Europe") return "europe";
  if (region === "Africa") return "africa";
  if (region === "Alphaa") return "alphaa";
  return "overview";
}

export function adminCountryPlansForRegion(region: AdminRegion): AdminCountryPlan[] {
  if (region === "Europe") return EUROPE_COUNTRY_PLANS;
  if (region === "Africa") return ADMIN_COUNTRY_PLANS;
  if (region === "Alphaa") return ALPHAA_COUNTRY_PLANS;

  const africaAndEuropeCountries = new Set<string>([
    ...AFRICA_PLAN_COUNTRIES,
    ...EUROPE_COUNTRIES,
  ]);

  return [
    ...ADMIN_COUNTRY_PLANS.map((plan) =>
      isDualRegionCountry(plan.country)
        ? { ...plan, country: overviewDisplayCountry(plan.country, "Africa") }
        : plan
    ),
    ...EUROPE_COUNTRY_PLANS,
    ...ALPHAA_COUNTRY_PLANS.filter(
      (plan) =>
        !africaAndEuropeCountries.has(plan.country) ||
        isDualRegionCountry(plan.country)
    ).map((plan) =>
      isDualRegionCountry(plan.country)
        ? { ...plan, country: overviewDisplayCountry(plan.country, "Alphaa") }
        : plan
    ),
  ];
}

export function adminPlanCountriesForRegion(region: AdminRegion): string[] {
  return adminCountryPlansForRegion(region).map((plan) => plan.country);
}

/** Countries tracked via temp_users + temp_social_media_accounts (Africa/Europe tabs). */
export function isTempPlanCountry(value: string) {
  const base = baseCountryFromDisplay(value);
  return (
    (AFRICA_PLAN_COUNTRIES as readonly string[]).includes(base) ||
    (EUROPE_COUNTRIES as readonly string[]).includes(base)
  );
}

export function regionForCountry(country: string): CountryRegion | null {
  if (isTempPlanCountry(country) || isAfricaSetupCountry(country)) {
    return (EUROPE_COUNTRIES as readonly string[]).includes(country)
      ? "Europe"
      : "Africa";
  }

  if ((ALPHAA_COUNTRIES as readonly string[]).includes(country)) {
    return "Alphaa";
  }

  return null;
}

function isAfricaSetupCountry(country: string) {
  // Non-plan Africa setup countries (e.g. Congo) still resolve to Africa.
  const africaOnly = new Set([
    "Congo",
    "Central African Republic",
    "Ghana",
    "Guinea",
    "Mauritius",
    "South Sudan",
    "Niger",
    "Djibouti",
    "Comoros",
    "Ivory Coast",
    "Gabon",
    "Uganda",
    "Libya",
    "Rwanda",
    "Mauritania",
    "Senegal",
    "Cameroon",
    "Somalia",
    "Borkina",
    "Angola",
    "Tanzania",
    "Mozambique",
    "Madagascar",
    "Zambia",
    "Nigeria",
    "Mali",
    "Chad",
    "Sudan",
  ]);
  return africaOnly.has(country);
}

export function isEuropeCountry(value: string) {
  return (EUROPE_COUNTRIES as readonly string[]).includes(value);
}

/** @deprecated Use isEuropeCountry */
export const isBalkanCountry = isEuropeCountry;

export function isAlphaaCountry(value: string) {
  const base = baseCountryFromDisplay(value);
  return (ALPHAA_COUNTRIES as readonly string[]).includes(base);
}

/** Map Overview display labels (e.g. Sudan (Africa)) back to DB country names. */
export function baseCountriesFromDisplayFilter(
  displayCountries: string[] | null,
  baseCountries: readonly string[]
): string[] {
  if (!displayCountries) return [...baseCountries];
  const allowed = new Set(displayCountries.map(baseCountryFromDisplay));
  return baseCountries.filter((country) => allowed.has(country));
}
