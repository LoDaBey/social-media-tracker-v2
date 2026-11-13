"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import { extractFilterPlatformLabel } from "@/lib/admin-extract-platform";
import { baseCountryFromDisplay } from "@/lib/overview-country-display";
import { MAIN_PROJECT_LABEL } from "@/lib/project-labels";
import type { AdminExtractRow, ExtractExportButtonProps } from "@/types/admin";

/**
 * Same columns as public/Africa Template.xlsx (so the file can also be imported
 * back), with the project as a first "Region" column. Used for every project.
 */
const TEMPLATE_HEADER = [
  "Region",
  "Handler Name",
  "Country",
  "Platforms",
  "Categories",
  "Acount Name",
  "URL",
  "Personal",
  "Umbrella",
  "Status",
  "Language1",
  "Username ",
  "Email",
  "Password",
  "Mobile No.",
] as const;

const COLUMN_WIDTHS = [12, 28, 16, 12, 12, 26, 44, 10, 10, 13, 14, 24, 30, 18, 16];

const STATUS_LABEL: Record<AdminExtractRow["status"], string> = {
  active: "Active",
  archived: "Temp locked",
  suspended: "Suspended",
};

function projectLabel(region: string | null): string {
  const value = region?.trim().toLowerCase() ?? "";
  if (value === "alphaa" || value === "main") return MAIN_PROJECT_LABEL;
  if (value === "balkan" || value === "europe") return "Europe";
  if (value === "africa") return "Africa";
  if (value === "asia") return "Asia";
  return region?.trim() ?? "";
}

function rowToTemplate(row: AdminExtractRow): string[] {
  const hasAccount = Boolean(row.platform);
  const personal = hasAccount && row.account_scope !== "umbrella";
  const umbrella = hasAccount && row.account_scope === "umbrella";
  return [
    projectLabel(row.region),
    row.handler_name,
    row.country ? baseCountryFromDisplay(row.country) : "",
    hasAccount ? extractFilterPlatformLabel(row.platform) : "",
    hasAccount ? (row.category ?? "") : "",
    hasAccount ? row.account_name : "",
    hasAccount ? (row.account_url ?? "") : "",
    personal ? "Yes" : "",
    umbrella ? "Yes" : "",
    hasAccount ? STATUS_LABEL[row.status] : "",
    row.language ?? "",
    hasAccount ? (row.username ?? "") : "",
    hasAccount ? (row.account_email ?? "") : "",
    hasAccount ? (row.account_password ?? "") : "",
    hasAccount ? (row.mobile_number ?? "") : "",
  ];
}

function downloadWorkbook(rows: AdminExtractRow[]) {
  // Already ordered by project, country, handler and platform.
  const aoa: string[][] = [[...TEMPLATE_HEADER], ...rows.map(rowToTemplate)];
  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  sheet["!cols"] = COLUMN_WIDTHS.map((wch) => ({ wch }));
  sheet["!autofilter"] = {
    ref: XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: aoa.length - 1, c: TEMPLATE_HEADER.length - 1 },
    }),
  };
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "template");
  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `smt-extract-${stamp}.xlsx`);
}

export function ExtractExportButton({
  rows,
  disabled,
}: ExtractExportButtonProps) {
  const [busy, setBusy] = useState(false);
  const canExport = !disabled && rows.length > 0 && !busy;

  return (
    <motion.button
      type="button"
      aria-label="Export extract results to Excel"
      layout
      whileHover={canExport ? { scale: 1.05 } : undefined}
      whileTap={canExport ? { scale: 0.95 } : undefined}
      disabled={!canExport}
      onClick={() => {
        setBusy(true);
        try {
          downloadWorkbook(rows);
        } finally {
          setBusy(false);
        }
      }}
      className="inline-flex h-11 cursor-pointer items-center justify-center rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-5 text-[14px] font-bold text-[var(--color-ink)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {busy ? "Exporting…" : `Export Excel (${rows.length.toLocaleString()})`}
    </motion.button>
  );
}
