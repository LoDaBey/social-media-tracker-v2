"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import {
  importManagerBulkEmployeeAccounts,
  parseManagerBulkImportWorkbook,
} from "@/actions/manager-bulk-import";
import { getBulkImportStrictValidation } from "@/lib/bulk-import-parse";
import { isSetupCountry } from "@/lib/setup-options";
import { BulkImportUploadStep } from "@/components/admin/BulkImportUploadStep";
import { BulkImportReviewTable } from "@/components/admin/BulkImportReviewTable";
import type { BulkImportAccountDraft } from "@/types/admin";
import type { ManagerBulkImportModalProps } from "@/types/manager";

export function ManagerBulkImportModal({
  open,
  holder,
  onClose,
}: ManagerBulkImportModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <ManagerBulkImportModalDialog holder={holder} onClose={onClose} />
      ) : null}
    </AnimatePresence>
  );
}

function ManagerBulkImportModalDialog({
  holder,
  onClose,
}: Omit<ManagerBulkImportModalProps, "open">) {
  const router = useRouter();
  const [step, setStep] = useState<"upload" | "review">("upload");
  const [language, setLanguage] = useState(holder.language ?? "");
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [rows, setRows] = useState<BulkImportAccountDraft[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const country = holder.country;
  const countryMissing = !isSetupCountry(country);

  const strictValidation = useMemo(
    () => getBulkImportStrictValidation(rows, language),
    [rows, language]
  );

  useEffect(() => {
    setLanguage(holder.language ?? "");
  }, [holder.id, holder.language]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  function handleFile(file: File) {
    setUploadError(null);
    setFileName(file.name);
    const data = new FormData();
    data.set("file", file);
    data.set("holderId", String(holder.id));
    data.set("holderName", holder.full_name);
    startTransition(async () => {
      const result = await parseManagerBulkImportWorkbook(data);
      if ("error" in result) {
        setUploadError(result.error);
        return;
      }
      setRows(
        result.rows.map((row) => ({
          ...row,
          accountHolder: holder.full_name,
        }))
      );
      if (result.language) setLanguage(result.language);
      setParseWarnings(result.warnings);
      setStep("review");
    });
  }

  function acceptImport() {
    setFormError(null);
    if (countryMissing) {
      setFormError("This employee needs a valid country before importing.");
      return;
    }
    if (!strictValidation.canImport) {
      setFormError(
        strictValidation.blockingMessages[0] ??
          "Fix all highlighted issues before importing."
      );
      return;
    }

    startTransition(async () => {
      const result = await importManagerBulkEmployeeAccounts({
        holderId: holder.id,
        country,
        language,
        rows,
      });
      if (result.error) {
        setFormError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success(
        `Imported ${result.imported ?? rows.length} accounts for ${holder.full_name}.`
      );
      onClose();
      router.refresh();
    });
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto p-4 sm:p-8"
      role="presentation"
    >
      <motion.button
        type="button"
        aria-label="Close bulk import"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="manager-bulk-import-title"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        className="relative z-10 my-4 w-full max-w-6xl rounded-[20px] bg-[var(--color-surface)] p-5 shadow-xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2
              id="manager-bulk-import-title"
              className="text-[22px] font-extrabold text-[var(--color-ink)] sm:text-[26px]"
            >
              Bulk import accounts
            </h2>
            <p className="mt-1 text-[14px] text-[var(--color-muted)]">
              {step === "upload"
                ? `Upload the Excel template for ${holder.full_name}.`
                : "Review every account and fix all highlighted issues before importing. Invalid values cannot be saved."}
            </p>
          </div>
          <motion.button
            type="button"
            aria-label="Close bulk import"
            layout
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[var(--color-muted)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </motion.button>
        </div>

        {countryMissing ? (
          <p className="mt-4 rounded-lg bg-[var(--color-coral-tint)] px-4 py-3 text-[14px] text-[var(--color-coral)]">
            This employee does not have a valid country yet. Ask your admin to assign one
            before bulk importing.
          </p>
        ) : null}

        {formError ? (
          <p className="mt-4 rounded-lg bg-[var(--color-coral-tint)] px-4 py-3 text-[14px] text-[var(--color-coral)]">
            {formError}
          </p>
        ) : null}

        {parseWarnings.length > 0 && step === "review" ? (
          <ul className="mt-4 list-disc space-y-1 rounded-lg bg-[#E08A2C]/15 px-5 py-3 text-[13px] text-[#E08A2C]">
            {parseWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        ) : null}

        {step === "review" && strictValidation.blockingMessages.length > 0 ? (
          <ul className="mt-4 list-disc space-y-1 rounded-lg bg-[var(--color-coral-tint)] px-5 py-3 text-[13px] text-[var(--color-coral)]">
            {strictValidation.blockingMessages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        ) : null}

        <div className="mt-5">
          {step === "upload" ? (
            <BulkImportUploadStep
              fileName={fileName}
              error={uploadError}
              pending={pending}
              onFile={handleFile}
            />
          ) : null}
          {step === "review" ? (
            <BulkImportReviewTable
              holderName={holder.full_name}
              language={language}
              rows={rows}
              strict
              rowFieldErrors={strictValidation.rowFieldErrors}
              onLanguageChange={setLanguage}
              onRowChange={(id, patch) =>
                setRows((prev) =>
                  prev.map((row) => (row.id === id ? { ...row, ...patch } : row))
                )
              }
              onRemoveRow={(id) =>
                setRows((prev) => prev.filter((row) => row.id !== id))
              }
              onAddRow={() =>
                setRows((prev) => [
                  ...prev,
                  {
                    id: crypto.randomUUID(),
                    platform: "",
                    accountHolder: holder.full_name,
                    url: "",
                    category: "",
                    username: "",
                    email: "",
                    accountPassword: "",
                    emailPassword: "",
                    mobileNumber: "",
                    status: "active",
                  },
                ])
              }
            />
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          {step === "review" ? (
            <motion.button
              type="button"
              layout
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={pending}
              onClick={() => {
                setFormError(null);
                setStep("upload");
              }}
              aria-label="Go back to spreadsheet upload"
              className="cursor-pointer rounded-lg border border-[var(--color-hairline)] px-4 py-2 text-[13px] font-semibold text-[var(--color-ink)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:opacity-50"
            >
              Back
            </motion.button>
          ) : (
            <motion.button
              type="button"
              layout
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              aria-label="Cancel bulk import"
              className="cursor-pointer rounded-lg border border-[var(--color-hairline)] px-4 py-2 text-[13px] font-semibold text-[var(--color-ink)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
            >
              Cancel
            </motion.button>
          )}
          {step === "review" ? (
            <motion.button
              type="button"
              layout
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={
                pending ||
                countryMissing ||
                !strictValidation.canImport
              }
              onClick={acceptImport}
              aria-label="Import reviewed accounts"
              className="cursor-pointer rounded-lg bg-[var(--color-emerald)] px-4 py-2 text-[13px] font-semibold text-white outline-none hover:bg-[var(--color-emerald-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:opacity-50"
            >
              {pending ? "Importing…" : "Import accounts"}
            </motion.button>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}
