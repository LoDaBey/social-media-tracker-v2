"use server";

import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";
import { auth } from "@/auth";
import { requirePagePermission } from "@/lib/admin-access";
import { sameProject } from "@/lib/project-region-sql";
import { baseCountryFromDisplay } from "@/lib/overview-country-display";
import { pool, queryOne } from "@/lib/db";
import { publicAdminMutationError } from "@/lib/admin-action-error";
import {
  parseAfricaTemplateSheet,
  sanitizeBulkImportRow,
} from "@/lib/bulk-import-parse";
import { accountScopeForPlatform } from "@/lib/account-scope";
import { uniqueAccountUrlError } from "@/lib/social-account-validation";
import { isAlphaaCountry } from "@/lib/region-config";
import { MAIN_PROJECT_LABEL, regionDisplayLabel } from "@/lib/project-labels";
import { extractPlatformLabel } from "@/lib/admin-extract-platform";
import { normalizeProjectRegion } from "@/lib/admin-view";
import { fetchStrategyProjectRegionForAlphaaUser } from "@/lib/strategy-projects-data";
import { strategyAccountRegionValue } from "@/lib/strategy-regions";
import {
  isSetupCountry,
  isSetupLanguage,
  setupRegionForCountry,
  setupRegionsForCountry,
} from "@/lib/setup-options";
import type {
  BulkImportAccountDraft,
  BulkImportParseResult,
} from "@/types/admin";
import { logOrbitAction } from "@/lib/orbit-log";
import { requireManagerPermission } from "@/lib/manager-permissions";
import type { Platform } from "@/lib/platform-config";
import {
  assertManagerCanEditEmployee,
  fetchManagerCountries,
} from "@/lib/manager-data";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

async function requireAdminOrManager() {
  const session = await auth();
  const userId = Number(session?.user?.id);
  const role = session?.user?.role;
  if (!Number.isFinite(userId)) {
    throw new Error("Unauthorized.");
  }
  if (role === "manager") {
    await requireManagerPermission("manager_team", "canUpdate");
    return { userId, role: "manager" as const, opScope: null };
  }
  // Importing replaces an existing employee's accounts: an update, not a create.
  const viewer = await requirePagePermission("employees", "canUpdate");
  return {
    userId: viewer.userId,
    role: (viewer.role === "hoo" ? "hoo" : "admin") as "admin" | "hoo",
    // Operation Managers: only employees in their own project and countries.
    opScope: viewer.role === "op" ? viewer.scope : null,
  };
}

async function assertOpCanImportHolder(
  scope: { region: string; countries: string[] } | null,
  holderId: number,
  source: "temp" | "alphaa",
  country: string
): Promise<string | null> {
  if (!scope) return null;
  const allowed = new Set(scope.countries);
  if (!allowed.has(country)) {
    return "You can only import accounts into your countries.";
  }
  const holder = await queryOne<{ region: string | null; country: string | null }>(
    `SELECT region, country FROM temp_users WHERE id = $1`,
    [holderId]
  );
  if (!holder) return "Account holder not found.";
  const holderProject = source === "alphaa" ? "Alphaa" : holder.region;
  if (
    !sameProject(holderProject, scope.region) ||
    !holder.country ||
    !allowed.has(baseCountryFromDisplay(holder.country))
  ) {
    return "You can only import accounts for employees in your project and countries.";
  }
  return null;
}

async function assertManagerCanImportHolder(
  managerId: number,
  holderId: number,
  source: "temp" | "alphaa",
  country: string
): Promise<string | null> {
  if (source === "alphaa") {
    return "You can only import accounts for your team members.";
  }
  const allowed = await assertManagerCanEditEmployee(managerId, holderId);
  if (!allowed) {
    return "You can only import accounts for your team members.";
  }
  const countries = await fetchManagerCountries(managerId);
  const inScope = countries.some(
    (item) => item.toLowerCase() === country.toLowerCase()
  );
  if (!inScope) {
    return "You can only import accounts into your countries.";
  }
  return null;
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
    revalidatePath("/dashboard");
  }
}

