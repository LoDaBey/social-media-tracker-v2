import {
  isAlphaaCountry,
  isEuropeCountry,
  isTempPlanCountry,
  regionForCountry,
} from "@/lib/region-config";

export const SETUP_REGION = "Africa" as const;

/** Africa countries — labels must match Google Sheets dropdowns. */
export const SETUP_COUNTRIES = [
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
] as const;

/** Europe (formerly Balkan) countries — labels must match Google Sheets dropdowns. */
export const EUROPE_SETUP_COUNTRIES = [
  "Slovakia",
  "Moldova",
  "Slovenia",
  "Macedonia",
  "Bulgaria",
  "Bosnia",
] as const;

/** @deprecated Use EUROPE_SETUP_COUNTRIES */
export const BALKAN_SETUP_COUNTRIES = EUROPE_SETUP_COUNTRIES;

export const ALPHAA_SETUP_COUNTRIES = [
  "Sudan",
  "Somalia",
  "Palestine",
  "Turkey",
  "Iran",
] as const;

/** ALPHAA countries not already listed under Africa/Europe setup lists. */
export const ALPHAA_EXCLUSIVE_SETUP_COUNTRIES = [
  "Palestine",
  "Turkey",
  "Iran",
] as const;

/** Asia strategy countries. */
export const ASIA_SETUP_COUNTRIES = [
  "North Korea",
  "South Korea",
  "Japan",
  "Mongolia",
  "Azerbaijan",
  "Armenia",
  "Iraq",
  "Palestine",
  "Bahrain",
  "Kuwait",
  "Oman",
  "Georgia",
] as const;

/** Asia countries not already listed under Africa/Europe/ALPHAA setup lists. */
export const ASIA_EXCLUSIVE_SETUP_COUNTRIES = [
  "North Korea",
  "South Korea",
  "Japan",
  "Mongolia",
  "Azerbaijan",
  "Armenia",
  "Iraq",
  "Bahrain",
  "Kuwait",
  "Oman",
  "Georgia",
] as const;

export const ALL_SETUP_COUNTRIES = [
  ...SETUP_COUNTRIES,
  ...EUROPE_SETUP_COUNTRIES,
  ...ALPHAA_EXCLUSIVE_SETUP_COUNTRIES,
  ...ASIA_EXCLUSIVE_SETUP_COUNTRIES,
] as const;

export const SETUP_CATEGORIES = ["GH-G", "GH-R"] as const;

/** App language dropdown values (Africa / Europe / Main / Asia). */
export const SETUP_LANGUAGES = [
  "French",
  "Sango",
  "Creole (Kriol)",
  "Twi",
  "Mauritian Creole",
  "English",
  "Kriol",
  "Lingala",
  "Olyad",
  "Malagasy",
  "Arabic",
  "Somali",
  "Portuguese",
  "Kiswahili",
  "Slovak",
  "Romanian",
  "Russian",
  "Slovenian",
  "Macdonian",
  "Albanian",
  "Bulgarian",
  "Bosnian",
  "Serbian",
  "Croatian",
  "Turkish",
  "Persian",
  "Korean",
  "Japanese",
  "Mongolian",
  "Azerbaijani",
  "Armenian",
  "Georgian",
] as const;

export function isSetupCountry(value: string) {
  return (ALL_SETUP_COUNTRIES as readonly string[]).includes(value);
}

export function setupRegionForCountry(country: string) {
  return regionForCountry(country) ?? SETUP_REGION;
}

export type SetupRegion = "Africa" | "Europe" | "Alphaa" | "Asia";

export function setupCountriesForRegion(region: SetupRegion): readonly string[] {
  if (region === "Europe") return EUROPE_SETUP_COUNTRIES;
  if (region === "Alphaa") return ALPHAA_SETUP_COUNTRIES;
  if (region === "Asia") return ASIA_SETUP_COUNTRIES;
  return SETUP_COUNTRIES;
}

/** Every project (region) whose country list contains this country. */
export function setupRegionsForCountry(country: string): SetupRegion[] {
  const regions: SetupRegion[] = ["Africa", "Europe", "Alphaa", "Asia"];
  return regions.filter((region) =>
    (setupCountriesForRegion(region) as readonly string[]).includes(country)
  );
}

/**
 * Country Manager tick/untick. A manager has one project, so ticking a country that
 * is in two projects (Sudan: Africa + Main) in one group sets the manager's project.
 */
export function toggleManagerCountryInGroup(
  countries: string[],
  region: string,
  option: string,
  groupRegion: string
): { countries: string[]; region: string } {
  const shared = setupRegionsForCountry(option).length > 1;
  const has = countries.includes(option);
  const checkedHere = has && (!shared || !region || region === groupRegion);
  if (checkedHere) {
    return { countries: countries.filter((c) => c !== option), region };
  }
  const nextRegion = has || shared || countries.length === 0 || !region ? groupRegion : region;
  const next = has ? countries : [...countries, option];
  if (nextRegion === region) return { countries: next, region };
  // Project changed: drop shared countries that are not in the new project (they would be hidden).
  return {
    countries: next.filter((c) => {
      const regions = setupRegionsForCountry(c);
      return regions.length < 2 || regions.some((r) => r === nextRegion);
    }),
    region: nextRegion,
  };
}

export function employeeListRegionFromSlug(
  value: string | undefined
): "all" | SetupRegion {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "europe" || normalized === "balkan") return "Europe";
  if (normalized === "africa") return "Africa";
  if (normalized === "alphaa") return "Alphaa";
  if (normalized === "asia") return "Asia";
  return "all";
}

export function employeeListRegionSlug(region: SetupRegion): string {
  if (region === "Europe") return "europe";
  if (region === "Alphaa") return "alphaa";
  if (region === "Asia") return "asia";
  return "africa";
}

export function isCountryInEmployeeListRegion(
  country: string,
  region: "all" | SetupRegion
) {
  if (!isSetupCountry(country)) return false;
  if (region === "all") return true;
  return (setupCountriesForRegion(region) as readonly string[]).includes(country);
}

export { isAlphaaCountry, isEuropeCountry, isTempPlanCountry };
/** @deprecated Use isEuropeCountry */
export { isEuropeCountry as isBalkanCountry };

export function isSetupCategory(value: string) {
  return (SETUP_CATEGORIES as readonly string[]).includes(value);
}

export function isSetupLanguage(value: string) {
  return (SETUP_LANGUAGES as readonly string[]).includes(value);
}

export function isSetupProfileComplete(profile: {
  country: string | null | undefined;
  language: string | null | undefined;
}) {
  return (
    isSetupCountry(profile.country ?? "") &&
    isSetupLanguage(profile.language ?? "")
  );
}
