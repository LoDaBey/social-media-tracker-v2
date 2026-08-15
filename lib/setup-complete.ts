import { PLATFORMS, type Platform } from "@/lib/platform-config";
import { isSetupCategory, isSetupProfileComplete } from "@/lib/setup-options";
import { accountsMeetTargets } from "@/lib/setup-facebook";
import type { TempSocialMediaAccount } from "@/types/db";

export type SetupCompleteTargets = Record<Platform, number>;

export function targetsFromCounts(row: {
  target_x_count: number;
  target_facebook_personal_count: number;
  target_facebook_umbrella_count: number;
  target_instagram_count: number;
  target_tiktok_count: number;
}): SetupCompleteTargets {
  return {
    x: row.target_x_count,
    facebook_personal: row.target_facebook_personal_count,
    facebook_umbrella: row.target_facebook_umbrella_count,
    instagram: row.target_instagram_count,
    tiktok: row.target_tiktok_count,
  };
}

export function groupAccountsByPlatform(
  accounts: TempSocialMediaAccount[]
): Record<Platform, TempSocialMediaAccount[]> {
  const grouped: Record<Platform, TempSocialMediaAccount[]> = {
    x: [],
    facebook_personal: [],
    facebook_umbrella: [],
    instagram: [],
    tiktok: [],
  };
  for (const a of accounts) grouped[a.platform].push(a);
  return grouped;
}

export function isEmployeeSetupComplete(input: {
  country: string | null | undefined;
  language: string | null | undefined;
  targets: SetupCompleteTargets;
  accountsByPlatform: Record<Platform, TempSocialMediaAccount[]>;
  setupNeedsReview?: boolean;
}): boolean {
  if (input.setupNeedsReview) return false;
  const counts: SetupCompleteTargets = {
    x: input.accountsByPlatform.x?.length ?? 0,
    facebook_personal: input.accountsByPlatform.facebook_personal?.length ?? 0,
    facebook_umbrella: input.accountsByPlatform.facebook_umbrella?.length ?? 0,
    instagram: input.accountsByPlatform.instagram?.length ?? 0,
    tiktok: input.accountsByPlatform.tiktok?.length ?? 0,
  };
  const hasAllExact = accountsMeetTargets(counts, input.targets);
  const hasProfile = isSetupProfileComplete({
    country: input.country,
    language: input.language,
  });
  const hasCategories = PLATFORMS.every((platform) =>
    (input.accountsByPlatform[platform] ?? []).every((account) =>
      isSetupCategory(account.category ?? "")
    )
  );
  return hasAllExact && hasProfile && hasCategories;
}

export function homePathForRole(
  role: string
): "/admin" | "/qc" | "/manager" | "/dashboard" {
  if (role === "admin") return "/admin";
  if (role === "team_lead") return "/qc";
  if (role === "manager") return "/manager";
  return "/dashboard";
}
