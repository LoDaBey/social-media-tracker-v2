import { google } from "googleapis";
import {
  SHEETS_EXPORT_HEADERS,
  sheetsExportValuesFromRow,
  transformSheetsExportRow,
} from "@/lib/sheets-export-transform";
import type { SheetsExportAccountRow } from "@/types/admin";

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

  const clearRange = `${sheetTab}!A1:W`;
  const updateRange = `${sheetTab}!A1`;

  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: clearRange,
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: updateRange,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [Array.from(SHEETS_EXPORT_HEADERS), ...values],
    },
  });

  return accounts.length;
}
