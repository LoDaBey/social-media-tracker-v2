"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import { PLATFORM_LABELS } from "@/lib/platform-config";
import { accountScopeLabel } from "@/lib/account-scope";
import type { AdminExtractRow, ExtractExportButtonProps } from "@/types/admin";

function rowsToSheetRows(rows: AdminExtractRow[]) {
  return rows.map((row) => {
    const region =
      row.region?.trim().toLowerCase() === "balkan"
        ? "Europe"
        : (row.region ?? "");
    return {
      Region: region,
      Country: row.country ?? "",
      Handler: row.handler_name,
      Platform: PLATFORM_LABELS[row.platform] ?? row.platform,
      "Account type": accountScopeLabel(row.account_scope),
      Account: row.account_name,
      Username: row.username ?? "",
      URL: row.account_url ?? "",
      Category: row.category ?? "",
      Status: row.status,
      Spare: row.is_spare ? "Yes" : "No",
    };
  });
}

function downloadWorkbook(rows: AdminExtractRow[]) {
  const sheet = XLSX.utils.json_to_sheet(rowsToSheetRows(rows));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Extract");
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
