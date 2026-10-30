import { ALPHAA_EXTRA_PLATFORM_KEYS } from "@/lib/alphaa-coverage-platforms";
import type {
  StrategyAccountScope,
  StrategyBook,
  StrategyHandlerField,
  StrategyPlatformKey,
  StrategyScopeCounts,
  StrategySheetGroup,
} from "@/types/strategy";
import type {
  AdminCountryPlan,
  AdminCountrySeatQuota,
  AlphaaExtraPlatformCounts,
} from "@/types/admin";

export const STRATEGY_SCOPES: StrategyAccountScope[] = [
  "personal",
  "umbrella",
  "native",
];

export const STRATEGY_PLATFORM_KEYS: StrategyPlatformKey[] = [
  "twitter",
  "facebook",
  "instagram",
  "tiktok",
  "threads",
  "reddit",
  "youtube",
  "blogspot",
  "telegram",
  "website",
  "pinterest",
  "turkkitap",
  "kizlarsoruyor",
  "balatarin",
];

export const STRATEGY_PLATFORM_LABELS: Record<StrategyPlatformKey, string> = {
  twitter: "X / Twitter",
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  threads: "Threads",
  reddit: "Reddit",
  youtube: "YouTube",
  blogspot: "BlogSpot",
  telegram: "Telegram",
  website: "Website",
  pinterest: "Pinterest",
  turkkitap: "1000Kitap",
  kizlarsoruyor: "KızlarSoruyor",
  balatarin: "Balatarin",
};

export const STRATEGY_SCOPE_LABELS: Record<StrategyAccountScope, string> = {
  personal: "Personal",
  umbrella: "Umbrella",
  native: "Native",
};

export const STRATEGY_PLATFORM_SHORT_LABELS: Record<StrategyPlatformKey, string> =
  {
    twitter: "X",
    facebook: "Facebook",
    instagram: "Instagram",
    tiktok: "TikTok",
    threads: "Threads",
    reddit: "Reddit",
    youtube: "YouTube",
    blogspot: "BlogSpot",
    telegram: "Telegram",
    website: "Website",
    pinterest: "Pinterest",
    turkkitap: "1000Kitap",
    kizlarsoruyor: "KızlarSoruyor",
    balatarin: "Balatarin",
  };

const CORE_SUMMARY_PLATFORMS: StrategyPlatformKey[] = [
  "twitter",
  "facebook",
  "instagram",
  "tiktok",
];

export const ALPHAA_SUMMARY_PLATFORMS: StrategyPlatformKey[] = [
  "twitter",
  "facebook",
  "instagram",
  "threads",
  "reddit",
  "youtube",
  "blogspot",
  "tiktok",
  "telegram",
  "website",
  "pinterest",
  "turkkitap",
  "kizlarsoruyor",
  "balatarin",
];

export const AFRICA_EUROPE_SHEET_GROUPS: StrategySheetGroup[] = [
  {
    label: "Personal",
    scope: "personal",
    platforms: ["twitter", "facebook", "instagram", "tiktok"],
  },
  {
    label: "Umbrella",
    scope: "umbrella",
    platforms: ["twitter", "facebook", "instagram", "tiktok"],
  },
];

export const ALPHAA_SHEET_GROUPS: StrategySheetGroup[] = [
  {
    label: "Personal",
    scope: "personal",
    platforms: [
      "twitter",
      "facebook",
      "instagram",
      "threads",
      "reddit",
      "blogspot",
      "youtube",
    ],
  },
  {
    label: "Umbrella",
    scope: "umbrella",
    platforms: [
      "website",
      "twitter",
      "facebook",
      "instagram",
      "threads",
      "youtube",
      "reddit",
      "blogspot",
      "tiktok",
      "pinterest",
    ],
  },
  {
    label: "Native",
    scope: "native",
    platforms: ["turkkitap", "balatarin", "kizlarsoruyor"],
  },
  {
    label: "Verified",
    scope: "native",
    platforms: ["telegram"],
  },
];

export const DEFAULT_CUSTOM_PROJECT_PLATFORMS: StrategyPlatformKey[] = [
  ...CORE_SUMMARY_PLATFORMS,
];

export function strategyProjectSlugFromName(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return slug || "project";
}

