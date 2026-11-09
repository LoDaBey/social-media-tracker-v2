"use server";

import { requirePagePermission, type AdminViewer } from "@/lib/admin-access";
import { baseCountryFromDisplay } from "@/lib/overview-country-display";
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

/**
 * Operation Managers only ever get their own project and countries, whatever the
 * filters ask for (the page hides other countries; this enforces it on the server).
 * Returns null when they have no countries at all.
 */
function scopeFiltersForViewer(
  filters: AdminExtractFilters,
  viewer: AdminViewer
): AdminExtractFilters | null {
  if (viewer.role !== "op") return filters;
  const scope = viewer.scope;
  if (!scope || scope.countries.length === 0) return null;
  const allowed = new Set(scope.countries);
  const picked = filters.countries.filter((country) =>
    allowed.has(baseCountryFromDisplay(country))
  );
  return {
    ...filters,
    region: scope.region as AdminExtractRegionFilter,
    countries: picked.length > 0 ? picked : [...scope.countries],
  };
}

export async function runAdminExtract(
  input: AdminExtractFilters
): Promise<AdminExtractResult | { error: string }> {
  try {
    const viewer = await requirePagePermission("extract", "canRead");
    const filters = scopeFiltersForViewer(normalizeFilters(input), viewer);
    if (!filters) {
      return {
        rows: [],
        summary: {
          total: 0,
          byRegion: [],
          byCountry: [],
          byPlatform: [],
          byScope: [],
          byRole: [],
        },
      };
    }
    return await fetchAdminExtract(filters);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Extract failed.",
    };
  }
}
