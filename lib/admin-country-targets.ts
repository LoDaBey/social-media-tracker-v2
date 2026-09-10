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

/** Per employee seat: 15 account slots — Balkan platform mix. */
const BALKAN_SEAT_ACCOUNTS = {
  xPersonal: 10,
  facebookPersonal: 1,
  xUmbrella: 1,
  facebookUmbrella: 1,
  instagram: 1,
  tiktok: 1,
} as const;

const BALKAN_ACCOUNTS_PER_SEAT = 15;

function planCountry(
  country: string,
  language: string,
  resources: number,
  accounts: typeof STANDARD_ACCOUNTS | typeof SUDAN_ACCOUNTS
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

function balkanPlanCountry(
  country: string,
  language: string,
  resources: number
): AdminCountryPlan {
  return {
    country,
    language,
    resources,
    xPersonal: BALKAN_SEAT_ACCOUNTS.xPersonal * resources,
    facebookPersonal: BALKAN_SEAT_ACCOUNTS.facebookPersonal * resources,
    xUmbrella: BALKAN_SEAT_ACCOUNTS.xUmbrella * resources,
    facebookUmbrella: BALKAN_SEAT_ACCOUNTS.facebookUmbrella * resources,
    instagram: BALKAN_SEAT_ACCOUNTS.instagram * resources,
    tiktok: BALKAN_SEAT_ACCOUNTS.tiktok * resources,
    totalAccounts: BALKAN_ACCOUNTS_PER_SEAT * resources,
  };
}

/** Africa resource plan — 9×74 + 132 = 798 account slots project-wide. */
export const ADMIN_COUNTRY_PLANS: AdminCountryPlan[] = [
  planCountry("Burkina Faso", "French", AFRICA_STANDARD_RESOURCES, STANDARD_ACCOUNTS),
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

/** Balkan resource plan: 15 account slots per employee seat. */
export const BALKAN_COUNTRY_PLANS: AdminCountryPlan[] = [
  balkanPlanCountry("Slovakia", "Slovak", 13),
  balkanPlanCountry("Moldova", "Romanian", 13),
  balkanPlanCountry("Slovenia", "Slovenian", 6),
  balkanPlanCountry("Macedonia", "Macedonian", 6),
  balkanPlanCountry("Bulgaria", "Bulgarian", 6),
  balkanPlanCountry("Bosnia", "Bosnian", 6),
];

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
