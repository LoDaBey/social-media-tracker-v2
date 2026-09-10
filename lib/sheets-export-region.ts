import { setupRegionForCountry, type SetupRegion } from "@/lib/setup-options";
import type { SheetsExportAccountRow } from "@/types/admin";

export type SheetsExportRegion = SetupRegion;

export function resolveSheetsExportRegion(
  account: Pick<SheetsExportAccountRow, "region" | "country">
): SheetsExportRegion {
  const stored = account.region?.trim();
  if (stored === "Balkan" || stored === "Africa") return stored;
  return setupRegionForCountry(account.country ?? "");
}

export function splitAccountsByExportRegion(accounts: SheetsExportAccountRow[]) {
  const africa: SheetsExportAccountRow[] = [];
  const balkan: SheetsExportAccountRow[] = [];

  for (const account of accounts) {
    if (resolveSheetsExportRegion(account) === "Balkan") {
      balkan.push(account);
    } else {
      africa.push(account);
    }
  }

  return { africa, balkan };
}
