export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchAdminHolderAccounts } from "@/lib/admin-accounts-data";
import type { EmployeeAccountsResponse } from "@/types/admin";

export async function GET(request: Request) {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!Number.isFinite(userId) || session?.user?.role !== "admin") {
    return NextResponse.json(
      { ok: false, error: "Unauthorized — admin only." } satisfies EmployeeAccountsResponse,
      { status: 401 }
    );
  }

  const url = new URL(request.url);
  const sourceRaw = url.searchParams.get("source");
  const source =
    sourceRaw === "alphaa" ? "alphaa" : sourceRaw === "temp" ? "temp" : null;
  const id = Number(url.searchParams.get("id"));

  if (!source || !Number.isFinite(id)) {
    return NextResponse.json(
      { ok: false, error: "Select an account holder." } satisfies EmployeeAccountsResponse,
      { status: 400 }
    );
  }

  try {
    const accounts = await fetchAdminHolderAccounts(id, source);
    return NextResponse.json({
      ok: true,
      accounts,
    } satisfies EmployeeAccountsResponse);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load accounts.";
    return NextResponse.json(
      { ok: false, error: message } satisfies EmployeeAccountsResponse,
      { status: 500 }
    );
  }
}
