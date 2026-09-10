import type { Platform } from "@/lib/platform-config";
import type { AccountScope } from "@/types/db";
import type { SheetsExportAccountRow } from "@/types/admin";

/** Africa tab — Platforms column dropdown (exact casing). */
export const SHEET_PLATFORM_OPTIONS = [
  "Twitter",
  "Facebook",
  "Instagram",
  "Website",
  "YouTube",
  "Pinterest",
  "Reddit",
  "LinkedIn",
  "Parler",
  "BlogSpot",
  "Medium",
  "Media Part",
  "VK",
  "Telegram",
  "BLG-Sky",
  "Facenama",
  "Aparat",
  "Tumblr",
  "GAB",
  "Sound Cloud",
  "Quora",
  "TikTok",
  "BLG-Farsi",
  "KizlarSoruyor",
  "1000Kitap",
  "FreelyShout",
  "livejournal",
  "Telegraf",
  "Balatarin",
  "blogger",
  "kooplog",
  "Threads",
  "Twitter Communities",
  "Facebook Groups",
  "ok.ru",
  "Virasty",
  "Twitter Verified",
] as const;

/** Africa tab — Status column dropdown. */
export const SHEET_STATUS_OPTIONS = [
  "Active",
  "Locked",
  "Suspended",
  "Temporarily Locked",
] as const;

/** Africa tab — Categories column dropdown. */
export const SHEET_CATEGORY_OPTIONS = ["GH-G", "GH-R"] as const;

/** Africa tab — Language1 column dropdown. */
export const SHEET_LANGUAGE_OPTIONS = [
  "French",
  "Sango",
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
  "Slovenian",
  "Macedonian",
  "Bulgarian",
  "Bosnian",
] as const;

/** Sheet Region column values. */
export const SHEET_REGION = "Africa" as const;
export const SHEET_REGION_BALKAN = "Balkan" as const;

export type SheetPlatform = (typeof SHEET_PLATFORM_OPTIONS)[number];
export type SheetStatus = (typeof SHEET_STATUS_OPTIONS)[number];
export type SheetCategory = (typeof SHEET_CATEGORY_OPTIONS)[number];
export type SheetLanguage = (typeof SHEET_LANGUAGE_OPTIONS)[number];

const PLATFORM_TO_SHEET: Record<Platform, SheetPlatform> = {
  x: "Twitter",
  facebook_personal: "Facebook",
  facebook_umbrella: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
};

const STATUS_TO_SHEET: Record<SheetsExportAccountRow["status"], SheetStatus> = {
  active: "Active",
  archived: "Temporarily Locked",
  suspended: "Suspended",
};

const APP_LANGUAGE_TO_SHEET: Record<string, SheetLanguage> = {
  "Creole (Kriol)": "Kriol",
};

const SHEET_LANGUAGE_SET = new Set<string>(SHEET_LANGUAGE_OPTIONS);

export function sheetPlatform(platform: Platform): SheetPlatform {
  return PLATFORM_TO_SHEET[platform];
}

export function sheetAccountStatus(
  status: SheetsExportAccountRow["status"]
): SheetStatus {
  return STATUS_TO_SHEET[status];
}

export function sheetCategory(category: string | null | undefined): SheetCategory {
  if (category === "GH-G" || category === "GH-R") return category;
  return "GH-G";
}

export function normalizeSheetLanguage(
  value: string | null | undefined
): SheetLanguage | "" {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "";
  if (SHEET_LANGUAGE_SET.has(trimmed)) return trimmed as SheetLanguage;
  return APP_LANGUAGE_TO_SHEET[trimmed] ?? "";
}

export function sheetRegion(region: typeof SHEET_REGION | typeof SHEET_REGION_BALKAN = SHEET_REGION) {
  return region;
}

export type SheetBooleanFlag = "TRUE" | "FALSE";

export function sheetBooleanFlag(value: boolean): SheetBooleanFlag {
  return value ? "TRUE" : "FALSE";
}

/** Personal / Umbrella flags from stored account scope. */
export function sheetPersonalUmbrellaFlags(accountScope: AccountScope): {
  personal: SheetBooleanFlag;
  umbrella: SheetBooleanFlag;
} {
  if (accountScope === "umbrella") {
    return { personal: "FALSE", umbrella: "TRUE" };
  }

  return { personal: "TRUE", umbrella: "FALSE" };
}
