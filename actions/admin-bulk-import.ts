"use server";

import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";
import { auth } from "@/auth";
import { pool, queryOne } from "@/lib/db";
import { publicAdminMutationError } from "@/lib/admin-action-error";
import {
  alphaaLegacyPlatformFields,
  parseAfricaTemplateSheet,
  sanitizeBulkImportRow,
} from "@/lib/bulk-import-parse";
import { uniqueAccountUrlError } from "@/lib/social-account-validation";
import { isAlphaaCountry } from "@/lib/region-config";
import { SHEET_REGION_ALPHAA } from "@/lib/sheets-validation-values";
import {
  isSetupCountry,
  isSetupLanguage,
  setupRegionForCountry,
} from "@/lib/setup-options";
import type {
  BulkImportAccountDraft,
  BulkImportParseResult,
} from "@/types/admin";
import type { Platform } from "@/lib/platform-config";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

async function requireAdmin() {
  const session = await auth();
  const adminId = Number(session?.user?.id);
  const role = session?.user?.role;
  if (!Number.isFinite(adminId) || role !== "admin") {
    throw new Error("Unauthorized — admin only.");
  }
}

function revalidateBulkImport(
  userId: number,
  source: "temp" | "alphaa" = "temp"
) {
  revalidatePath("/admin/employees");
  revalidatePath("/admin");
  if (source === "alphaa") {
    revalidatePath(`/admin/employees/alphaa/${userId}`);
  } else {
    revalidatePath(`/admin/employees/${userId}`);
    revalidatePath("/manager");
    revalidatePath("/manager/setup");
    revalidatePath("/dashboard");
  }
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

function sanitizeImportRows(
  inputRows: BulkImportAccountDraft[],
  holderName: string
) {
  const seenUrls = new Set<string>();
  return inputRows
    .map((row) => sanitizeBulkImportRow(row, holderName))
    .filter((row) => row.platform)
    .map((row) => {
      if (!row.url) return row;
      const key = `${row.platform}:${row.url.replace(/\/+$/, "").toLowerCase()}`;
      if (seenUrls.has(key)) {
        return { ...row, url: "" };
      }
      seenUrls.add(key);
      return row;
    });
}

async function importTempHolderAccounts(input: {
  holderId: number;
  country: string;
  language: string | null;
  rows: BulkImportAccountDraft[];
}): Promise<{ error?: string; imported?: number }> {
  const employee = await queryOne<{ id: number }>(
    `SELECT id FROM temp_users WHERE id = $1 AND role = 'employee'`,
    [input.holderId]
  );
  if (!employee) return { error: "Account holder not found." };

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Keep existing target_* values — admin Targets tab is the source of truth.
    await client.query(
      `UPDATE temp_users
          SET country = $2,
              region = $3,
              language = $4,
              setup_needs_review = TRUE
        WHERE id = $1`,
      [
        input.holderId,
        input.country,
        setupRegionForCountry(input.country),
        input.language,
      ]
    );

    await client.query(
      `DELETE FROM temp_social_media_accounts WHERE user_id = $1`,
      [input.holderId]
    );

    const values: unknown[] = [];
    const sqlRows: string[] = [];
    input.rows.forEach((row, idx) => {
      const base = idx * 14;
      sqlRows.push(
        `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, $${base + 11}, $${base + 12}, $${base + 13}, $${base + 14})`
      );
      const accountName =
        row.username.replace(/^@/, "") || row.accountHolder || "Pending";
      values.push(
        input.holderId,
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

  revalidateBulkImport(input.holderId, "temp");
  return { imported: input.rows.length };
}

async function importAlphaaHolderAccounts(input: {
  holderId: number;
  country: string;
  language: string | null;
  rows: BulkImportAccountDraft[];
}): Promise<{ error?: string; imported?: number }> {
  if (!isAlphaaCountry(input.country)) {
    return { error: "Select an ALPHAA country." };
  }

  const employee = await queryOne<{ id: number }>(
    `SELECT id FROM users WHERE id = $1`,
    [input.holderId]
  );
  if (!employee) return { error: "Account holder not found." };

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`UPDATE users SET country = $2 WHERE id = $1`, [
      input.holderId,
      input.country,
    ]);
    await client.query(`DELETE FROM social_media_accounts WHERE user_id = $1`, [
      input.holderId,
    ]);

    const values: unknown[] = [];
    const sqlRows: string[] = [];
    input.rows.forEach((row, idx) => {
      const base = idx * 16;
      sqlRows.push(
        `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, $${base + 11}, $${base + 12}, $${base + 13}, $${base + 14}, $${base + 15}, $${base + 16})`
      );
      const platform = row.platform as Platform;
      const mapped = alphaaLegacyPlatformFields(platform);
      const accountName =
        row.username.replace(/^@/, "") || row.accountHolder || "Pending";
      values.push(
        input.holderId,
        mapped.platform,
        mapped.personal,
        mapped.umberlla,
        accountName,
        row.username || null,
        row.url || null,
        row.email || null,
        row.accountPassword || null,
        row.mobileNumber || null,
        row.category || null,
        row.status,
        false,
        input.country,
        input.language,
        SHEET_REGION_ALPHAA
      );
    });

    await client.query(
      `INSERT INTO social_media_accounts
        (user_id, platform, personal, umberlla, acc_name, acc_username, acc_url,
         acc_email, acc_password_hash, acc_mobile, direction, acc_state,
         spare_acc, country, language1, region)
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

  revalidateBulkImport(input.holderId, "alphaa");
  return { imported: input.rows.length };
}

export async function importBulkEmployeeAccounts(input: {
  holderId: number;
  source?: "temp" | "alphaa";
  country: string;
  language: string;
  rows: BulkImportAccountDraft[];
}): Promise<{ error?: string; imported?: number }> {
  try {
    await requireAdmin();
    const holderId = Number(input.holderId);
    if (!Number.isFinite(holderId)) return { error: "Select an account holder." };
    const source = input.source === "alphaa" ? "alphaa" : "temp";
    const country = input.country.trim();
    const language = input.language.trim();
    if (!isSetupCountry(country)) return { error: "Select a valid country." };
    const savedLanguage = isSetupLanguage(language) ? language : null;
    if (!input.rows.length) return { error: "Add at least one account before importing." };

    const holderName =
      input.rows[0]?.accountHolder.trim() || "Account holder";
    const rows = sanitizeImportRows(input.rows, holderName);
    if (!rows.length) {
      return { error: "No rows had a platform to import." };
    }

    if (source === "alphaa") {
      return importAlphaaHolderAccounts({
        holderId,
        country,
        language: savedLanguage,
        rows,
      });
    }

    return importTempHolderAccounts({
      holderId,
      country,
      language: savedLanguage,
      rows,
    });
  } catch (error) {
    return { error: publicAdminMutationError(error) };
  }
}
