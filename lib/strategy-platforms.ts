import { ALPHAA_EXTRA_PLATFORM_KEYS } from "@/lib/alphaa-coverage-platforms";
import type {
  StrategyAccountScope,
  StrategyBook,
  StrategyGapLine,
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

export function strategyNeedsSentence(lines: StrategyGapLine[]): string {
  const parts = lines
    .filter((line) => line.missing > 0)
    .map((line) => {
      const scope =
        line.scope === "all" ? "" : ` ${STRATEGY_SCOPE_LABELS[line.scope]}`;
      return `${line.missing} ${STRATEGY_PLATFORM_SHORT_LABELS[line.platform]}${scope}`;
    });
  if (parts.length === 0) return "";
  return `Need ${parts.join(", ")}`;
}

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

export function strategySummaryPlatformsForBook(
  book: StrategyBook
): StrategyPlatformKey[] {
  return book === "alphaa" ? ALPHAA_SUMMARY_PLATFORMS : CORE_SUMMARY_PLATFORMS;
}

export function strategySheetGroupsForBook(
  book: StrategyBook
): StrategySheetGroup[] {
  return book === "alphaa" ? ALPHAA_SHEET_GROUPS : AFRICA_EUROPE_SHEET_GROUPS;
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
