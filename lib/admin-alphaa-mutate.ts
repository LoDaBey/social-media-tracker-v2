/*
 * Edits for Main (ALPHAA) holders and accounts.
 * Main holders are temp_users with region = 'Alphaa'; their accounts are in
 * temp_social_media_accounts. Nothing here touches the old Alpha tables.
 * Person edits (profile / active / delete) stay limited to region 'Alphaa'.
 * Single-account edits also accept people who are additionally Main handlers
 * (main_country set), so their Main accounts can be managed from Main screens.
 */
import { pool, queryOne } from "@/lib/db";
import { ALPHAA_REGION_WHERE } from "@/lib/alphaa-platform-sql";
import { mapAlphaaRole } from "@/lib/admin-alphaa-roles";
import { uniqueAccountUrlError } from "@/lib/social-account-validation";
import { baseCountryFromDisplay } from "@/lib/overview-country-display";
import { publicAdminMutationError } from "@/lib/admin-action-error";
import type {
  AdminAccountMutationResult,
  AdminSocialAccountInput,
  UpdateAlphaaEmployeePayload,
} from "@/types/admin";

const ALPHAA_ROLES = ["Handler", "Team Leader", "Manager", "Admin", "OP", "HR", "QC"] as const;

export function normalizeAlphaaRoleLabel(roleLabel: string) {
  const trimmed = roleLabel.trim();
  const match = ALPHAA_ROLES.find(
    (role) => role.toLowerCase() === trimmed.toLowerCase()
  );
  return match ?? null;
}

async function alphaaHolderExists(userId: number) {
  const row = await queryOne<{ id: number }>(
    `SELECT id FROM temp_users WHERE id = $1 AND region = 'Alphaa'`,
    [userId]
  );
  return Boolean(row);
}

export async function updateAlphaaEmployeeRow(
  userId: number,
  payload: UpdateAlphaaEmployeePayload
): Promise<void> {
  const fullName = payload.fullName.trim();
  const email = payload.email.trim().toLowerCase();
  const roleLabel = normalizeAlphaaRoleLabel(payload.roleLabel);
  const country = baseCountryFromDisplay(payload.country.trim());
  if (!fullName) throw new Error("Enter a name.");
  if (!email) throw new Error("Enter an email.");
  if (!roleLabel) throw new Error("Select a role.");
  if (!country) throw new Error("Select a country.");

  const dup = await queryOne<{ id: number }>(
    `SELECT id FROM temp_users WHERE LOWER(TRIM(email)) = $1 AND id <> $2 LIMIT 1`,
    [email, userId]
  );
  if (dup) throw new Error("Email already in use.");

  // These rows are real Orbit logins now. The Main editor must not grant
  // admin-workspace roles (admin / hoo / op) — that stays in the Orbit editor.
  const role = mapAlphaaRole(roleLabel);
  if (role === "admin" || role === "hoo" || role === "op") {
    const current = await queryOne<{ role: string }>(
      `SELECT role FROM temp_users WHERE id = $1 AND region = 'Alphaa'`,
      [userId]
    );
    if (current?.role !== role) {
      throw new Error(
        "Admin and Operation Manager roles can only be given from the Orbit employee editor."
      );
    }
  }

  const result = await pool.query(
    `UPDATE temp_users
        SET full_name = $1,
            email = $2,
            phone = $3,
            role = $4,
            country = $5,
            is_active = $6
      WHERE id = $7
        AND region = 'Alphaa'`,
    [
      fullName,
      email,
      payload.phone,
      role,
      country,
      payload.isActive,
      userId,
    ]
  );
  if (!result.rowCount) throw new Error("Account holder not found.");
}

export async function setAlphaaEmployeeActiveRow(
  userId: number,
  isActive: boolean
): Promise<void> {
  const result = await pool.query(
    `UPDATE temp_users SET is_active = $2 WHERE id = $1 AND region = 'Alphaa'`,
    [userId, isActive]
  );
  if (!result.rowCount) throw new Error("Account holder not found.");
}

/** Deletes the Orbit holder (its accounts go with it via ON DELETE CASCADE). */
export async function deleteAlphaaEmployeeRow(userId: number): Promise<void> {
  const result = await pool.query(
    `DELETE FROM temp_users WHERE id = $1 AND region = 'Alphaa'`,
    [userId]
  );
  if (!result.rowCount) throw new Error("User not found.");
}

