import { google } from "googleapis";
import {
  ALPHAA_SHEETS_EXPORT_HEADERS,
  alphaaSheetsExportValuesFromRow,
  transformAlphaaSheetsExportRow,
} from "@/lib/alphaa-sheets-export-transform";
import {
  sheetsExportValuesFromRow,
  transformSheetsExportRow,
} from "@/lib/sheets-export-transform";
import { splitAccountsByExportRegion } from "@/lib/sheets-export-region";
import type { SetupRegion } from "@/lib/setup-options";
import type {
  AlphaaSheetsExportAccountRow,
  SheetsExportAccountRow,
} from "@/types/admin";

/** Africa/Balkan — row 1 keeps template headers; data starts at row 2. */
const STRATEGY_DATA_START_ROW = 2;
const STRATEGY_MAX_DATA_ROW = 5000;

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

function getRegionSheetsTarget(region: SetupRegion): RegionSheetsTarget {
  const spreadsheetId = process.env.SPREADSHEET_ID?.trim();
  if (!spreadsheetId) {
    throw new Error(
      "Google Sheets is not configured. Set SPREADSHEET_ID."
    );
  }

  let sheetTab = process.env.GOOGLE_SHEETS_TAB?.trim() || "Africa";
  if (region === "Balkan") {
    sheetTab = process.env.GOOGLE_SHEETS_TAB_BALKAN?.trim() || "Balkan";
  } else if (region === "Alphaa") {
    sheetTab = process.env.GOOGLE_SHEETS_TAB_ALPHAA?.trim() || "ALPHAA";
  }

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

/** Africa/Balkan strategy tabs — data only (headers live on the sheet template). */
async function syncStrategyAccountsToSheetTab(
  target: RegionSheetsTarget,
  accounts: SheetsExportAccountRow[],
  credentials: GoogleSheetsCredentials
) {
  const sheets = getSheetsClient(credentials);
  const transformedAccounts = accounts.map(transformSheetsExportRow);
  const values = transformedAccounts.map((account, index) =>
    sheetsExportValuesFromRow(account, index + 1)
  );

  const clearRange = `${target.sheetTab}!A${STRATEGY_DATA_START_ROW}:W${STRATEGY_MAX_DATA_ROW}`;
  const updateRange = `${target.sheetTab}!A${STRATEGY_DATA_START_ROW}`;

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

/** ALPHAA tab — full replace including headers (legacy social_media_accounts format). */
async function syncAlphaaAccountsToSheetTab(
  target: RegionSheetsTarget,
  accounts: AlphaaSheetsExportAccountRow[],
  credentials: GoogleSheetsCredentials
) {
  const sheets = getSheetsClient(credentials);
  const transformedAccounts = accounts.map(transformAlphaaSheetsExportRow);
  const values = transformedAccounts.map(alphaaSheetsExportValuesFromRow);

  const clearRange = `${target.sheetTab}!A1:Z`;
  const updateRange = `${target.sheetTab}!A1`;

  await sheets.spreadsheets.values.clear({
    spreadsheetId: target.spreadsheetId,
    range: clearRange,
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: target.spreadsheetId,
    range: updateRange,
    valueInputOption: "RAW",
    requestBody: {
      values: [Array.from(ALPHAA_SHEETS_EXPORT_HEADERS), ...values],
    },
  });

  return accounts.length;
}

export type SheetsSyncSummary = {
  africaCount: number;
  balkanCount: number;
  alphaaCount: number;
  total: number;
};

/** Sync Africa/Balkan (temp accounts) and ALPHAA (legacy social_media_accounts). */
export async function syncAccountsToGoogleSheets(
  africaBalkanAccounts: SheetsExportAccountRow[],
  alphaaAccounts: AlphaaSheetsExportAccountRow[]
): Promise<SheetsSyncSummary> {
  const credentials = getGoogleSheetsCredentials();
  const { africa, balkan } = splitAccountsByExportRegion(africaBalkanAccounts);

  const [africaCount, balkanCount, alphaaCount] = await Promise.all([
    syncStrategyAccountsToSheetTab(
      getRegionSheetsTarget("Africa"),
      africa,
      credentials
    ),
    syncStrategyAccountsToSheetTab(
      getRegionSheetsTarget("Balkan"),
      balkan,
      credentials
    ),
    syncAlphaaAccountsToSheetTab(
      getRegionSheetsTarget("Alphaa"),
      alphaaAccounts,
      credentials
    ),
  ]);

  return {
    africaCount,
    balkanCount,
    alphaaCount,
    total: africaCount + balkanCount + alphaaCount,
  };
}
