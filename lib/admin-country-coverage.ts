import { query } from "@/lib/db";
import { ADMIN_COUNTRY_PLANS, xPlanTarget } from "@/lib/admin-country-targets";
import type {
  AdminCoverageCount,
  AdminCountryCoverage,
  AdminCountryCoverageRow,
  AdminCountryPlan,
} from "@/types/admin";

type CountryActuals = {
  employees: number;
  x: number;
  facebookPersonal: number;
  facebookUmbrella: number;
  instagram: number;
  tiktok: number;
};

const EMPTY_ACTUALS: CountryActuals = {
  employees: 0,
  x: 0,
  facebookPersonal: 0,
  facebookUmbrella: 0,
  instagram: 0,
  tiktok: 0,
};

function count(actual: number, target: number): AdminCoverageCount {
  return { actual, target };
}

function totalAccounts(actuals: CountryActuals) {
  return (
    actuals.x +
    actuals.facebookPersonal +
    actuals.facebookUmbrella +
    actuals.instagram +
    actuals.tiktok
  );
}

function emptyPlan(country: string): AdminCountryPlan {
  return {
    country,
    language: "—",
    resources: 0,
    xPersonal: 0,
    facebookPersonal: 0,
    xUmbrella: 0,
    facebookUmbrella: 0,
    instagram: 0,
    tiktok: 0,
    totalAccounts: 0,
  };
}

function toRow(
  plan: AdminCountryPlan,
  actuals: CountryActuals,
  onPlan: boolean
): AdminCountryCoverageRow {
  return {
    country: plan.country,
    language: plan.language,
    onPlan,
    resources: count(actuals.employees, plan.resources),
    x: count(actuals.x, xPlanTarget(plan)),
    facebookPersonal: count(actuals.facebookPersonal, plan.facebookPersonal),
    facebookUmbrella: count(actuals.facebookUmbrella, plan.facebookUmbrella),
    instagram: count(actuals.instagram, plan.instagram),
    tiktok: count(actuals.tiktok, plan.tiktok),
    totalAccounts: count(totalAccounts(actuals), plan.totalAccounts),
  };
}

function addCount(
  left: AdminCoverageCount,
  right: AdminCoverageCount
): AdminCoverageCount {
  return {
    actual: left.actual + right.actual,
    target: left.target + right.target,
  };
}

export async function fetchAdminCountryCoverage(): Promise<AdminCountryCoverage> {
  const rows = await query<{
    country: string;
    employees: string;
    x: string;
    facebook_personal: string;
    facebook_umbrella: string;
    instagram: string;
    tiktok: string;
  }>(
    `SELECT
       COALESCE(u.country, '') AS country,
       COUNT(DISTINCT u.id)::text AS employees,
       COUNT(a.id) FILTER (WHERE a.platform = 'x')::text AS x,
       COUNT(a.id) FILTER (WHERE a.platform = 'facebook_personal')::text AS facebook_personal,
       COUNT(a.id) FILTER (WHERE a.platform = 'facebook_umbrella')::text AS facebook_umbrella,
       COUNT(a.id) FILTER (WHERE a.platform = 'instagram')::text AS instagram,
       COUNT(a.id) FILTER (WHERE a.platform = 'tiktok')::text AS tiktok
     FROM temp_users u
     LEFT JOIN temp_social_media_accounts a
       ON a.user_id = u.id
      AND a.status = 'active'
    WHERE u.role = 'employee'
      AND u.is_active = TRUE
    GROUP BY COALESCE(u.country, '')`
  );

  const actualByCountry = new Map<string, CountryActuals>();
  for (const row of rows) {
    const country = row.country.trim() || "Unassigned";
    actualByCountry.set(country, {
      employees: Number(row.employees),
      x: Number(row.x),
      facebookPersonal: Number(row.facebook_personal),
      facebookUmbrella: Number(row.facebook_umbrella),
      instagram: Number(row.instagram),
      tiktok: Number(row.tiktok),
    });
  }

  const coverageRows: AdminCountryCoverageRow[] = ADMIN_COUNTRY_PLANS.map((plan) => {
    const actuals = actualByCountry.get(plan.country) ?? EMPTY_ACTUALS;
    actualByCountry.delete(plan.country);
    return toRow(plan, actuals, true);
  });

  const extraCountries = [...actualByCountry.keys()].sort((a, b) =>
    a.localeCompare(b)
  );
  for (const country of extraCountries) {
    coverageRows.push(
      toRow(emptyPlan(country), actualByCountry.get(country) ?? EMPTY_ACTUALS, false)
    );
  }

  const totals = coverageRows.reduce(
    (sum, row) => ({
      resources: addCount(sum.resources, row.resources),
      x: addCount(sum.x, row.x),
      facebookPersonal: addCount(sum.facebookPersonal, row.facebookPersonal),
      facebookUmbrella: addCount(sum.facebookUmbrella, row.facebookUmbrella),
      instagram: addCount(sum.instagram, row.instagram),
      tiktok: addCount(sum.tiktok, row.tiktok),
      totalAccounts: addCount(sum.totalAccounts, row.totalAccounts),
    }),
    {
      resources: count(0, 0),
      x: count(0, 0),
      facebookPersonal: count(0, 0),
      facebookUmbrella: count(0, 0),
      instagram: count(0, 0),
      tiktok: count(0, 0),
      totalAccounts: count(0, 0),
    }
  );

  return { rows: coverageRows, totals };
}
