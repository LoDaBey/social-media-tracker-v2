import {
  ALPHAA_EXTRA_PLATFORM_KEYS,
  ALPHAA_EXTRA_PLATFORM_LABELS,
} from "@/lib/alphaa-coverage-platforms";
import { PLATFORM_LABELS, PLATFORMS, type Platform } from "@/lib/platform-config";
import type { AlphaaExtraPlatformKey } from "@/types/admin";

export const EXTRACT_CORE_PLATFORMS: Platform[] = [...PLATFORMS];

export const EXTRACT_ALPHAA_EXTRA_PLATFORMS: AlphaaExtraPlatformKey[] = [
  ...ALPHAA_EXTRA_PLATFORM_KEYS,
];

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
