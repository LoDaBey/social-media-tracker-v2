export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchAdminCountryCoverage } from "@/lib/admin-country-coverage";
import { isAlphaaCountry } from "@/lib/region-config";
import type { AdminCountryCoverageResponse } from "@/types/admin";

export async function GET(request: Request) {
  const session = await auth();
  const userId = Number(session?.user?.id);
  const role = session?.user?.role;
  if (
    !Number.isFinite(userId) ||
    (role !== "admin" && role !== "manager" && role !== "op")
  ) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized." } satisfies AdminCountryCoverageResponse,
      { status: 401 }
    );
  }

  const country = new URL(request.url).searchParams.get("country")?.trim() ?? "";
  if (!country) {
    return NextResponse.json(
      {
        ok: false,
        error: "Choose a country.",
      } satisfies AdminCountryCoverageResponse,
      { status: 400 }
    );
  }

  try {
    const coverage = await fetchAdminCountryCoverage({ countries: [country] });
    return NextResponse.json({
      ok: true,
      coverage,
      showAlphaaPlatforms: isAlphaaCountry(country),
    } satisfies AdminCountryCoverageResponse);
  } catch (error) {
    console.error("Could not load country coverage.", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Could not load planned coverage for this country.",
      } satisfies AdminCountryCoverageResponse,
      { status: 500 }
    );
  }
}
