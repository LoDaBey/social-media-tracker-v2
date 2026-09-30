import type { AdminCountryPlan, AdminCountrySeatQuota } from "@/types/admin";

/** Planned employee seats per standard Africa country (excluding Sudan). */
export const AFRICA_STANDARD_RESOURCES = 5;

/** Sudan (Africa / temp system) planned employee seats. */
export const SUDAN_AFRICA_RESOURCES = 9;

/** Per-handler targets when creating a new Africa employee (11 + 1 + 1 + 1 + 1 = 15). */
export const AFRICA_SEAT_ACCOUNTS = {
  xPersonal: 10,
  xUmbrella: 1,
  facebookPersonal: 1,
  facebookUmbrella: 1,
  instagram: 1,
  tiktok: 1,
} as const;

export const AFRICA_X_PER_SEAT =
  AFRICA_SEAT_ACCOUNTS.xPersonal + AFRICA_SEAT_ACCOUNTS.xUmbrella;

const STANDARD_ACCOUNTS = {
  xPersonal: 49,
  facebookPersonal: 5,
  xUmbrella: 5,
  facebookUmbrella: 5,
  instagram: 5,
  tiktok: 5,
} as const;

const SUDAN_ACCOUNTS = {
  xPersonal: 87,
  facebookPersonal: 9,
  xUmbrella: 9,
  facebookUmbrella: 9,
  instagram: 9,
  tiktok: 9,
} as const;

/**
 * Europe large markets (13 seats): 191 total accounts.
 * Average ~14.7/seat (nine seats at 15, four at 14) via splitCountryPlanSeats.
 */
const EUROPE_LARGE_ACCOUNTS = {
  xPersonal: 126,
  facebookPersonal: 13,
  xUmbrella: 13,
  facebookUmbrella: 13,
  instagram: 13,
  tiktok: 13,
} as const;

/**
 * Europe standard markets (6 seats): 78 total accounts (13/seat).
 * X is 9/seat (8 personal + 1 umbrella) instead of the inflated 11/seat mix.
 */
const EUROPE_STANDARD_ACCOUNTS = {
  xPersonal: 48,
  facebookPersonal: 6,
  xUmbrella: 6,
  facebookUmbrella: 6,
  instagram: 6,
  tiktok: 6,
} as const;

/**
 * Bosnia (6 seats): 89 total accounts.
 * Same non-X mix as other 6-seat markets; extra slots are on X (65 vs 54).
 */
const EUROPE_BOSNIA_ACCOUNTS = {
  xPersonal: 59,
  facebookPersonal: 6,
  xUmbrella: 6,
  facebookUmbrella: 6,
  instagram: 6,
  tiktok: 6,
} as const;

function planCountry(
  country: string,
  language: string,
  resources: number,
  accounts:
    | typeof STANDARD_ACCOUNTS
    | typeof SUDAN_ACCOUNTS
    | typeof EUROPE_LARGE_ACCOUNTS
    | typeof EUROPE_STANDARD_ACCOUNTS
    | typeof EUROPE_BOSNIA_ACCOUNTS
): AdminCountryPlan {
  return {
    country,
    language,
    resources,
    ...accounts,
    totalAccounts:
      accounts.xPersonal +
      accounts.facebookPersonal +
      accounts.xUmbrella +
      accounts.facebookUmbrella +
      accounts.instagram +
      accounts.tiktok,
  };
}

/** Africa resource plan — 9×74 + 132 = 798 account slots project-wide. */
export const ADMIN_COUNTRY_PLANS: AdminCountryPlan[] = [
  planCountry("Borkina", "French", AFRICA_STANDARD_RESOURCES, STANDARD_ACCOUNTS),
  planCountry("Angola", "Portuguese", AFRICA_STANDARD_RESOURCES, STANDARD_ACCOUNTS),
  planCountry("Tanzania", "Kiswahili", AFRICA_STANDARD_RESOURCES, STANDARD_ACCOUNTS),
  planCountry("Mozambique", "Portuguese", AFRICA_STANDARD_RESOURCES, STANDARD_ACCOUNTS),
  planCountry("Madagascar", "Malagasy", AFRICA_STANDARD_RESOURCES, STANDARD_ACCOUNTS),
  planCountry("Zambia", "English", AFRICA_STANDARD_RESOURCES, STANDARD_ACCOUNTS),
  planCountry("Nigeria", "English", AFRICA_STANDARD_RESOURCES, STANDARD_ACCOUNTS),
  planCountry("Mali", "French", AFRICA_STANDARD_RESOURCES, STANDARD_ACCOUNTS),
  planCountry("Chad", "French", AFRICA_STANDARD_RESOURCES, STANDARD_ACCOUNTS),
  planCountry("Sudan", "Arabic", SUDAN_AFRICA_RESOURCES, SUDAN_ACCOUNTS),
];

