"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/auth";
import { pool, queryOne } from "@/lib/db";
import { logOrbitAction } from "@/lib/orbit-log";
import type { ChangePasswordState } from "@/types/settings";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters.")
      .max(128, "Password is too long."),
    confirmPassword: z.string().min(1, "Confirm the new password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and confirmation do not match.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from the current one.",
    path: ["newPassword"],
  });

export async function changePasswordAction(
  _prev: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!Number.isFinite(userId)) {
    return { error: "Please sign in again.", success: null };
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: String(formData.get("currentPassword") ?? ""),
    newPassword: String(formData.get("newPassword") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });
  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message ?? "Please review the form and try again.";
    return { error: message, success: null };
  }

  const user = await queryOne<{ password_hash: string }>(
    `SELECT password_hash FROM temp_users WHERE id = $1 AND is_active = TRUE`,
    [userId]
  );
  if (!user) {
    return { error: "Account not found.", success: null };
  }

  const matches = await bcrypt.compare(
    parsed.data.currentPassword,
    user.password_hash
  );
  if (!matches) {
    return { error: "Current password is incorrect.", success: null };
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await pool.query(`UPDATE temp_users SET password_hash = $2 WHERE id = $1`, [
    userId,
    passwordHash,
  ]);

  await logOrbitAction({
    action: "password_change",
    resource: "auth",
    summary: "Changed account password",
  });

  return { error: null, success: "Password updated." };
}
