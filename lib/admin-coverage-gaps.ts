import {
  ALPHAA_EXTRA_PLATFORM_KEYS,
  ALPHAA_EXTRA_PLATFORM_LABELS,
} from "@/lib/alphaa-coverage-platforms";
import type { AdminCountryCoverageHolder } from "@/types/admin";

function shortfall(actual: number, target: number) {
  return Math.max(0, target - actual);
}

export function holderHasCoverageGap(holder: AdminCountryCoverageHolder) {
  const coreGap =
    holder.vacant ||
    holder.x.actual < holder.x.target ||
    holder.facebookPersonal.actual < holder.facebookPersonal.target ||
    holder.facebookUmbrella.actual < holder.facebookUmbrella.target ||
    holder.instagram.actual < holder.instagram.target ||
    holder.tiktok.actual < holder.tiktok.target;

  if (coreGap) return true;

  if (!holder.extraPlatforms) return false;

  return ALPHAA_EXTRA_PLATFORM_KEYS.some((platform) => {
    const count = holder.extraPlatforms?.[platform];
    if (!count || count.target <= 0) return false;
    return count.actual < count.target;
  });
}

export function holderGapSummary(holder: AdminCountryCoverageHolder) {
  if (holder.vacant) return "No employee in this planned seat.";

  const parts: string[] = [];
  const missingX = shortfall(holder.x.actual, holder.x.target);
  const missingFacebookPersonal = shortfall(
    holder.facebookPersonal.actual,
    holder.facebookPersonal.target
  );
  const missingFacebookUmbrella = shortfall(
    holder.facebookUmbrella.actual,
    holder.facebookUmbrella.target
  );
  const missingInstagram = shortfall(holder.instagram.actual, holder.instagram.target);
  const missingTiktok = shortfall(holder.tiktok.actual, holder.tiktok.target);

  if (missingX) parts.push(`X ${missingX} short`);
  if (missingFacebookPersonal) parts.push(`Facebook personal ${missingFacebookPersonal} short`);
  if (missingFacebookUmbrella) parts.push(`Facebook umbrella ${missingFacebookUmbrella} short`);
  if (missingInstagram) parts.push(`Instagram ${missingInstagram} short`);
  if (missingTiktok) parts.push(`TikTok ${missingTiktok} short`);

  if (holder.extraPlatforms) {
    for (const platform of ALPHAA_EXTRA_PLATFORM_KEYS) {
      const count = holder.extraPlatforms[platform];
      if (!count || count.target <= 0) continue;
      const missing = shortfall(count.actual, count.target);
      if (missing) {
        parts.push(`${ALPHAA_EXTRA_PLATFORM_LABELS[platform]} ${missing} short`);
      }
    }
  }

  return parts.length ? parts.join(" · ") : "On plan";
}
