"use server";

import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";
import { auth } from "@/auth";
import { pool, queryOne } from "@/lib/db";
import { publicAdminMutationError } from "@/lib/admin-action-error";
import {
  countBulkImportTargets,
  parseAfricaTemplateSheet,
  validateBulkImportDraftRow,
} from "@/lib/bulk-import-parse";
import { uniqueAccountUrlError } from "@/lib/social-account-validation";
import {
  SETUP_REGION,
  isSetupCountry,
  isSetupLanguage,
} from "@/lib/setup-options";
import type {
  BulkImportAccountDraft,
  BulkImportParseResult,
} from "@/types/admin";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

async function requireAdmin() {
  const session = await auth();
  const adminId = Number(session?.user?.id);
  const role = session?.user?.role;
  if (!Number.isFinite(adminId) || role !== "admin") {
    throw new Error("Unauthorized — admin only.");
  }
}

function revalidateBulkImport(userId: number) {
  revalidatePath("/admin/employees");
  revalidatePath(`/admin/employees/${userId}`);
  revalidatePath("/manager");
  revalidatePath("/manager/setup");
  revalidatePath("/dashboard");
}

export async function parseBulkImportWorkbook(
  formData: FormData
): Promise<{ error: string } | BulkImportParseResult> {
  try {
    await requireAdmin();
    const holderName = String(formData.get("holderName") ?? "").trim();
    const file = formData.get("file");
    if (!(file instanceof File)) return { error: "Choose an Excel file to upload." };
    if (file.size === 0) return { error: "The uploaded file is empty." };
    if (file.size > MAX_UPLOAD_BYTES) {
      return { error: "The file is too large. Use a spreadsheet under 5 MB." };
    }
    const name = file.name.toLowerCase();
    if (!name.endsWith(".xlsx") && !name.endsWith(".xls")) {
      return { error: "Upload an Excel file (.xlsx)." };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer", raw: false });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return { error: "The spreadsheet has no sheets." };
    const sheet = workbook.Sheets[sheetName];
    const aoa = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
      raw: false,
      blankrows: false,
    }) as unknown[][];

    return parseAfricaTemplateSheet(aoa, holderName || "Account holder");
  } catch (error) {
    return { error: publicAdminMutationError(error) };
  }
}

function validateDraftRow(row: BulkImportAccountDraft): string | null {
  return validateBulkImportDraftRow(row);
}

export async function importBulkEmployeeAccounts(input: {
  holderId: number;
  country: string;
  language: string;
  rows: BulkImportAccountDraft[];
}): Promise<{ error?: string; imported?: number }> {
  try {
    await requireAdmin();
    const holderId = Number(input.holderId);
    if (!Number.isFinite(holderId)) return { error: "Select an account holder." };
    const country = input.country.trim();
    const language = input.language.trim();
    if (!isSetupCountry(country)) return { error: "Select a valid country." };
    if (!isSetupLanguage(language)) return { error: "Select a valid language." };
    if (!input.rows.length) return { error: "Add at least one account before importing." };

    const rows = input.rows.map((row) => ({
      ...row,
      accountHolder: row.accountHolder.trim(),
      url: row.url.trim(),
      category: row.category.trim(),
      username: row.username.trim(),
      email: row.email.trim(),
      mobileNumber: row.mobileNumber.trim(),
    }));

    for (const row of rows) {
      const error = validateDraftRow(row);
      if (error) return { error };
    }

    const seen = new Set<string>();
    for (const row of rows) {
      const key = `${row.platform}:${row.url.replace(/\/+$/, "").toLowerCase()}`;
      if (seen.has(key)) {
        return { error: "You used the same account URL twice. Please change one." };
      }
      seen.add(key);
    }

    const employee = await queryOne<{ id: number }>(
      `SELECT id FROM temp_users WHERE id = $1 AND role = 'employee'`,
      [holderId]
    );
    if (!employee) return { error: "Account holder not found." };

    const targets = countBulkImportTargets(rows);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE temp_users
            SET country = $2,
                region = $3,
                language = $4,
                setup_needs_review = TRUE,
                target_x_count = $5,
                target_facebook_personal_count = $6,
                target_facebook_umbrella_count = $7,
                target_instagram_count = $8,
                target_tiktok_count = $9
          WHERE id = $1`,
        [
          holderId,
          country,
          SETUP_REGION,
          language,
          targets.x,
          targets.facebook_personal,
          targets.facebook_umbrella,
          targets.instagram,
          targets.tiktok,
        ]
      );

      await client.query(
        `DELETE FROM temp_social_media_accounts WHERE user_id = $1`,
        [holderId]
      );

      const values: unknown[] = [];
      const sqlRows: string[] = [];
      rows.forEach((row, idx) => {
        const base = idx * 14;
        sqlRows.push(
          `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, $${base + 11}, $${base + 12}, $${base + 13}, $${base + 14})`
        );
        values.push(
          holderId,
          row.platform,
          row.username.replace(/^@/, ""),
          row.accountHolder,
          row.url,
          0,
          0,
          row.category,
          row.username,
          row.email,
          row.accountPassword,
          row.emailPassword,
          row.mobileNumber,
          row.status
        );
      });

      await client.query(
        `INSERT INTO temp_social_media_accounts
          (user_id, platform, account_name, account_handle, account_url,
           starting_followers, current_followers, category, username,
           account_email, account_password, email_password, mobile_number, status)
         VALUES ${sqlRows.join(", ")}`,
        values
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      return { error: uniqueAccountUrlError(error) };
    } finally {
      client.release();
    }

    revalidateBulkImport(holderId);
    return { imported: rows.length };
  } catch (error) {
    return { error: publicAdminMutationError(error) };
  }
}
