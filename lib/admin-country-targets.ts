import type { AdminCountryPlan } from "@/types/admin";

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
