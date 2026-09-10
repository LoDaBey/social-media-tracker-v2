import type { AlphaaSheetsExportAccountRow } from "@/types/admin";

function capitalizeWords(str: string | null | undefined) {
  if (!str) return "";
  if (str.toLowerCase() === "uae") return "UAE";
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function transformAlphaaPlatform(platform: string | null | undefined) {
  if (!platform) return "";

  const platformLower = platform.toLowerCase();

  if (
    platformLower.includes("blogspot") ||
    platformLower.includes("blogger")
  ) {
    return "BlogSpot";
  }
  if (platformLower.includes("turkkitap")) return "1000Kitap";
  if (platformLower.includes("kizlarsoruyor")) return "KızlarSoruyor";
  if (platformLower.includes("blogsky")) return "BLG-Sky";
  if (platformLower.includes("tiktok")) return "TikTok";
  if (platformLower.includes("youtube")) return "YouTube";
  if (platformLower.includes("blg-farsi")) return "BLG-Farsi";
  if (platformLower.includes("sound cloud") || platformLower.includes("soundcloud")) {
    return "Sound Cloud";
  }
  if (platformLower.includes("telegraf")) return "Telegraf";
  if (platformLower.includes("facenama")) return "Facenama";
  if (platformLower.includes("aparat")) return "Aparat";
  if (platformLower.includes("likee")) return "Likee";
  if (platformLower.includes("ok.ru") || platformLower.includes("okru")) return "ok.ru";
  if (
    platformLower.includes("twitter communities") ||
    platformLower.includes("communities tw")
  ) {
    return "Twitter Communities";
  }
  if (platformLower.includes("reddit groups")) return "Reddit Groups";
  if (platformLower.includes("facebook groups")) return "Facebook Groups";
  if (platformLower.includes("groups")) return "Groups";
  if (platformLower.includes("communities")) return "Communities";
  if (platformLower.includes("twitter verified")) return "Twitter Verified";
  if (platformLower.includes("virasty")) return "Virasty";
  if (platformLower.includes("gab")) return "GAB";
  if (platformLower.includes("parler")) return "Parler";
  if (platformLower.includes("tumblr")) return "Tumblr";
  if (platformLower.includes("pinterest")) return "Pinterest";
  if (platformLower.includes("vk")) return "VK";
  if (platformLower.includes("quora")) return "Quora";
  if (platformLower.includes("telegram")) return "Telegram";
  if (platformLower.includes("balatarin")) return "Balatarin";
  if (platformLower.includes("medium")) return "Medium";
  if (platformLower.includes("website")) return "Website";

  return capitalizeWords(platform);
}

function exportSheetFlag(value: AlphaaSheetsExportAccountRow["personal"]) {
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  return value ?? "";
}

function exportLanguage(value: string | null | undefined) {
  return capitalizeWords(value) || "Arabic";
}

export function transformAlphaaSheetsExportRow(account: AlphaaSheetsExportAccountRow) {
  return {
    region: capitalizeWords(account.region),
    country: capitalizeWords(account.country),
    platform: transformAlphaaPlatform(account.platform),
    direction: account.direction ?? "",
    acc_name: capitalizeWords(account.acc_name),
    acc_bio: account.acc_bio ?? "",
    acc_url: account.acc_url ?? "",
    Personal: exportSheetFlag(account.personal),
    Umberlla: exportSheetFlag(account.umberlla),
    Native: exportSheetFlag(account.native),
    Blogs: exportSheetFlag(account.blogs),
    Golden: exportSheetFlag(account.golden),
    acc_state: capitalizeWords(account.acc_state),
    Language1: exportLanguage(account.language1),
    Language2: exportLanguage(account.language2),
    handler_name: capitalizeWords(account.handler_name),
    acc_username: account.acc_username ?? "",
    acc_email: account.acc_email ?? "",
    acc_password_hash: account.acc_password_hash ?? "",
    acc_mobile: account.acc_mobile ?? "",
    rss: account.rss ?? "",
    dropbox: account.dropbox ?? "",
  };
}

/** ALPHAA sheet layout — headers and data both start at row 1. */
export const ALPHAA_SHEETS_EXPORT_HEADERS = [
  "Region",
  "Country",
  "Platforms",
  "Categories",
  "Account Name",
  "Account Bio",
  "URL",
  "Personal",
  "Umberlla",
  "Native",
  "Blogs",
  "Golden",
  "Status",
  "Language1",
  "Language2",
  "Account Handler",
  "Username",
  "Email",
  "Password",
  "Mobile No.",
  "Details",
  "RSS Link",
  "Dropbox Link",
] as const;

export function alphaaSheetsExportValuesFromRow(
  account: ReturnType<typeof transformAlphaaSheetsExportRow>
) {
  return [
    account.region,
    account.country,
    account.platform,
    account.direction,
    account.acc_name,
    account.acc_bio,
    account.acc_url,
    account.Personal,
    account.Umberlla,
    account.Native,
    account.Blogs,
    account.Golden,
    account.acc_state,
    account.Language1,
    account.Language2,
    account.handler_name,
    account.acc_username,
    account.acc_email,
    account.acc_password_hash,
    account.acc_mobile,
    "ALPHAA",
    account.rss,
    account.dropbox,
  ];
}
