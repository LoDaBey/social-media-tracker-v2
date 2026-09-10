import { isBalkanCountry, regionForCountry } from "@/lib/region-config";

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
  "Somalia",
  "South Sudan",
  "Sudan",
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

export const ALL_SETUP_COUNTRIES = [
  ...SETUP_COUNTRIES,
  ...BALKAN_SETUP_COUNTRIES,
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
] as const;

export function isSetupCountry(value: string) {
  return (ALL_SETUP_COUNTRIES as readonly string[]).includes(value);
}

export function setupRegionForCountry(country: string) {
  return regionForCountry(country) ?? SETUP_REGION;
}

export type SetupRegion = "Africa" | "Balkan";

export function setupCountriesForRegion(region: SetupRegion): readonly string[] {
  return region === "Balkan" ? BALKAN_SETUP_COUNTRIES : SETUP_COUNTRIES;
}

export function employeeListRegionFromSlug(
  value: string | undefined
): "all" | SetupRegion {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "balkan") return "Balkan";
  if (normalized === "africa") return "Africa";
  return "all";
}

export function employeeListRegionSlug(region: SetupRegion): string {
  return region === "Balkan" ? "balkan" : "africa";
}

export function isCountryInEmployeeListRegion(
  country: string,
  region: "all" | SetupRegion
) {
  if (!isSetupCountry(country)) return false;
  if (region === "all") return true;
  return (setupCountriesForRegion(region) as readonly string[]).includes(country);
}

export { isBalkanCountry };

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
