import { google } from "googleapis";
import {
  sheetsExportValuesFromRow,
  transformSheetsExportRow,
} from "@/lib/sheets-export-transform";
import {
  splitAccountsByExportRegion,
  type SheetsExportRegion,
} from "@/lib/sheets-export-region";
import type { SheetsExportAccountRow } from "@/types/admin";

/** First data row — row 1 keeps the sheet template headers & validation. */
const DATA_START_ROW = 2;
const MAX_DATA_ROW = 5000;

type RegionSheetsTarget = {
  spreadsheetId: string;
  sheetTab: string;
};

type GoogleSheetsCredentials = {
  clientEmail: string;
  privateKey: string;
};

function getGoogleSheetsCredentials(): GoogleSheetsCredentials {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail || !privateKeyRaw) {
    throw new Error(
      "Google Sheets is not configured. Set GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY."
    );
  }

  return {
    clientEmail,
    privateKey: privateKeyRaw.replace(/\\n/g, "\n"),
  };
}

function getRegionSheetsTarget(region: SheetsExportRegion): RegionSheetsTarget {
  const spreadsheetId = process.env.SPREADSHEET_ID?.trim();
  if (!spreadsheetId) {
    throw new Error(
      "Google Sheets is not configured. Set SPREADSHEET_ID."
    );
  }

  const sheetTab =
    region === "Balkan"
      ? process.env.GOOGLE_SHEETS_TAB_BALKAN?.trim() || "Balkan"
      : process.env.GOOGLE_SHEETS_TAB?.trim() || "Africa";

  return { spreadsheetId, sheetTab };
}

function getSheetsClient(credentials: GoogleSheetsCredentials) {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: credentials.clientEmail,
      private_key: credentials.privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

/** Replaces all data rows on one sheet tab with the exported accounts. */
async function syncAccountsToSheetTab(
  target: RegionSheetsTarget,
  accounts: SheetsExportAccountRow[],
  credentials: GoogleSheetsCredentials
) {
  const sheets = getSheetsClient(credentials);
  const transformedAccounts = accounts.map(transformSheetsExportRow);
  const values = transformedAccounts.map((account, index) =>
    sheetsExportValuesFromRow(account, index + 1)
  );

  const clearRange = `${target.sheetTab}!A${DATA_START_ROW}:W${MAX_DATA_ROW}`;
  const updateRange = `${target.sheetTab}!A${DATA_START_ROW}`;

  await sheets.spreadsheets.values.clear({
    spreadsheetId: target.spreadsheetId,
    range: clearRange,
  });

  if (values.length === 0) {
    return 0;
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: target.spreadsheetId,
    range: updateRange,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });

  return accounts.length;
}

export type SheetsSyncSummary = {
  africaCount: number;
  balkanCount: number;
  total: number;
};

/** Sync Africa and Balkan accounts to separate tabs in the same spreadsheet. */
export async function syncAccountsToGoogleSheets(
  accounts: SheetsExportAccountRow[]
): Promise<SheetsSyncSummary> {
  const credentials = getGoogleSheetsCredentials();
  const { africa, balkan } = splitAccountsByExportRegion(accounts);

  const [africaCount, balkanCount] = await Promise.all([
    syncAccountsToSheetTab(getRegionSheetsTarget("Africa"), africa, credentials),
    syncAccountsToSheetTab(getRegionSheetsTarget("Balkan"), balkan, credentials),
  ]);

  return {
    africaCount,
    balkanCount,
    total: africaCount + balkanCount,
  };
}
