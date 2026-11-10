"use server";

import { revalidatePath } from "next/cache";
import { pool, queryOne } from "@/lib/db";
import { requireManagerPermission } from "@/lib/manager-permissions";
import {
  assertManagerCanEditEmployee,
  assertManagerCanSpareAccount,
} from "@/lib/manager-data";
import { setAlphaaSocialAccountSpareRow } from "@/lib/admin-alphaa-mutate";
import { normalizeSocialAccountInput } from "@/lib/account-scope";
import { publicAdminMutationError } from "@/lib/admin-action-error";
import {
  uniqueAccountUrlError,
  validateSocialAccountInput,
} from "@/lib/social-account-validation";
import { logOrbitAction } from "@/lib/orbit-log";
import { MAIN_PROJECT_LABEL } from "@/lib/project-labels";
import type {
  AdminAccountMutationResult,
  AdminEmployeeSource,
  AdminSocialAccountInput,
} from "@/types/admin";

function revalidateManagerAccounts(userId: number) {
  revalidatePath("/manager");
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  revalidatePath("/admin/employees");
  revalidatePath(`/admin/employees/${userId}`);
}

/** CM adds one account by hand for an employee on their team. */
export async function createManagerSocialAccount(
  userId: number,
  payload: AdminSocialAccountInput,
): Promise<AdminAccountMutationResult> {
  try {
    const managerId = await requireManagerPermission(
      "manager_team",
      "canCreate",
    );
    if (!Number.isFinite(userId)) return { error: "Invalid employee." };
    const allowed = await assertManagerCanEditEmployee(managerId, userId);
    if (!allowed) return { error: "You can only add accounts for your team." };
    const checked = validateSocialAccountInput(payload);
    if ("error" in checked) return checked;
    const data = normalizeSocialAccountInput(checked.data);

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
      ],
    );
    revalidateManagerAccounts(userId);
    await logOrbitAction({
      action: "create",
      resource: "account",
      summary: `Manager added a ${data.platform} account for employee #${userId}`,
      details: { userId, platform: data.platform, username: data.username },
    });
    return {};
  } catch (error) {
    return { error: uniqueAccountUrlError(error) };
  }
}

export async function updateManagerSocialAccount(
  accountId: number,
  payload: AdminSocialAccountInput,
): Promise<AdminAccountMutationResult> {
  try {
    const managerId = await requireManagerPermission(
      "manager_team",
      "canUpdate",
    );
    if (!Number.isFinite(accountId)) return { error: "Invalid account." };
    const checked = validateSocialAccountInput(payload);
    if ("error" in checked) return checked;
    const data = normalizeSocialAccountInput(checked.data);

    const existing = await queryOne<{ id: number; user_id: number }>(
      `SELECT id, user_id FROM temp_social_media_accounts WHERE id = $1`,
      [accountId],
    );
    if (!existing) return { error: "Account not found." };

    const allowed = await assertManagerCanEditEmployee(
      managerId,
      existing.user_id,
    );
    if (!allowed) return { error: "You cannot edit this account." };

    let nextUserId = existing.user_id;
    if (data.holderUserId != null && data.holderUserId !== existing.user_id) {
      const canMove = await assertManagerCanEditEmployee(
        managerId,
        data.holderUserId,
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
              status = $13,
              account_scope = $14
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
        data.accountScope,
      ],
    );
    revalidateManagerAccounts(existing.user_id);
    if (nextUserId !== existing.user_id) {
      revalidateManagerAccounts(nextUserId);
    }
    await logOrbitAction({
      action: "update",
      resource: "account",
      summary: `Manager updated ${data.platform} account #${accountId}`,
      details: {
        accountId,
        userId: nextUserId,
        platform: data.platform,
        username: data.username,
      },
    });
    return {};
  } catch (error) {
    return { error: uniqueAccountUrlError(error) };
  }
}

export async function deleteManagerSocialAccount(
  accountId: number,
): Promise<AdminAccountMutationResult> {
  try {
    const managerId = await requireManagerPermission(
      "manager_team",
      "canDelete",
    );
    if (!Number.isFinite(accountId)) return { error: "Invalid account." };
    const existing = await queryOne<{ user_id: number }>(
      `SELECT user_id FROM temp_social_media_accounts WHERE id = $1`,
      [accountId],
    );
    if (!existing) return { error: "Account not found." };

    const allowed = await assertManagerCanEditEmployee(
      managerId,
      existing.user_id,
    );
    if (!allowed) return { error: "You cannot delete this account." };

    await pool.query(`DELETE FROM temp_social_media_accounts WHERE id = $1`, [
      accountId,
    ]);
    revalidateManagerAccounts(existing.user_id);
    await logOrbitAction({
      action: "delete",
      resource: "account",
      summary: `Manager deleted account #${accountId}`,
      details: { accountId, userId: existing.user_id },
    });
    return {};
  } catch (error) {
    return { error: publicAdminMutationError(error) };
  }
}

export async function setManagerSocialAccountSpare(
  accountId: number,
  isSpare: boolean,
  source: AdminEmployeeSource = "temp",
): Promise<AdminAccountMutationResult> {
  try {
    const managerId = await requireManagerPermission(
      "manager_spare",
      "canUpdate",
    );
    if (!Number.isFinite(accountId)) return { error: "Invalid account." };
    const allowed = await assertManagerCanSpareAccount(
      managerId,
      accountId,
      source,
    );
    if (!allowed) {
      return { error: "You can only mark spare accounts in your countries." };
    }

    if (source === "alphaa") {
      const existing = await queryOne<{ user_id: number }>(
        `SELECT user_id FROM temp_social_media_accounts WHERE id = $1`,
        [accountId],
      );
      const result = await setAlphaaSocialAccountSpareRow(accountId, isSpare);
      if (!result.error) {
        revalidateManagerAccounts(existing?.user_id ?? 0);
        await logOrbitAction({
          action: "spare",
          resource: "account",
          summary: isSpare
            ? `Manager marked ${MAIN_PROJECT_LABEL} account #${accountId} as spare`
            : `Manager unmarked ${MAIN_PROJECT_LABEL} account #${accountId} as spare`,
          details: { accountId, userId: existing?.user_id, isSpare, source },
        });
      }
      return result;
    }

    const existing = await queryOne<{ user_id: number }>(
      `SELECT user_id FROM temp_social_media_accounts WHERE id = $1`,
      [accountId],
    );
    if (!existing) return { error: "Account not found." };

    await pool.query(
      `UPDATE temp_social_media_accounts SET is_spare = $2 WHERE id = $1`,
      [accountId, isSpare],
    );
    revalidateManagerAccounts(existing.user_id);
    await logOrbitAction({
      action: "spare",
      resource: "account",
      summary: isSpare
        ? `Manager marked account #${accountId} as spare`
        : `Manager unmarked account #${accountId} as spare`,
      details: { accountId, userId: existing.user_id, isSpare, source },
    });
    return {};
  } catch (error) {
    return { error: publicAdminMutationError(error) };
  }
}
