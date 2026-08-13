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
] as const;

export function isSetupCountry(value: string) {
  return (SETUP_COUNTRIES as readonly string[]).includes(value);
}

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
