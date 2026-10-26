"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { pool, queryOne } from "@/lib/db";
import { publicAdminMutationError } from "@/lib/admin-action-error";
import { normalizeSocialAccountInput } from "@/lib/account-scope";
import {
  uniqueAccountUrlError,
  validateSocialAccountInput,
} from "@/lib/social-account-validation";
import {
  createAlphaaSocialAccountRow,
  deleteAlphaaSocialAccountRow,
  setAlphaaSocialAccountSpareRow,
  updateAlphaaSocialAccountRow,
} from "@/lib/admin-alphaa-mutate";
import type {
  AdminAccountMutationResult,
  AdminEmployeeSource,
  AdminSocialAccountInput,
} from "@/types/admin";

async function requireAdmin() {
  const session = await auth();
  const adminId = Number(session?.user?.id);
  const role = session?.user?.role;
  if (!Number.isFinite(adminId) || role !== "admin") {
    throw new Error("Unauthorized — admin only.");
  }
}

function revalidateAccounts(
  userId?: number,
  source: AdminEmployeeSource = "temp"
) {
  revalidatePath("/admin/employees");
  if (userId) {
    revalidatePath(
      source === "alphaa"
        ? `/admin/employees/alphaa/${userId}`
        : `/admin/employees/${userId}`
    );
  }
  revalidatePath("/manager");
  revalidatePath("/dashboard");
}

function withAlphaaEmailPassword(
  payload: AdminSocialAccountInput
): AdminSocialAccountInput {
  const emailPassword = payload.emailPassword.trim();
  if (emailPassword) return payload;
  return {
    ...payload,
    emailPassword: payload.accountPassword || "n/a",
  };
}

