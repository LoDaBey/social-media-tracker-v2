import { PLATFORMS, type Platform } from "@/lib/platform-config";
import { isSetupCategory, isSetupLanguage } from "@/lib/setup-options";
import { accountUrlKey } from "@/lib/setup-validation";
import {
  isPlatformAccountUrl,
  isValidAccountEmail,
  isValidAccountUrl,
  platformUrlErrorMessage,
  setupAccountFieldsSchemaFor,
} from "@/lib/setup-schema";
import type { BulkImportAccountDraft, BulkImportParseResult } from "@/types/admin";

export type BulkImportRowFieldErrors = Partial<
  Record<
    | "platform"
    | "accountHolder"
    | "url"
    | "category"
    | "username"
    | "email"
    | "accountPassword"
    | "emailPassword"
    | "mobileNumber",
    string
  >
>;

export type BulkImportStrictValidation = {
  languageError: string | null;
  rowFieldErrors: Record<string, BulkImportRowFieldErrors>;
  blockingMessages: string[];
  canImport: boolean;
};

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

function compactToken(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^a-z0-9]+/g, "");
}

function isCheckmarkFlag(value: string) {
  return /[✓✔✅☑]/.test(value);
}

function isExplicitFalseFlag(value: string) {
  const token = compactToken(value);
  return !token || ["0", "no", "n", "false", "off", "none"].includes(token);
}

function isExplicitTrueFlag(value: string, extraTokens: string[]) {
  if (!value.trim() || isExplicitFalseFlag(value)) return false;
  if (isCheckmarkFlag(value)) return true;
  const token = compactToken(value);
  return ["yes", "y", "true", "1", "ok", ...extraTokens].includes(token);
}

/** Personal / Umbrella cells: Yes/No, checkmarks, P/U, any case. */
function parseColumnFlag(
  value: string,
  kind: "personal" | "umbrella"
): boolean {
  const extra = kind === "personal" ? ["p", "personal"] : ["u", "umbrella"];
  const other = kind === "personal" ? ["u", "umbrella"] : ["p", "personal"];
  const token = compactToken(value);
  if (other.includes(token)) return false;
  return isExplicitTrueFlag(value, extra);
}

function parsePlatform(
  platformRaw: string,
  personalRaw: string,
  umbrellaRaw: string
): Platform | "" {
  const platform = platformRaw.trim().toLowerCase();
  const personal = parseColumnFlag(personalRaw, "personal");
  const umbrella = parseColumnFlag(umbrellaRaw, "umbrella");

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
    if (umbrella) return "facebook_umbrella";
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
  const token = compactToken(value);
  if (!token) return "";
  if (["g", "green", "ghg"].includes(token)) return "GH-G";
  if (["r", "red", "ghr"].includes(token)) return "GH-R";
  const spaced = value.trim();
  return isSetupCategory(spaced) ? spaced : "";
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
  const categoryIdx = (() => {
    const found = headerIndex(headerRow, ["categories", "category"]);
    if (found >= 0) return found;
    // Official template puts category in column D even when the header is blank.
    return headerRow.length > 3 ? 3 : -1;
  })();
  const directionIdx = headerIndex(headerRow, ["direction"]);
  const accountNameIdx = headerIndex(headerRow, [
    "acount name",
    "account name",
    "name",
  ]);
  const urlIdx = headerIndex(headerRow, ["url", "profile url", "link"]);
  const personalIdx = headerIndex(headerRow, ["personal"]);
  const umbrellaIdx = headerIndex(headerRow, [
    "umbrella",
    "umberlla",
    "umbrellla",
  ]);
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

    const rawCategory = take(categoryIdx) || take(directionIdx);
    const parsedCategory =
      parseCategory(take(categoryIdx)) || parseCategory(take(directionIdx));

    rows.push({
      id: `import-${i}`,
      platform: parsePlatform(take(platformIdx), take(personalIdx), take(umbrellaIdx)),
      accountHolder: holderName,
      url,
      category: parsedCategory || rawCategory,
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

  const language = languages.find((value) => isSetupLanguage(value)) ?? "";
  const unrecognizedLanguage = languages.find((value) => value && !isSetupLanguage(value));
  if (unrecognizedLanguage) {
    warnings.push(
      `Language "${unrecognizedLanguage}" is not recognized and will be left empty.`
    );
  }

  if (!rows.length) {
    warnings.push("No account rows were found in the spreadsheet.");
  }

  return { language, warnings, rows };
}

export function validateBulkImportDraftRow(
  row: BulkImportAccountDraft
): string | null {
  const warnings = bulkImportRowWarnings(row);
  return warnings[0] ?? null;
}

export function bulkImportRowFieldErrors(
  row: BulkImportAccountDraft
): BulkImportRowFieldErrors {
  const errors: BulkImportRowFieldErrors = {};
  if (!row.platform || !PLATFORMS.includes(row.platform)) {
    errors.platform = "Select a platform.";
    return errors;
  }

  const parsed = setupAccountFieldsSchemaFor(row.platform).safeParse({
    accountHolder: row.accountHolder,
    url: row.url,
    category: row.category,
    username: row.username,
    email: row.email,
    accountPassword: row.accountPassword,
    emailPassword: row.emailPassword,
    mobileNumber: row.mobileNumber,
  });

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key !== "string") continue;
      if (errors[key as keyof BulkImportRowFieldErrors]) continue;
      errors[key as keyof BulkImportRowFieldErrors] = issue.message;
    }
  }

  return errors;
}

