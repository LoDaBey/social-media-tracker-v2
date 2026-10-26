import { ALPHAA_EXTRA_PLATFORM_KEYS } from "@/lib/alphaa-coverage-platforms";
import { platformTotal, scopeCount } from "@/lib/strategy-platforms";
import type { AlphaaExtraPlatformKey } from "@/types/admin";
import type {
  StrategyActualsSnapshot,
  StrategyCountryGaps,
  StrategyCountryRow,
  StrategyGapLine,
  StrategyHandlerGap,
  StrategyHolderSnapshot,
  StrategyPlatformKey,
  StrategyScopeCounts,
} from "@/types/strategy";

function extraActual(
  extra: Partial<Record<StrategyPlatformKey, number>> | undefined,
  platform: StrategyPlatformKey
) {
  if (platform === "twitter" || platform === "facebook" || platform === "instagram" || platform === "tiktok") {
    return 0;
  }
  return extra?.[platform] ?? 0;
}

function projectLines(
  targets: StrategyScopeCounts,
  actuals: StrategyActualsSnapshot
): StrategyGapLine[] {
  const lines: StrategyGapLine[] = [];

  const twitterPlanned = platformTotal(targets, "twitter");
  if (twitterPlanned > 0) {
    const missing = Math.max(0, twitterPlanned - actuals.x);
    lines.push({
      platform: "twitter",
      scope: "all",
      planned: twitterPlanned,
      actual: actuals.x,
      missing,
    });
  }

  const fbPersonal = scopeCount(targets, "facebook", "personal");
  if (fbPersonal > 0) {
    lines.push({
      platform: "facebook",
      scope: "personal",
      planned: fbPersonal,
      actual: actuals.facebookPersonal,
      missing: Math.max(0, fbPersonal - actuals.facebookPersonal),
    });
  }

  const fbUmbrella =
    scopeCount(targets, "facebook", "umbrella") +
    scopeCount(targets, "facebook", "native");
  if (fbUmbrella > 0) {
    lines.push({
      platform: "facebook",
      scope: "umbrella",
      planned: fbUmbrella,
      actual: actuals.facebookUmbrella,
      missing: Math.max(0, fbUmbrella - actuals.facebookUmbrella),
    });
  }

  const instagramPlanned = platformTotal(targets, "instagram");
  if (instagramPlanned > 0) {
    lines.push({
      platform: "instagram",
      scope: "all",
      planned: instagramPlanned,
      actual: actuals.instagram,
      missing: Math.max(0, instagramPlanned - actuals.instagram),
    });
  }

  const tiktokPlanned = platformTotal(targets, "tiktok");
  if (tiktokPlanned > 0) {
    lines.push({
      platform: "tiktok",
      scope: "all",
      planned: tiktokPlanned,
      actual: actuals.tiktok,
      missing: Math.max(0, tiktokPlanned - actuals.tiktok),
    });
  }

  for (const platform of ALPHAA_EXTRA_PLATFORM_KEYS as AlphaaExtraPlatformKey[]) {
    const planned = platformTotal(targets, platform);
    if (planned <= 0) continue;
    const actual = extraActual(actuals.extraPlatforms, platform);
    lines.push({
      platform,
      scope: "all",
      planned,
      actual,
      missing: Math.max(0, planned - actual),
    });
  }

  return lines.filter((line) => line.planned > 0);
}

function handlerLines(
  targets: StrategyScopeCounts,
  holder: StrategyHolderSnapshot
): StrategyGapLine[] {
  return projectLines(targets, {
    employees: 1,
    x: holder.x,
    facebookPersonal: holder.facebookPersonal,
    facebookUmbrella: holder.facebookUmbrella,
    instagram: holder.instagram,
    tiktok: holder.tiktok,
    extraPlatforms: holder.extraPlatforms,
  }).filter((line) => line.missing > 0 || line.planned > 0);
}

export function buildStrategyCountryGaps(
  row: StrategyCountryRow,
  actuals: StrategyActualsSnapshot | undefined,
  holders: StrategyHolderSnapshot[]
): StrategyCountryGaps {
  const emptyActuals: StrategyActualsSnapshot = {
    employees: 0,
    x: 0,
    facebookPersonal: 0,
    facebookUmbrella: 0,
    instagram: 0,
    tiktok: 0,
    extraPlatforms: {},
  };
  const snapshot = actuals ?? emptyActuals;

  const project = {
    country: row.country,
    totalPlanned: row.totalAccounts,
    lines: projectLines(row.projectTargets, snapshot).filter(
      (line) => line.missing > 0
    ),
  };

  const handlerGaps: StrategyHandlerGap[] = holders.map((holder) => ({
    id: holder.id,
    fullName: holder.fullName,
    vacant: false,
    lines: handlerLines(row.handlerTargets, holder).filter((line) => line.missing > 0),
  }));

  const filled = holders.length;
  const vacantCount = Math.max(0, row.resources - filled);
  for (let index = 0; index < vacantCount; index += 1) {
    const vacantActuals: StrategyHolderSnapshot = {
      id: -1 * (index + 1),
      fullName: `Unfilled resource ${index + 1}`,
      x: 0,
      facebookPersonal: 0,
      facebookUmbrella: 0,
      instagram: 0,
      tiktok: 0,
      extraPlatforms: {},
    };
    handlerGaps.push({
      id: null,
      fullName: vacantActuals.fullName,
      vacant: true,
      lines: handlerLines(row.handlerTargets, vacantActuals).filter(
        (line) => line.missing > 0
      ),
    });
  }

  return {
    project,
    handlers: handlerGaps.filter((handler) => handler.vacant || handler.lines.length > 0),
  };
}

