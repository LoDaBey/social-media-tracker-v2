import {
  europeCountryPlan,
  splitCountryPlanSeats,
} from "@/lib/admin-country-targets";
import { isEuropeCountry } from "@/lib/region-config";
import type { Platform } from "@/lib/platform-config";
import type { AdminCountrySeatQuota } from "@/types/admin";

type CapAccountRow = {
  user_id: number;
  country: string | null;
  handler_name: string;
  platform: Platform;
};

type PlatformBucket =
  | "x"
  | "facebook_personal"
  | "facebook_umbrella"
  | "instagram"
  | "tiktok";

function platformBucket(platform: Platform): PlatformBucket | null {
  switch (platform) {
    case "x":
      return "x";
    case "facebook_personal":
      return "facebook_personal";
    case "facebook_umbrella":
      return "facebook_umbrella";
    case "instagram":
      return "instagram";
    case "tiktok":
      return "tiktok";
    default:
      return null;
  }
}

function quotaForBucket(
  seat: AdminCountrySeatQuota,
  bucket: PlatformBucket
): number {
  switch (bucket) {
    case "x":
      return seat.x;
    case "facebook_personal":
      return seat.facebookPersonal;
    case "facebook_umbrella":
      return seat.facebookUmbrella;
    case "instagram":
      return seat.instagram;
    case "tiktok":
      return seat.tiktok;
  }
}

/**
 * Keep only accounts that fit each Europe country's planned seat quotas.
 * Extra accounts above the plan stay in the app/DB but are omitted from Sheets.
 * Seat order matches coverage: handlers sorted by name, then user id.
 */
export function capEuropeAccountsToCountryPlan<T extends CapAccountRow>(
  rows: T[]
): T[] {
  const keep = new Set<T>();
  const byCountry = new Map<string, T[]>();

  for (const row of rows) {
    const country = row.country?.trim() ?? "";
    if (!isEuropeCountry(country)) continue;
    const list = byCountry.get(country) ?? [];
    list.push(row);
    byCountry.set(country, list);
  }

  for (const [country, countryRows] of byCountry) {
    const plan = europeCountryPlan(country);
    if (!plan) continue;

    const seats = splitCountryPlanSeats(plan);
    const handlers = new Map<number, { name: string; rows: T[] }>();

    for (const row of countryRows) {
      const existing = handlers.get(row.user_id);
      if (existing) {
        existing.rows.push(row);
      } else {
        handlers.set(row.user_id, { name: row.handler_name, rows: [row] });
      }
    }

    const orderedHandlers = [...handlers.entries()].sort((a, b) => {
      const byName = a[1].name.localeCompare(b[1].name);
      return byName !== 0 ? byName : a[0] - b[0];
    });

    orderedHandlers.forEach(([, handler], seatIndex) => {
      const seat = seats[seatIndex];
      if (!seat) return;

      const used: Record<PlatformBucket, number> = {
        x: 0,
        facebook_personal: 0,
        facebook_umbrella: 0,
        instagram: 0,
        tiktok: 0,
      };

      for (const row of handler.rows) {
        const bucket = platformBucket(row.platform);
        if (!bucket) continue;
        if (used[bucket] >= quotaForBucket(seat, bucket)) continue;
        used[bucket] += 1;
        keep.add(row);
      }
    });
  }

  return rows.filter((row) => {
    const country = row.country?.trim() ?? "";
    if (!isEuropeCountry(country)) return true;
    return keep.has(row);
  });
}

/** @deprecated Use capEuropeAccountsToCountryPlan */
export const capBalkanAccountsToCountryPlan = capEuropeAccountsToCountryPlan;
