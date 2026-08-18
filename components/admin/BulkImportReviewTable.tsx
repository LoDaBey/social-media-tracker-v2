"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { SETUP_LANGUAGES, isSetupLanguage } from "@/lib/setup-options";
import { BulkImportReviewRow } from "@/components/admin/BulkImportReviewRow";
import type { BulkImportReviewTableProps } from "@/types/admin";

export function BulkImportReviewTable({
  holderName,
  language,
  rows,
  rowFieldErrors = {},
  strict = false,
  onLanguageChange,
  onRowChange,
  onRemoveRow,
  onAddRow,
}: BulkImportReviewTableProps) {
  const languageInvalid = strict && !isSetupLanguage(language);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-[14px] text-[var(--color-muted)]">
          {strict
            ? `Review every account for ${holderName}. Fix all highlighted issues before importing.`
            : `Review and edit accounts for ${holderName} before importing.`}
        </p>
        <label className="flex min-w-[200px] flex-col gap-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-muted)]">
          Language
          <select
            value={isSetupLanguage(language) ? language : ""}
            aria-label="Account holder language"
            onChange={(event) => onLanguageChange(event.target.value)}
            className={`cursor-pointer rounded-lg outline-none border bg-[var(--color-cream-tint)] px-3 py-2.5 text-[14px] font-medium text-[var(--color-ink)] ${
              languageInvalid
                ? "border-[var(--color-coral)] focus-visible:ring-2 focus-visible:ring-[var(--color-coral)]"
                : language && isSetupLanguage(language)
                  ? "border-[var(--color-hairline)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
                  : strict
                    ? "border-[var(--color-coral)] focus-visible:ring-2 focus-visible:ring-[var(--color-coral)]"
                    : "border-[#E08A2C] focus-visible:ring-2 focus-visible:ring-[#E08A2C]"
            }`}
          >
            <option value="">Select a language</option>
            {SETUP_LANGUAGES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="overflow-x-auto rounded-[16px] border border-[var(--color-hairline)] bg-[var(--color-surface)]">
        <table className="w-full min-w-[1280px] border-collapse text-left">
          <thead>
            <tr className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              <th scope="col" className="px-3 py-2">
                Platform
              </th>
              <th scope="col" className="px-3 py-2">
                Username
              </th>
              <th scope="col" className="px-3 py-2">
                Email
              </th>
              <th scope="col" className="px-3 py-2">
                Password
              </th>
              <th scope="col" className="px-3 py-2">
                Email password
              </th>
              <th scope="col" className="px-3 py-2">
                URL
              </th>
              <th scope="col" className="px-3 py-2">
                Category
              </th>
              <th scope="col" className="px-3 py-2">
                Status
              </th>
              <th scope="col" className="px-3 py-2">
                Mobile
              </th>
              <th scope="col" className="px-3 py-2">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="px-3 py-8 text-center text-[14px] text-[var(--color-muted)]"
                >
                  No rows to review. Upload a spreadsheet or add a row.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <BulkImportReviewRow
                  key={row.id}
                  row={row}
                  strict={strict}
                  fieldErrors={rowFieldErrors[row.id]}
                  onChange={(patch) => onRowChange(row.id, patch)}
                  onRemove={() => onRemoveRow(row.id)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <motion.div layout whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="self-start">
        <button
          type="button"
          aria-label="Add another account row"
          onClick={onAddRow}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--color-hairline)] px-3 py-2 text-[13px] font-semibold text-[var(--color-ink)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add row
        </button>
      </motion.div>
    </div>
  );
}
