import { setupRegionForCountry, type SetupRegion } from "@/lib/setup-options";
import type { SheetsExportAccountRow } from "@/types/admin";

export type SheetsExportRegion = SetupRegion;

export function resolveSheetsExportRegion(
  account: Pick<SheetsExportAccountRow, "region" | "country">
): SheetsExportRegion {
  const stored = account.region?.trim();
  if (stored === "Europe" || stored === "Balkan") return "Europe";
  if (stored === "Africa" || stored === "Alphaa") return stored;
  return setupRegionForCountry(account.country ?? "");
}

export function splitAccountsByExportRegion(accounts: SheetsExportAccountRow[]) {
  const africa: SheetsExportAccountRow[] = [];
  const europe: SheetsExportAccountRow[] = [];
  const alphaa: SheetsExportAccountRow[] = [];

  for (const account of accounts) {
    const region = resolveSheetsExportRegion(account);
    if (region === "Europe") {
      europe.push(account);
    } else if (region === "Alphaa") {
      alphaa.push(account);
    } else {
      africa.push(account);
    }
  }

  return { africa, europe, balkan: europe, alphaa };
}