export async function parseBulkImportWorkbook(
  formData: FormData
): Promise<{ error: string } | BulkImportParseResult> {
  try {
    await requireAdminOrManager();
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
  const employee = await queryOne<{ id: number; region: string | null }>(
    `SELECT id, region FROM temp_users WHERE id = $1 AND role = 'employee'`,
    [input.holderId]
  );
  if (!employee) return { error: "Account holder not found." };

  // Keep the holder's project when the country is in it. Sudan / Somalia (Africa +
  // Main) and Palestine (Main + Asia) would otherwise be re-guessed and move them.
  const currentRegion = employee.region?.trim() ?? "";
  const region =
    currentRegion &&
    setupRegionsForCountry(input.country).some((r) => r === currentRegion)
      ? currentRegion
      : setupRegionForCountry(input.country);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Keep existing target_* values — admin Targets tab is the source of truth.
    await client.query(
      `UPDATE temp_users
          SET country = $2,
              region = $3,
              language = $4,
              setup_needs_review = FALSE
        WHERE id = $1`,
      [
        input.holderId,
        input.country,
        region,
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
    return { error: `Select a ${MAIN_PROJECT_LABEL} country.` };
  }

  // Main (ALPHAA) holder = temp_users row in region 'Alphaa'.
  const employee = await queryOne<{ id: number; country: string | null }>(
    `SELECT id, country FROM temp_users WHERE id = $1 AND region = 'Alphaa'`,
    [input.holderId]
  );
  if (!employee) return { error: "Account holder not found." };

  const existing = await queryOne<{
    geo_region: string | null;
    language1: string | null;
    language2: string | null;
  }>(
    `SELECT geo_region, language1, language2
       FROM temp_social_media_accounts
      WHERE user_id = $1
      ORDER BY id ASC
      LIMIT 1`,
    [input.holderId]
  );

  const country = employee.country?.trim() || input.country;
  const projectRegion = await fetchStrategyProjectRegionForAlphaaUser(
    input.holderId
  );
  const region =
    existing?.geo_region?.trim() ||
    (projectRegion ? strategyAccountRegionValue(projectRegion) : "") ||
    "africa";
  const language1 =
    existing?.language1?.trim() || input.language || "English";
  const language2 =
    existing?.language2?.trim() || language1;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`UPDATE temp_users SET country = $2 WHERE id = $1`, [
      input.holderId,
      country,
    ]);
    // Same replace-all behaviour as before, now on this holder's Orbit accounts only.
    await client.query(
      `DELETE FROM temp_social_media_accounts WHERE user_id = $1`,
      [input.holderId]
    );

    const values: unknown[] = [];
    const sqlRows: string[] = [];
    input.rows.forEach((row, idx) => {
      const base = idx * 16;
      sqlRows.push(
        `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, 0, 0, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, $${base + 11}, $${base + 12}, $${base + 13}, $${base + 14}, $${base + 15}, $${base + 16})`
      );
      const platform = row.platform as Platform;
      const accountName =
        row.username.replace(/^@/, "") || row.accountHolder || "Pending";
      values.push(
        input.holderId,
        platform,
        accountName,
        row.accountHolder || null,
        row.url.trim() || null,
        row.category.trim() || "GH-G",
        row.username.trim() || accountName,
        row.email.trim() || null,
        row.accountPassword || null,
        row.emailPassword || null,
        row.mobileNumber.trim() || null,
        row.status,
        accountScopeForPlatform(platform),
        region,
        language1,
        language2
      );
    });

    await client.query(
      `INSERT INTO temp_social_media_accounts
        (user_id, platform, account_name, account_handle, account_url,
         starting_followers, current_followers, category, username,
         account_email, account_password, email_password, mobile_number, status,
         account_scope, geo_region, language1, language2)
       VALUES ${sqlRows.join(", ")}`,
      values
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "23505"
    ) {
      return { error: "This account URL already exists for this person." };
    }
    if (error instanceof Error && error.message.trim()) {
      return { error: error.message.trim().slice(0, 180) };
    }
    return { error: `Could not save these ${MAIN_PROJECT_LABEL} accounts. Please try again.` };
  } finally {
    client.release();
  }

  revalidateBulkImport(input.holderId, "alphaa");
  return { imported: input.rows.length };
}

