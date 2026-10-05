"use server";

import { auth } from "@/auth";
import { fetchAdminExtract } from "@/lib/admin-extract-data";
import { PLATFORMS, type Platform } from "@/lib/platform-config";
import { isSetupCountry } from "@/lib/setup-options";
import type { AccountScope } from "@/types/db";
import type {
  AdminExtractFilters,
  AdminExtractResult,
  AdminExtractSpareFilter,
  AdminExtractStatusFilter,
  AdminExtractRegionFilter,
} from "@/types/admin";

function requireAdmin() {
  return auth().then((session) => {
    const adminId = Number(session?.user?.id);
    const role = session?.user?.role;
    if (!Number.isFinite(adminId) || role !== "admin") {
      throw new Error("Unauthorized — admin only.");
    }
  });
}

function normalizeFilters(input: AdminExtractFilters): AdminExtractFilters {
  const region: AdminExtractRegionFilter =
    input.region === "Africa" || input.region === "Europe"
      ? input.region
      : "all";
  const platforms = (input.platforms ?? []).filter((platform): platform is Platform =>
    (PLATFORMS as readonly string[]).includes(platform)
  );
  const scopes = (input.scopes ?? []).filter((scope): scope is AccountScope =>
    scope === "personal" || scope === "umbrella"
  );
  const countries = (input.countries ?? []).filter((country) =>
    isSetupCountry(country)
  );
  const status: AdminExtractStatusFilter =
    input.status === "all" ||
    input.status === "archived" ||
    input.status === "suspended"
      ? input.status
      : "active";
  const spare: AdminExtractSpareFilter =
    input.spare === "include" || input.spare === "only"
      ? input.spare
      : "exclude";

  return {
    region,
    countries,
    platforms,
    scopes,
    status,
    spare,
  };
}

export async function runAdminExtract(
  input: AdminExtractFilters
): Promise<AdminExtractResult | { error: string }> {
  try {
    await requireAdmin();
    return await fetchAdminExtract(normalizeFilters(input));
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Extract failed.",
    };
  }
}
