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
 * Personal and Umbrella are separate assigned slots.
 * 1 personal + 1 umbrella means 2 Facebook accounts.
 */
export function facebookRequiredTarget(targets: Record<Platform, number>) {
  return (
    (targets.facebook_personal ?? 0) + (targets.facebook_umbrella ?? 0)
  );
}

export function facebookAssignedCount(counts: Record<Platform, number>) {
  return (
    (counts.facebook_personal ?? 0) + (counts.facebook_umbrella ?? 0)
  );
}

export function totalAssignedAccountTarget(targets: Record<Platform, number>) {
  return PLATFORMS.reduce(
    (sum, platform) => sum + (targets[platform] ?? 0),
    0
  );
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
