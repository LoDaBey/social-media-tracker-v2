import type { Platform } from "@/lib/platform-config";
import type { SheetsExportAccountRow } from "@/types/admin";

/** Allowed platform labels from the sheet data-validation list. */
export const SHEET_PLATFORM_OPTIONS = [
  "1000Kitap",
  "Aparat",
  "Balatarin",
  "BLG-Sky",
  "BlogSpot",
  "Facebook",
  "Facebook groups",
  "GAB",
  "Instagram",
  "KizlarSoruyor",
  "LinkedIn",
  "Parler",
  "Pinterest",
  "Reddit",
  "Threads",
  "TikTok",
  "Tumblr",
  "Twitter",
  "communities TW",
  "Telegram",
  "Website",
  "YouTube",
  "VK",
  "ok.ru",
  "Virasty",
] as const;

/** Allowed status labels from the sheet data-validation list. */
export const SHEET_STATUS_OPTIONS = [
  "Active",
  "On Hold",
  "Inactive",
  "Restricted",
  "Stand-by",
  "Suspended",
] as const;

export type SheetPlatform = (typeof SHEET_PLATFORM_OPTIONS)[number];
export type SheetStatus = (typeof SHEET_STATUS_OPTIONS)[number];

const PLATFORM_TO_SHEET: Record<Platform, SheetPlatform> = {
  x: "Twitter",
  facebook_personal: "Facebook",
  facebook_umbrella: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
};

const STATUS_TO_SHEET: Record<SheetsExportAccountRow["status"], SheetStatus> = {
  active: "Active",
  archived: "Stand-by",
  suspended: "Suspended",
};

export function sheetPlatform(platform: Platform): SheetPlatform {
  return PLATFORM_TO_SHEET[platform];
}

export function sheetAccountStatus(
  status: SheetsExportAccountRow["status"]
): SheetStatus {
  return STATUS_TO_SHEET[status];
}

export function sheetFlag(value: boolean): boolean {
  return value;
}

export function sheetPersonalFlag(platform: Platform): boolean {
  return platform === "facebook_personal";
}

export function sheetUmbrellaFlag(platform: Platform): boolean {
  return platform === "facebook_umbrella";
}
