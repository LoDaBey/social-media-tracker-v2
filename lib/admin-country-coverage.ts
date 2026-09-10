import {
  fetchAlphaaCountryActuals,
  fetchAlphaaHolderActuals,
} from "@/lib/alphaa-country-coverage-data";
import {
  splitCountryPlanSeats,
  xPlanTarget,
} from "@/lib/admin-country-targets";
import { baseCountryFromDisplay } from "@/lib/overview-country-display";
import {
  adminCountryPlansForRegion,
  adminPlanCountriesForRegion,
  baseCountriesFromDisplayFilter,
  isDualRegionCountry,
  overviewDisplayCountry,
} from "@/lib/region-config";
import { isAlphaaCountry, isTempPlanCountry } from "@/lib/setup-options";
import {
  fetchTempCountryCoverage,
  type TempCountryActuals,
  type TempHolderActuals,
} from "@/lib/temp-country-coverage-data";
import type {
  AdminCoverageCount,
  AdminCountryCoverage,
  AdminCountryCoverageFilter,
  AdminCountryCoverageHolder,
  AdminCountryCoverageRow,
  AdminCountryPlan,
  AdminCountrySeatQuota,
  AdminRegion,
} from "@/types/admin";

type CountryActuals = TempCountryActuals;
type HolderActuals = TempHolderActuals;

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

/** Employee totals count every active handler — not capped at the plan seat count. */
function addResourceTotal(
  left: AdminCoverageCount,
  right: AdminCoverageCount
): AdminCoverageCount {
  return {
    actual: left.actual + right.actual,
    target: left.target + right.target,
  };
}

function uniqueBaseCountries(displayCountries: string[]): string[] {
  return [...new Set(displayCountries.map(baseCountryFromDisplay))];
}

function splitCoverageCountries(
  countryFilter: string[] | null,
  region: AdminRegion | undefined
) {
  const africaPlanCountries = adminPlanCountriesForRegion("Africa");
  const balkanPlanCountries = adminPlanCountriesForRegion("Balkan");
  const alphaaPlanCountries = adminPlanCountriesForRegion("Alphaa");
  const allTempPlanCountries = [...africaPlanCountries, ...balkanPlanCountries];

  /** ALPHAA — legacy users + social_media_accounts only. */
  if (region === "Alphaa") {
    return {
      tempCountries: [] as string[],
      alphaaCountries: baseCountriesFromDisplayFilter(
        countryFilter,
        alphaaPlanCountries
      ),
      tempRegionScope: undefined,
      fetchTemp: false,
      fetchAlphaa: true,
    };
  }

  /** Africa — temp_users + temp_social_media_accounts only. */
  if (region === "Africa") {
    return {
      tempCountries: baseCountriesFromDisplayFilter(
        countryFilter,
        africaPlanCountries
      ),
      alphaaCountries: [] as string[],
      tempRegionScope: "Africa" as const,
      fetchTemp: true,
      fetchAlphaa: false,
    };
  }

  /** Balkan — temp_users + temp_social_media_accounts only. */
  if (region === "Balkan") {
    return {
      tempCountries: baseCountriesFromDisplayFilter(
        countryFilter,
        balkanPlanCountries
      ),
      alphaaCountries: [] as string[],
      tempRegionScope: "Balkan" as const,
      fetchTemp: true,
      fetchAlphaa: false,
    };
  }

  /** Overview — temp for Africa+Balkan rows, legacy for ALPHAA rows (dual Sudan). */
  if (region === "Overview") {
    const tempFromFilter = countryFilter
      ? uniqueBaseCountries(countryFilter.filter(isTempPlanCountry))
      : allTempPlanCountries;
    const alphaaFromFilter = countryFilter
      ? uniqueBaseCountries(countryFilter.filter(isAlphaaCountry))
      : alphaaPlanCountries;

    return {
      tempCountries: tempFromFilter,
      alphaaCountries: alphaaFromFilter,
      tempRegionScope: "AfricaAndBalkan" as const,
      fetchTemp: tempFromFilter.length > 0,
      fetchAlphaa: alphaaFromFilter.length > 0,
    };
  }

  if (countryFilter) {
    return {
      tempCountries: uniqueBaseCountries(countryFilter.filter(isTempPlanCountry)),
      alphaaCountries: uniqueBaseCountries(countryFilter.filter(isAlphaaCountry)),
      tempRegionScope: "AfricaAndBalkan" as const,
      fetchTemp: countryFilter.some(isTempPlanCountry),
      fetchAlphaa: countryFilter.some(isAlphaaCountry),
    };
  }

  return {
    tempCountries: [] as string[],
    alphaaCountries: [] as string[],
    tempRegionScope: undefined,
    fetchTemp: false,
    fetchAlphaa: false,
  };
}

