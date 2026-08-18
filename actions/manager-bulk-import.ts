"use server";

import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";
import { auth } from "@/auth";
import { pool, queryOne } from "@/lib/db";
import { publicAdminMutationError } from "@/lib/admin-action-error";
import {
  getBulkImportStrictValidation,
  parseAfricaTemplateSheet,
} from "@/lib/bulk-import-parse";
import { assertManagerCanEditEmployee } from "@/lib/manager-data";
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

async function requireManagerId() {
  const session = await auth();
  const managerId = Number(session?.user?.id);
  const role = session?.user?.role;
  if (!Number.isFinite(managerId) || role !== "manager") {
    throw new Error("Unauthorized — manager only.");
  }
  return managerId;
}

function revalidateManagerBulkImport(userId: number) {
  revalidatePath("/manager");
  revalidatePath("/manager/setup");
  revalidatePath("/admin/employees");
  revalidatePath(`/admin/employees/${userId}`);
  revalidatePath("/dashboard");
}

export async function parseManagerBulkImportWorkbook(
  formData: FormData
): Promise<{ error: string } | BulkImportParseResult> {
  try {
    const managerId = await requireManagerId();
    const holderId = Number(formData.get("holderId"));
    const holderName = String(formData.get("holderName") ?? "").trim();
    if (!Number.isFinite(holderId)) return { error: "Invalid account holder." };

    const allowed = await assertManagerCanEditEmployee(managerId, holderId);
    if (!allowed) return { error: "You cannot import accounts for this employee." };

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

export async function importManagerBulkEmployeeAccounts(input: {
  holderId: number;
  country: string;
  language: string;
  rows: BulkImportAccountDraft[];
}): Promise<{ error?: string; imported?: number }> {
  try {
    const managerId = await requireManagerId();
    const holderId = Number(input.holderId);
    if (!Number.isFinite(holderId)) return { error: "Invalid account holder." };

    const allowed = await assertManagerCanEditEmployee(managerId, holderId);
    if (!allowed) return { error: "You cannot import accounts for this employee." };

    const country = input.country.trim();
    const language = input.language.trim();
    if (!isSetupCountry(country)) {
      return { error: "This employee needs a valid country before importing." };
    }
    if (!isSetupLanguage(language)) {
      return { error: "Select a valid language before importing." };
    }
    if (!input.rows.length) return { error: "Add at least one account before importing." };

    const holderName = input.rows[0]?.accountHolder.trim() || "Account holder";
    const rows = input.rows
      .filter((row) => row.platform)
      .map((row) => ({
        ...row,
        accountHolder: row.accountHolder.trim() || holderName,
        url: row.url.trim(),
        category: row.category.trim(),
        username: row.username.trim(),
        email: row.email.trim(),
        mobileNumber: row.mobileNumber.trim(),
      }));

    const validation = getBulkImportStrictValidation(rows, language);
    if (!validation.canImport) {
      return {
        error:
          validation.blockingMessages[0] ??
          "Fix all highlighted issues before importing.",
      };
    }

    const employee = await queryOne<{ id: number }>(
      `SELECT id FROM temp_users WHERE id = $1 AND role = 'employee'`,
      [holderId]
    );
    if (!employee) return { error: "Account holder not found." };

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE temp_users
            SET country = $2,
                region = $3,
                language = $4,
                setup_needs_review = FALSE
          WHERE id = $1`,
        [holderId, country, SETUP_REGION, language]
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
        const accountName =
          row.username.replace(/^@/, "") || row.accountHolder || "Account";
        values.push(
          holderId,
          row.platform,
          accountName,
          row.accountHolder || null,
          row.url || null,
          0,
          0,
          row.category || null,
          row.username || null,
          row.email || null,
          row.accountPassword || null,
          row.emailPassword || null,
          row.mobileNumber || null,
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

    revalidateManagerBulkImport(holderId);
    return { imported: rows.length };
  } catch (error) {
    return { error: publicAdminMutationError(error) };
  }
}
