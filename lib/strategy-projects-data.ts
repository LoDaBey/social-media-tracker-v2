import { query, queryOne } from "@/lib/db";
import {
  fetchAfricaEuropeStrategyRows,
  fetchAlphaaStrategyRows,
} from "@/lib/strategy-plans-data";
import {
  addStrategyScopeCounts,
  ALPHAA_SUMMARY_PLATFORMS,
  DEFAULT_CUSTOM_PROJECT_PLATFORMS,
  emptyStrategyScopeCounts,
  isStrategyPlatformKey,
  normalizeStrategyTargets,
  orderedStrategyPlatforms,
  platformsUsedInRows,
  strategyProjectSlugFromName,
  targetsGrandTotal,
} from "@/lib/strategy-platforms";
import {
  STRATEGY_GEO_REGIONS,
  normalizeStrategyProjectRegion,
  strategyAccountRegionValue,
  uniqueStrategyProjectRegions,
} from "@/lib/strategy-regions";
import type {
  StrategyCountryRow,
  StrategyCreateProjectInput,
  StrategyPlatformKey,
  StrategyProject,
  StrategyProjectRegion,
  StrategySaveProjectInput,
  StrategyScopeCounts,
} from "@/types/strategy";

type StrategyProjectDbRow = {
  id: number;
  name: string;
  slug: string;
  region: string | null;
  platforms: string[] | null;
  language: string;
  resources: number;
  total_accounts: number;
  project_targets: unknown;
  handler_targets: unknown;
  updated_at: Date | string;
};

type SeedBook = {
  name: string;
  slug: string;
  createdAt: string;
  defaultPlatforms: StrategyPlatformKey[];
  rows: StrategyCountryRow[];
};

const PROJECT_SELECT = `id, name, slug, region, platforms, language, resources, total_accounts,
            project_targets, handler_targets, updated_at`;

