import type { AdminCountryCoverageHolder } from "@/types/admin";

function shortfall(actual: number, target: number) {
  return Math.max(0, target - actual);
}

export function holderHasCoverageGap(holder: AdminCountryCoverageHolder) {
  return (
    holder.vacant ||
    holder.x.actual < holder.x.target ||
    holder.facebookPersonal.actual < holder.facebookPersonal.target ||
    holder.facebookUmbrella.actual < holder.facebookUmbrella.target ||
    holder.instagram.actual < holder.instagram.target ||
    holder.tiktok.actual < holder.tiktok.target
  );
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

  return parts.length ? parts.join(" · ") : "On plan";
}