export async function createAdminSocialAccount(
  userId: number,
  payload: AdminSocialAccountInput,
  source: AdminEmployeeSource = "temp"
): Promise<AdminAccountMutationResult> {
  try {
    await requireAdmin();
    if (!Number.isFinite(userId)) return { error: "Invalid employee." };
    const checked = validateSocialAccountInput(
      source === "alphaa" ? withAlphaaEmailPassword(payload) : payload
    );
    if ("error" in checked) return checked;
    const data = normalizeSocialAccountInput(checked.data);
    if (source === "alphaa") {
      const result = await createAlphaaSocialAccountRow(userId, data);
      if (!result.error) revalidateAccounts(userId, source);
      return result;
    }

    const user = await queryOne<{ id: number }>(
      `SELECT id FROM temp_users WHERE id = $1 AND role = 'employee'`,
      [userId]
    );
    if (!user) return { error: "Employee not found." };

    const accountName = data.username.replace(/^@/, "");
    await pool.query(
      `INSERT INTO temp_social_media_accounts
        (user_id, platform, account_name, account_handle, account_url,
         starting_followers, current_followers, category, username,
         account_email, account_password, email_password, mobile_number, status,
         account_scope)
       VALUES ($1, $2, $3, $4, $5, 0, 0, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        userId,
        data.platform,
        accountName,
        data.accountHolder,
        data.url,
        data.category,
        data.username,
        data.email,
        data.accountPassword,
        data.emailPassword,
        data.mobileNumber,
        data.status ?? "active",
        data.accountScope,
      ]
    );
    revalidateAccounts(userId);
    return {};
  } catch (error) {
    return { error: uniqueAccountUrlError(error) };
  }
}

export async function updateAdminSocialAccount(
  accountId: number,
  payload: AdminSocialAccountInput,
  source: AdminEmployeeSource = "temp"
): Promise<AdminAccountMutationResult> {
  try {
    await requireAdmin();
    if (!Number.isFinite(accountId)) return { error: "Invalid account." };
    const checked = validateSocialAccountInput(
      source === "alphaa" ? withAlphaaEmailPassword(payload) : payload
    );
    if ("error" in checked) return checked;
    const data = normalizeSocialAccountInput(checked.data);
    if (source === "alphaa") {
      const existing = await queryOne<{ user_id: number }>(
        `SELECT user_id FROM social_media_accounts WHERE id = $1`,
        [accountId]
      );
      const result = await updateAlphaaSocialAccountRow(accountId, data);
      if (!result.error) revalidateAccounts(existing?.user_id, source);
      return result;
    }

    const existing = await queryOne<{ id: number; user_id: number }>(
      `SELECT id, user_id FROM temp_social_media_accounts WHERE id = $1`,
      [accountId]
    );
    if (!existing) return { error: "Account not found." };

    const accountName = data.username.replace(/^@/, "");
    await pool.query(
      `UPDATE temp_social_media_accounts
          SET platform = $2,
              account_name = $3,
              account_handle = $4,
              account_url = $5,
              category = $6,
              username = $7,
              account_email = $8,
              account_password = $9,
              email_password = $10,
              mobile_number = $11,
              status = $12,
              account_scope = $13
        WHERE id = $1`,
      [
        accountId,
        data.platform,
        accountName,
        data.accountHolder,
        data.url,
        data.category,
        data.username,
        data.email,
        data.accountPassword,
        data.emailPassword,
        data.mobileNumber,
        data.status ?? "active",
        data.accountScope,
      ]
    );
    revalidateAccounts(existing.user_id);
    return {};
  } catch (error) {
    return { error: uniqueAccountUrlError(error) };
  }
}

export async function deleteAdminSocialAccount(
  accountId: number,
  source: AdminEmployeeSource = "temp"
): Promise<AdminAccountMutationResult> {
  try {
    await requireAdmin();
    if (!Number.isFinite(accountId)) return { error: "Invalid account." };
    if (source === "alphaa") {
      const existing = await queryOne<{ user_id: number }>(
        `SELECT user_id FROM social_media_accounts WHERE id = $1`,
        [accountId]
      );
      const result = await deleteAlphaaSocialAccountRow(accountId);
      if (!result.error) revalidateAccounts(existing?.user_id, source);
      return result;
    }
    const existing = await queryOne<{ user_id: number }>(
      `SELECT user_id FROM temp_social_media_accounts WHERE id = $1`,
      [accountId]
    );
    if (!existing) return { error: "Account not found." };
    await pool.query(`DELETE FROM temp_social_media_accounts WHERE id = $1`, [
      accountId,
    ]);
    revalidateAccounts(existing.user_id);
    return {};
  } catch (error) {
    return { error: publicAdminMutationError(error) };
  }
}

/** Mark/unmark a temp or ALPHAA account as spare (excluded from plan KPIs). */
export async function setAdminSocialAccountSpare(
  accountId: number,
  isSpare: boolean,
  source: AdminEmployeeSource = "temp"
): Promise<AdminAccountMutationResult> {
  try {
    await requireAdmin();
    if (!Number.isFinite(accountId)) return { error: "Invalid account." };
    if (source === "alphaa") {
      const existing = await queryOne<{ user_id: number }>(
        `SELECT user_id FROM social_media_accounts WHERE id = $1`,
        [accountId]
      );
      const result = await setAlphaaSocialAccountSpareRow(accountId, isSpare);
      if (!result.error) {
        revalidateAccounts(existing?.user_id, source);
        revalidatePath("/admin");
      }
      return result;
    }

    const existing = await queryOne<{
      user_id: number;
      region: string | null;
    }>(
      `SELECT a.user_id, u.region
         FROM temp_social_media_accounts a
         INNER JOIN temp_users u ON u.id = a.user_id
        WHERE a.id = $1`,
      [accountId]
    );
    if (!existing) return { error: "Account not found." };

    const region = existing.region?.trim().toLowerCase() ?? "";
    if (region !== "africa" && region !== "europe" && region !== "balkan") {
      return {
        error: "Spare marking is only available for Africa and Europe accounts.",
      };
    }

    await pool.query(
      `UPDATE temp_social_media_accounts SET is_spare = $2 WHERE id = $1`,
      [accountId, isSpare]
    );
    revalidateAccounts(existing.user_id);
    revalidatePath("/admin");
    return {};
  } catch (error) {
    return { error: publicAdminMutationError(error) };
  }
}
