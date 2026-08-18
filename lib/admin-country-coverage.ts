import { query } from "@/lib/db";
import {
  ADMIN_COUNTRY_PLANS,
  splitCountryPlanSeats,
  xPlanTarget,
} from "@/lib/admin-country-targets";
import type {
  AdminCoverageCount,
  AdminCountryCoverage,
  AdminCountryCoverageFilter,
  AdminCountryCoverageHolder,
  AdminCountryCoverageRow,
  AdminCountryPlan,
  AdminCountrySeatQuota,
} from "@/types/admin";

type CountryActuals = {
  employees: number;
  x: number;
  facebookPersonal: number;
  facebookUmbrella: number;
  instagram: number;
  tiktok: number;
};

type HolderActuals = {
  id: number;
  fullName: string;
  email: string;
  country: string;
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

const EMPTY_SEAT: AdminCountrySeatQuota = {
  x: 0,
  facebookPersonal: 0,
  facebookUmbrella: 0,
  instagram: 0,
  tiktok: 0,
  totalAccounts: 0,
};

function count(actual: number, target: number): AdminCoverageCount {
  return { actual, target };
}

/** Count toward plan totals: extras above a target never fill another gap. */
function credited(actual: number, target: number) {
  if (target <= 0) return 0;
  return Math.min(actual, target);
}

function creditedAccountsFrom(counts: {
  x: AdminCoverageCount;
  facebookPersonal: AdminCoverageCount;
  facebookUmbrella: AdminCoverageCount;
  instagram: AdminCoverageCount;
  tiktok: AdminCoverageCount;
}) {
  return (
    credited(counts.x.actual, counts.x.target) +
    credited(counts.facebookPersonal.actual, counts.facebookPersonal.target) +
    credited(counts.facebookUmbrella.actual, counts.facebookUmbrella.target) +
    credited(counts.instagram.actual, counts.instagram.target) +
    credited(counts.tiktok.actual, counts.tiktok.target)
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

function holderFromSeat(
  person: HolderActuals | null,
  seat: AdminCountrySeatQuota,
  vacantIndex: number
): AdminCountryCoverageHolder {
  const actuals = person ?? {
    x: 0,
    facebookPersonal: 0,
    facebookUmbrella: 0,
    instagram: 0,
    tiktok: 0,
  };
  return {
    id: person?.id ?? null,
    fullName: person?.fullName ?? `Unfilled resource ${vacantIndex}`,
    email: person?.email ?? null,
    vacant: !person,
    x: count(actuals.x, seat.x),
    facebookPersonal: count(actuals.facebookPersonal, seat.facebookPersonal),
    facebookUmbrella: count(actuals.facebookUmbrella, seat.facebookUmbrella),
    instagram: count(actuals.instagram, seat.instagram),
    tiktok: count(actuals.tiktok, seat.tiktok),
    totalAccounts: count(creditedAccountsFrom({
      x: count(actuals.x, seat.x),
      facebookPersonal: count(actuals.facebookPersonal, seat.facebookPersonal),
      facebookUmbrella: count(actuals.facebookUmbrella, seat.facebookUmbrella),
      instagram: count(actuals.instagram, seat.instagram),
      tiktok: count(actuals.tiktok, seat.tiktok),
    }), seat.totalAccounts),
  };
}

function holdersForCountry(
  plan: AdminCountryPlan,
  people: HolderActuals[]
): AdminCountryCoverageHolder[] {
  const seats = splitCountryPlanSeats(plan);
  const holders: AdminCountryCoverageHolder[] = [];
  const seatCount = Math.max(seats.length, people.length);
  let vacantIndex = 0;

  for (let index = 0; index < seatCount; index += 1) {
    const person = people[index] ?? null;
    const seat = seats[index] ?? EMPTY_SEAT;
    if (!person) vacantIndex += 1;
    holders.push(holderFromSeat(person, seat, vacantIndex));
  }

  return holders;
}

function toRow(
  plan: AdminCountryPlan,
  actuals: CountryActuals,
  people: HolderActuals[],
  onPlan: boolean
): AdminCountryCoverageRow {
  const x = count(actuals.x, xPlanTarget(plan));
  const facebookPersonal = count(actuals.facebookPersonal, plan.facebookPersonal);
  const facebookUmbrella = count(actuals.facebookUmbrella, plan.facebookUmbrella);
  const instagram = count(actuals.instagram, plan.instagram);
  const tiktok = count(actuals.tiktok, plan.tiktok);

  return {
    country: plan.country,
    language: plan.language,
    onPlan,
    resources: count(actuals.employees, plan.resources),
    x,
    facebookPersonal,
    facebookUmbrella,
    instagram,
    tiktok,
    totalAccounts: count(
      creditedAccountsFrom({
        x,
        facebookPersonal,
        facebookUmbrella,
        instagram,
        tiktok,
      }),
      plan.totalAccounts
    ),
    holders: holdersForCountry(plan, people),
  };
}

function addCreditedCount(
  left: AdminCoverageCount,
  right: AdminCoverageCount
): AdminCoverageCount {
  return {
    actual: left.actual + credited(right.actual, right.target),
    target: left.target + right.target,
  };
}

export async function fetchAdminCountryCoverage(
  filter?: AdminCountryCoverageFilter
): Promise<AdminCountryCoverage> {
  const countryFilter = filter === undefined ? null : (filter.countries ?? []);
  const sqlCountryClause =
    countryFilter === null
      ? ""
      : ` AND COALESCE(u.country, '') = ANY($1::text[])`;
  const sqlParams = countryFilter === null ? [] : [countryFilter];

  const [countryRows, holderRows, onHoldRow] = await Promise.all([
    query<{
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
        AND u.is_active = TRUE${sqlCountryClause}
      GROUP BY COALESCE(u.country, '')`,
      sqlParams
    ),
    query<{
      id: number;
      full_name: string;
      email: string;
      country: string;
      x: string;
      facebook_personal: string;
      facebook_umbrella: string;
      instagram: string;
      tiktok: string;
    }>(
      `SELECT
         u.id,
         u.full_name,
         u.email,
         COALESCE(u.country, '') AS country,
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
        AND u.is_active = TRUE${sqlCountryClause}
      GROUP BY u.id, u.full_name, u.email, COALESCE(u.country, '')
      ORDER BY u.full_name ASC, u.id ASC`,
      sqlParams
    ),
    query<{ on_hold: string }>(
      countryFilter === null
        ? `SELECT COUNT(*)::text AS on_hold
             FROM temp_users
            WHERE employment_status = 'on_hold'`
        : `SELECT COUNT(*)::text AS on_hold
             FROM temp_users
            WHERE employment_status = 'on_hold'
              AND role = 'employee'
              AND COALESCE(country, '') = ANY($1::text[])`,
      sqlParams
    ),
  ]);

  const actualByCountry = new Map<string, CountryActuals>();
  for (const row of countryRows) {
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

  const holdersByCountry = new Map<string, HolderActuals[]>();
  for (const row of holderRows) {
    const country = row.country.trim() || "Unassigned";
    const list = holdersByCountry.get(country) ?? [];
    list.push({
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      country,
      x: Number(row.x),
      facebookPersonal: Number(row.facebook_personal),
      facebookUmbrella: Number(row.facebook_umbrella),
      instagram: Number(row.instagram),
      tiktok: Number(row.tiktok),
    });
    holdersByCountry.set(country, list);
  }

  const allowedCountries = countryFilter === null ? null : new Set(countryFilter);
  const plans =
    allowedCountries === null
      ? ADMIN_COUNTRY_PLANS
      : ADMIN_COUNTRY_PLANS.filter((plan) => allowedCountries.has(plan.country));

  const coverageRows: AdminCountryCoverageRow[] = plans.map((plan) => {
    const actuals = actualByCountry.get(plan.country) ?? EMPTY_ACTUALS;
    const people = holdersByCountry.get(plan.country) ?? [];
    actualByCountry.delete(plan.country);
    holdersByCountry.delete(plan.country);
    return toRow(plan, actuals, people, true);
  });

  const extraCountries = [...new Set([...actualByCountry.keys(), ...holdersByCountry.keys()])]
    .filter((country) => allowedCountries === null || allowedCountries.has(country))
    .sort((a, b) => a.localeCompare(b));
  for (const country of extraCountries) {
    coverageRows.push(
      toRow(
        emptyPlan(country),
        actualByCountry.get(country) ?? EMPTY_ACTUALS,
        holdersByCountry.get(country) ?? [],
        false
      )
    );
  }

  if (allowedCountries) {
    const shown = new Set(coverageRows.map((row) => row.country));
    for (const country of countryFilter ?? []) {
      if (shown.has(country)) continue;
      coverageRows.push(
        toRow(emptyPlan(country), EMPTY_ACTUALS, [], false)
      );
    }
  }

  const totals = coverageRows.reduce(
    (sum, row) => ({
      resources: addCreditedCount(sum.resources, row.resources),
      x: addCreditedCount(sum.x, row.x),
      facebookPersonal: addCreditedCount(sum.facebookPersonal, row.facebookPersonal),
      facebookUmbrella: addCreditedCount(sum.facebookUmbrella, row.facebookUmbrella),
      instagram: addCreditedCount(sum.instagram, row.instagram),
      tiktok: addCreditedCount(sum.tiktok, row.tiktok),
      totalAccounts: addCreditedCount(sum.totalAccounts, row.totalAccounts),
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

  return {
    rows: coverageRows,
    totals,
    onHoldCount: Number(onHoldRow[0]?.on_hold ?? 0),
  };
}