export function orderedStrategyPlatforms(
  selected: readonly string[]
): StrategyPlatformKey[] {
  const allowed = new Set(selected);
  return STRATEGY_PLATFORM_KEYS.filter((platform) => allowed.has(platform));
}

export function filterStrategyTargets(
  targets: StrategyScopeCounts,
  platforms: readonly StrategyPlatformKey[]
): StrategyScopeCounts {
  const allowed = new Set(platforms);
  const next: StrategyScopeCounts = {};
  for (const platform of STRATEGY_PLATFORM_KEYS) {
    if (!allowed.has(platform)) continue;
    const row = targets[platform];
    if (row) next[platform] = row;
  }
  return next;
}

export function strategySummaryPlatformsForBook(
  book: StrategyBook
): StrategyPlatformKey[] {
  if (book === "alphaa") return ALPHAA_SUMMARY_PLATFORMS;
  if (book === "custom") return [...STRATEGY_PLATFORM_KEYS];
  return CORE_SUMMARY_PLATFORMS;
}

export function strategySheetGroupsForBook(
  book: StrategyBook
): StrategySheetGroup[] {
  if (book === "alphaa") return ALPHAA_SHEET_GROUPS;
  if (book === "custom") {
    return STRATEGY_SCOPES.map((scope) => ({
      label: STRATEGY_SCOPE_LABELS[scope],
      scope,
      platforms: [...STRATEGY_PLATFORM_KEYS],
    }));
  }
  return AFRICA_EUROPE_SHEET_GROUPS;
}

/** Africa/Europe handler seat: X is one count; Facebook is Personal vs Umbrella. */
export const AFRICA_EUROPE_HANDLER_FIELDS: StrategyHandlerField[] = [
  { label: "X", platform: "twitter", scope: "all" },
  { label: "Facebook Personal", platform: "facebook", scope: "personal" },
  { label: "Facebook Umbrella", platform: "facebook", scope: "umbrella" },
  { label: "Instagram", platform: "instagram", scope: "all" },
  { label: "TikTok", platform: "tiktok", scope: "all" },
];

export function groupHandlerFieldsByPlatform(
  fields: StrategyHandlerField[]
): { platform: StrategyPlatformKey; fields: StrategyHandlerField[] }[] {
  const order: StrategyPlatformKey[] = [];
  const grouped = new Map<StrategyPlatformKey, StrategyHandlerField[]>();
  for (const field of fields) {
    const existing = grouped.get(field.platform);
    if (!existing) {
      grouped.set(field.platform, [field]);
      order.push(field.platform);
      continue;
    }
    existing.push(field);
  }
  return order.map((platform) => ({
    platform,
    fields: grouped.get(platform) ?? [],
  }));
}

export function strategyDisplayScopesForBook(
  book: StrategyBook
): StrategyAccountScope[] {
  if (book === "africa_europe") return ["personal", "umbrella"];
  return [...STRATEGY_SCOPES];
}

export function strategyGridPlatformsForBook(
  book: StrategyBook
): StrategyPlatformKey[] {
  return strategySummaryPlatformsForBook(book);
}

export function editableScopesForPlatform(
  book: StrategyBook,
  platform: StrategyPlatformKey
): StrategyAccountScope[] {
  if (book === "custom") return [...STRATEGY_SCOPES];
  const scopes = new Set<StrategyAccountScope>();
  for (const group of strategySheetGroupsForBook(book)) {
    if (group.platforms.includes(platform)) {
      scopes.add(group.scope);
    }
  }
  return STRATEGY_SCOPES.filter((scope) => scopes.has(scope));
}

export function strategyScopeTotal(
  targets: StrategyScopeCounts,
  scope: StrategyAccountScope
): number {
  return STRATEGY_PLATFORM_KEYS.reduce(
    (sum, platform) => sum + scopeCount(targets, platform, scope),
    0
  );
}

const PLATFORM_ALIASES: Record<string, StrategyPlatformKey> = {
  twitter: "twitter",
  x: "twitter",
  facebook: "facebook",
  instagram: "instagram",
  tiktok: "tiktok",
  threads: "threads",
  reddit: "reddit",
  youtube: "youtube",
  blogspot: "blogspot",
  blogger: "blogspot",
  telegram: "telegram",
  website: "website",
  pinterest: "pinterest",
  turkkitap: "turkkitap",
  "1000kitap": "turkkitap",
  kizlarsoruyor: "kizlarsoruyor",
  balatarin: "balatarin",
};

