import {
  ALPHAA_COUNTRY_LABELS,
  ALPHAA_COUNTRY_LANGUAGES,
  ALPHAA_COUNTRY_RESOURCES,
  requiredProjectStrategy,
  requiredProjectStrategyPerCategory,
  type AlphaaCountryKey,
  type AlphaaPlatformCounts,
} from "@/lib/alphaa-country-strategy";
import { ALPHAA_EXTRA_PLATFORM_KEYS } from "@/lib/alphaa-coverage-platforms";
import type {
  AdminCountryPlan,
  AdminCountrySeatQuota,
  AlphaaExtraPlatformCounts,
  AlphaaExtraPlatformKey,
} from "@/types/admin";

function sumCount(value: number | undefined) {
  return value ?? 0;
}

function sumPlatformCounts(values: AlphaaPlatformCounts) {
  return Object.values(values).reduce((sum, value) => sum + sumCount(value), 0);
}

function extraPlatformTargets(
  key: AlphaaCountryKey
): AlphaaExtraPlatformCounts {
  const split = requiredProjectStrategyPerCategory[key];
  const targets: AlphaaExtraPlatformCounts = {};

  for (const platform of ALPHAA_EXTRA_PLATFORM_KEYS) {
    const target =
      sumCount(split.personal[platform]) + sumCount(split.umberlla[platform]);
    if (target > 0) {
      targets[platform] = target;
    }
  }

  return targets;
}

function buildAlphaaPlan(key: AlphaaCountryKey): AdminCountryPlan {
  const split = requiredProjectStrategyPerCategory[key];
  const personal = split.personal;
  const umbrella = split.umberlla;

  const xPersonal = sumCount(personal.twitter);
  const xUmbrella = sumCount(umbrella.twitter);
  const facebookPersonal = sumCount(personal.facebook);
  const facebookUmbrella = sumCount(umbrella.facebook);
  const instagram = sumCount(personal.instagram) + sumCount(umbrella.instagram);
  const tiktok = sumCount(personal.tiktok) + sumCount(umbrella.tiktok);
  const extraPlatforms = extraPlatformTargets(key);

  return {
    country: ALPHAA_COUNTRY_LABELS[key],
    language: ALPHAA_COUNTRY_LANGUAGES[key],
    resources: ALPHAA_COUNTRY_RESOURCES[key],
    xPersonal,
    facebookPersonal,
    xUmbrella,
    facebookUmbrella,
    instagram,
    tiktok,
    extraPlatforms,
    totalAccounts: sumPlatformCounts(requiredProjectStrategy[key]),
  };
}

/** ALPHAA strategic country plans (Sudan, Somalia, Palestine, Turkey, Iran). */
export const ALPHAA_COUNTRY_PLANS: AdminCountryPlan[] = (
  [
    "sudan",
    "somalia",
    "palestine",
    "turkey",
    "iran",
  ] as AlphaaCountryKey[]
).map(buildAlphaaPlan);

export const ALPHAA_PLAN_COUNTRIES = ALPHAA_COUNTRY_PLANS.map(
  (plan) => plan.country
);

function splitTotal(total: number, seats: number): number[] {
  if (seats <= 0) return [];
  const base = Math.floor(total / seats);
  const remainder = total % seats;
  return Array.from({ length: seats }, (_, index) =>
    base + (index < remainder ? 1 : 0)
  );
}

/** Split an ALPHAA country plan across employee seats (core + extended platforms). */
export function splitAlphaaCountryPlanSeats(
  plan: AdminCountryPlan
): AdminCountrySeatQuota[] {
  const seats = plan.resources;
  const xTarget = plan.xPersonal + plan.xUmbrella;
  const xShares = splitTotal(xTarget, seats);
  const facebookPersonalShares = splitTotal(plan.facebookPersonal, seats);
  const facebookUmbrellaShares = splitTotal(plan.facebookUmbrella, seats);
  const instagramShares = splitTotal(plan.instagram, seats);
  const tiktokShares = splitTotal(plan.tiktok, seats);

  const extraSharesByPlatform = Object.fromEntries(
    ALPHAA_EXTRA_PLATFORM_KEYS.map((platform) => [
      platform,
      splitTotal(plan.extraPlatforms?.[platform] ?? 0, seats),
    ])
  ) as Record<AlphaaExtraPlatformKey, number[]>;

  return Array.from({ length: seats }, (_, index) => {
    const x = xShares[index] ?? 0;
    const facebookPersonal = facebookPersonalShares[index] ?? 0;
    const facebookUmbrella = facebookUmbrellaShares[index] ?? 0;
    const instagram = instagramShares[index] ?? 0;
    const tiktok = tiktokShares[index] ?? 0;

    const extraPlatforms: AlphaaExtraPlatformCounts = {};
    let extraTotal = 0;
    for (const platform of ALPHAA_EXTRA_PLATFORM_KEYS) {
      const share = extraSharesByPlatform[platform][index] ?? 0;
      if (share > 0) {
        extraPlatforms[platform] = share;
      }
      extraTotal += share;
    }

    return {
      x,
      facebookPersonal,
      facebookUmbrella,
      instagram,
      tiktok,
      extraPlatforms,
      totalAccounts:
        x + facebookPersonal + facebookUmbrella + instagram + tiktok + extraTotal,
    };
  });
}
