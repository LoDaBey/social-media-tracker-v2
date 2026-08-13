"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { pool, query, queryOne } from "@/lib/db";
import { assertManagerCanEditEmployee } from "@/lib/manager-data";
import {
  groupAccountsByPlatform,
  targetsFromCounts,
} from "@/lib/setup-complete";
import type { Platform } from "@/lib/platform-config";
import { SETUP_REGION, isSetupCountry } from "@/lib/setup-options";
import {
  isPlatformAccountUrl,
  isValidAccountEmail,
  isValidAccountUrl,
  platformUrlErrorMessage,
} from "@/lib/setup-validation";
import { setupSavePayloadSchema } from "@/lib/setup-schema";
import { accountsMeetTargets } from "@/lib/setup-facebook";
import type { SetupSaveAccountInput } from "@/types/setup";
import type { TempSocialMediaAccount, TempUser } from "@/types/db";

export type ManagerEmployeeSetupBundle = {
  employee: {
    id: number;
    full_name: string;
    email: string;
    country: string;
    language: string | null;
    targets: Record<Platform, number>;
  };
  existingByPlatform: Record<Platform, TempSocialMediaAccount[]>;
};

export async function getManagerEmployeeSetupBundle(
  employeeId: number
): Promise<ManagerEmployeeSetupBundle | null> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "manager") return null;
  const managerId = Number(session.user.id);
  if (!Number.isFinite(managerId) || !Number.isFinite(employeeId)) return null;

  const allowed = await assertManagerCanEditEmployee(managerId, employeeId);
  if (!allowed) return null;

  const user = await queryOne<
    Pick<
      TempUser,
      | "id"
      | "full_name"
      | "email"
      | "country"
      | "language"
      | "target_x_count"
      | "target_facebook_personal_count"
      | "target_facebook_umbrella_count"
      | "target_instagram_count"
      | "target_tiktok_count"
    >
  >(
    `SELECT id, full_name, email, country, language,
            target_x_count, target_facebook_personal_count, target_facebook_umbrella_count,
            target_instagram_count, target_tiktok_count
       FROM temp_users
      WHERE id = $1`,
    [employeeId]
  );
  if (!user || !user.country) return null;

  const accounts = await query<TempSocialMediaAccount>(
    `SELECT *
       FROM temp_social_media_accounts
      WHERE user_id = $1 AND status = 'active'
      ORDER BY platform ASC, id ASC`,
    [employeeId]
  );

  return {
    employee: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      country: user.country,
      language: user.language,
      targets: targetsFromCounts(user),
    },
    existingByPlatform: groupAccountsByPlatform(accounts),
  };
}

function accountUrlKey(account: Pick<SetupSaveAccountInput, "platform" | "url">) {
  return `${account.platform}:${account.url.trim().replace(/\/+$/, "").toLowerCase()}`;
}

function hasDuplicateAccountUrl(accounts: SetupSaveAccountInput[]) {
  const seen = new Set<string>();
  for (const account of accounts) {
    const key = accountUrlKey(account);
    if (seen.has(key)) return true;
    seen.add(key);
  }
  return false;
}

function countByPlatform(accounts: SetupSaveAccountInput[]) {
  const counts: Record<Platform, number> = {
    x: 0,
    facebook_personal: 0,
    facebook_umbrella: 0,
    instagram: 0,
    tiktok: 0,
  };
  for (const a of accounts) counts[a.platform] += 1;
  return counts;
}

