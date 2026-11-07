"use server";

import { auth } from "@/auth";
import { fetchAdminExtract } from "@/lib/admin-extract-data";
import { isExtractPlatform } from "@/lib/admin-extract-platform";
import {
  isExtractCountryFilter,
  isExtractRoleFilter,
} from "@/lib/admin-extract-filters";
import type { AccountScope } from "@/types/db";
import type {
  AdminExtractFilters,
  AdminExtractResult,
  AdminExtractRoleFilter,
  AdminExtractSpareFilter,
  AdminExtractStatusFilter,
  AdminExtractRegionFilter,
} from "@/types/admin";

function requireAdmin() {
  return auth().then((session) => {
    const adminId = Number(session?.user?.id);
    const role = session?.user?.role;
    if (
      !Number.isFinite(adminId) ||
      (role !== "admin" && role !== "hoo" && role !== "op")
    ) {
      throw new Error("Unauthorized — admin workspace only.");
    }
  });
}

function normalizeFilters(input: AdminExtractFilters): AdminExtractFilters {
  const region: AdminExtractRegionFilter =
    input.region === "Africa" ||
    input.region === "Europe" ||
    input.region === "Alphaa" ||
    input.region === "Asia"
      ? input.region
      : "all";
  const platforms = (input.platforms ?? []).filter((platform) =>
    isExtractPlatform(platform)
  );
  const scopes = (input.scopes ?? []).filter((scope): scope is AccountScope =>
    scope === "personal" || scope === "umbrella"
  );
  const countries = (input.countries ?? []).filter((country) =>
    isExtractCountryFilter(country)
  );
  const roles = (input.roles ?? []).filter((role): role is AdminExtractRoleFilter =>
    isExtractRoleFilter(role)
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
    roles,
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
