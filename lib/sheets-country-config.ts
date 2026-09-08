import { SETUP_COUNTRIES, SETUP_REGION } from "@/lib/setup-options";

/** Primary Language1 per country — matches the Africa strategy reference sheet. */
export const COUNTRY_SHEET_LANGUAGE: Record<(typeof SETUP_COUNTRIES)[number], string> =
  {
    Angola: "Portuguese",
    "Burkina Faso": "French",
    Cameroon: "French",
    "Central African Republic": "Sango",
    Chad: "French",
    Comoros: "Olyad",
    Congo: "French",
    Djibouti: "Lingala",
    Gabon: "Arabic",
    Ghana: "Creole (Kriol)",
    Guinea: "Twi",
    "Ivory Coast": "Malagasy",
    Libya: "Portuguese",
    Madagascar: "Malagasy",
    Mali: "French",
    Mauritania: "Arabic",
    Mauritius: "Mauritian Creole",
    Mozambique: "Portuguese",
    Niger: "Kriol",
    Nigeria: "English",
    Rwanda: "Kiswahili",
    Senegal: "French",
    Somalia: "Somali",
    "South Sudan": "English",
    Sudan: "Arabic",
    Tanzania: "Kiswahili",
    Uganda: "Somali",
    Zambia: "English",
  };

/** Country labels as they appear on the strategy spreadsheet. */
export const COUNTRY_SHEET_NAME: Partial<
  Record<(typeof SETUP_COUNTRIES)[number], string>
> = {
  "Burkina Faso": "Borkina",
};

export function sheetRegion() {
  return SETUP_REGION;
}

export function sheetCountryName(country: string | null | undefined) {
  if (!country) return "";
  const alias = COUNTRY_SHEET_NAME[country as (typeof SETUP_COUNTRIES)[number]];
  return alias ?? country;
}

export function sheetLanguage1(
  country: string | null | undefined,
  storedLanguage: string | null | undefined
) {
  if (country) {
    const mapped =
      COUNTRY_SHEET_LANGUAGE[country as (typeof SETUP_COUNTRIES)[number]];
    if (mapped) return mapped;
  }
  return storedLanguage?.trim() ?? "";
}
