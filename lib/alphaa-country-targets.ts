import {
  ALPHAA_COUNTRY_LABELS,
  ALPHAA_COUNTRY_LANGUAGES,
  ALPHAA_COUNTRY_RESOURCES,
  requiredProjectStrategyPerCategory,
  type AlphaaCountryKey,
} from "@/lib/alphaa-country-strategy";
import type { AdminCountryPlan } from "@/types/admin";

function sumCount(value: number | undefined) {
  return value ?? 0;
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
    totalAccounts:
      xPersonal +
      xUmbrella +
      facebookPersonal +
      facebookUmbrella +
      instagram +
      tiktok,
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
