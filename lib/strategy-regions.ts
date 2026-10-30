import type { StrategyProjectRegion } from "@/types/strategy";

/** Geographic regions — not Africa/Europe/ALPHAA books. */
export const STRATEGY_GEO_REGIONS = [
  "Gulf",
  "Levant",
  "Asia",
  "LATAM",
  "Maghreb",
  "Balkans",
  "Caucasus",
  "Horn of Africa",
  "Sahel",
  "Central Asia",
  "South Asia",
  "Southeast Asia",
] as const;

const BLOCKED_REGION_KEYS = new Set([
  "alphaa",
  "custom",
  "all",
  "project",
  "africa_europe",
]);

export function normalizeStrategyProjectRegion(value: unknown): StrategyProjectRegion {
  const region = String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 60);
  if (!region) return "";
  if (BLOCKED_REGION_KEYS.has(region.toLowerCase())) return "";
  const catalog = STRATEGY_GEO_REGIONS.find(
    (item) => item.toLowerCase() === region.toLowerCase()
  );
  return catalog ?? region;
}

export function isStrategyProjectRegion(value: string): value is StrategyProjectRegion {
  return normalizeStrategyProjectRegion(value).length > 0;
}

export function uniqueStrategyProjectRegions(
  values: readonly string[]
): StrategyProjectRegion[] {
  const seen = new Set<string>();
  const regions: StrategyProjectRegion[] = [];
  for (const value of values) {
    const region = normalizeStrategyProjectRegion(value);
    if (!region) continue;
    const key = region.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    regions.push(region);
  }
  return regions.sort((left, right) => left.localeCompare(right));
}

export function strategyAccountRegionValue(region: StrategyProjectRegion) {
  return normalizeStrategyProjectRegion(region);
}
