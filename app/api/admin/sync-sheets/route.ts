export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchAccountsForSheetsExport } from "@/lib/admin-sheets-export-data";
import { syncAccountsToGoogleSheets } from "@/lib/google-sheets";
import type { SheetsSyncResult } from "@/types/admin";

export async function POST() {
  const session = await auth();
  const userId = Number(session?.user?.id);
  const role = session?.user?.role;

  if (!Number.isFinite(userId)) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  if (role !== "admin") {
    return NextResponse.json({ success: false, message: "Forbidden — admin only." }, { status: 403 });
  }

  try {
    const accounts = await fetchAccountsForSheetsExport();
    const count = await syncAccountsToGoogleSheets(accounts);

    const result: SheetsSyncResult = {
      success: true,
      message: "Data successfully saved to Google Sheets",
      count,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error saving to Google Sheets:", error);
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
