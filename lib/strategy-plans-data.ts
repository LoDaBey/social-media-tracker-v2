import { query, queryOne } from "@/lib/db";
import {
  ADMIN_COUNTRY_PLANS,
  EUROPE_COUNTRY_PLANS,
  europeCountryPlan,
  seatQuotaForIndex,
} from "@/lib/admin-country-targets";
import { ALPHAA_COUNTRY_PLANS } from "@/lib/alphaa-country-targets";
import {
  adminCountryPlanFromTargets,
  normalizeStrategyTargets,
} from "@/lib/strategy-platforms";
import {
  isDualRegionCountry,
  labelDuplicateOverviewPlans,
} from "@/lib/overview-country-display";
import { MAIN_PROJECT_LABEL } from "@/lib/project-labels";
import type {
  AdminCountryPlan,
  AdminCountrySeatQuota,
  AdminRegion,
} from "@/types/admin";
import type {
  StrategyBook,
  StrategyCountryRow,
  StrategySaveCountryInput,
  StrategyScopeCounts,
} from "@/types/strategy";

type AlphaaPlanDbRow = {
  country: string;
  language: string;
  resources: number;
  total_accounts: number;
  project_targets: unknown;
  handler_targets: unknown;
  updated_at: Date | string;
};

type AfricaEuropePlanDbRow = AlphaaPlanDbRow & {
  region: "Africa" | "Europe";
  language2: string | null;
};

