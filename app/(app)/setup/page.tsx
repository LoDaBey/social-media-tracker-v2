import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { query, queryOne } from "@/lib/db";
import type { Role, TempSocialMediaAccount, TempUser } from "@/types/db";
import { SetupForm } from "@/components/setup/SetupForm";
import { PLATFORMS, type Platform } from "@/lib/platform-config";
import { isSetupCategory, isSetupProfileComplete } from "@/lib/setup-options";

type UserTargetsRow = Pick<
  TempUser,
  | "id"
  | "full_name"
  | "target_x_count"
  | "target_facebook_personal_count"
  | "target_facebook_umbrella_count"
  | "target_instagram_count"
  | "target_tiktok_count"
  | "country"
  | "language"
>;

function targetsFromUser(u: UserTargetsRow): Record<Platform, number> {
  return {
    x: u.target_x_count,
    facebook_personal: u.target_facebook_personal_count,
    facebook_umbrella: u.target_facebook_umbrella_count,
    instagram: u.target_instagram_count,
    tiktok: u.target_tiktok_count,
  };
}

function groupAccounts(accounts: TempSocialMediaAccount[]) {
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

function accountsHaveCategories(
  assignedPlatforms: Platform[],
  existingByPlatform: Record<Platform, TempSocialMediaAccount[]>
) {
  return assignedPlatforms.every((platform) =>
    (existingByPlatform[platform] ?? []).every((account) =>
      isSetupCategory(account.category ?? "")
    )
  );
}

export default async function SetupPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = (session.user.role ?? "employee") as Role;
  if (role === "admin") redirect("/admin");
  if (role === "team_lead") redirect("/qc");

  const userId = Number(session.user.id);
  if (!Number.isFinite(userId)) redirect("/login");

  const user = await queryOne<UserTargetsRow>(
    `SELECT id,
            full_name,
            target_x_count,
            target_facebook_personal_count,
            target_facebook_umbrella_count,
            target_instagram_count,
            target_tiktok_count,
            country,
            language
     FROM temp_users
     WHERE id = $1`,
    [userId]
  );
  if (!user) redirect("/login");

  const targets = targetsFromUser(user);
  const assignedPlatforms = PLATFORMS.filter((p) => targets[p] > 0);

  const existingAccounts = await query<TempSocialMediaAccount>(
    `SELECT *
     FROM temp_social_media_accounts
     WHERE user_id = $1
       AND status = 'active'
     ORDER BY platform ASC, id ASC`,
    [userId]
  );

  const existingByPlatform = groupAccounts(existingAccounts);

  const hasAllExact = assignedPlatforms.every(
    (p) => (existingByPlatform[p]?.length ?? 0) === targets[p]
  );
  const hasProfile = isSetupProfileComplete(user);
  const hasCategories = accountsHaveCategories(assignedPlatforms, existingByPlatform);
  if (hasAllExact && hasProfile && hasCategories) redirect("/dashboard");

  return (
    <main className="w-full">
      <SetupForm
        userId={userId}
        fullName={user.full_name}
        targets={targets}
        existingByPlatform={existingByPlatform}
        initialProfile={{
          country: user.country ?? "",
          language: user.language ?? "",
        }}
      />
    </main>
  );
}

