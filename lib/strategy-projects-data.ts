import { query, queryOne } from "@/lib/db";
import {
  fetchAfricaEuropeStrategyRows,
  fetchAlphaaStrategyRows,
  saveStrategyCountry,
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
  StrategySaveSubProjectInput,
  StrategyScopeCounts,
} from "@/types/strategy";

type StrategyProjectDbRow = {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  region: string | null;
  platforms: string[] | null;
  language: string;
  resources: number;
  total_accounts: number;
  project_targets: unknown;
  handler_targets: unknown;
  created_at: Date | string;
  updated_at: Date | string;
};

type SeedBook = {
  name: string;
  slug: string;
  createdAt: string;
  defaultPlatforms: StrategyPlatformKey[];
  rows: StrategyCountryRow[];
};

type LegacyBookSync = {
  slug: "alphaa" | "africa" | "europe";
  book: "alphaa" | "africa_europe";
  region?: "Africa" | "Europe";
};

const PROJECT_SELECT = `id, name, slug, parent_id, region, platforms, language, resources,
            total_accounts, project_targets, handler_targets, created_at, updated_at`;

const ALPHAA_SUBPROJECT_ORDER = [
  "Turkey",
  "Iran",
  "Sudan",
  "Somalia",
  "Palestine",
];

const LEGACY_BOOKS: LegacyBookSync[] = [
  { slug: "alphaa", book: "alphaa" },
  { slug: "africa", book: "africa_europe", region: "Africa" },
  { slug: "europe", book: "africa_europe", region: "Europe" },
];

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
    parentId: row.parent_id == null ? null : Number(row.parent_id),
    region: normalizeStrategyProjectRegion(row.region),
    platforms: parsePlatforms(row.platforms),
    language: row.language ?? "",
    resources: Number(row.resources),
    totalAccounts: Number(row.total_accounts),
    projectTargets: normalizeStrategyTargets(row.project_targets),
    handlerTargets: normalizeStrategyTargets(row.handler_targets),
    subProjects: [],
    updatedAt: asIso(row.updated_at),
  };
}

