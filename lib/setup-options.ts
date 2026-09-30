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

export const ALL_SETUP_COUNTRIES = [
  ...SETUP_COUNTRIES,
  ...EUROPE_SETUP_COUNTRIES,
  ...ALPHAA_EXCLUSIVE_SETUP_COUNTRIES,
] as const;

export const SETUP_CATEGORIES = ["GH-G", "GH-R"] as const;

/** Africa + Europe languages — values must match Google Sheets Language1 dropdown. */
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
] as const;

export function isSetupCountry(value: string) {
  return (ALL_SETUP_COUNTRIES as readonly string[]).includes(value);
}

export function setupRegionForCountry(country: string) {
  return regionForCountry(country) ?? SETUP_REGION;
}

export type SetupRegion = "Africa" | "Europe" | "Alphaa";

export function setupCountriesForRegion(region: SetupRegion): readonly string[] {
  if (region === "Europe") return EUROPE_SETUP_COUNTRIES;
  if (region === "Alphaa") return ALPHAA_SETUP_COUNTRIES;
  return SETUP_COUNTRIES;
}

export function employeeListRegionFromSlug(
  value: string | undefined
): "all" | SetupRegion {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "europe" || normalized === "balkan") return "Europe";
  if (normalized === "africa") return "Africa";
  if (normalized === "alphaa") return "Alphaa";
  return "all";
}

export function employeeListRegionSlug(region: SetupRegion): string {
  if (region === "Europe") return "europe";
  if (region === "Alphaa") return "alphaa";
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
