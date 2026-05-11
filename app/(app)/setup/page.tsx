import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { query, queryOne } from "@/lib/db";
import type { TempSocialMediaAccount, TempUser } from "@/types/db";
import { SetupForm } from "@/components/setup/SetupForm";
import { PLATFORMS, type Platform } from "@/lib/platform-config";

type UserTargetsRow = Pick<
  TempUser,
  | "id"
  | "target_x_count"
  | "target_facebook_personal_count"
  | "target_facebook_umbrella_count"
  | "target_instagram_count"
  | "target_tiktok_count"
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

export default async function SetupPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const userId = Number(session.user.id);
  if (!Number.isFinite(userId)) redirect("/login");

  const user = await queryOne<UserTargetsRow>(
    `SELECT id,
            target_x_count,
            target_facebook_personal_count,
            target_facebook_umbrella_count,
            target_instagram_count,
            target_tiktok_count
     FROM temp_users
     WHERE id = $1`,
    [userId]
  );
  if (!user) redirect("/login");

  const targets = targetsFromUser(user);
  const assignedPlatforms = PLATFORMS.filter((p) => targets[p] > 0);
  if (assignedPlatforms.length === 0) redirect("/dashboard");

  const existingAccounts = await query<TempSocialMediaAccount>(
    `SELECT *
     FROM temp_social_media_accounts
     WHERE user_id = $1
     ORDER BY platform ASC, id ASC`,
    [userId]
  );

  const existingByPlatform = groupAccounts(existingAccounts);

  const hasAllExact = assignedPlatforms.every(
    (p) => (existingByPlatform[p]?.length ?? 0) === targets[p]
  );
  if (hasAllExact) redirect("/dashboard");

  return (
    <main className="w-full">
      <SetupForm
        userId={userId}
        targets={targets}
        existingByPlatform={existingByPlatform}
      />
    </main>
  );
}