export function getBulkImportStrictValidation(
  rows: BulkImportAccountDraft[],
  language: string
): BulkImportStrictValidation {
  const languageError = isSetupLanguage(language)
    ? null
    : "Select a valid language.";
  const rowFieldErrors: Record<string, BulkImportRowFieldErrors> = {};
  const blockingMessages: string[] = [];
  const seenUrls = new Map<string, string>();

  const platformRows = rows.filter((row) => row.platform);
  if (!platformRows.length) {
    blockingMessages.push("Add at least one row with a platform.");
  }

  for (const row of rows) {
    if (!row.platform) continue;

    const fieldErrors = bulkImportRowFieldErrors(row);
    const url = row.url.trim();
    if (
      url &&
      isValidAccountUrl(url) &&
      isPlatformAccountUrl(row.platform, url)
    ) {
      const key = accountUrlKey(row.platform, url);
      const firstRowId = seenUrls.get(key);
      if (firstRowId) {
        fieldErrors.url = "Same URL used twice.";
        rowFieldErrors[firstRowId] = {
          ...(rowFieldErrors[firstRowId] ?? {}),
          url: "Same URL used twice.",
        };
      } else {
        seenUrls.set(key, row.id);
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      rowFieldErrors[row.id] = {
        ...(rowFieldErrors[row.id] ?? {}),
        ...fieldErrors,
      };
    }
  }

  const invalidRowCount = Object.keys(rowFieldErrors).length;
  if (invalidRowCount > 0) {
    blockingMessages.push(
      `Fix all highlighted issues in ${invalidRowCount} row${
        invalidRowCount === 1 ? "" : "s"
      } before importing.`
    );
  }
  if (languageError) {
    blockingMessages.push(languageError);
  }

  return {
    languageError,
    rowFieldErrors,
    blockingMessages,
    canImport:
      blockingMessages.length === 0 &&
      platformRows.length > 0 &&
      invalidRowCount === 0,
  };
}

export function bulkImportRowWarnings(row: BulkImportAccountDraft): string[] {
  const warnings: string[] = [];
  if (!row.platform || !PLATFORMS.includes(row.platform)) {
    warnings.push("Select a platform.");
  }
  if (row.url.trim()) {
    if (!isValidAccountUrl(row.url)) {
      warnings.push("URL is invalid and will be saved empty.");
    } else if (
      row.platform &&
      PLATFORMS.includes(row.platform) &&
      !isPlatformAccountUrl(row.platform, row.url)
    ) {
      warnings.push(
        `${platformUrlErrorMessage(row.platform)} It will be saved empty.`
      );
    }
  }
  if (row.category.trim() && !isSetupCategory(row.category.trim())) {
    warnings.push("Category is invalid and will be saved empty.");
  }
  if (row.email.trim() && !isValidAccountEmail(row.email)) {
    warnings.push("Email is invalid and will be saved empty.");
  }
  return warnings;
}

export function sanitizeBulkImportRow(
  row: BulkImportAccountDraft,
  holderName: string
): BulkImportAccountDraft {
  const platform =
    row.platform && PLATFORMS.includes(row.platform) ? row.platform : "";
  let url = row.url.trim();
  if (
    url &&
    (!isValidAccountUrl(url) ||
      (platform && !isPlatformAccountUrl(platform, url)))
  ) {
    url = "";
  }
  const category = isSetupCategory(row.category.trim())
    ? row.category.trim()
    : "";
  const email = isValidAccountEmail(row.email) ? row.email.trim() : "";

  return {
    ...row,
    platform,
    accountHolder: row.accountHolder.trim() || holderName,
    url,
    category,
    username: row.username.trim(),
    email,
    accountPassword: row.accountPassword,
    emailPassword: row.emailPassword,
    mobileNumber: row.mobileNumber.trim(),
  };
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
