import {
  fetchAlphaaCountryActuals,
  fetchAlphaaHolderActuals,
} from "@/lib/alphaa-country-coverage-data";
import { fetchTempCountryCoverage } from "@/lib/temp-country-coverage-data";
import { buildStrategyCountryGaps } from "@/lib/strategy-gaps";
import type { AlphaaExtraPlatformKey } from "@/types/admin";
import type {
  StrategyActualsSnapshot,
  StrategyBook,
  StrategyCountryGaps,
  StrategyCountryRow,
  StrategyHolderSnapshot,
  StrategyPlatformKey,
} from "@/types/strategy";

function extrasFrom(
  extra: Partial<Record<AlphaaExtraPlatformKey, number>> | undefined
): Partial<Record<StrategyPlatformKey, number>> {
  if (!extra) return {};
  return { ...extra };
}

export async function fetchStrategyGapsByCountry(
  book: StrategyBook,
  rows: StrategyCountryRow[]
): Promise<Record<string, StrategyCountryGaps>> {
  const countries = rows.map((row) => row.country);
  if (countries.length === 0) return {};

  if (book === "alphaa") {
    const [actuals, holders] = await Promise.all([
      fetchAlphaaCountryActuals(countries),
      fetchAlphaaHolderActuals(countries),
    ]);
    const gaps: Record<string, StrategyCountryGaps> = {};
    for (const row of rows) {
      const actual = actuals.get(row.country);
      const holderRows = holders.get(row.country) ?? [];
      const snapshot: StrategyActualsSnapshot | undefined = actual
        ? {
            employees: actual.employees,
            x: actual.x,
            facebookPersonal: actual.facebookPersonal,
            facebookUmbrella: actual.facebookUmbrella,
            instagram: actual.instagram,
            tiktok: actual.tiktok,
            extraPlatforms: extrasFrom(actual.extraPlatforms),
          }
        : undefined;
      const handlerSnapshots: StrategyHolderSnapshot[] = holderRows.map((holder) => ({
        id: holder.id,
        fullName: holder.fullName,
        x: holder.x,
        facebookPersonal: holder.facebookPersonal,
        facebookUmbrella: holder.facebookUmbrella,
        instagram: holder.instagram,
        tiktok: holder.tiktok,
        extraPlatforms: extrasFrom(holder.extraPlatforms),
      }));
      gaps[row.country] = buildStrategyCountryGaps(row, snapshot, handlerSnapshots);
    }
    return gaps;
  }

  const coverage = await fetchTempCountryCoverage(countries, {
    regionScope: "AfricaAndEurope",
  });
  const gaps: Record<string, StrategyCountryGaps> = {};
  for (const row of rows) {
    const actual = coverage.actualByCountry.get(row.country);
    const holderRows = coverage.holdersByCountry.get(row.country) ?? [];
    const snapshot: StrategyActualsSnapshot | undefined = actual
      ? {
          employees: actual.employees,
          x: actual.x,
          facebookPersonal: actual.facebookPersonal,
          facebookUmbrella: actual.facebookUmbrella,
          instagram: actual.instagram,
          tiktok: actual.tiktok,
          extraPlatforms: {},
        }
      : undefined;
    const handlerSnapshots: StrategyHolderSnapshot[] = holderRows.map((holder) => ({
      id: holder.id,
      fullName: holder.fullName,
      x: holder.x,
      facebookPersonal: holder.facebookPersonal,
      facebookUmbrella: holder.facebookUmbrella,
      instagram: holder.instagram,
      tiktok: holder.tiktok,
      extraPlatforms: {},
    }));
    gaps[row.country] = buildStrategyCountryGaps(row, snapshot, handlerSnapshots);
  }
  return gaps;
}