export function emptyStrategyScopeCounts(): StrategyScopeCounts {
  return {};
}

export function scopeCount(
  targets: StrategyScopeCounts,
  platform: StrategyPlatformKey,
  scope: StrategyAccountScope
) {
  return targets[platform]?.[scope] ?? 0;
}

export function platformTotal(
  targets: StrategyScopeCounts,
  platform: StrategyPlatformKey
) {
  const row = targets[platform];
  if (!row) return 0;
  return STRATEGY_SCOPES.reduce((sum, scope) => sum + (row[scope] ?? 0), 0);
}

export function targetsGrandTotal(targets: StrategyScopeCounts) {
  return STRATEGY_PLATFORM_KEYS.reduce(
    (sum, platform) => sum + platformTotal(targets, platform),
    0
  );
}

/** Sum two project-target maps (used when an Assets sheet has one row per language). */
export function addStrategyScopeCounts(
  left: StrategyScopeCounts,
  right: StrategyScopeCounts
): StrategyScopeCounts {
  let next = left;
  for (const platform of STRATEGY_PLATFORM_KEYS) {
    for (const scope of STRATEGY_SCOPES) {
      const extra = scopeCount(right, platform, scope);
      if (extra <= 0) continue;
      next = setScopeCount(
        next,
        platform,
        scope,
        scopeCount(next, platform, scope) + extra
      );
    }
  }
  return next;
}

export function setScopeCount(
  targets: StrategyScopeCounts,
  platform: StrategyPlatformKey,
  scope: StrategyAccountScope,
  value: number
): StrategyScopeCounts {
  const nextCount = Number.isFinite(value) && value > 0 ? Math.round(value) : 0;
  const current = { ...(targets[platform] ?? {}) };
  if (nextCount <= 0) {
    delete current[scope];
  } else {
    current[scope] = nextCount;
  }
  const next = { ...targets };
  if (Object.keys(current).length === 0) {
    delete next[platform];
  } else {
    next[platform] = current;
  }
  return next;
}

/** Write a combined platform total without inventing a Personal/Umbrella split. */
export function setPlatformTotal(
  targets: StrategyScopeCounts,
  platform: StrategyPlatformKey,
  value: number
): StrategyScopeCounts {
  const safe = Number.isFinite(value) && value > 0 ? Math.round(value) : 0;
  const personal = scopeCount(targets, platform, "personal");
  const umbrella = scopeCount(targets, platform, "umbrella");
  const native = scopeCount(targets, platform, "native");

  if (umbrella > 0 && personal === 0 && native === 0) {
    return setScopeCount(targets, platform, "umbrella", safe);
  }
  if (native > 0 && personal === 0 && umbrella === 0) {
    return setScopeCount(targets, platform, "native", safe);
  }

  const keptUmbrella = Math.min(umbrella, safe);
  let next = setScopeCount(targets, platform, "umbrella", keptUmbrella);
  next = setScopeCount(next, platform, "personal", safe - keptUmbrella);
  return next;
}

export function handlerFieldValue(
  targets: StrategyScopeCounts,
  field: StrategyHandlerField
) {
  if (field.scope === "all") return platformTotal(targets, field.platform);
  return scopeCount(targets, field.platform, field.scope);
}

export function setHandlerFieldValue(
  targets: StrategyScopeCounts,
  field: StrategyHandlerField,
  value: number
) {
  if (field.scope === "all") {
    return setPlatformTotal(targets, field.platform, value);
  }
  return setScopeCount(targets, field.platform, field.scope, value);
}

export function parseStrategyPlatformKey(raw: string): StrategyPlatformKey | null {
  const normalized = raw.trim().toLowerCase().replace(/[\s._-]+/g, "");
  if (normalized in PLATFORM_ALIASES) {
    return PLATFORM_ALIASES[normalized];
  }
  return null;
}

export function isStrategyPlatformKey(value: string): value is StrategyPlatformKey {
  return (STRATEGY_PLATFORM_KEYS as readonly string[]).includes(value);
}