export async function fetchAdminCountryCoverage(
  filter?: AdminCountryCoverageFilter
): Promise<AdminCountryCoverage> {
  const regionPlans =
    filter?.region === undefined
      ? null
      : adminCountryPlansForRegion(filter.region);
  const countryFilter =
    filter?.countries ??
    (regionPlans === null ? null : regionPlans.map((plan) => plan.country));

  const {
    tempCountries,
    alphaaCountries,
    tempRegionScope,
    fetchTemp,
    fetchAlphaa,
  } = splitCoverageCountries(countryFilter, filter?.region);

  const [tempCoverage, alphaaActualByCountry, alphaaHoldersByCountry] =
    await Promise.all([
      fetchTemp
        ? fetchTempCountryCoverage(tempCountries, { regionScope: tempRegionScope })
        : Promise.resolve({
            actualByCountry: new Map<string, CountryActuals>(),
            holdersByCountry: new Map<string, HolderActuals[]>(),
            onHoldCount: 0,
          }),
      fetchAlphaa
        ? fetchAlphaaCountryActuals(alphaaCountries)
        : Promise.resolve(new Map()),
      fetchAlphaa
        ? fetchAlphaaHolderActuals(alphaaCountries)
        : Promise.resolve(new Map()),
    ]);

  const actualByCountry = new Map<string, CountryActuals>();
  const holdersByCountry = new Map<string, HolderActuals[]>();

  if (filter?.region === "Alphaa") {
    for (const [country, actuals] of alphaaActualByCountry) {
      actualByCountry.set(country, actuals);
    }
    for (const [country, holders] of alphaaHoldersByCountry) {
      holdersByCountry.set(country, holders);
    }
  } else if (filter?.region === "Africa" || filter?.region === "Balkan") {
    for (const [country, actuals] of tempCoverage.actualByCountry) {
      actualByCountry.set(country, actuals);
    }
    for (const [country, holders] of tempCoverage.holdersByCountry) {
      holdersByCountry.set(country, holders);
    }
  } else if (filter?.region === "Overview") {
    for (const [country, actuals] of tempCoverage.actualByCountry) {
      actualByCountry.set(
        isDualRegionCountry(country)
          ? overviewDisplayCountry(country, "Africa")
          : country,
        actuals
      );
    }
    for (const [country, holders] of tempCoverage.holdersByCountry) {
      holdersByCountry.set(
        isDualRegionCountry(country)
          ? overviewDisplayCountry(country, "Africa")
          : country,
        holders
      );
    }
    for (const [country, actuals] of alphaaActualByCountry) {
      if (isDualRegionCountry(country)) {
        actualByCountry.set(overviewDisplayCountry(country, "Alphaa"), actuals);
      } else if (!isTempPlanCountry(country)) {
        actualByCountry.set(country, actuals);
      }
    }
    for (const [country, holders] of alphaaHoldersByCountry) {
      if (isDualRegionCountry(country)) {
        holdersByCountry.set(overviewDisplayCountry(country, "Alphaa"), holders);
      } else if (!isTempPlanCountry(country)) {
        holdersByCountry.set(country, holders);
      }
    }
  } else {
    for (const [country, actuals] of tempCoverage.actualByCountry) {
      actualByCountry.set(country, actuals);
    }
    for (const [country, holders] of tempCoverage.holdersByCountry) {
      holdersByCountry.set(country, holders);
    }
    for (const [country, actuals] of alphaaActualByCountry) {
      if (!isTempPlanCountry(country)) {
        actualByCountry.set(country, actuals);
      }
    }
    for (const [country, holders] of alphaaHoldersByCountry) {
      if (!isTempPlanCountry(country)) {
        holdersByCountry.set(country, holders);
      }
    }
  }

  const allowedCountries = countryFilter === null ? null : new Set(countryFilter);
  const planSource =
    regionPlans ??
    (filter?.region === undefined
      ? adminCountryPlansForRegion("Overview")
      : adminCountryPlansForRegion(filter.region));
  const plans =
    allowedCountries === null
      ? planSource
      : planSource.filter((plan) => allowedCountries.has(plan.country));

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
      resources: addResourceTotal(sum.resources, row.resources),
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
    onHoldCount: tempCoverage.onHoldCount,
  };
}