export async function createAlphaaSocialAccountRow(
  userId: number,
  payload: AdminSocialAccountInput
): Promise<AdminAccountMutationResult> {
  if (!(await alphaaHolderExists(userId))) return { error: "Employee not found." };

  // New accounts inherit the holder's languages / sheet region from an existing account.
  const sibling = await queryOne<{
    geo_region: string | null;
    language1: string | null;
    language2: string | null;
  }>(
    `SELECT geo_region, language1, language2
       FROM temp_social_media_accounts
      WHERE user_id = $1
      ORDER BY id ASC
      LIMIT 1`,
    [userId]
  );
  const language1 = sibling?.language1?.trim() || "English";
  const accountName =
    payload.username.replace(/^@/, "") || payload.accountHolder || "Pending";

  try {
    await pool.query(
      `INSERT INTO temp_social_media_accounts
        (user_id, platform, account_name, account_handle, account_url,
         starting_followers, current_followers, category, username,
         account_email, account_password, email_password, mobile_number, status,
         account_scope, geo_region, language1, language2)
       VALUES ($1, $2, $3, $4, $5, 0, 0, $6, $7, $8, $9, $10, $11, $12, $13,
               $14, $15, $16)`,
      [
        userId,
        payload.platform,
        accountName,
        payload.accountHolder,
        payload.url.trim(),
        payload.category.trim() || "GH-G",
        payload.username.trim() || accountName,
        payload.email.trim(),
        payload.accountPassword,
        payload.emailPassword,
        payload.mobileNumber.trim() || null,
        payload.status ?? "active",
        payload.accountScope ?? "personal",
        sibling?.geo_region ?? null,
        language1,
        sibling?.language2?.trim() || language1,
      ]
    );
    return {};
  } catch (error) {
    return { error: uniqueAccountUrlError(error) };
  }
}

export async function updateAlphaaSocialAccountRow(
  accountId: number,
  payload: AdminSocialAccountInput
): Promise<AdminAccountMutationResult> {
  const existing = await queryOne<{ account_password: string | null }>(
    `SELECT sma.account_password
       FROM temp_social_media_accounts sma
       INNER JOIN temp_users u ON u.id = sma.user_id
      WHERE sma.id = $1
        AND ${ALPHAA_REGION_WHERE}`,
    [accountId]
  );
  if (!existing) return { error: "Account not found." };

  const accountName =
    payload.username.replace(/^@/, "") || payload.accountHolder || "Pending";
  const password =
    payload.accountPassword.trim() || existing.account_password || "";

  try {
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
        payload.platform,
        accountName,
        payload.accountHolder,
        payload.url.trim(),
        payload.category.trim() || "GH-G",
        payload.username.trim() || accountName,
        payload.email.trim(),
        password,
        payload.emailPassword,
        payload.mobileNumber.trim() || null,
        payload.status ?? "active",
        payload.accountScope ?? "personal",
      ]
    );
    return {};
  } catch (error) {
    return { error: uniqueAccountUrlError(error) };
  }
}

export async function deleteAlphaaSocialAccountRow(
  accountId: number
): Promise<AdminAccountMutationResult> {
  try {
    const result = await pool.query(
      `DELETE FROM temp_social_media_accounts sma
        USING temp_users u
       WHERE u.id = sma.user_id
         AND sma.id = $1
         AND ${ALPHAA_REGION_WHERE}`,
      [accountId]
    );
    if (!result.rowCount) return { error: "Account not found." };
    return {};
  } catch (error) {
    return { error: publicAdminMutationError(error) };
  }
}

export async function setAlphaaSocialAccountSpareRow(
  accountId: number,
  isSpare: boolean
): Promise<AdminAccountMutationResult> {
  try {
    const result = await pool.query(
      `UPDATE temp_social_media_accounts sma
          SET is_spare = $2
         FROM temp_users u
        WHERE u.id = sma.user_id
          AND sma.id = $1
          AND ${ALPHAA_REGION_WHERE}`,
      [accountId, isSpare]
    );
    if (!result.rowCount) return { error: "Account not found." };
    return {};
  } catch (error) {
    return { error: publicAdminMutationError(error) };
  }
}
