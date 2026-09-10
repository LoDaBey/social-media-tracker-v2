import { ALL_SETUP_COUNTRIES } from "@/lib/setup-options";
import type { SheetLanguage } from "@/lib/sheets-validation-values";
import { normalizeSheetLanguage } from "@/lib/sheets-validation-values";

/** Primary Language1 per country — values must match the sheet dropdown exactly. */
export const COUNTRY_SHEET_LANGUAGE: Partial<
  Record<(typeof ALL_SETUP_COUNTRIES)[number], SheetLanguage>
> = {
  Angola: "Portuguese",
  "Burkina Faso": "French",
  Cameroon: "French",
  "Central African Republic": "Sango",
  Chad: "French",
  Comoros: "Olyad",
  Congo: "French",
  Djibouti: "Lingala",
  Gabon: "Arabic",
  Ghana: "Kriol",
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
  Slovakia: "Slovak",
  Moldova: "Romanian",
  Slovenia: "Slovenian",
  Macedonia: "Macedonian",
  Bulgaria: "Bulgarian",
  Bosnia: "Bosnian",
  Palestine: "Arabic",
  Turkey: "Turkish",
  Iran: "Persian",
};

/** Country labels as they appear on the Africa strategy sheet dropdown. */
export const COUNTRY_SHEET_NAME: Partial<
  Record<(typeof ALL_SETUP_COUNTRIES)[number], string>
> = {
  "Burkina Faso": "Borkina",
};

export function sheetCountryName(country: string | null | undefined) {
  if (!country) return "";
  const alias = COUNTRY_SHEET_NAME[country as (typeof ALL_SETUP_COUNTRIES)[number]];
  return alias ?? country;
}

export function sheetLanguage1(
  country: string | null | undefined,
  storedLanguage: string | null | undefined
): SheetLanguage {
  if (country) {
    const mapped =
      COUNTRY_SHEET_LANGUAGE[country as (typeof ALL_SETUP_COUNTRIES)[number]];
    if (mapped) return mapped;
  }

  const normalized = normalizeSheetLanguage(storedLanguage);
  if (normalized) return normalized;

  return "English";
}
