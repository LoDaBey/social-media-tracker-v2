import type { SheetsExportAccountRow } from "@/types/admin";
import { parseSheetAccountId } from "@/lib/sheets-account-id";
import { COUNTRY_SHEET_NAME } from "@/lib/sheets-country-config";
import { SETUP_COUNTRIES } from "@/lib/setup-options";

/** Column indexes in the A:W export row (0-based). */
export const SHEETS_COL = {
  SN: 0,
  REGION: 1,
  COUNTRY: 2,
  PLATFORM: 3,
  CATEGORY: 4,
  ACCOUNT_NAME: 5,
  ACCOUNT_BIO: 6,
  URL: 7,
  PERSONAL: 8,
  UMBRELLA: 9,
  STATUS: 13,
  LANGUAGE1: 14,
  HANDLER: 16,
  USERNAME: 17,
  EMAIL: 18,
  PASSWORD: 19,
  MOBILE: 20,
  DETAILS: 21,
} as const;

const SHEET_COUNTRY_ALIASES: Record<string, string> = {};
for (const country of SETUP_COUNTRIES) {
  const sheetName = COUNTRY_SHEET_NAME[country] ?? country;
  SHEET_COUNTRY_ALIASES[country.toLowerCase()] = sheetName.toLowerCase();
  SHEET_COUNTRY_ALIASES[sheetName.toLowerCase()] = sheetName.toLowerCase();
}

function normalizeCell(value: unknown) {
  return String(value ?? "").trim();
}

export function normalizeSheetsUsername(value: string | null | undefined) {
  return normalizeCell(value).replace(/^@+/i, "").toLowerCase();
}

export function normalizeSheetsUrl(value: string | null | undefined) {
  const raw = normalizeCell(value);
  if (!raw) return "";

  try {
    const parsed = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    let host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    if (host === "twitter.com") host = "x.com";
    if (host === "fb.com") host = "facebook.com";
    if (host === "m.facebook.com") host = "facebook.com";
    const path = parsed.pathname.replace(/\/+$/, "").toLowerCase();
    return `${host}${path}`;
  } catch {
    return raw.toLowerCase().replace(/\/+$/, "");
  }
}

export function normalizeSheetsEmail(value: string | null | undefined) {
  return normalizeCell(value).toLowerCase();
}

function normalizeCountry(value: string | null | undefined) {
  const token = normalizeCell(value).toLowerCase();
  return SHEET_COUNTRY_ALIASES[token] ?? token;
}

/** Stable keys used to locate an existing sheet row (most specific last). */
export function sheetsAccountMatchKeys(account: {
  username: string | null;
  account_url: string | null;
  account_email?: string | null;
  account_name?: string | null;
  handler_name?: string;
  country?: string | null;
}): string[] {
  const keys: string[] = [];
  const username = normalizeSheetsUsername(account.username);
  const url = normalizeSheetsUrl(account.account_url);
  const accountName = normalizeSheetsUsername(account.account_name);
  const email = normalizeSheetsEmail(account.account_email);

  if (email) keys.push(`email:${email}`);
  if (username) keys.push(`username:${username}`);
  if (accountName && accountName !== username) keys.push(`username:${accountName}`);
  if (url) keys.push(`url:${url}`);

  if (username) {
    const handler = normalizeCell(account.handler_name).toLowerCase();
    const country = normalizeCountry(account.country ?? "");
    keys.push(`full:${country}|${handler}|${username}`);
  }

  return keys;
}

export function sheetsRowMatchKeys(row: unknown[]): string[] {
  const keys: string[] = [];
  const username = normalizeSheetsUsername(normalizeCell(row[SHEETS_COL.USERNAME]));
  const url = normalizeSheetsUrl(normalizeCell(row[SHEETS_COL.URL]));
  const accountName = normalizeSheetsUsername(normalizeCell(row[SHEETS_COL.ACCOUNT_NAME]));
  const email = normalizeSheetsEmail(normalizeCell(row[SHEETS_COL.EMAIL]));

  if (email) keys.push(`email:${email}`);
  if (username) keys.push(`username:${username}`);
  if (accountName && accountName !== username) keys.push(`username:${accountName}`);
  if (url) keys.push(`url:${url}`);

  if (username) {
    const handler = normalizeCell(row[SHEETS_COL.HANDLER]).toLowerCase();
    const country = normalizeCountry(normalizeCell(row[SHEETS_COL.COUNTRY]));
    keys.push(`full:${country}|${handler}|${username}`);
  }

  return keys;
}

export type SheetRowIndex = {
  /** All row indices for a database account id (Details column). */
  byAccountId: Map<number, number[]>;
  /** First row index (0-based) for each match key. */
  primaryByKey: Map<string, number>;
  /** All row indices sharing a username or url (for deduping). */
  byUsername: Map<string, number[]>;
  byUrl: Map<string, number[]>;
  byEmail: Map<string, number[]>;
};

