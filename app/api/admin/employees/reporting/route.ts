export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchEmployeeReporting } from "@/lib/admin-employee-reporting";
import { assertManagerCanEditEmployee } from "@/lib/manager-data";
import type { EmployeeReportingResponse } from "@/types/admin";

export async function GET(request: Request) {
  const session = await auth();
  const userId = Number(session?.user?.id);
  const role = session?.user?.role;
  if (!Number.isFinite(userId) || (role !== "admin" && role !== "manager")) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized." } satisfies EmployeeReportingResponse,
      { status: 401 }
    );
  }

  const url = new URL(request.url);
  const sourceRaw = url.searchParams.get("source");
  const source = sourceRaw === "alphaa" ? "alphaa" : sourceRaw === "temp" ? "temp" : null;
  const id = Number(url.searchParams.get("id"));

  if (!source || !Number.isFinite(id)) {
    return NextResponse.json(
      { ok: false, error: "Select an account holder." } satisfies EmployeeReportingResponse,
      { status: 400 }
    );
  }

  if (role === "manager") {
    if (source !== "temp") {
      return NextResponse.json(
        {
          ok: false,
          error: "You can only view reporting for your team members.",
        } satisfies EmployeeReportingResponse,
        { status: 401 }
      );
    }
    const allowed = await assertManagerCanEditEmployee(userId, id);
    if (!allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: "You can only view reporting for your team members.",
        } satisfies EmployeeReportingResponse,
        { status: 401 }
      );
    }
  }

  try {
    const reporting = await fetchEmployeeReporting(source, id);
    if (!reporting) {
      return NextResponse.json(
        { ok: false, error: "Account holder not found." } satisfies EmployeeReportingResponse,
        { status: 404 }
      );
    }
    return NextResponse.json({
      ok: true,
      reporting,
    } satisfies EmployeeReportingResponse);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load reporting.";
    return NextResponse.json(
      { ok: false, error: message } satisfies EmployeeReportingResponse,
      { status: 500 }
    );
  }
}
