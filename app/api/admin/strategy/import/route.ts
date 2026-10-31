export const runtime = "nodejs";

import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { parseStrategyWorkbook } from "@/lib/strategy-excel-import";
import { importProjectRows } from "@/lib/strategy-plans-data";
import { syncLegacyBookSubProjectsFromCountryPlans } from "@/lib/strategy-projects-data";
import type { StrategyImportResult } from "@/types/strategy";

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!Number.isFinite(userId) || session?.user?.role !== "admin") {
    return NextResponse.json(
      { success: false, message: "Unauthorized — admin only." } satisfies StrategyImportResult,
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "Choose the strategy Excel file." } satisfies StrategyImportResult,
        { status: 400 }
      );
    }
    if (file.size === 0) {
      return NextResponse.json(
        { success: false, message: "The uploaded file is empty." } satisfies StrategyImportResult,
        { status: 400 }
      );
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { success: false, message: "The file is too large. Use a spreadsheet under 8 MB." } satisfies StrategyImportResult,
        { status: 400 }
      );
    }
    const name = file.name.toLowerCase();
    if (!name.endsWith(".xlsx") && !name.endsWith(".xls")) {
      return NextResponse.json(
        { success: false, message: "Upload an Excel file (.xlsx)." } satisfies StrategyImportResult,
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = parseStrategyWorkbook(buffer);
    if (parsed.alphaa.length === 0 && parsed.africaEurope.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No country rows found. Use the Alpha Main Asset and Africa, Europe Accounts sheets.",
        } satisfies StrategyImportResult,
        { status: 400 }
      );
    }

    await importProjectRows(
      "alphaa",
      parsed.alphaa.map((row) => ({
        country: row.country,
        language: row.language,
        resources: row.resources,
        totalAccounts: row.totalAccounts,
        projectTargets: row.projectTargets,
      }))
    );
    await importProjectRows(
      "africa_europe",
      parsed.africaEurope.map((row) => ({
        country: row.country,
        region: row.region === "Europe" ? "Europe" : "Africa",
        language: row.language,
        language2: row.language2,
        resources: row.resources,
        totalAccounts: row.totalAccounts,
        projectTargets: row.projectTargets,
      }))
    );

    await syncLegacyBookSubProjectsFromCountryPlans();

    revalidatePath("/admin");
    revalidatePath("/admin/strategy");

    const result: StrategyImportResult = {
      success: true,
      message: `Updated ${parsed.alphaa.length} ALPHAA and ${parsed.africaEurope.length} Africa/Europe countries. Handler templates were kept.`,
      alphaaCount: parsed.alphaa.length,
      africaEuropeCount: parsed.africaEurope.length,
    };
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error importing strategy Excel:", error);
    const message =
      error instanceof Error ? error.message : "Could not import the strategy file.";
    return NextResponse.json(
      { success: false, message } satisfies StrategyImportResult,
      { status: 500 }
    );
  }
}
