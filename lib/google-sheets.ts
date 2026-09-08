import { google } from "googleapis";
import {
  sheetsExportValuesFromRow,
  transformSheetsExportRow,
} from "@/lib/sheets-export-transform";
import {
  accountHasSheetIdentifiers,
  accountSyncLabel,
  buildSheetRowIndex,
  findSheetRowIndicesForAccount,
  maxSheetSerialNumber,
  parseSheetSerialNumber,
  type PartialSheetsSyncSummary,
} from "@/lib/sheets-row-match";
import type { SheetsExportAccountRow } from "@/types/admin";

/** First data row — row 1 keeps the sheet template headers & validation. */
export const SHEETS_DATA_START_ROW = 2;
/** Read/update range cap for production sheets. */
export const SHEETS_MAX_DATA_ROW = 5000;

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
 * Manager-safe sync — updates matched rows in place, clears duplicate rows
 * for the same account, and never wipes unrelated sheet data.
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
  const rowIndex = buildSheetRowIndex(existingRows);

  const batchUpdates: { range: string; values: unknown[][] }[] = [];
  const clearRanges: string[] = [];
  const appendRows: unknown[][] = [];
  const clearedRowIndices = new Set<number>();
  const skippedAccounts: string[] = [];
  let skipped = 0;

  let nextSerial = maxSheetSerialNumber(existingRows);

  for (const account of accounts) {
    const matchedIndices = findSheetRowIndicesForAccount(account, rowIndex);

    if (matchedIndices.length === 0) {
      if (!accountHasSheetIdentifiers(account)) {
        skipped += 1;
        skippedAccounts.push(`${accountSyncLabel(account)} (invalid account id)`);
        continue;
      }

      nextSerial += 1;
      const transformed = transformSheetsExportRow(account);
      appendRows.push(sheetsExportValuesFromRow(transformed, nextSerial));
      continue;
    }

    const primaryIndex = matchedIndices[0];
    const primaryRowNumber = SHEETS_DATA_START_ROW + primaryIndex;
    const existingRow = existingRows[primaryIndex] ?? [];
    const serial = parseSheetSerialNumber(existingRow, primaryIndex + 1);
    const transformed = transformSheetsExportRow(account);

    batchUpdates.push({
      range: `${sheetTab}!A${primaryRowNumber}:W${primaryRowNumber}`,
      values: [sheetsExportValuesFromRow(transformed, serial)],
    });

    for (const duplicateIndex of matchedIndices.slice(1)) {
      if (clearedRowIndices.has(duplicateIndex)) continue;
      clearedRowIndices.add(duplicateIndex);
      const duplicateRowNumber = SHEETS_DATA_START_ROW + duplicateIndex;
      clearRanges.push(`${sheetTab}!A${duplicateRowNumber}:W${duplicateRowNumber}`);
    }
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

  if (clearRanges.length > 0) {
    await sheets.spreadsheets.values.batchClear({
      spreadsheetId,
      requestBody: { ranges: clearRanges },
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
    duplicatesCleared: clearRanges.length,
    skippedAccounts,
  };
}
