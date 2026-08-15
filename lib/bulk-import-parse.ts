import { PLATFORMS, type Platform } from "@/lib/platform-config";
import { isSetupCategory, isSetupLanguage } from "@/lib/setup-options";
import {
  isPlatformAccountUrl,
  isValidAccountEmail,
  isValidAccountUrl,
  platformUrlErrorMessage,
} from "@/lib/setup-schema";
import type { BulkImportAccountDraft, BulkImportParseResult } from "@/types/admin";

function cellString(value: unknown) {
  if (value == null) return "";
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "yes" : "";
  return String(value).trim();
}

function normalizeHeader(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function headerIndex(headers: string[], aliases: string[]) {
  const normalized = headers.map(normalizeHeader);
  for (const alias of aliases) {
    const i = normalized.indexOf(normalizeHeader(alias));
    if (i >= 0) return i;
  }
  return -1;
}

function truthyFlag(value: string) {
  const v = value.trim().toLowerCase();
  if (!v) return false;
  return !["0", "no", "n", "false", "off", "-"].includes(v);
}

function parsePlatform(
  platformRaw: string,
  personalRaw: string,
  umbrellaRaw: string
): Platform | "" {
  const platform = platformRaw.trim().toLowerCase();
  const personal = truthyFlag(personalRaw);
  const umbrella = truthyFlag(umbrellaRaw);

  if (
    platform.includes("umbrella") ||
    platform.includes("page") ||
    (umbrella && !personal && (platform.includes("facebook") || platform.includes("fb") || !platform))
  ) {
    return "facebook_umbrella";
  }
  if (
    platform.includes("personal") ||
    (personal && (platform.includes("facebook") || platform.includes("fb") || !platform))
  ) {
    return "facebook_personal";
  }
  if (platform.includes("facebook") || platform === "fb") {
    if (umbrella && !personal) return "facebook_umbrella";
    return "facebook_personal";
  }
  if (
    platform === "x" ||
    platform.includes("twitter") ||
    platform === "xtwitter"
  ) {
    return "x";
  }
  if (platform.includes("instagram") || platform === "ig" || platform === "insta") {
    return "instagram";
  }
  if (platform.includes("tiktok") || platform === "tt") {
    return "tiktok";
  }
  if (!platform && umbrella) return "facebook_umbrella";
  if (!platform && personal) return "facebook_personal";
  return "";
}

function parseStatus(value: string): BulkImportAccountDraft["status"] {
  const v = value.trim().toLowerCase();
  if (v.includes("suspend")) return "suspended";
  if (
    v.includes("temp") ||
    v.includes("lock") ||
    v.includes("archiv")
  ) {
    return "archived";
  }
  return "active";
}

function parseCategory(value: string) {
  const v = value.trim().toUpperCase().replace(/\s+/g, "-");
  if (v === "GHG" || v === "GH-G") return "GH-G";
  if (v === "GHR" || v === "GH-R") return "GH-R";
  return isSetupCategory(value.trim()) ? value.trim() : value.trim();
}

function rowHasData(values: string[]) {
  return values.some((value) => value.trim().length > 0);
}

export function parseAfricaTemplateSheet(
  aoa: unknown[][],
  holderName: string
): BulkImportParseResult {
  const warnings: string[] = [];
  if (!aoa.length) {
    return { language: "", warnings: ["The spreadsheet is empty."], rows: [] };
  }

  const headerRow = (aoa[0] ?? []).map((cell) => cellString(cell));
  const handlerIdx = headerIndex(headerRow, ["handler name", "handler", "account holder"]);
  const countryIdx = headerIndex(headerRow, ["country"]);
  const platformIdx = headerIndex(headerRow, ["platforms", "platform"]);
  const categoryIdx = headerIndex(headerRow, ["categories", "category"]);
  const accountNameIdx = headerIndex(headerRow, [
    "acount name",
    "account name",
    "name",
  ]);
  const urlIdx = headerIndex(headerRow, ["url", "profile url", "link"]);
  const personalIdx = headerIndex(headerRow, ["personal"]);
  const umbrellaIdx = headerIndex(headerRow, ["umbrella"]);
  const statusIdx = headerIndex(headerRow, ["status"]);
  const languageIdx = headerIndex(headerRow, ["language1", "language"]);
  const usernameIdx = headerIndex(headerRow, ["username"]);
  const emailIdx = headerIndex(headerRow, ["email"]);
  const passwordIdx = headerIndex(headerRow, ["password", "account password"]);
  const mobileIdx = headerIndex(headerRow, [
    "mobile no",
    "mobile no.",
    "mobile",
    "mobile number",
  ]);

  if (urlIdx < 0 && usernameIdx < 0) {
    return {
      language: "",
      warnings: [
        "Could not find URL or Username columns. Use the Africa Template.xlsx file.",
      ],
      rows: [],
    };
  }

  const rows: BulkImportAccountDraft[] = [];
  const languages: string[] = [];
  const otherHandlers = new Set<string>();
  const otherCountries = new Set<string>();

  for (let i = 1; i < aoa.length; i += 1) {
    const raw = aoa[i] ?? [];
    const values = raw.map((cell) => cellString(cell));
    if (!rowHasData(values)) continue;

    const take = (idx: number) => (idx >= 0 ? values[idx] ?? "" : "");
    const handler = take(handlerIdx);
    const country = take(countryIdx);
    const username = take(usernameIdx) || take(accountNameIdx);
    const url = take(urlIdx);
    const password = take(passwordIdx);
    if (!username && !url) continue;

    if (handler && handler.toLowerCase() !== holderName.trim().toLowerCase()) {
      otherHandlers.add(handler);
    }
    if (country) otherCountries.add(country);

    const language = take(languageIdx);
    if (language) languages.push(language);

    rows.push({
      id: `import-${i}`,
      platform: parsePlatform(take(platformIdx), take(personalIdx), take(umbrellaIdx)),
      accountHolder: holderName,
      url,
      category: parseCategory(take(categoryIdx)),
      username,
      email: take(emailIdx),
      accountPassword: password,
      emailPassword: password,
      mobileNumber: take(mobileIdx),
      status: parseStatus(take(statusIdx)),
    });
  }

  if (otherHandlers.size > 0) {
    warnings.push(
      `Some rows list a different handler (${[...otherHandlers].join(", ")}). They will still be imported for ${holderName}.`
    );
  }
  if (otherCountries.size > 1) {
    warnings.push(
      `The sheet lists more than one country (${[...otherCountries].join(", ")}). The country you selected will be used.`
    );
  }

  const language =
    languages.find((value) => isSetupLanguage(value)) ?? languages[0] ?? "";

  if (!rows.length) {
    warnings.push("No account rows were found in the spreadsheet.");
  }

  return { language, warnings, rows };
}

export function validateBulkImportDraftRow(
  row: BulkImportAccountDraft
): string | null {
  if (!row.platform || !PLATFORMS.includes(row.platform)) {
    return "Select a platform.";
  }
  if (!row.accountHolder.trim()) return "Add an account holder.";
  if (!row.username.trim()) return "Add a username.";
  if (!isValidAccountUrl(row.url)) return "Use a valid http(s) URL.";
  if (!isPlatformAccountUrl(row.platform, row.url)) {
    return platformUrlErrorMessage(row.platform);
  }
  if (!isSetupCategory(row.category)) return "Select a category.";
  if (!isValidAccountEmail(row.email)) return "Use a valid email.";
  if (!row.accountPassword) return "Add an account password.";
  if (!row.emailPassword) return "Add an email password.";
  if (!row.mobileNumber.trim()) return "Add a mobile number.";
  return null;
}

export function countBulkImportTargets(rows: BulkImportAccountDraft[]) {
  const counts: Record<Platform, number> = {
    x: 0,
    facebook_personal: 0,
    facebook_umbrella: 0,
    instagram: 0,
    tiktok: 0,
  };
  for (const row of rows) {
    if (row.platform && PLATFORMS.includes(row.platform)) {
      counts[row.platform] += 1;
    }
  }
  return counts;
}