/** Accounts a holder has right now (the import replaces all of them). */
async function countHolderAccounts(holderId: number): Promise<number> {
  const row = await queryOne<{ total: number }>(
    `SELECT COUNT(*)::int AS total FROM temp_social_media_accounts WHERE user_id = $1`,
    [holderId]
  );
  return row?.total ?? 0;
}

/**
 * One Activity entry per import attempt: who it was for, project, country, table,
 * what was imported per platform, and whether it worked. No account data is logged.
 */
async function logBulkImport(input: {
  holderId: number;
  source: "temp" | "alphaa";
  country: string;
  rows: BulkImportAccountDraft[];
  previousAccounts: number | null;
  result: { error?: string; imported?: number };
}) {
  const holder = await queryOne<{ full_name: string | null; region: string | null }>(
    `SELECT full_name, region FROM temp_users WHERE id = $1`,
    [input.holderId]
  ).catch(() => null);
  const name = holder?.full_name?.trim() || `Employee #${input.holderId}`;
  const project =
    input.source === "alphaa"
      ? MAIN_PROJECT_LABEL
      : regionDisplayLabel(normalizeProjectRegion(holder?.region) ?? "") || "—";
  const platforms: Record<string, number> = {};
  for (const row of input.rows) {
    const label = extractPlatformLabel(row.platform);
    platforms[label] = (platforms[label] ?? 0) + 1;
  }
  const ok = !input.result.error;
  await logOrbitAction({
    action: "import",
    resource: "account",
    summary: ok
      ? `Imported ${input.result.imported ?? input.rows.length} accounts for ${name} — ${input.country} (${project})`
      : `Import failed for ${name} — ${input.country} (${project}): ${input.result.error}`,
    details: {
      result: ok ? "Success" : "Failed",
      ...(ok ? {} : { error: input.result.error }),
      holder: `${name} (#${input.holderId})`,
      project,
      country: input.country,
      table: "temp_social_media_accounts",
      imported: ok ? (input.result.imported ?? input.rows.length) : 0,
      ...(input.previousAccounts !== null
        ? { replacedAccounts: ok ? input.previousAccounts : 0 }
        : {}),
      platforms,
    },
  });
}

export async function importBulkEmployeeAccounts(input: {
  holderId: number;
  source?: "temp" | "alphaa";
  country: string;
  language: string;
  rows: BulkImportAccountDraft[];
}): Promise<{ error?: string; imported?: number }> {
  try {
    const { userId, role, opScope } = await requireAdminOrManager();
    const holderId = Number(input.holderId);
    if (!Number.isFinite(holderId)) return { error: "Select an account holder." };
    const source = input.source === "alphaa" ? "alphaa" : "temp";
    const country = input.country.trim();
    const language = input.language.trim();
    if (!isSetupCountry(country)) return { error: "Select a valid country." };
    if (role === "manager") {
      const denied = await assertManagerCanImportHolder(
        userId,
        holderId,
        source,
        country
      );
      if (denied) return { error: denied };
    }
    const opDenied = await assertOpCanImportHolder(opScope, holderId, source, country);
    if (opDenied) return { error: opDenied };
    const savedLanguage = isSetupLanguage(language) ? language : null;
    if (!input.rows.length) return { error: "Add at least one account before importing." };

    const holderName =
      input.rows[0]?.accountHolder.trim() || "Account holder";
    const rows = sanitizeImportRows(input.rows, holderName);
    if (!rows.length) {
      return { error: "No rows had a platform to import." };
    }

    const previousAccounts = await countHolderAccounts(holderId);
    const result =
      source === "alphaa"
        ? await importAlphaaHolderAccounts({
            holderId,
            country,
            language: savedLanguage,
            rows,
          })
        : await importTempHolderAccounts({
            holderId,
            country,
            language: savedLanguage,
            rows,
          });
    await logBulkImport({
      holderId,
      source,
      country,
      rows,
      previousAccounts,
      result,
    });
    return result;
  } catch (error) {
    return { error: publicAdminMutationError(error) };
  }
}
