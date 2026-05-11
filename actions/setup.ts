"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { pool, queryOne } from "@/lib/db";
import type { TempUser } from "@/types/db";
import type { Platform } from "@/lib/platform-config";

type SaveAccountInput = {
  platform: Platform;
  handle: string;
  url: string;
  followers: number;
};

const saveAccountSchema = z.object({
  platform: z.enum([
    "x",
    "facebook_personal",
    "facebook_umbrella",
    "instagram",
    "tiktok",
  ]),
  handle: z.string().min(1),
  url: z.string().min(1),
  followers: z.number().int().min(0),
});

const savePayloadSchema = z.object({
  accounts: z.array(saveAccountSchema),
});

function normalizeHandle(handle: string) {
  const trimmed = handle.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

function isValidUrl(value: string) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function countByPlatform(accounts: SaveAccountInput[]) {
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
    const parsed = savePayloadSchema.safeParse(json);
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

    const accounts: SaveAccountInput[] = parsed.data.accounts.map((a) => ({
      platform: a.platform,
      handle: normalizeHandle(a.handle),
      url: a.url.trim(),
      followers: a.followers,
    }));

    for (const a of accounts) {
      if (!a.handle) return { error: "Each account must have a handle." };
      if (!isValidUrl(a.url)) return { error: "Each account must have a valid URL." };
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
        "DELETE FROM temp_social_media_accounts WHERE user_id = $1",
        [userId]
      );

      const values: unknown[] = [];
      const rowsSql: string[] = [];

      accounts.forEach((a, idx) => {
        const base = idx * 8;
        const accountName = a.handle.replace(/^@/, "");
        rowsSql.push(
          `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8})`
        );
        values.push(
          userId,
          a.platform,
          accountName,
          a.handle,
          a.url,
          a.followers,
          a.followers,
          "active"
        );
      });

      if (rowsSql.length) {
        await client.query(
          `INSERT INTO temp_social_media_accounts
            (user_id, platform, account_name, account_handle, account_url, starting_followers, current_followers, status)
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

    redirect("/dashboard");
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

