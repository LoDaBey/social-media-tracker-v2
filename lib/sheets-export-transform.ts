import type { Platform } from "@/lib/platform-config";
import type { SheetsExportAccountRow } from "@/types/admin";

function capitalizeWords(str: string | null | undefined) {
  if (!str) return "";
  if (str.toLowerCase() === "uae") return "UAE";
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function sheetBoolean(value: boolean) {
  return value ? "TRUE" : "FALSE";
}

function transformPlatform(platform: Platform) {
  switch (platform) {
    case "x":
      return "Twitter";
    case "facebook_personal":
    case "facebook_umbrella":
      return "Facebook";
    case "instagram":
      return "Instagram";
    case "tiktok":
      return "TikTok";
    default:
      return capitalizeWords(platform);
  }
}

function isPersonalPlatform(platform: Platform) {
  return platform === "facebook_personal";
}

function isUmbrellaPlatform(platform: Platform) {
  return platform === "facebook_umbrella";
}

function transformStatus(status: SheetsExportAccountRow["status"]) {
  return capitalizeWords(status);
}

function formatUsername(username: string | null) {
  const value = username?.trim() ?? "";
  if (!value) return "";
  return value.startsWith("@") ? value : `@${value}`;
}

export function transformSheetsExportRow(account: SheetsExportAccountRow) {
  return {
    region: capitalizeWords(account.region),
    country: capitalizeWords(account.country),
    platform: transformPlatform(account.platform),
    category: account.category ?? "",
    acc_name: capitalizeWords(account.account_name),
    acc_bio: "",
    acc_url: account.account_url ?? "",
    Personal: sheetBoolean(isPersonalPlatform(account.platform)),
    Umbrella: sheetBoolean(isUmbrellaPlatform(account.platform)),
    Native: "",
    Blogs: "",
    Golden: "",
    acc_state: transformStatus(account.status),
    Language1: capitalizeWords(account.language) || "",
    Language2: "",
    handler_name: capitalizeWords(account.handler_name),
    acc_username: formatUsername(account.username),
    acc_email: account.account_email ?? "",
    acc_password: account.account_password ?? "",
    acc_mobile: account.mobile_number ?? "",
  };
}

/** Matches the "051426 Alpha Strategy" spreadsheet column layout. */
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
