import type { AdminCountryPlan, AdminCountrySeatQuota } from "@/types/admin";

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

/** Africa resource plan: employees and account slots the admin should fill. */
export const ADMIN_COUNTRY_PLANS: AdminCountryPlan[] = [
  planCountry("Burkina Faso", "French", 5, STANDARD_ACCOUNTS),
  planCountry("Angola", "Portuguese", 5, STANDARD_ACCOUNTS),
  planCountry("Tanzania", "Kiswahili", 5, STANDARD_ACCOUNTS),
  planCountry("Mozambique", "Portuguese", 5, STANDARD_ACCOUNTS),
  planCountry("Madagascar", "Malagasy", 5, STANDARD_ACCOUNTS),
  planCountry("Zambia", "English", 5, STANDARD_ACCOUNTS),
  planCountry("Nigeria", "English", 5, STANDARD_ACCOUNTS),
  planCountry("Mali", "French", 5, STANDARD_ACCOUNTS),
  planCountry("Chad", "French", 5, STANDARD_ACCOUNTS),
  planCountry("Sudan", "Arabic", 9, SUDAN_ACCOUNTS),
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
