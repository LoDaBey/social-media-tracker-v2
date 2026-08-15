"use client";

import { motion } from "framer-motion";
import { FileSpreadsheet } from "lucide-react";
import type { BulkImportUploadStepProps } from "@/types/admin";

export function BulkImportUploadStep({
  fileName,
  error,
  pending,
  onFile,
}: BulkImportUploadStepProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[14px] text-[var(--color-muted)]">
        Upload the Africa template. We will extract the rows so you can review
        them before importing.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex">
          <input
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            aria-label="Upload Excel template"
            disabled={pending}
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onFile(file);
              event.target.value = "";
            }}
          />
          <motion.span
            layout
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[var(--color-emerald)] px-3 py-2 text-[13px] font-semibold text-white outline-none"
          >
            <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
            {pending ? "Reading…" : "Choose spreadsheet"}
          </motion.span>
        </label>
        <a
          href="/Africa%20Template.xlsx"
          download="Africa Template.xlsx"
          aria-label="Download Africa Excel template"
          className="rounded-lg text-[13px] font-semibold text-[var(--color-emerald)] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
        >
          Download template
        </a>
      </div>
      {fileName ? (
        <p className="text-[13px] font-medium text-[var(--color-ink)]">{fileName}</p>
      ) : null}
      {error ? (
        <p className="rounded-lg bg-[var(--color-coral-tint)] px-4 py-3 text-[14px] text-[var(--color-coral)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