/** Europe resource plan — 2×191 + 3×78 + 89 = 705 account slots project-wide. */
export const EUROPE_COUNTRY_PLANS: AdminCountryPlan[] = [
  planCountry("Slovakia", "Slovak", 13, EUROPE_LARGE_ACCOUNTS),
  planCountry("Moldova", "Romanian", 13, EUROPE_LARGE_ACCOUNTS),
  planCountry("Slovenia", "Slovenian", 6, EUROPE_STANDARD_ACCOUNTS),
  planCountry("Macedonia", "Macdonian", 6, EUROPE_STANDARD_ACCOUNTS),
  planCountry("Bulgaria", "Bulgarian", 6, EUROPE_STANDARD_ACCOUNTS),
  planCountry("Bosnia", "Bosnian", 6, EUROPE_BOSNIA_ACCOUNTS),
];

/** @deprecated Use EUROPE_COUNTRY_PLANS */
export const BALKAN_COUNTRY_PLANS = EUROPE_COUNTRY_PLANS;

export function europeCountryPlan(country: string): AdminCountryPlan | null {
  return EUROPE_COUNTRY_PLANS.find((plan) => plan.country === country) ?? null;
}

/** @deprecated Use europeCountryPlan */
export const balkanCountryPlan = europeCountryPlan;

/** Default account targets for a new employee seat in a planned Europe country. */
export function europeSeatTargetsForIndex(
  country: string,
  seatIndex: number
): AdminCountrySeatQuota | null {
  const plan = europeCountryPlan(country);
  if (!plan) return null;
  const seats = splitCountryPlanSeats(plan);
  if (seats.length === 0) return null;
  return seats[Math.min(Math.max(seatIndex, 0), seats.length - 1)] ?? null;
}

/** @deprecated Use europeSeatTargetsForIndex */
export const balkanSeatTargetsForIndex = europeSeatTargetsForIndex;

export function xPlanTarget(plan: Pick<AdminCountryPlan, "xPersonal" | "xUmbrella">) {
  return plan.xPersonal + plan.xUmbrella;
}

function splitTotal(total: number, seats: number): number[] {
  if (seats <= 0) return [];
  const base = Math.floor(total / seats);
  const remainder = total % seats;
  return Array.from({ length: seats }, (_, index) =>
    base + (index < remainder ? 1 : 0)
  );
}

/** Split a country plan across the planned number of employee seats. */
export function splitCountryPlanSeats(plan: AdminCountryPlan): AdminCountrySeatQuota[] {
  const seats = plan.resources;
  const xShares = splitTotal(xPlanTarget(plan), seats);
  const facebookPersonalShares = splitTotal(plan.facebookPersonal, seats);
  const facebookUmbrellaShares = splitTotal(plan.facebookUmbrella, seats);
  const instagramShares = splitTotal(plan.instagram, seats);
  const tiktokShares = splitTotal(plan.tiktok, seats);

  return Array.from({ length: seats }, (_, index) => {
    const x = xShares[index] ?? 0;
    const facebookPersonal = facebookPersonalShares[index] ?? 0;
    const facebookUmbrella = facebookUmbrellaShares[index] ?? 0;
    const instagram = instagramShares[index] ?? 0;
    const tiktok = tiktokShares[index] ?? 0;
    return {
      x,
      facebookPersonal,
      facebookUmbrella,
      instagram,
      tiktok,
      totalAccounts:
        x + facebookPersonal + facebookUmbrella + instagram + tiktok,
    };
  });
}
