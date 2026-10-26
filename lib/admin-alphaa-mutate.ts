import { pool, queryOne } from "@/lib/db";
import { alphaaLegacyPlatformFields } from "@/lib/bulk-import-parse";
import { uniqueAccountUrlError } from "@/lib/social-account-validation";
import { PLATFORMS, type Platform } from "@/lib/platform-config";
import { baseCountryFromDisplay } from "@/lib/overview-country-display";
import { publicAdminMutationError } from "@/lib/admin-action-error";
import type {
  AdminAccountMutationResult,
  AdminSocialAccountInput,
  UpdateAlphaaEmployeePayload,
} from "@/types/admin";

const ALPHAA_ROLES = ["Handler", "Team Leader", "Manager", "Admin", "OP", "HR", "QC"] as const;

function reportingKeys(values: string[]) {
  const seen = new Set<string>();
  const keys: string[] = [];
  for (const value of values) {
    const key = value.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    keys.push(key);
  }
  return keys;
}

function alphaaAccState(status: AdminSocialAccountInput["status"]) {
  if (status === "archived") return "archived";
  if (status === "suspended") return "suspended";
  return "active";
}

function asPlatform(value: string): Platform | null {
  return (PLATFORMS as readonly string[]).includes(value)
    ? (value as Platform)
    : null;
}

export function normalizeAlphaaRoleLabel(roleLabel: string) {
  const trimmed = roleLabel.trim();
  const match = ALPHAA_ROLES.find(
    (role) => role.toLowerCase() === trimmed.toLowerCase()
  );
  return match ?? null;
}

async function alphaaAccountDefaults(userId: number) {
  const existing = await queryOne<{
    country: string | null;
    region: string | null;
    language1: string | null;
    language2: string | null;
  }>(
    `SELECT country, region, language1, language2
       FROM social_media_accounts
      WHERE user_id = $1
      ORDER BY id ASC
      LIMIT 1`,
    [userId]
  );
  const user = await queryOne<{ country: string | null }>(
    `SELECT country FROM users WHERE id = $1`,
    [userId]
  );
  const country =
    existing?.country?.trim() ||
    user?.country?.trim() ||
    "";
  if (!country) {
    return { error: "Set a country on this person before adding accounts." };
  }
  const language1 = existing?.language1?.trim() || "English";
  return {
    country,
    region: existing?.region?.trim() || "africa",
    language1,
    language2: existing?.language2?.trim() || language1,
  };
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
    `SELECT id FROM users WHERE LOWER(TRIM(email)) = $1 AND id <> $2 LIMIT 1`,
    [email, userId]
  );
  if (dup) throw new Error("Email already in use.");

  const result = await pool.query(
    `UPDATE users
        SET username = $1,
            email = $2,
            phone_number = $3,
            role = $4,
            country = $5,
            department = $6,
            location = $7,
            projects = $8::text[],
            is_active = $9,
            updated_at = NOW()
      WHERE id = $10`,
    [
      fullName,
      email,
      payload.phone,
      roleLabel,
      country || null,
      payload.department,
      payload.location,
      reportingKeys(payload.projects),
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
    `UPDATE users SET is_active = $2, updated_at = NOW() WHERE id = $1`,
    [userId, isActive]
  );
  if (!result.rowCount) throw new Error("Account holder not found.");
}

