import type { SheetsExportAccountRow } from "@/types/admin";
import { sheetCountryName } from "@/lib/sheets-country-config";

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

function normalizeUsername(value: string) {
  return value.trim().replace(/^@+/i, "").toLowerCase();
}

function normalizeCell(value: unknown) {
  return String(value ?? "").trim();
}

export function sheetsAccountMatchKey(account: {
  username: string | null;
  account_url: string | null;
  handler_name?: string;
  country?: string | null;
}): string | null {
  const username = normalizeUsername(account.username ?? "");
  if (username) {
    const handler = normalizeCell(account.handler_name).toLowerCase();
    const country = normalizeCell(sheetCountryName(account.country ?? "")).toLowerCase();
    return `u:${country}|${handler}|${username}`;
  }

  const url = normalizeCell(account.account_url).toLowerCase();
  if (url) return `url:${url}`;

  return null;
}

export function sheetsRowMatchKey(row: unknown[]): string | null {
  const username = normalizeUsername(normalizeCell(row[SHEETS_COL.USERNAME]));
  if (username) {
    const handler = normalizeCell(row[SHEETS_COL.HANDLER]).toLowerCase();
    const country = normalizeCell(row[SHEETS_COL.COUNTRY]).toLowerCase();
    return `u:${country}|${handler}|${username}`;
  }

  const url = normalizeCell(row[SHEETS_COL.URL]).toLowerCase();
  if (url) return `url:${url}`;

  return null;
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
};

export function summarizePartialSheetsSync(
  accounts: SheetsExportAccountRow[],
  summary: PartialSheetsSyncSummary
) {
  const parts = [`${summary.updated} updated`];
  if (summary.appended > 0) parts.push(`${summary.appended} added`);
  if (summary.skipped > 0) parts.push(`${summary.skipped} skipped`);

  return {
    count: accounts.length,
    message: `Google Sheet sync complete (${parts.join(", ")})`,
    ...summary,
  };
}
