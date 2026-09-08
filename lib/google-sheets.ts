import { google } from "googleapis";
import {
  sheetsExportValuesFromRow,
  transformSheetsExportRow,
} from "@/lib/sheets-export-transform";
import {
  maxSheetSerialNumber,
  parseSheetSerialNumber,
  sheetsAccountMatchKey,
  sheetsRowMatchKey,
  type PartialSheetsSyncSummary,
} from "@/lib/sheets-row-match";
import type { SheetsExportAccountRow } from "@/types/admin";

/** First data row — row 1 keeps the sheet template headers & validation. */
export const SHEETS_DATA_START_ROW = 2;
/** Read/update range cap — avoids touching rows far below production data. */
export const SHEETS_MAX_DATA_ROW = 1000;

function getGoogleSheetsConfig() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY;
  const spreadsheetId = process.env.SPREADSHEET_ID;
  const sheetTab = process.env.GOOGLE_SHEETS_TAB ?? "Africa";

  if (!clientEmail || !privateKeyRaw || !spreadsheetId) {
    throw new Error(
      "Google Sheets is not configured. Set GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, and SPREADSHEET_ID."
    );
  }

  return {
    clientEmail,
    privateKey: privateKeyRaw.replace(/\\n/g, "\n"),
    spreadsheetId,
    sheetTab,
  };
}

function getSheetsClient() {
  const { clientEmail, privateKey } = getGoogleSheetsConfig();

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

/** Admin-only — replaces all data rows on the sheet tab. */
export async function syncAccountsToGoogleSheets(accounts: SheetsExportAccountRow[]) {
  const { spreadsheetId, sheetTab } = getGoogleSheetsConfig();
  const sheets = getSheetsClient();

  const transformedAccounts = accounts.map(transformSheetsExportRow);
  const values = transformedAccounts.map((account, index) =>
    sheetsExportValuesFromRow(account, index + 1)
  );

  const clearRange = `${sheetTab}!A${SHEETS_DATA_START_ROW}:W${SHEETS_MAX_DATA_ROW}`;
  const updateRange = `${sheetTab}!A${SHEETS_DATA_START_ROW}`;

  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: clearRange,
  });

  if (values.length === 0) {
    return 0;
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: updateRange,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });

  return accounts.length;
}

/**
 * Manager-safe sync — reads existing rows, updates only matched accounts,
 * and appends new team accounts without clearing the sheet.
 */
export async function partialSyncAccountsToGoogleSheets(
  accounts: SheetsExportAccountRow[]
): Promise<PartialSheetsSyncSummary> {
  const { spreadsheetId, sheetTab } = getGoogleSheetsConfig();
  const sheets = getSheetsClient();

  const readRange = `${sheetTab}!A${SHEETS_DATA_START_ROW}:W${SHEETS_MAX_DATA_ROW}`;
  const existingResponse = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: readRange,
  });

  const existingRows = existingResponse.data.values ?? [];
  const rowIndexByKey = new Map<string, number>();

  for (let index = 0; index < existingRows.length; index += 1) {
    const key = sheetsRowMatchKey(existingRows[index] ?? []);
    if (key && !rowIndexByKey.has(key)) {
      rowIndexByKey.set(key, index);
    }
  }

  const batchUpdates: { range: string; values: unknown[][] }[] = [];
  const appendRows: unknown[][] = [];
  let skipped = 0;

  let nextSerial = maxSheetSerialNumber(existingRows);

  for (const account of accounts) {
    const matchKey = sheetsAccountMatchKey({
      username: account.username,
      account_url: account.account_url,
      handler_name: account.handler_name,
      country: account.country,
    });

    if (!matchKey) {
      skipped += 1;
      continue;
    }

    const transformed = transformSheetsExportRow(account);
    const existingIndex = rowIndexByKey.get(matchKey);

    if (existingIndex !== undefined) {
      const sheetRowNumber = SHEETS_DATA_START_ROW + existingIndex;
      const existingRow = existingRows[existingIndex] ?? [];
      const serial = parseSheetSerialNumber(existingRow, existingIndex + 1);
      batchUpdates.push({
        range: `${sheetTab}!A${sheetRowNumber}:W${sheetRowNumber}`,
        values: [sheetsExportValuesFromRow(transformed, serial)],
      });
      continue;
    }

    nextSerial += 1;
    appendRows.push(sheetsExportValuesFromRow(transformed, nextSerial));
  }

  if (batchUpdates.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: "USER_ENTERED",
        data: batchUpdates,
      },
    });
  }

  if (appendRows.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetTab}!A:W`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: appendRows },
    });
  }

  return {
    updated: batchUpdates.length,
    appended: appendRows.length,
    skipped,
  };
}
