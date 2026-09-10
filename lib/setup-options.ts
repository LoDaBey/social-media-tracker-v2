import {
  isAlphaaCountry,
  isBalkanCountry,
  isTempPlanCountry,
  regionForCountry,
} from "@/lib/region-config";

export const SETUP_REGION = "Africa" as const;

export const SETUP_COUNTRIES = [
  "Angola",
  "Burkina Faso",
  "Cameroon",
  "Central African Republic",
  "Chad",
  "Comoros",
  "Congo",
  "Djibouti",
  "Gabon",
  "Ghana",
  "Guinea",
  "Ivory Coast",
  "Libya",
  "Madagascar",
  "Mali",
  "Mauritania",
  "Mauritius",
  "Mozambique",
  "Niger",
  "Nigeria",
  "Rwanda",
  "Senegal",
  "Sudan",
  "South Sudan",
  "Tanzania",
  "Uganda",
  "Zambia",
] as const;

export const BALKAN_SETUP_COUNTRIES = [
  "Slovakia",
  "Moldova",
  "Slovenia",
  "Macedonia",
  "Bulgaria",
  "Bosnia",
] as const;

export const ALPHAA_SETUP_COUNTRIES = [
  "Sudan",
  "Somalia",
  "Palestine",
  "Turkey",
  "Iran",
] as const;

/** ALPHAA countries not already listed under Africa/Balkan setup lists. */
export const ALPHAA_EXCLUSIVE_SETUP_COUNTRIES = [
  "Somalia",
  "Palestine",
  "Turkey",
  "Iran",
] as const;

export const ALL_SETUP_COUNTRIES = [
  ...SETUP_COUNTRIES,
  ...BALKAN_SETUP_COUNTRIES,
  ...ALPHAA_EXCLUSIVE_SETUP_COUNTRIES,
] as const;

export const SETUP_CATEGORIES = ["GH-G", "GH-R"] as const;

export const SETUP_LANGUAGES = [
  "Arabic",
  "Creole (Kriol)",
  "English",
  "French",
  "Kiswahili",
  "Kriol",
  "Lingala",
  "Malagasy",
  "Mauritian Creole",
  "Olyad",
  "Portuguese",
  "Sango",
  "Somali",
  "Twi",
  "Slovak",
  "Romanian",
  "Slovenian",
  "Macedonian",
  "Bulgarian",
  "Bosnian",
  "Turkish",
  "Persian",
] as const;

export function isSetupCountry(value: string) {
  return (ALL_SETUP_COUNTRIES as readonly string[]).includes(value);
}

export function setupRegionForCountry(country: string) {
  return regionForCountry(country) ?? SETUP_REGION;
}

export type SetupRegion = "Africa" | "Balkan" | "Alphaa";

export function setupCountriesForRegion(region: SetupRegion): readonly string[] {
  if (region === "Balkan") return BALKAN_SETUP_COUNTRIES;
  if (region === "Alphaa") return ALPHAA_SETUP_COUNTRIES;
  return SETUP_COUNTRIES;
}

export function employeeListRegionFromSlug(
  value: string | undefined
): "all" | SetupRegion {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "balkan") return "Balkan";
  if (normalized === "africa") return "Africa";
  if (normalized === "alphaa") return "Alphaa";
  return "all";
}

export function employeeListRegionSlug(region: SetupRegion): string {
  if (region === "Balkan") return "balkan";
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

export { isAlphaaCountry, isBalkanCountry, isTempPlanCountry };

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