export function buildSheetRowIndex(rows: unknown[][]): SheetRowIndex {
  const byAccountId = new Map<number, number[]>();
  const primaryByKey = new Map<string, number>();
  const byUsername = new Map<string, number[]>();
  const byUrl = new Map<string, number[]>();
  const byEmail = new Map<string, number[]>();

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index] ?? [];
    if (!row.some((cell) => normalizeCell(cell))) continue;

    const username = normalizeSheetsUsername(normalizeCell(row[SHEETS_COL.USERNAME]));
    const accountName = normalizeSheetsUsername(normalizeCell(row[SHEETS_COL.ACCOUNT_NAME]));
    const url = normalizeSheetsUrl(normalizeCell(row[SHEETS_COL.URL]));
    const email = normalizeSheetsEmail(normalizeCell(row[SHEETS_COL.EMAIL]));
    const accountId = parseSheetAccountId(row[SHEETS_COL.DETAILS]);

    if (accountId) {
      const list = byAccountId.get(accountId) ?? [];
      list.push(index);
      byAccountId.set(accountId, list);
    }

    if (email) {
      const list = byEmail.get(email) ?? [];
      list.push(index);
      byEmail.set(email, list);
    }

    for (const token of [username, accountName]) {
      if (!token) continue;
      const list = byUsername.get(token) ?? [];
      list.push(index);
      byUsername.set(token, list);
    }

    if (url) {
      const list = byUrl.get(url) ?? [];
      list.push(index);
      byUrl.set(url, list);
    }

    for (const key of sheetsRowMatchKeys(row)) {
      if (!primaryByKey.has(key)) {
        primaryByKey.set(key, index);
      }
    }
  }

  return { byAccountId, primaryByKey, byUsername, byUrl, byEmail };
}

export function accountHasSheetIdentifiers(account: SheetsExportAccountRow) {
  return Number.isFinite(account.id) && account.id > 0;
}

export function accountSyncLabel(account: SheetsExportAccountRow) {
  const handle =
    account.username ||
    account.account_name ||
    account.account_email ||
    account.account_url ||
    "Unknown account";
  return `#${account.id} ${handle}`;
}

export function findSheetRowIndicesForAccount(
  account: SheetsExportAccountRow,
  index: SheetRowIndex
): number[] {
  if (account.id > 0) {
    const byId = index.byAccountId.get(account.id);
    if (byId?.length) {
      return [...byId].sort((a, b) => a - b);
    }
  }

  const username = normalizeSheetsUsername(account.username);
  const accountName = normalizeSheetsUsername(account.account_name);
  const url = normalizeSheetsUrl(account.account_url);
  const email = normalizeSheetsEmail(account.account_email);

  const indices = new Set<number>();

  if (email) {
    for (const rowIndex of index.byEmail.get(email) ?? []) {
      indices.add(rowIndex);
    }
  }

  for (const token of [username, accountName]) {
    if (!token) continue;
    for (const rowIndex of index.byUsername.get(token) ?? []) {
      indices.add(rowIndex);
    }
  }

  if (url) {
    for (const rowIndex of index.byUrl.get(url) ?? []) {
      indices.add(rowIndex);
    }
  }

  if (indices.size > 0) {
    return [...indices].sort((a, b) => a - b);
  }

  for (const key of sheetsAccountMatchKeys(account)) {
    const rowIndex = index.primaryByKey.get(key);
    if (rowIndex !== undefined) {
      return [rowIndex];
    }
  }

  return [];
}

export function parseSheetSerialNumber(row: unknown[], fallback: number) {
  const raw = normalizeCell(row[SHEETS_COL.SN]);
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function maxSheetSerialNumber(rows: unknown[][]) {
  let max = 0;
  for (const row of rows) {
    const serial = parseSheetSerialNumber(row, 0);
    if (serial > max) max = serial;
  }
  return max;
}

export type PartialSheetsSyncSummary = {
  updated: number;
  appended: number;
  skipped: number;
  duplicatesCleared: number;
  skippedAccounts: string[];
};

export function summarizePartialSheetsSync(
  accounts: SheetsExportAccountRow[],
  summary: PartialSheetsSyncSummary
) {
  const parts = [`${summary.updated} updated`];
  if (summary.duplicatesCleared > 0) {
    parts.push(`${summary.duplicatesCleared} duplicates cleared`);
  }
  if (summary.appended > 0) parts.push(`${summary.appended} added`);
  if (summary.skipped > 0) parts.push(`${summary.skipped} skipped`);

  let message = `Google Sheet sync complete (${parts.join(", ")})`;
  if (summary.skippedAccounts.length > 0) {
    message += `. Skipped: ${summary.skippedAccounts.join(", ")}`;
  }

  return {
    count: accounts.length,
    message,
    ...summary,
  };
}