function nestProjects(projects: StrategyProject[]): StrategyProject[] {
  const children = new Map<number, StrategyProject[]>();
  for (const project of projects) {
    if (project.parentId == null) continue;
    const list = children.get(project.parentId) ?? [];
    list.push({ ...project, subProjects: [] });
    children.set(project.parentId, list);
  }
  return projects
    .filter((project) => project.parentId == null)
    .map((project) => ({
      ...project,
      subProjects: children.get(project.id) ?? [],
    }));
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

function aggregateSubProjects(
  children: Array<{
    resources: number;
    projectTargets: StrategyScopeCounts;
    platforms?: StrategyPlatformKey[];
  }>,
  fallbackPlatforms: StrategyPlatformKey[]
) {
  let projectTargets = emptyStrategyScopeCounts();
  const platformSet = new Set<StrategyPlatformKey>();
  let resources = 0;
  for (const child of children) {
    projectTargets = addStrategyScopeCounts(projectTargets, child.projectTargets);
    resources += child.resources;
    for (const platform of child.platforms ?? []) platformSet.add(platform);
  }
  const platforms = orderedStrategyPlatforms([...platformSet]);
  return {
    resources,
    totalAccounts: targetsGrandTotal(projectTargets),
    projectTargets,
    platforms: platforms.length > 0 ? platforms : fallbackPlatforms,
  };
}

function sortAlphaaRows(rows: StrategyCountryRow[]) {
  const rank = new Map(ALPHAA_SUBPROJECT_ORDER.map((name, index) => [name, index]));
  return [...rows].sort((left, right) => {
    const leftRank = rank.get(left.country) ?? ALPHAA_SUBPROJECT_ORDER.length;
    const rightRank = rank.get(right.country) ?? ALPHAA_SUBPROJECT_ORDER.length;
    if (leftRank !== rightRank) return leftRank - rightRank;
    return left.country.localeCompare(right.country);
  });
}

function legacyBookForParentSlug(slug: string): LegacyBookSync | null {
  return LEGACY_BOOKS.find((book) => book.slug === slug) ?? null;
}

async function fetchProjectRowBySlug(slug: string) {
  return queryOne<StrategyProjectDbRow>(
    `SELECT ${PROJECT_SELECT}
     FROM strategy_projects
     WHERE slug = $1`,
    [slug]
  );
}

async function fetchChildRows(parentId: number) {
  return query<StrategyProjectDbRow>(
    `SELECT ${PROJECT_SELECT}
     FROM strategy_projects
     WHERE parent_id = $1
     ORDER BY created_at ASC, name ASC`,
    [parentId]
  );
}

async function attachChildren(project: StrategyProject): Promise<StrategyProject> {
  const rows = await fetchChildRows(project.id);
  return {
    ...project,
    subProjects: rows.map((row) => ({ ...mapProject(row), subProjects: [] })),
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
    return nestProjects(rows.map(mapProject));
  } catch (error) {
    console.error("Strategy projects table unavailable.", error);
    return [];
  }
}

export async function fetchStrategyProjectBySlug(
  slug: string
): Promise<StrategyProject | null> {
  const row = await fetchProjectRowBySlug(slug);
  if (!row) return null;
  const project = mapProject(row);
  if (project.parentId != null) return { ...project, subProjects: [] };
  return attachChildren(project);
}

export async function createStrategyProject(
  input: StrategyCreateProjectInput
): Promise<StrategyProject> {
  const name = input.name.trim();
  const platforms = orderedStrategyPlatforms(input.platforms);
  const slug = await uniqueProjectSlug(name);
  const row = await queryOne<StrategyProjectDbRow>(
    `INSERT INTO strategy_projects (
       name, slug, parent_id, region, platforms, language, resources, total_accounts,
       project_targets, handler_targets
     ) VALUES ($1, $2, NULL, $3, $4::text[], '', 0, 0, '{}'::jsonb, '{}'::jsonb)
     RETURNING ${PROJECT_SELECT}`,
    [name, slug, normalizeStrategyProjectRegion(input.region), platforms]
  );
  if (!row) throw new Error("Could not create the strategy project.");
  return { ...mapProject(row), subProjects: [] };
}

async function insertSubProject(
  parent: StrategyProject,
  input: {
    name: string;
    language: string;
    resources: number;
    platforms: StrategyPlatformKey[];
    projectTargets: StrategyScopeCounts;
    handlerTargets: StrategyScopeCounts;
    createdAt?: string;
  }
): Promise<StrategyProject> {
  const name = input.name.trim();
  const slug = await uniqueProjectSlug(
    `${parent.slug}-${strategyProjectSlugFromName(name)}`
  );
  const totalAccounts = targetsGrandTotal(input.projectTargets);
  const row = await queryOne<StrategyProjectDbRow>(
    `INSERT INTO strategy_projects (
       name, slug, parent_id, region, platforms, language, resources, total_accounts,
       project_targets, handler_targets, created_at, updated_at
     ) VALUES (
       $1, $2, $3, '', $4::text[], $5, $6, $7, $8::jsonb, $9::jsonb,
       COALESCE($10::timestamp, CURRENT_TIMESTAMP),
       COALESCE($10::timestamp, CURRENT_TIMESTAMP)
     )
     RETURNING ${PROJECT_SELECT}`,
    [
      name,
      slug,
      parent.id,
      input.platforms,
      input.language,
      input.resources,
      totalAccounts,
      JSON.stringify(input.projectTargets),
      JSON.stringify(input.handlerTargets),
      input.createdAt ?? null,
    ]
  );
  if (!row) throw new Error("Could not create the sub-project.");
  return { ...mapProject(row), subProjects: [] };
}

async function updateProjectRow(input: {
  slug: string;
  name?: string;
  region: StrategyProjectRegion | "";
  platforms: StrategyPlatformKey[];
  language: string;
  resources: number;
  totalAccounts: number;
  projectTargets: StrategyScopeCounts;
  handlerTargets: StrategyScopeCounts;
}) {
  await query(
    `UPDATE strategy_projects SET
       name = COALESCE($9, name),
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
      input.platforms,
      input.language,
      input.resources,
      input.totalAccounts,
      JSON.stringify(input.projectTargets),
      JSON.stringify(input.handlerTargets),
      input.name?.trim() || null,
    ]
  );
}

export async function saveStrategyProject(input: StrategySaveProjectInput) {
  const existing = await fetchStrategyProjectBySlug(input.slug);
  if (!existing) throw new Error("That project was not found.");
  if (existing.parentId != null) {
    throw new Error("Save the parent project to update a nested book.");
  }

  const platforms = orderedStrategyPlatforms(input.platforms);
  const incoming = input.subProjects;

  if (incoming.length > 0) {
    const names = incoming.map((item) => item.name.trim().toLowerCase());
    if (new Set(names).size !== names.length) {
      throw new Error("Each sub-project needs a unique name.");
    }
  }

  const existingBySlug = new Map(
    existing.subProjects.map((child) => [child.slug, child])
  );
  const keepSlugs = new Set(
    incoming
      .map((item) => item.slug?.trim())
      .filter((slug): slug is string => {
        if (!slug) return false;
        return existingBySlug.has(slug);
      })
  );

  for (const child of existing.subProjects) {
    if (!keepSlugs.has(child.slug)) {
      await deleteStrategyProject(child.slug);
    }
  }

  const savedChildren: StrategyProject[] = [];
  for (const item of incoming) {
    const saved = await upsertSubProject(existing, item, platforms, existingBySlug);
    savedChildren.push(saved);
    await syncLegacyCountryPlan(existing, saved);
  }

  const rollup =
    savedChildren.length > 0
      ? aggregateSubProjects(savedChildren, platforms)
      : {
          resources: input.resources,
          totalAccounts:
            input.totalAccounts > 0
              ? input.totalAccounts
              : targetsGrandTotal(input.projectTargets),
          projectTargets: input.projectTargets,
          platforms,
        };

  await updateProjectRow({
    slug: existing.slug,
    region: input.region,
    platforms: rollup.platforms,
    language: input.language,
    resources: rollup.resources,
    totalAccounts: rollup.totalAccounts,
    projectTargets: rollup.projectTargets,
    handlerTargets: input.handlerTargets,
  });
}

async function upsertSubProject(
  parent: StrategyProject,
  item: StrategySaveSubProjectInput,
  platforms: StrategyPlatformKey[],
  existingBySlug: Map<string, StrategyProject>
): Promise<StrategyProject> {
  const name = item.name.trim();
  const projectTargets = normalizeStrategyTargets(item.projectTargets);
  const slug = item.slug?.trim();
  const existingChild = slug ? existingBySlug.get(slug) : undefined;
  if (existingChild) {
    await updateProjectRow({
      slug: existingChild.slug,
      name,
      region: "",
      platforms,
      language: item.language,
      resources: item.resources,
      totalAccounts: targetsGrandTotal(projectTargets),
      projectTargets,
      handlerTargets: existingChild.handlerTargets,
    });
    return {
      ...existingChild,
      name,
      language: item.language,
      resources: item.resources,
      platforms,
      totalAccounts: targetsGrandTotal(projectTargets),
      projectTargets,
      subProjects: [],
    };
  }
  return insertSubProject(parent, {
    name,
    language: item.language,
    resources: item.resources,
    platforms,
    projectTargets,
    handlerTargets: emptyStrategyScopeCounts(),
  });
}

async function syncLegacyCountryPlan(
  parent: StrategyProject,
  child: StrategyProject
) {
  const legacy = legacyBookForParentSlug(parent.slug);
  if (!legacy) return;
  try {
    await saveStrategyCountry({
      book: legacy.book,
      country: child.name,
      language: child.language,
      region: legacy.region,
      resources: child.resources,
      totalAccounts: child.totalAccounts,
      projectTargets: child.projectTargets,
      handlerTargets: child.handlerTargets,
    });
  } catch (error) {
    console.error("Could not sync strategy sub-project to country plans.", error);
  }
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

async function upsertSubProjectsFromCountryRows(
  parent: StrategyProject,
  rows: StrategyCountryRow[]
) {
  const existing = await fetchChildRows(parent.id);
  const byName = new Map(
    existing.map((row) => [row.name.trim().toLowerCase(), mapProject(row)])
  );
  const platformsFallback =
    parent.platforms.length > 0
      ? parent.platforms
      : DEFAULT_CUSTOM_PROJECT_PLATFORMS;
  let index = 0;
  for (const row of rows) {
    const nameKey = row.country.trim().toLowerCase();
    const platforms =
      platformsUsedInRows([row]).length > 0
        ? platformsUsedInRows([row])
        : platformsFallback;
    const current = byName.get(nameKey);
    if (current) {
      await updateProjectRow({
        slug: current.slug,
        region: "",
        platforms,
        language: row.language,
        resources: row.resources,
        totalAccounts: targetsGrandTotal(row.projectTargets) || row.totalAccounts,
        projectTargets: row.projectTargets,
        handlerTargets: row.handlerTargets,
      });
    } else {
      const createdAt = new Date(
        Date.parse(parent.updatedAt) + (index + 1) * 1000
      ).toISOString();
      await insertSubProject(parent, {
        name: row.country,
        language: row.language,
        resources: row.resources,
        platforms,
        projectTargets: row.projectTargets,
        handlerTargets: row.handlerTargets,
        createdAt,
      });
    }
    index += 1;
  }

  const children = (await fetchChildRows(parent.id)).map(mapProject);
  const rollup = aggregateSubProjects(
    children,
    parent.platforms.length > 0 ? parent.platforms : platformsFallback
  );
  await updateProjectRow({
    slug: parent.slug,
    region: parent.region,
    platforms: rollup.platforms,
    language: parent.language,
    resources: rollup.resources,
    totalAccounts: rollup.totalAccounts,
    projectTargets: rollup.projectTargets,
    handlerTargets: parent.handlerTargets,
  });
}

export async function syncLegacyBookSubProjectsFromCountryPlans() {
  const [alphaaRows, africaEuropeRows, parents] = await Promise.all([
    fetchAlphaaStrategyRows(),
    fetchAfricaEuropeStrategyRows(),
    query<StrategyProjectDbRow>(
      `SELECT ${PROJECT_SELECT}
       FROM strategy_projects
       WHERE slug = ANY($1::text[]) AND parent_id IS NULL`,
      [LEGACY_BOOKS.map((book) => book.slug)]
    ),
  ]);
  const parentBySlug = new Map(parents.map((row) => [row.slug, mapProject(row)]));
  const africaRows = africaEuropeRows.filter((row) => row.region === "Africa");
  const europeRows = africaEuropeRows.filter((row) => row.region === "Europe");
  const rowsBySlug: Record<LegacyBookSync["slug"], StrategyCountryRow[]> = {
    alphaa: sortAlphaaRows(alphaaRows),
    africa: africaRows,
    europe: europeRows,
  };

  for (const book of LEGACY_BOOKS) {
    const parent = parentBySlug.get(book.slug);
    if (!parent) continue;
    await upsertSubProjectsFromCountryRows(parent, rowsBySlug[book.slug]);
  }
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
  if (!seeded) {
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
        rows: sortAlphaaRows(alphaaRows),
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
           name, slug, parent_id, region, platforms, language, resources, total_accounts,
           project_targets, handler_targets, created_at, updated_at
         ) VALUES (
           $1, $2, NULL, '', $3::text[], '', $4, $5, $6::jsonb, $7::jsonb,
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

  const subSeeded = await queryOne<{ value: string }>(
    `SELECT value FROM strategy_project_meta WHERE key = 'legacy_subprojects_seeded'`
  );
  if (subSeeded) return;

  try {
    await syncLegacyBookSubProjectsFromCountryPlans();
    await query(
      `INSERT INTO strategy_project_meta (key, value) VALUES ('legacy_subprojects_seeded', '1')
       ON CONFLICT (key) DO NOTHING`
    );
  } catch (error) {
    console.error("Could not seed strategy sub-projects from country plans.", error);
  }
}
