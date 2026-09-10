import {
  sheetAccountStatus,
  sheetBooleanFlag,
  sheetCategory,
  sheetPersonalUmbrellaFlags,
  sheetPlatform,
  sheetRegion,
} from "@/lib/sheets-validation-values";
import { sheetCountryName, sheetLanguage1 } from "@/lib/sheets-country-config";
import { resolveSheetsExportRegion } from "@/lib/sheets-export-region";
import type { SheetsExportAccountRow } from "@/types/admin";

function capitalizeWords(str: string | null | undefined) {
  if (!str) return "";
  if (str.toLowerCase() === "uae") return "UAE";
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatUsername(username: string | null) {
  const value = username?.trim() ?? "";
  if (!value) return "";
  return value.startsWith("@") ? value : `@${value}`;
}

export function transformSheetsExportRow(account: SheetsExportAccountRow) {
  const { personal, umbrella } = sheetPersonalUmbrellaFlags(account.account_scope);
  const exportRegion = resolveSheetsExportRegion(account);

  return {
    region: sheetRegion(exportRegion),
    country: sheetCountryName(account.country),
    platform: sheetPlatform(account.platform),
    category: sheetCategory(account.category),
    acc_name: account.account_name?.trim() ?? "",
    acc_bio: "",
    acc_url: account.account_url ?? "",
    Personal: personal,
    Umbrella: umbrella,
    Native: sheetBooleanFlag(false),
    Blogs: sheetBooleanFlag(false),
    Golden: sheetBooleanFlag(false),
    acc_state: sheetAccountStatus(account.status),
    Language1: sheetLanguage1(account.country, account.language),
    Language2: "",
    handler_name: capitalizeWords(account.handler_name),
    acc_username: formatUsername(account.username),
    acc_email: account.account_email ?? "",
    acc_password: account.account_password ?? "",
    acc_mobile: account.mobile_number ?? "",
  };
}

/** Matches the Africa strategy spreadsheet column layout (row 1 on the sheet). */
export const SHEETS_EXPORT_HEADERS = [
  "S/N",
  "Region",
  "Country",
  "Platforms",
  "Categories",
  "Acount Name",
  "Account Bio",
  "URL",
  "Personal",
  "Umbrella",
  "Native",
  "Blogs",
  "Golden",
  "Status",
  "Language1",
  "Language2",
  "Account Handler",
  "USERNAME",
  "EMAIL",
  "Password",
  "Mobile",
  "Details",
] as const;

export function sheetsExportValuesFromRow(
  account: ReturnType<typeof transformSheetsExportRow>,
  serialNumber: number
) {
  return [
    serialNumber,
    account.region,
    account.country,
    account.platform,
    account.category,
    account.acc_name,
    account.acc_bio,
    account.acc_url,
    account.Personal,
    account.Umbrella,
    account.Native,
    account.Blogs,
    account.Golden,
    account.acc_state,
    account.Language1,
    account.Language2,
    account.handler_name,
    account.acc_username,
    account.acc_email,
    account.acc_password,
    account.acc_mobile,
    "ALPHA",
  ];
}
