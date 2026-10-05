import type { AdminExtractFilters } from "@/types/admin";

export function emptyAdminExtractFilters(): AdminExtractFilters {
  return {
    region: "all",
    countries: [],
    platforms: [],
    scopes: [],
    status: "active",
    spare: "exclude",
  };
}
