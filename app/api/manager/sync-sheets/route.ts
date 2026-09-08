export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchManagerAccountsForSheetsExport } from "@/lib/admin-sheets-export-data";
import { partialSyncAccountsToGoogleSheets } from "@/lib/google-sheets";
import { summarizePartialSheetsSync } from "@/lib/sheets-row-match";
import type { SheetsSyncResult } from "@/types/admin";

export async function POST() {
  const session = await auth();
  const managerId = Number(session?.user?.id);
  const role = session?.user?.role;

  if (!Number.isFinite(managerId)) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  if (role !== "manager") {
    return NextResponse.json(
      { success: false, message: "Forbidden — manager only." },
      { status: 403 }
    );
  }

  try {
    const accounts = await fetchManagerAccountsForSheetsExport(managerId);

    if (accounts.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No team accounts to sync.",
        count: 0,
        updated: 0,
        appended: 0,
        skipped: 0,
        duplicatesCleared: 0,
        skippedAccounts: [],
      } satisfies SheetsSyncResult);
    }

    const summary = await partialSyncAccountsToGoogleSheets(accounts);
    const result: SheetsSyncResult = {
      success: true,
      ...summarizePartialSheetsSync(accounts, summary),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error partially syncing manager accounts to Google Sheets:", error);
    const message =
      error instanceof Error ? error.message : "Error saving data to Google Sheets";

    return NextResponse.json(
      {
        success: false,
        message,
      } satisfies SheetsSyncResult,
      { status: 500 }
    );
  }
}
