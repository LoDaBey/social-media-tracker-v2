import { google } from "googleapis";
import {
  sheetsExportValuesFromRow,
  transformSheetsExportRow,
} from "@/lib/sheets-export-transform";
import type { SheetsExportAccountRow } from "@/types/admin";

/** First data row — row 1 keeps the sheet template headers & validation. */
const DATA_START_ROW = 2;
/** Clear trailing rows so stale values (e.g. I800) do not block array formulas. */
const MAX_DATA_ROW = 1000;

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

export async function syncAccountsToGoogleSheets(accounts: SheetsExportAccountRow[]) {
  const { spreadsheetId, sheetTab } = getGoogleSheetsConfig();
  const sheets = getSheetsClient();

  const transformedAccounts = accounts.map(transformSheetsExportRow);
  const values = transformedAccounts.map((account, index) =>
    sheetsExportValuesFromRow(account, index + 1)
  );

  const clearRange = `${sheetTab}!A${DATA_START_ROW}:W${MAX_DATA_ROW}`;
  const updateRange = `${sheetTab}!A${DATA_START_ROW}`;

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