function asIso(value: Date | string) {
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function mapAlphaaRow(row: AlphaaPlanDbRow): StrategyCountryRow {
  return {
    book: "alphaa",
    region: "Alphaa",
    country: row.country,
    language: row.language,
    language2: null,
    resources: Number(row.resources),
    totalAccounts: Number(row.total_accounts),
    projectTargets: normalizeStrategyTargets(row.project_targets),
    handlerTargets: normalizeStrategyTargets(row.handler_targets),
    updatedAt: asIso(row.updated_at),
  };
}

function mapAfricaEuropeRow(row: AfricaEuropePlanDbRow): StrategyCountryRow {
  return {
    book: "africa_europe",
    region: row.region,
    country: row.country,
    language: row.language,
    language2: row.language2,
    resources: Number(row.resources),
    totalAccounts: Number(row.total_accounts),
    projectTargets: normalizeStrategyTargets(row.project_targets),
    handlerTargets: normalizeStrategyTargets(row.handler_targets),
    updatedAt: asIso(row.updated_at),
  };
}

export function strategyRowToAdminPlan(row: StrategyCountryRow): AdminCountryPlan {
  const plan = adminCountryPlanFromTargets({
    country: row.country,
    language: row.language,
    resources: row.resources,
    totalAccounts: row.totalAccounts,
    projectTargets: row.projectTargets,
    handlerTargets: row.handlerTargets,
  });
  if (row.book === "alphaa" && plan.extraPlatforms === undefined) {
    plan.extraPlatforms = {};
  }
  return plan;
}

export async function fetchAlphaaStrategyRows(): Promise<StrategyCountryRow[]> {
  const rows = await query<AlphaaPlanDbRow>(
    `SELECT country, language, resources, total_accounts,
            project_targets, handler_targets, updated_at
     FROM alphaa_country_plans
     ORDER BY country ASC`
  );
  return rows.map(mapAlphaaRow);
}

export async function fetchAfricaEuropeStrategyRows(): Promise<StrategyCountryRow[]> {
  const rows = await query<AfricaEuropePlanDbRow>(
    `SELECT country, region, language, language2, resources, total_accounts,
            project_targets, handler_targets, updated_at
     FROM africa_europe_country_plans
     ORDER BY region ASC, country ASC`
  );
  return rows.map(mapAfricaEuropeRow);
}

export async function fetchStrategyRows(
  book: StrategyBook,
  region?: "Africa" | "Europe"
) {
  if (book === "alphaa") return fetchAlphaaStrategyRows();
  const rows = await fetchAfricaEuropeStrategyRows();
  if (!region) return rows;
  return rows.filter((row) => row.region === region);
}

function staticPlansForRegion(region: AdminRegion): AdminCountryPlan[] {
  if (region === "Europe") return EUROPE_COUNTRY_PLANS;
  if (region === "Africa") return ADMIN_COUNTRY_PLANS;
  if (region === "Alphaa") return ALPHAA_COUNTRY_PLANS;

  const africaAndEuropeCountries = new Set<string>([
    ...ADMIN_COUNTRY_PLANS.map((plan) => plan.country),
    ...EUROPE_COUNTRY_PLANS.map((plan) => plan.country),
  ]);

  return labelDuplicateOverviewPlans([
    ...ADMIN_COUNTRY_PLANS.map((plan) => ({
      plan,
      baseCountry: plan.country,
      projectLabel: "Africa",
    })),
    ...EUROPE_COUNTRY_PLANS.map((plan) => ({
      plan,
      baseCountry: plan.country,
      projectLabel: "Europe",
    })),
    ...ALPHAA_COUNTRY_PLANS.filter(
      (plan) =>
        !africaAndEuropeCountries.has(plan.country) ||
        isDualRegionCountry(plan.country)
    ).map((plan) => ({
      plan,
      baseCountry: plan.country,
      projectLabel: MAIN_PROJECT_LABEL,
    })),
  ]);
}

export async function fetchAdminCountryPlansForRegion(
  region: AdminRegion
): Promise<AdminCountryPlan[]> {
  const isCustomStrategyProject =
    region !== "Overview" &&
    region !== "Africa" &&
    region !== "Europe" &&
    region !== "Alphaa";

  try {
    const fromDb = await fetchAdminCountryPlansFromDb(region);
    if (fromDb.length > 0 || isCustomStrategyProject) return fromDb;
  } catch (error) {
    console.error("Strategy tables unavailable, using static plans.", error);
    if (isCustomStrategyProject) return [];
  }
  return staticPlansForRegion(region);
}

export async function adminCountryPlansForRegion(region: AdminRegion) {
  return fetchAdminCountryPlansForRegion(region);
}

export async function adminPlanCountriesForRegion(
  region: AdminRegion
): Promise<string[]> {
  const plans = await fetchAdminCountryPlansForRegion(region);
  return plans.map((plan) => plan.country);
}

export async function europeCountryPlanResolved(
  country: string
): Promise<AdminCountryPlan | null> {
  try {
    const fromDb = await fetchAfricaEuropeAdminPlan(country);
    if (fromDb) return fromDb;
  } catch (error) {
    console.error("Strategy tables unavailable, using static Europe plan.", error);
  }
  return europeCountryPlan(country);
}

export async function europeSeatTargetsForIndexFromDb(
  country: string,
  seatIndex: number
): Promise<AdminCountrySeatQuota | null> {
  const plan = await europeCountryPlanResolved(country);
  if (!plan) return null;
  return seatQuotaForIndex(plan, seatIndex);
}

async function plansFromStrategyProjectSlug(
  slug: string
): Promise<AdminCountryPlan[]> {
  const { fetchStrategyProjectBySlug } = await import(
    "@/lib/strategy-projects-data"
  );
  const { adminCountryPlanFromTargets, targetsGrandTotal } = await import(
    "@/lib/strategy-platforms"
  );
  const project = await fetchStrategyProjectBySlug(slug);
  if (!project) return [];
  const children =
    project.subProjects.length > 0 ? project.subProjects : [project];
  const seenCountries = new Set<string>();
  const plans: AdminCountryPlan[] = [];
  for (const child of children) {
    const country = child.name.trim();
    if (!country) continue;
    const key = country.toLowerCase();
    if (seenCountries.has(key)) continue;
    seenCountries.add(key);
    plans.push(
      adminCountryPlanFromTargets({
        country,
        language: child.language || "—",
        resources: child.resources,
        totalAccounts:
          child.totalAccounts > 0
            ? child.totalAccounts
            : targetsGrandTotal(child.projectTargets),
        projectTargets: child.projectTargets,
        handlerTargets: child.handlerTargets,
      })
    );
  }
  return plans;
}

async function fetchAdminCountryPlansFromDb(
  region: AdminRegion
): Promise<AdminCountryPlan[]> {
  if (region === "Africa") {
    const rows = await fetchAfricaEuropeStrategyRows();
    return rows
      .filter((row) => row.region === "Africa")
      .map(strategyRowToAdminPlan);
  }

  if (region === "Europe") {
    const rows = await fetchAfricaEuropeStrategyRows();
    return rows
      .filter((row) => row.region === "Europe")
      .map(strategyRowToAdminPlan);
  }

  if (region === "Alphaa") {
    const rows = await fetchAlphaaStrategyRows();
    return rows.map(strategyRowToAdminPlan);
  }

  if (region !== "Overview") {
    return plansFromStrategyProjectSlug(region);
  }

  const [africaEurope, alphaa, { fetchStrategyProjects }] = await Promise.all([
    fetchAfricaEuropeStrategyRows(),
    fetchAlphaaStrategyRows(),
    import("@/lib/strategy-projects-data"),
  ]);
  const africa = africaEurope.filter((row) => row.region === "Africa");
  const europe = africaEurope.filter((row) => row.region === "Europe");
  const africaEuropeCountries = new Set(africaEurope.map((row) => row.country));
  const legacySlugs = new Set(["africa", "europe", "alphaa"]);
  const customProjects = (await fetchStrategyProjects()).filter(
    (project) => !legacySlugs.has(project.slug)
  );
  const customEntries = (
    await Promise.all(
      customProjects.map(async (project) => {
        const plans = await plansFromStrategyProjectSlug(project.slug);
        return plans.map((plan) => ({
          plan,
          baseCountry: plan.country,
          projectLabel: project.name,
        }));
      })
    )
  ).flat();

  return labelDuplicateOverviewPlans([
    ...africa.map((row) => {
      const plan = strategyRowToAdminPlan(row);
      return {
        plan,
        baseCountry: plan.country,
        projectLabel: "Africa",
      };
    }),
    ...europe.map((row) => {
      const plan = strategyRowToAdminPlan(row);
      return {
        plan,
        baseCountry: plan.country,
        projectLabel: "Europe",
      };
    }),
    ...alphaa
      .filter(
        (row) =>
          !africaEuropeCountries.has(row.country) ||
          isDualRegionCountry(row.country)
      )
      .map((row) => {
        const plan = strategyRowToAdminPlan(row);
        return {
          plan,
          baseCountry: plan.country,
          projectLabel: MAIN_PROJECT_LABEL,
        };
      }),
    ...customEntries,
  ]);
}

export async function fetchAfricaEuropeAdminPlan(
  country: string
): Promise<AdminCountryPlan | null> {
  const row = await queryOne<AfricaEuropePlanDbRow>(
    `SELECT country, region, language, language2, resources, total_accounts,
            project_targets, handler_targets, updated_at
     FROM africa_europe_country_plans
     WHERE country = $1`,
    [country]
  );
  return row ? strategyRowToAdminPlan(mapAfricaEuropeRow(row)) : null;
}

export async function saveStrategyCountry(input: StrategySaveCountryInput) {
  if (input.book === "alphaa") {
    await query(
      `INSERT INTO alphaa_country_plans (
         country, language, resources, total_accounts, project_targets, handler_targets, updated_at
       ) VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, CURRENT_TIMESTAMP)
       ON CONFLICT (country) DO UPDATE SET
         language = EXCLUDED.language,
         resources = EXCLUDED.resources,
         total_accounts = EXCLUDED.total_accounts,
         project_targets = EXCLUDED.project_targets,
         handler_targets = EXCLUDED.handler_targets,
         updated_at = CURRENT_TIMESTAMP`,
      [
        input.country,
        input.language,
        input.resources,
        input.totalAccounts,
        JSON.stringify(input.projectTargets),
        JSON.stringify(input.handlerTargets),
      ]
    );
    return;
  }

  const region = input.region ?? "Africa";
  await query(
    `INSERT INTO africa_europe_country_plans (
       country, region, language, language2, resources, total_accounts,
       project_targets, handler_targets, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, CURRENT_TIMESTAMP)
     ON CONFLICT (country) DO UPDATE SET
       region = EXCLUDED.region,
       language = EXCLUDED.language,
       language2 = COALESCE(EXCLUDED.language2, africa_europe_country_plans.language2),
       resources = EXCLUDED.resources,
       total_accounts = EXCLUDED.total_accounts,
       project_targets = EXCLUDED.project_targets,
       handler_targets = EXCLUDED.handler_targets,
       updated_at = CURRENT_TIMESTAMP`,
    [
      input.country,
      region,
      input.language,
      input.language2 ?? null,
      input.resources,
      input.totalAccounts,
      JSON.stringify(input.projectTargets),
      JSON.stringify(input.handlerTargets),
    ]
  );
}

export async function importProjectRows(
  book: StrategyBook,
  rows: Array<{
    country: string;
    region?: "Africa" | "Europe";
    language: string;
    language2?: string | null;
    resources: number;
    totalAccounts: number;
    projectTargets: StrategyScopeCounts;
  }>
) {
  for (const row of rows) {
    if (book === "alphaa") {
      await query(
        `INSERT INTO alphaa_country_plans (
           country, language, resources, total_accounts, project_targets, handler_targets, updated_at
         ) VALUES ($1, $2, $3, $4, $5::jsonb, '{}'::jsonb, CURRENT_TIMESTAMP)
         ON CONFLICT (country) DO UPDATE SET
           language = CASE
             WHEN EXCLUDED.language <> '' THEN EXCLUDED.language
             ELSE alphaa_country_plans.language
           END,
           resources = CASE
             WHEN EXCLUDED.resources > 0 THEN EXCLUDED.resources
             ELSE alphaa_country_plans.resources
           END,
           total_accounts = EXCLUDED.total_accounts,
           project_targets = EXCLUDED.project_targets,
           updated_at = CURRENT_TIMESTAMP`,
        [
          row.country,
          row.language,
          row.resources,
          row.totalAccounts,
          JSON.stringify(row.projectTargets),
        ]
      );
      continue;
    }

    await query(
      `INSERT INTO africa_europe_country_plans (
         country, region, language, language2, resources, total_accounts,
         project_targets, handler_targets, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, '{}'::jsonb, CURRENT_TIMESTAMP)
       ON CONFLICT (country) DO UPDATE SET
         region = EXCLUDED.region,
         language = CASE
           WHEN EXCLUDED.language <> '' THEN EXCLUDED.language
           ELSE africa_europe_country_plans.language
         END,
         language2 = COALESCE(EXCLUDED.language2, africa_europe_country_plans.language2),
         resources = CASE
           WHEN EXCLUDED.resources > 0 THEN EXCLUDED.resources
           ELSE africa_europe_country_plans.resources
         END,
         total_accounts = EXCLUDED.total_accounts,
         project_targets = EXCLUDED.project_targets,
         updated_at = CURRENT_TIMESTAMP`,
      [
        row.country,
        row.region ?? "Africa",
        row.language,
        row.language2 ?? null,
        row.resources,
        row.totalAccounts,
        JSON.stringify(row.projectTargets),
      ]
    );
  }
}