function asIso(value: Date | string) {
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function parsePlatforms(value: string[] | null): StrategyPlatformKey[] {
  return orderedStrategyPlatforms((value ?? []).filter(isStrategyPlatformKey));
}

function mapProject(row: StrategyProjectDbRow): StrategyProject {
  return {
    id: Number(row.id),
    name: row.name,
    slug: row.slug,
    region: normalizeStrategyProjectRegion(row.region),
    platforms: parsePlatforms(row.platforms),
    language: row.language ?? "",
    resources: Number(row.resources),
    totalAccounts: Number(row.total_accounts),
    projectTargets: normalizeStrategyTargets(row.project_targets),
    handlerTargets: normalizeStrategyTargets(row.handler_targets),
    updatedAt: asIso(row.updated_at),
  };
}

async function uniqueProjectSlug(name: string): Promise<string> {
  const root = strategyProjectSlugFromName(name);
  const existing = await query<{ slug: string }>(
    `SELECT slug FROM strategy_projects WHERE slug = $1 OR slug LIKE $2`,
    [root, `${root}-%`]
  );
  const taken = new Set(existing.map((row) => row.slug));
  if (!taken.has(root)) return root;
  let index = 2;
  while (taken.has(`${root}-${index}`)) index += 1;
  return `${root}-${index}`;
}

function aggregateCountryRows(
  rows: StrategyCountryRow[],
  fallbackPlatforms: StrategyPlatformKey[]
): {
  resources: number;
  totalAccounts: number;
  projectTargets: StrategyScopeCounts;
  handlerTargets: StrategyScopeCounts;
  platforms: StrategyPlatformKey[];
} {
  let projectTargets = emptyStrategyScopeCounts();
  for (const row of rows) {
    projectTargets = addStrategyScopeCounts(projectTargets, row.projectTargets);
  }
  const richest = [...rows].sort(
    (left, right) => right.totalAccounts - left.totalAccounts
  )[0];
  const platforms = platformsUsedInRows(rows);
  return {
    resources: rows.reduce((sum, row) => sum + row.resources, 0),
    totalAccounts:
      targetsGrandTotal(projectTargets) ||
      rows.reduce((sum, row) => sum + row.totalAccounts, 0),
    projectTargets,
    handlerTargets: richest?.handlerTargets ?? emptyStrategyScopeCounts(),
    platforms: platforms.length > 0 ? platforms : fallbackPlatforms,
  };
}

export async function fetchStrategyProjects(): Promise<StrategyProject[]> {
  try {
    await seedStrategyProjectsFromCountryPlans();
  } catch (error) {
    console.error("Could not seed strategy projects from country plans.", error);
  }

  try {
    const rows = await query<StrategyProjectDbRow>(
      `SELECT ${PROJECT_SELECT}
       FROM strategy_projects
       ORDER BY created_at ASC, name ASC`
    );
    return rows.map(mapProject);
  } catch (error) {
    console.error("Strategy projects table unavailable.", error);
    return [];
  }
}

export async function fetchStrategyProjectBySlug(
  slug: string
): Promise<StrategyProject | null> {
  const row = await queryOne<StrategyProjectDbRow>(
    `SELECT ${PROJECT_SELECT}
     FROM strategy_projects
     WHERE slug = $1`,
    [slug]
  );
  return row ? mapProject(row) : null;
}

export async function createStrategyProject(
  input: StrategyCreateProjectInput
): Promise<StrategyProject> {
  const name = input.name.trim();
  const platforms = orderedStrategyPlatforms(input.platforms);
  const slug = await uniqueProjectSlug(name);
  const row = await queryOne<StrategyProjectDbRow>(
    `INSERT INTO strategy_projects (
       name, slug, region, platforms, language, resources, total_accounts,
       project_targets, handler_targets
     ) VALUES ($1, $2, $3, $4::text[], '', 0, 0, '{}'::jsonb, '{}'::jsonb)
     RETURNING ${PROJECT_SELECT}`,
    [name, slug, normalizeStrategyProjectRegion(input.region), platforms]
  );
  if (!row) throw new Error("Could not create the strategy project.");
  return mapProject(row);
}

export async function saveStrategyProject(input: StrategySaveProjectInput) {
  const platforms = orderedStrategyPlatforms(input.platforms);
  await query(
    `UPDATE strategy_projects SET
       region = $2,
       platforms = $3::text[],
       language = $4,
       resources = $5,
       total_accounts = $6,
       project_targets = $7::jsonb,
       handler_targets = $8::jsonb,
       updated_at = CURRENT_TIMESTAMP
     WHERE slug = $1`,
    [
      input.slug,
      normalizeStrategyProjectRegion(input.region),
      platforms,
      input.language,
      input.resources,
      input.totalAccounts,
      JSON.stringify(input.projectTargets),
      JSON.stringify(input.handlerTargets),
    ]
  );
}

export async function applyStrategyProjectRegionToAccounts(
  name: string,
  region: StrategyProjectRegion | ""
) {
  if (!region) return;
  const accountRegion = strategyAccountRegionValue(region);
  try {
    await query(
      `UPDATE social_media_accounts sma
       SET region = $2,
           updated_at = CURRENT_TIMESTAMP
       FROM users u
       WHERE sma.user_id = u.id
         AND EXISTS (
           SELECT 1
           FROM unnest(COALESCE(u.projects, ARRAY[]::text[])) AS project_name
           WHERE LOWER(TRIM(project_name)) = LOWER(TRIM($1))
         )`,
      [name, accountRegion]
    );
  } catch (error) {
    console.error("Could not apply strategy project region to accounts.", error);
  }
}

export async function fetchStrategyProjectRegionForAlphaaUser(
  userId: number
): Promise<StrategyProjectRegion | ""> {
  try {
    const row = await queryOne<{ region: string | null }>(
      `SELECT sp.region
       FROM strategy_projects sp
       JOIN users u ON u.id = $1
       WHERE TRIM(COALESCE(sp.region, '')) <> ''
         AND EXISTS (
           SELECT 1
           FROM unnest(COALESCE(u.projects, ARRAY[]::text[])) AS project_name
           WHERE LOWER(TRIM(project_name)) = LOWER(TRIM(sp.name))
         )
       ORDER BY sp.updated_at DESC
       LIMIT 1`,
      [userId]
    );
    return normalizeStrategyProjectRegion(row?.region);
  } catch (error) {
    console.error("Could not read strategy project region for handler.", error);
    return "";
  }
}

export async function fetchStrategyProjectRegionOptions(): Promise<string[]> {
  let stored: string[] = [];
  try {
    const projectRows = await query<{ region: string }>(
      `SELECT DISTINCT region
       FROM strategy_projects
       WHERE TRIM(COALESCE(region, '')) <> ''`
    );
    const accountRows = await query<{ region: string }>(
      `SELECT DISTINCT region
       FROM social_media_accounts
       WHERE TRIM(COALESCE(region, '')) <> ''`
    );
    stored = [...projectRows, ...accountRows].map((row) => row.region);
  } catch (error) {
    console.error("Could not load strategy region options.", error);
  }
  return uniqueStrategyProjectRegions([...STRATEGY_GEO_REGIONS, ...stored]).filter(
    (region) => !["africa", "europe", "alphaa", "balkan"].includes(region.toLowerCase())
  );
}

export async function deleteStrategyProject(slug: string): Promise<boolean> {
  const row = await queryOne<{ id: number }>(
    `DELETE FROM strategy_projects WHERE slug = $1 RETURNING id`,
    [slug]
  );
  return Boolean(row);
}

export async function seedStrategyProjectsFromCountryPlans() {
  await query(`
    CREATE TABLE IF NOT EXISTS strategy_project_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);
  const seeded = await queryOne<{ value: string }>(
    `SELECT value FROM strategy_project_meta WHERE key = 'legacy_books_seeded'`
  );
  if (seeded) return;

  let alphaaRows: StrategyCountryRow[] = [];
  let africaEuropeRows: StrategyCountryRow[] = [];
  try {
    [alphaaRows, africaEuropeRows] = await Promise.all([
      fetchAlphaaStrategyRows(),
      fetchAfricaEuropeStrategyRows(),
    ]);
  } catch (error) {
    console.error("Could not read country strategy plans for project seed.", error);
  }

  const books: SeedBook[] = [
    {
      name: "ALPHAA",
      slug: "alphaa",
      createdAt: "2020-01-01T00:00:00.000Z",
      defaultPlatforms: ALPHAA_SUMMARY_PLATFORMS,
      rows: alphaaRows,
    },
    {
      name: "Africa",
      slug: "africa",
      createdAt: "2020-01-02T00:00:00.000Z",
      defaultPlatforms: [...DEFAULT_CUSTOM_PROJECT_PLATFORMS],
      rows: africaEuropeRows.filter((row) => row.region === "Africa"),
    },
    {
      name: "Europe",
      slug: "europe",
      createdAt: "2020-01-03T00:00:00.000Z",
      defaultPlatforms: [...DEFAULT_CUSTOM_PROJECT_PLATFORMS],
      rows: africaEuropeRows.filter((row) => row.region === "Europe"),
    },
  ];

  for (const book of books) {
    const aggregated = aggregateCountryRows(book.rows, book.defaultPlatforms);
    await query(
      `INSERT INTO strategy_projects (
         name, slug, region, platforms, language, resources, total_accounts,
         project_targets, handler_targets, created_at, updated_at
       ) VALUES (
         $1, $2, '', $3::text[], '', $4, $5, $6::jsonb, $7::jsonb,
         $8::timestamp, $8::timestamp
       )
       ON CONFLICT (slug) DO NOTHING`,
      [
        book.name,
        book.slug,
        aggregated.platforms,
        aggregated.resources,
        aggregated.totalAccounts,
        JSON.stringify(aggregated.projectTargets),
        JSON.stringify(aggregated.handlerTargets),
        book.createdAt,
      ]
    );
  }

  await query(
    `INSERT INTO strategy_project_meta (key, value) VALUES ('legacy_books_seeded', '1')
     ON CONFLICT (key) DO NOTHING`
  );
}
