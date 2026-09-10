import {
  ADMIN_COUNTRY_PLANS,
  BALKAN_COUNTRY_PLANS,
} from "@/lib/admin-country-targets";
import { ALPHAA_COUNTRY_PLANS } from "@/lib/alphaa-country-targets";
import type { AdminCountryPlan } from "@/types/admin";
import type { AdminRegion, AdminRegionSlug } from "@/types/admin";

export const BALKAN_COUNTRIES = [
  "Slovakia",
  "Moldova",
  "Slovenia",
  "Macedonia",
  "Bulgaria",
  "Bosnia",
] as const;

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

export type CountryRegion = "Africa" | "Balkan" | "Alphaa";

export function adminRegionFromSlug(value: string | undefined): AdminRegion {
  if (value === "balkan") return "Balkan";
  if (value === "africa") return "Africa";
  if (value === "alphaa") return "Alphaa";
  return "Overview";
}

export function adminRegionSlug(region: AdminRegion): AdminRegionSlug {
  if (region === "Balkan") return "balkan";
  if (region === "Africa") return "africa";
  if (region === "Alphaa") return "alphaa";
  return "overview";
}

export function adminCountryPlansForRegion(region: AdminRegion): AdminCountryPlan[] {
  if (region === "Balkan") return BALKAN_COUNTRY_PLANS;
  if (region === "Africa") return ADMIN_COUNTRY_PLANS;
  if (region === "Alphaa") return ALPHAA_COUNTRY_PLANS;

  const africaAndBalkanCountries = new Set<string>([
    ...AFRICA_PLAN_COUNTRIES,
    ...BALKAN_COUNTRIES,
  ]);

  return [
    ...ADMIN_COUNTRY_PLANS,
    ...BALKAN_COUNTRY_PLANS,
    ...ALPHAA_COUNTRY_PLANS.filter(
      (plan) => !africaAndBalkanCountries.has(plan.country)
    ),
  ];
}

export function adminPlanCountriesForRegion(region: AdminRegion): string[] {
  return adminCountryPlansForRegion(region).map((plan) => plan.country);
}

/** Countries tracked via temp_users + temp_social_media_accounts (Africa/Balkan tabs). */
export function isTempPlanCountry(value: string) {
  return (
    (AFRICA_PLAN_COUNTRIES as readonly string[]).includes(value) ||
    (BALKAN_COUNTRIES as readonly string[]).includes(value)
  );
}

export function regionForCountry(country: string): CountryRegion | null {
  if (isTempPlanCountry(country)) {
    return (BALKAN_COUNTRIES as readonly string[]).includes(country)
      ? "Balkan"
      : "Africa";
  }

  if ((ALPHAA_COUNTRIES as readonly string[]).includes(country)) {
    return "Alphaa";
  }

  return null;
}

export function isBalkanCountry(value: string) {
  return (BALKAN_COUNTRIES as readonly string[]).includes(value);
}

export function isAlphaaCountry(value: string) {
  return (ALPHAA_COUNTRIES as readonly string[]).includes(value);
}
