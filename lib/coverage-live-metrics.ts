import {
  ALPHAA_EXTRA_PLATFORM_KEYS,
  ALPHAA_EXTRA_PLATFORM_LABELS,
} from "@/lib/alphaa-coverage-platforms";
import type {
  AdminCountryCoverageHolder,
  AdminCountryCoverageRow,
  AdminCoverageCount,
  CoverageLivePlatformMetric,
} from "@/types/admin";
import type { StrategyPlatformKey } from "@/types/strategy";

function scope(
  id: string,
  label: string,
  count: AdminCoverageCount,
  tone: CoverageLivePlatformMetric["scopes"][number]["tone"] = "default"
): CoverageLivePlatformMetric["scopes"][number] {
  return { id, label, count, tone };
}

function coreMetrics(source: {
  x: AdminCoverageCount;
  facebookPersonal: AdminCoverageCount;
  facebookUmbrella: AdminCoverageCount;
  instagram: AdminCoverageCount;
  tiktok: AdminCoverageCount;
}): CoverageLivePlatformMetric[] {
  return [
    {
      key: "x",
      platform: "twitter",
      label: "X",
      scopes: [scope("accounts", "Accounts", source.x, "personal")],
    },
    {
      key: "facebook",
      platform: "facebook",
      label: "Facebook",
      scopes: [
        scope("personal", "Personal", source.facebookPersonal, "personal"),
        scope("umbrella", "Umbrella", source.facebookUmbrella, "umbrella"),
      ],
    },
    {
      key: "instagram",
      platform: "instagram",
      label: "Instagram",
      scopes: [scope("accounts", "Accounts", source.instagram, "personal")],
    },
    {
      key: "tiktok",
      platform: "tiktok",
      label: "TikTok",
      scopes: [scope("accounts", "Accounts", source.tiktok, "native")],
    },
  ];
}

function extraMetrics(
  extra: AdminCountryCoverageRow["extraPlatforms"] | AdminCountryCoverageHolder["extraPlatforms"],
  showAlphaaPlatforms: boolean
): CoverageLivePlatformMetric[] {
  if (!showAlphaaPlatforms || !extra) return [];

  return ALPHAA_EXTRA_PLATFORM_KEYS.flatMap((platform) => {
    const count = extra[platform];
    if (!count || (count.target <= 0 && count.actual <= 0)) return [];
    return [
      {
        key: platform,
        platform: platform as StrategyPlatformKey,
        label: ALPHAA_EXTRA_PLATFORM_LABELS[platform],
        scopes: [scope("accounts", "Accounts", count, "native")],
      },
    ];
  });
}

export function coverageLiveMetricsFromRow(
  row: AdminCountryCoverageRow,
  showAlphaaPlatforms = false
): CoverageLivePlatformMetric[] {
  return [...coreMetrics(row), ...extraMetrics(row.extraPlatforms, showAlphaaPlatforms)];
}

export function coverageLiveMetricsFromHolder(
  holder: AdminCountryCoverageHolder,
  showAlphaaPlatforms = false
): CoverageLivePlatformMetric[] {
  return [
    ...coreMetrics(holder),
    ...extraMetrics(holder.extraPlatforms, showAlphaaPlatforms),
  ];
}

export function coverageMetricTotal(metric: CoverageLivePlatformMetric): AdminCoverageCount {
  return metric.scopes.reduce(
    (sum, item) => ({
      actual: sum.actual + item.count.actual,
      target: sum.target + item.count.target,
    }),
    { actual: 0, target: 0 }
  );
}

export function coverageMetricHasShortfall(metric: CoverageLivePlatformMetric) {
  return metric.scopes.some((item) => item.count.actual < item.count.target);
}