export function normalizeStrategyTargets(value: unknown): StrategyScopeCounts {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const targets: StrategyScopeCounts = {};
  for (const [platformRaw, scopesRaw] of Object.entries(value)) {
    const platform = parseStrategyPlatformKey(platformRaw);
    if (!platform || !scopesRaw || typeof scopesRaw !== "object") continue;
    const scopes = scopesRaw as Record<string, unknown>;
    const row: Partial<Record<StrategyAccountScope, number>> = {};
    for (const scope of STRATEGY_SCOPES) {
      const count = Number(scopes[scope] ?? 0);
      if (Number.isFinite(count) && count > 0) row[scope] = Math.round(count);
    }
    if (Object.keys(row).length > 0) targets[platform] = row;
  }
  return targets;
}

export function handlerSeatFromTargets(
  targets: StrategyScopeCounts
): AdminCountrySeatQuota {
  const extraPlatforms: AlphaaExtraPlatformCounts = {};
  let extraTotal = 0;
  for (const platform of ALPHAA_EXTRA_PLATFORM_KEYS) {
    const total = platformTotal(targets, platform);
    if (total > 0) extraPlatforms[platform] = total;
    extraTotal += total;
  }

  const x = platformTotal(targets, "twitter");
  const facebookPersonal = scopeCount(targets, "facebook", "personal");
  const facebookUmbrella =
    scopeCount(targets, "facebook", "umbrella") +
    scopeCount(targets, "facebook", "native");
  const instagram = platformTotal(targets, "instagram");
  const tiktok = platformTotal(targets, "tiktok");

  return {
    x,
    facebookPersonal,
    facebookUmbrella,
    instagram,
    tiktok,
    extraPlatforms,
    totalAccounts:
      x + facebookPersonal + facebookUmbrella + instagram + tiktok + extraTotal,
  };
}

export function adminCountryPlanFromTargets(input: {
  country: string;
  language: string;
  resources: number;
  totalAccounts: number;
  projectTargets: StrategyScopeCounts;
  handlerTargets: StrategyScopeCounts;
}): AdminCountryPlan {
  const extraPlatforms: AlphaaExtraPlatformCounts = {};
  for (const platform of ALPHAA_EXTRA_PLATFORM_KEYS) {
    const total = platformTotal(input.projectTargets, platform);
    if (total > 0) extraPlatforms[platform] = total;
  }

  const handlerSeat = handlerSeatFromTargets(input.handlerTargets);
  const hasHandlerTemplate = handlerSeat.totalAccounts > 0;

  return {
    country: input.country,
    language: input.language,
    resources: input.resources,
    xPersonal: scopeCount(input.projectTargets, "twitter", "personal"),
    xUmbrella:
      scopeCount(input.projectTargets, "twitter", "umbrella") +
      scopeCount(input.projectTargets, "twitter", "native"),
    facebookPersonal: scopeCount(input.projectTargets, "facebook", "personal"),
    facebookUmbrella:
      scopeCount(input.projectTargets, "facebook", "umbrella") +
      scopeCount(input.projectTargets, "facebook", "native"),
    instagram: platformTotal(input.projectTargets, "instagram"),
    tiktok: platformTotal(input.projectTargets, "tiktok"),
    extraPlatforms:
      Object.keys(extraPlatforms).length > 0 ? extraPlatforms : undefined,
    totalAccounts: input.totalAccounts,
    handlerSeat: hasHandlerTemplate ? handlerSeat : undefined,
  };
}

export function platformsUsedInRows(
  rows: { projectTargets: StrategyScopeCounts; handlerTargets: StrategyScopeCounts }[]
): StrategyPlatformKey[] {
  const used = new Set<StrategyPlatformKey>();
  for (const row of rows) {
    for (const platform of STRATEGY_PLATFORM_KEYS) {
      if (
        platformTotal(row.projectTargets, platform) > 0 ||
        platformTotal(row.handlerTargets, platform) > 0
      ) {
        used.add(platform);
      }
    }
  }
  const core: StrategyPlatformKey[] = ["twitter", "facebook", "instagram", "tiktok"];
  return [
    ...core,
    ...STRATEGY_PLATFORM_KEYS.filter((platform) => used.has(platform) && !core.includes(platform)),
  ];
}
