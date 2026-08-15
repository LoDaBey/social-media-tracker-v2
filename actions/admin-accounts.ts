"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { pool, queryOne } from "@/lib/db";
import {
  isPlatformAccountUrl,
  isValidAccountEmail,
  isValidAccountUrl,
  platformUrlErrorMessage,
  setupAccountFieldsSchemaFor,
} from "@/lib/setup-schema";
import { publicAdminMutationError } from "@/lib/admin-action-error";
import type {
  AdminAccountMutationResult,
  AdminSocialAccountInput,
} from "@/types/admin";

const platformSchema = z.enum([
  "x",
  "facebook_personal",
  "facebook_umbrella",
  "instagram",
  "tiktok",
]);

const inputSchema = z.object({
  platform: platformSchema,
  accountHolder: z.string().trim().min(1, "Add an account holder."),
  url: z.string().trim().min(1, "Add a URL."),
  category: z.string().trim().min(1, "Select a category."),
  username: z.string().trim().min(1, "Add a username."),
  email: z.string().trim().min(1, "Add an email."),
  accountPassword: z.string().min(1, "Add an account password."),
  emailPassword: z.string().min(1, "Add an email password."),
  mobileNumber: z.string().trim().min(1, "Add a mobile number."),
  status: z.enum(["active", "archived", "suspended"]).optional(),
});

async function requireAdmin() {
  const session = await auth();
  const adminId = Number(session?.user?.id);
  const role = session?.user?.role;
  if (!Number.isFinite(adminId) || role !== "admin") {
    throw new Error("Unauthorized — admin only.");
  }
}

function revalidateAccounts(userId?: number) {
  revalidatePath("/admin/employees");
  if (userId) revalidatePath(`/admin/employees/${userId}`);
  revalidatePath("/manager");
  revalidatePath("/dashboard");
}

function validateAccountInput(
  payload: AdminSocialAccountInput
): { error: string } | { data: AdminSocialAccountInput } {
  const parsed = inputSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: publicAdminMutationError(parsed.error) };
  }
  const data = parsed.data;
  const fields = setupAccountFieldsSchemaFor(data.platform).safeParse({
    accountHolder: data.accountHolder,
    url: data.url,
    category: data.category,
    username: data.username,
    email: data.email,
    accountPassword: data.accountPassword,
    emailPassword: data.emailPassword,
    mobileNumber: data.mobileNumber,
  });
  if (!fields.success) {
    return { error: publicAdminMutationError(fields.error) };
  }
  if (!isValidAccountUrl(data.url)) {
    return { error: "Use a valid http(s) URL." };
  }
  if (!isPlatformAccountUrl(data.platform, data.url)) {
    return { error: platformUrlErrorMessage(data.platform) };
  }
  if (!isValidAccountEmail(data.email)) {
    return { error: "Use a valid email." };
  }
  return { data };
}

function uniqueUrlError(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  ) {
    return "This account URL already exists for this person.";
  }
  return publicAdminMutationError(error);
}

export async function createAdminSocialAccount(
  userId: number,
  payload: AdminSocialAccountInput
): Promise<AdminAccountMutationResult> {
  try {
    await requireAdmin();
    if (!Number.isFinite(userId)) return { error: "Invalid employee." };
    const checked = validateAccountInput(payload);
    if ("error" in checked) return checked;
    const data = checked.data;

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
         account_email, account_password, email_password, mobile_number, status)
       VALUES ($1, $2, $3, $4, $5, 0, 0, $6, $7, $8, $9, $10, $11, $12)`,
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
      ]
    );
    revalidateAccounts(userId);
    return {};
  } catch (error) {
    return { error: uniqueUrlError(error) };
  }
}

export async function updateAdminSocialAccount(
  accountId: number,
  payload: AdminSocialAccountInput
): Promise<AdminAccountMutationResult> {
  try {
    await requireAdmin();
    if (!Number.isFinite(accountId)) return { error: "Invalid account." };
    const checked = validateAccountInput(payload);
    if ("error" in checked) return checked;
    const data = checked.data;

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
              status = $12
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
      ]
    );
    revalidateAccounts(existing.user_id);
    return {};
  } catch (error) {
    return { error: uniqueUrlError(error) };
  }
}

export async function deleteAdminSocialAccount(
  accountId: number
): Promise<AdminAccountMutationResult> {
  try {
    await requireAdmin();
    if (!Number.isFinite(accountId)) return { error: "Invalid account." };
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