export async function deleteAlphaaEmployeeRow(userId: number): Promise<void> {
  const user = await queryOne<{ id: number }>(
    `SELECT id FROM users WHERE id = $1`,
    [userId]
  );
  if (!user) throw new Error("User not found.");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM social_media_accounts WHERE user_id = $1`, [
      userId,
    ]);
    await client.query(`DELETE FROM users WHERE id = $1`, [userId]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? (error as { code?: string }).code
        : null;
    if (code === "23503") {
      throw new Error(
        "This person still has linked ALPHAA records. Deactivate them instead of deleting."
      );
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function createAlphaaSocialAccountRow(
  userId: number,
  payload: AdminSocialAccountInput
): Promise<AdminAccountMutationResult> {
  const employee = await queryOne<{ id: number }>(
    `SELECT id FROM users WHERE id = $1`,
    [userId]
  );
  if (!employee) return { error: "Employee not found." };

  const defaults = await alphaaAccountDefaults(userId);
  if ("error" in defaults) return defaults;

  const mapped = alphaaLegacyPlatformFields(payload.platform);
  const accountName =
    payload.username.replace(/^@/, "") || payload.accountHolder || "Pending";

  try {
    await pool.query(
      `INSERT INTO social_media_accounts
        (user_id, platform, personal, umberlla, acc_name, acc_bio, acc_username,
         acc_url, acc_email, acc_password_hash, acc_mobile, direction, acc_state,
         spare_acc, country, language1, language2, region)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, FALSE,
               $14, $15, $16, $17)`,
      [
        userId,
        mapped.platform,
        mapped.personal,
        mapped.umberlla,
        accountName,
        "",
        payload.username.trim() || accountName,
        payload.url.trim(),
        payload.email.trim(),
        payload.accountPassword,
        payload.mobileNumber.trim() || null,
        payload.category.trim() || "GH-G",
        alphaaAccState(payload.status),
        defaults.country,
        defaults.language1,
        defaults.language2,
        defaults.region,
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
  const existing = await queryOne<{
    id: number;
    user_id: number;
    platform: string | null;
    personal: boolean | null;
    umberlla: boolean | null;
    acc_password_hash: string | null;
  }>(
    `SELECT id, user_id, platform, personal, umberlla, acc_password_hash
       FROM social_media_accounts
      WHERE id = $1`,
    [accountId]
  );
  if (!existing) return { error: "Account not found." };

  const knownPlatform = asPlatform(payload.platform);
  const keepLegacyPlatform = !knownPlatform;
  const mapped = knownPlatform
    ? alphaaLegacyPlatformFields(knownPlatform)
    : {
        platform: existing.platform ?? "twitter",
        personal: Boolean(existing.personal),
        umberlla: Boolean(existing.umberlla),
      };
  const accountName =
    payload.username.replace(/^@/, "") || payload.accountHolder || "Pending";
  const password =
    payload.accountPassword.trim() || existing.acc_password_hash || "";

  try {
    await pool.query(
      `UPDATE social_media_accounts
          SET platform = $2,
              personal = $3,
              umberlla = $4,
              acc_name = $5,
              acc_username = $6,
              acc_url = $7,
              acc_email = $8,
              acc_password_hash = $9,
              acc_mobile = $10,
              direction = $11,
              acc_state = $12,
              updated_at = NOW()
        WHERE id = $1`,
      [
        accountId,
        keepLegacyPlatform ? existing.platform : mapped.platform,
        keepLegacyPlatform ? existing.personal : mapped.personal,
        keepLegacyPlatform ? existing.umberlla : mapped.umberlla,
        accountName,
        payload.username.trim() || accountName,
        payload.url.trim(),
        payload.email.trim(),
        password,
        payload.mobileNumber.trim() || null,
        payload.category.trim() || "GH-G",
        alphaaAccState(payload.status),
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
  const existing = await queryOne<{ user_id: number }>(
    `SELECT user_id FROM social_media_accounts WHERE id = $1`,
    [accountId]
  );
  if (!existing) return { error: "Account not found." };
  try {
    await pool.query(`DELETE FROM social_media_accounts WHERE id = $1`, [
      accountId,
    ]);
    return {};
  } catch (error) {
    return { error: publicAdminMutationError(error) };
  }
}

export async function setAlphaaSocialAccountSpareRow(
  accountId: number,
  isSpare: boolean
): Promise<AdminAccountMutationResult> {
  const existing = await queryOne<{ id: number }>(
    `SELECT id FROM social_media_accounts WHERE id = $1`,
    [accountId]
  );
  if (!existing) return { error: "Account not found." };
  try {
    await pool.query(
      `UPDATE social_media_accounts SET spare_acc = $2, updated_at = NOW() WHERE id = $1`,
      [accountId, isSpare]
    );
    return {};
  } catch (error) {
    return { error: publicAdminMutationError(error) };
  }
}