export async function saveEmployeeAccountsAsManager(input: {
  employeeId: number;
  language: string;
  accounts: SetupSaveAccountInput[];
}): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "manager") {
    return { error: "Unauthorized — manager only." };
  }
  const managerId = Number(session.user.id);
  if (!Number.isFinite(managerId) || !Number.isFinite(input.employeeId)) {
    return { error: "Invalid session." };
  }

  const allowed = await assertManagerCanEditEmployee(managerId, input.employeeId);
  if (!allowed) {
    return { error: "You cannot edit this account holder." };
  }

  const languageParsed = setupSavePayloadSchema.shape.language.safeParse(
    input.language
  );
  if (!languageParsed.success) {
    return { error: "Select a valid language." };
  }

  const accountsParsed = setupSavePayloadSchema.shape.accounts.safeParse(
    input.accounts
  );
  if (!accountsParsed.success) {
    return { error: "Please review the form and try again." };
  }

  const user = await queryOne<
    Pick<
      TempUser,
      | "id"
      | "country"
      | "target_x_count"
      | "target_facebook_personal_count"
      | "target_facebook_umbrella_count"
      | "target_instagram_count"
      | "target_tiktok_count"
    >
  >(
    `SELECT id,
            country,
            target_x_count,
            target_facebook_personal_count,
            target_facebook_umbrella_count,
            target_instagram_count,
            target_tiktok_count
       FROM temp_users
      WHERE id = $1`,
    [input.employeeId]
  );
  if (!user) return { error: "Employee not found." };

  const assignedCountry = user.country?.trim() ?? "";
  if (!isSetupCountry(assignedCountry)) {
    return { error: "Ask an admin to assign this employee a country first." };
  }

  const accounts: SetupSaveAccountInput[] = accountsParsed.data.map((a) => ({
    platform: a.platform,
    accountHolder: a.accountHolder.trim(),
    url: a.url.trim(),
    category: a.category.trim(),
    username: a.username.trim(),
    email: a.email.trim(),
    accountPassword: a.accountPassword,
    emailPassword: a.emailPassword,
    mobileNumber: a.mobileNumber.trim(),
  }));

  for (const a of accounts) {
    if (!a.accountHolder) return { error: "Each account must have an account holder." };
    if (!isValidAccountUrl(a.url)) {
      return { error: "Each account must have a valid http(s) URL." };
    }
    if (!isPlatformAccountUrl(a.platform, a.url)) {
      return { error: platformUrlErrorMessage(a.platform) };
    }
    if (!a.category) return { error: "Each account must have a category." };
    if (!a.username) return { error: "Each account must have a username." };
    if (!isValidAccountEmail(a.email)) return { error: "Each account must have a valid email." };
    if (!a.accountPassword) return { error: "Each account must have an account password." };
    if (!a.emailPassword) return { error: "Each account must have an email password." };
    if (!a.mobileNumber) return { error: "Each account must have a mobile number." };
  }
  if (hasDuplicateAccountUrl(accounts)) {
    return { error: "You used the same account URL twice. Please change one." };
  }

  const targets: Record<Platform, number> = {
    x: user.target_x_count,
    facebook_personal: user.target_facebook_personal_count,
    facebook_umbrella: user.target_facebook_umbrella_count,
    instagram: user.target_instagram_count,
    tiktok: user.target_tiktok_count,
  };

  const counts = countByPlatform(accounts);
  if (!accountsMeetTargets(counts, targets)) {
    return { error: "Add exactly the assigned number of accounts per platform." };
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `UPDATE temp_users
       SET region = $2,
           country = $3,
           language = $4
       WHERE id = $1`,
      [input.employeeId, SETUP_REGION, assignedCountry, languageParsed.data]
    );

    await client.query(
      "DELETE FROM temp_social_media_accounts WHERE user_id = $1",
      [input.employeeId]
    );

    const values: unknown[] = [];
    const rowsSql: string[] = [];

    accounts.forEach((a, idx) => {
      const base = idx * 14;
      const accountName = a.username.replace(/^@/, "");
      rowsSql.push(
        `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, $${base + 11}, $${base + 12}, $${base + 13}, $${base + 14})`
      );
      values.push(
        input.employeeId,
        a.platform,
        accountName,
        a.accountHolder,
        a.url,
        0,
        0,
        a.category,
        a.username,
        a.email,
        a.accountPassword,
        a.emailPassword,
        a.mobileNumber,
        "active"
      );
    });

    if (rowsSql.length) {
      await client.query(
        `INSERT INTO temp_social_media_accounts
          (user_id, platform, account_name, account_handle, account_url, starting_followers, current_followers, category, username, account_email, account_password, email_password, mobile_number, status)
         VALUES ${rowsSql.join(", ")}`,
        values
      );
    }

    await client.query("COMMIT");
  } catch {
    await client.query("ROLLBACK").catch(() => {});
    return { error: "Something went wrong. Please try again." };
  } finally {
    client.release();
  }

  revalidatePath("/manager");
  revalidatePath("/manager/setup");
  revalidatePath("/dashboard");
  return {};
}

