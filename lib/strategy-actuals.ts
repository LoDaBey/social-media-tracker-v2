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

function countryKey(value: string) {
  return value.trim().toLowerCase();
}

function lookupByCountry<T>(map: Map<string, T>, country: string): T | undefined {
  const exact = map.get(country);
  if (exact) return exact;
  const needle = countryKey(country);
  for (const [key, value] of map) {
    if (countryKey(key) === needle) return value;
  }
  return undefined;
}

function hasAnyActuals(actual: {
  employees: number;
  x: number;
  facebookPersonal: number;
  accounts?: number;
}) {
  return (
    (actual.accounts ?? 0) > 0 ||
    actual.employees > 0 ||
    actual.x > 0 ||
    actual.facebookPersonal > 0
  );
}

function pickCountryActuals<T extends {
  employees: number;
  x: number;
  facebookPersonal: number;
  accounts?: number;
}>(map: Map<string, T>, country: string): T | undefined {
  const exact = map.get(country);
  if (exact && hasAnyActuals(exact)) return exact;
  const needle = countryKey(country);
  for (const [key, value] of map) {
    if (countryKey(key) === needle && hasAnyActuals(value)) return value;
  }
  return exact;
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
      const actual = pickCountryActuals(actuals, row.country);
      const holderRows =
        lookupByCountry(holders, row.country) ?? holders.get(row.country) ?? [];
      const snapshot: StrategyActualsSnapshot | undefined = actual
        ? {
            employees: actual.employees,
            x: actual.x,
            facebookPersonal: actual.facebookPersonal,
            facebookUmbrella: actual.facebookUmbrella,
            instagram: actual.instagram,
            tiktok: actual.tiktok,
            extraPlatforms: extrasFrom(actual.extraPlatforms),
            accounts: actual.accounts,
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

  const regions = new Set(rows.map((row) => row.region));
  const regionScope =
    regions.size === 1 && regions.has("Europe")
      ? "Europe"
      : regions.size === 1 && regions.has("Africa")
        ? "Africa"
        : "AfricaAndEurope";
  const coverage = await fetchTempCountryCoverage(countries, {
    regionScope,
  });
  const gaps: Record<string, StrategyCountryGaps> = {};
  for (const row of rows) {
    const actual = pickCountryActuals(coverage.actualByCountry, row.country);
    const holderRows =
      lookupByCountry(coverage.holdersByCountry, row.country) ??
      coverage.holdersByCountry.get(row.country) ??
      [];
    const snapshot: StrategyActualsSnapshot | undefined = actual
      ? {
          employees: actual.employees,
          x: actual.x,
          facebookPersonal: actual.facebookPersonal,
          facebookUmbrella: actual.facebookUmbrella,
          instagram: actual.instagram,
          tiktok: actual.tiktok,
          extraPlatforms: {},
          accounts:
            actual.x +
            actual.facebookPersonal +
            actual.facebookUmbrella +
            actual.instagram +
            actual.tiktok,
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
