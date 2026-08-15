"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { pool, queryOne } from "@/lib/db";
import { assertManagerCanEditEmployee } from "@/lib/manager-data";
import { publicAdminMutationError } from "@/lib/admin-action-error";
import {
  uniqueAccountUrlError,
  validateSocialAccountInput,
} from "@/lib/social-account-validation";
import type {
  AdminAccountMutationResult,
  AdminSocialAccountInput,
} from "@/types/admin";

async function requireManager() {
  const session = await auth();
  const managerId = Number(session?.user?.id);
  const role = session?.user?.role;
  if (!Number.isFinite(managerId) || role !== "manager") {
    throw new Error("Unauthorized — manager only.");
  }
  return managerId;
}

function revalidateManagerAccounts(userId: number) {
  revalidatePath("/manager");
  revalidatePath("/dashboard");
  revalidatePath("/admin/employees");
  revalidatePath(`/admin/employees/${userId}`);
}

export async function updateManagerSocialAccount(
  accountId: number,
  payload: AdminSocialAccountInput
): Promise<AdminAccountMutationResult> {
  try {
    const managerId = await requireManager();
    if (!Number.isFinite(accountId)) return { error: "Invalid account." };
    const checked = validateSocialAccountInput(payload);
    if ("error" in checked) return checked;
    const data = checked.data;

    const existing = await queryOne<{ id: number; user_id: number }>(
      `SELECT id, user_id FROM temp_social_media_accounts WHERE id = $1`,
      [accountId]
    );
    if (!existing) return { error: "Account not found." };

    const allowed = await assertManagerCanEditEmployee(
      managerId,
      existing.user_id
    );
    if (!allowed) return { error: "You cannot edit this account." };

    let nextUserId = existing.user_id;
    if (
      data.holderUserId != null &&
      data.holderUserId !== existing.user_id
    ) {
      const canMove = await assertManagerCanEditEmployee(
        managerId,
        data.holderUserId
      );
      if (!canMove) {
        return { error: "You cannot move this account to that person." };
      }
      nextUserId = data.holderUserId;
    }

    const accountName = data.username.replace(/^@/, "");
    await pool.query(
      `UPDATE temp_social_media_accounts
          SET user_id = $2,
              platform = $3,
              account_name = $4,
              account_handle = $5,
              account_url = $6,
              category = $7,
              username = $8,
              account_email = $9,
              account_password = $10,
              email_password = $11,
              mobile_number = $12,
              status = $13
        WHERE id = $1`,
      [
        accountId,
        nextUserId,
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
      ]
    );
    revalidateManagerAccounts(existing.user_id);
    if (nextUserId !== existing.user_id) {
      revalidateManagerAccounts(nextUserId);
    }
    return {};
  } catch (error) {
    return { error: uniqueAccountUrlError(error) };
  }
}

export async function deleteManagerSocialAccount(
  accountId: number
): Promise<AdminAccountMutationResult> {
  try {
    const managerId = await requireManager();
    if (!Number.isFinite(accountId)) return { error: "Invalid account." };
    const existing = await queryOne<{ user_id: number }>(
      `SELECT user_id FROM temp_social_media_accounts WHERE id = $1`,
      [accountId]
    );
    if (!existing) return { error: "Account not found." };

    const allowed = await assertManagerCanEditEmployee(
      managerId,
      existing.user_id
    );
    if (!allowed) return { error: "You cannot delete this account." };

    await pool.query(`DELETE FROM temp_social_media_accounts WHERE id = $1`, [
      accountId,
    ]);
    revalidateManagerAccounts(existing.user_id);
    return {};
  } catch (error) {
    return { error: publicAdminMutationError(error) };
  }
}
