import { PLATFORMS, type Platform } from "@/lib/platform-config";

export const FACEBOOK_PLATFORMS: Platform[] = [
  "facebook_personal",
  "facebook_umbrella",
];

export function isFacebookPlatform(platform: Platform) {
  return (
    platform === "facebook_personal" || platform === "facebook_umbrella"
  );
}

/**
 * Personal and Umbrella share one Facebook quota. Completing either type
 * counts. When both columns are set (e.g. 1 and 1), only the higher number
 * is required so one Facebook account is enough.
 */
export function facebookRequiredTarget(targets: Record<Platform, number>) {
  return Math.max(
    targets.facebook_personal ?? 0,
    targets.facebook_umbrella ?? 0
  );
}

export function facebookAssignedCount(counts: Record<Platform, number>) {
  return (
    (counts.facebook_personal ?? 0) + (counts.facebook_umbrella ?? 0)
  );
}

export function totalAssignedAccountTarget(targets: Record<Platform, number>) {
  const other = PLATFORMS.filter((platform) => !isFacebookPlatform(platform)).reduce(
    (sum, platform) => sum + (targets[platform] ?? 0),
    0
  );
  return other + facebookRequiredTarget(targets);
}

export function accountsMeetTargets(
  counts: Record<Platform, number>,
  targets: Record<Platform, number>
) {
  if (facebookAssignedCount(counts) !== facebookRequiredTarget(targets)) {
    return false;
  }

  for (const platform of PLATFORMS) {
    if (isFacebookPlatform(platform)) continue;
    if ((counts[platform] ?? 0) !== (targets[platform] ?? 0)) return false;
  }
  return true;
}
