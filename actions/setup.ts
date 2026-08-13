"use server";

import { redirect } from "next/navigation";
import { pool, queryOne } from "@/lib/db";
import type { TempUser } from "@/types/db";
import type { Platform } from "@/lib/platform-config";
import { SETUP_REGION } from "@/lib/setup-options";
import {
  isPlatformAccountUrl,
  isValidAccountEmail,
  isValidAccountUrl,
  platformUrlErrorMessage,
} from "@/lib/setup-validation";
import { setupSavePayloadSchema } from "@/lib/setup-schema";
import type { SetupSaveAccountInput } from "@/types/setup";

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

export async function saveAccountsAction(formData: FormData) {
  try {
    const raw = String(formData.get("accounts") ?? "");
    const json = JSON.parse(raw);
    const parsed = setupSavePayloadSchema.safeParse(json);
    if (!parsed.success) return { error: "Please review the form and try again." };

    const sessionUserIdRaw = String(formData.get("userId") ?? "");
    const userId = Number(sessionUserIdRaw);
    if (!Number.isFinite(userId)) return { error: "Invalid session. Please sign in again." };

    const user = await queryOne<
      Pick<
        TempUser,
        | "id"
        | "target_x_count"
        | "target_facebook_personal_count"
        | "target_facebook_umbrella_count"
        | "target_instagram_count"
        | "target_tiktok_count"
      >
    >(
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
    if (!user) return { error: "User not found." };

    const accounts: SetupSaveAccountInput[] = parsed.data.accounts.map((a) => ({
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
    for (const platform of Object.keys(targets) as Platform[]) {
      const target = targets[platform];
      if (target === 0) {
        if (counts[platform] !== 0) {
          return { error: "You added accounts for a platform that is not assigned to you." };
        }
        continue;
      }
      if (counts[platform] !== target) {
        return { error: "Please add exactly the assigned number of accounts per platform." };
      }
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
        [userId, SETUP_REGION, parsed.data.country, parsed.data.language]
      );

      await client.query(
        "DELETE FROM temp_social_media_accounts WHERE user_id = $1",
        [userId]
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
          userId,
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
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch {
    return { error: "Something went wrong. Please try again." };
  }

  redirect("/dashboard");
}
