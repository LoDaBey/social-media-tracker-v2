import {
  ALPHAA_EXTRA_PLATFORM_KEYS,
  ALPHAA_EXTRA_PLATFORM_LABELS,
} from "@/lib/alphaa-coverage-platforms";
import { PLATFORM_LABELS, PLATFORMS, type Platform } from "@/lib/platform-config";
import type { AlphaaExtraPlatformKey, ExtractPlatformChip } from "@/types/admin";

export const EXTRACT_CORE_PLATFORMS: Platform[] = [...PLATFORMS];

export const EXTRACT_ALPHAA_EXTRA_PLATFORMS: AlphaaExtraPlatformKey[] = [
  ...ALPHAA_EXTRA_PLATFORM_KEYS,
];

const FACEBOOK_EXTRACT_PLATFORMS: string[] = [
  "facebook_personal",
  "facebook_umbrella",
];

export const EXTRACT_CORE_PLATFORM_CHIPS: ExtractPlatformChip[] = [
  { id: "x", label: "X", platforms: ["x"] },
  {
    id: "facebook",
    label: "Facebook",
    platforms: FACEBOOK_EXTRACT_PLATFORMS,
  },
  { id: "instagram", label: "Instagram", platforms: ["instagram"] },
  { id: "tiktok", label: "TikTok", platforms: ["tiktok"] },
];

export function extractPlatformChips(includeAlphaaExtras: boolean): ExtractPlatformChip[] {
  if (!includeAlphaaExtras) return EXTRACT_CORE_PLATFORM_CHIPS;
  return [
    ...EXTRACT_CORE_PLATFORM_CHIPS,
    ...EXTRACT_ALPHAA_EXTRA_PLATFORMS.map((platform) => ({
      id: platform,
      label: ALPHAA_EXTRA_PLATFORM_LABELS[platform],
      platforms: [platform],
    })),
  ];
}

export function extractChipIsActive(
  selected: string[],
  chip: ExtractPlatformChip
) {
  return chip.platforms.some((platform) => selected.includes(platform));
}

export function toggleExtractPlatformChip(
  selected: string[],
  chip: ExtractPlatformChip
): string[] {
  if (extractChipIsActive(selected, chip)) {
    return selected.filter((platform) => !chip.platforms.includes(platform));
  }
  const next = [...selected];
  for (const platform of chip.platforms) {
    if (!next.includes(platform)) next.push(platform);
  }
  return next;
}

const ALLOWED_EXTRACT_PLATFORMS = new Set<string>([
  ...PLATFORMS,
  ...ALPHAA_EXTRA_PLATFORM_KEYS,
]);

export function isExtractPlatform(value: string): boolean {
  return ALLOWED_EXTRACT_PLATFORMS.has(value);
}

export function extractPlatformLabel(platform: string): string {
  if (platform in PLATFORM_LABELS) {
    return PLATFORM_LABELS[platform as Platform];
  }
  if (platform in ALPHAA_EXTRA_PLATFORM_LABELS) {
    return ALPHAA_EXTRA_PLATFORM_LABELS[platform as AlphaaExtraPlatformKey];
  }
  return platform;
}

export function extractFilterPlatformLabel(platform: string): string {
  if (platform === "facebook_personal" || platform === "facebook_umbrella") {
    return "Facebook";
  }
  return extractPlatformLabel(platform);
}
