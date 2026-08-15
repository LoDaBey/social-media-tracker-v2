"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import {
  importBulkEmployeeAccounts,
  parseBulkImportWorkbook,
} from "@/actions/admin-bulk-import";
import { bulkImportRowWarnings } from "@/lib/bulk-import-parse";
import { BulkImportHolderStep } from "@/components/admin/BulkImportHolderStep";
import { BulkImportUploadStep } from "@/components/admin/BulkImportUploadStep";
import { BulkImportReviewTable } from "@/components/admin/BulkImportReviewTable";
import type {
  BulkImportAccountDraft,
  BulkImportModalProps,
} from "@/types/admin";

export function BulkImportModal({
  open,
  holders,
  initialHolderId,
  onClose,
}: BulkImportModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <BulkImportModalDialog
          holders={holders}
          initialHolderId={initialHolderId}
          onClose={onClose}
        />
      ) : null}
    </AnimatePresence>
  );
}

function BulkImportModalDialog({
  holders,
  initialHolderId,
  onClose,
}: Omit<BulkImportModalProps, "open">) {
  const router = useRouter();
  const [step, setStep] = useState<"holder" | "upload" | "review">("holder");
  const [holderId, setHolderId] = useState(
    initialHolderId ? String(initialHolderId) : ""
  );
  const [country, setCountry] = useState("");
  const [language, setLanguage] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [rows, setRows] = useState<BulkImportAccountDraft[]>([]);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selectedHolder = useMemo(
    () => holders.find((holder) => String(holder.id) === holderId) ?? null,
    [holders, holderId]
  );

  useEffect(() => {
    if (!selectedHolder) return;
    setCountry((prev) => prev || selectedHolder.country || "");
    setLanguage((prev) => prev || selectedHolder.language || "");
  }, [selectedHolder]);

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

  function goToUpload() {
    setFormError(null);
    if (!selectedHolder) {
      setFormError("Select an account holder.");
      return;
    }
    if (!country) {
      setFormError("Select the country for this account holder.");
      return;
    }
    setStep("upload");
  }

  function handleFile(file: File) {
    setUploadError(null);
    setFileName(file.name);
    const data = new FormData();
    data.set("file", file);
    data.set("holderName", selectedHolder?.full_name ?? "");
    startTransition(async () => {
      const result = await parseBulkImportWorkbook(data);
      if ("error" in result) {
        setUploadError(result.error);
        return;
      }
      setRows(
        result.rows.map((row) => ({
          ...row,
          accountHolder: selectedHolder?.full_name ?? row.accountHolder,
        }))
      );
      if (result.language) setLanguage(result.language);
      setWarnings(result.warnings);
      setRowErrors({});
      setStep("review");
    });
  }

  function acceptImport() {
    setFormError(null);
    if (!selectedHolder) {
      setFormError("Select an account holder.");
      return;
    }
    if (!country) {
      setFormError("Select the country for this account holder.");
      return;
    }
    if (!rows.some((row) => row.platform)) {
      setFormError("Add at least one row with a platform.");
      return;
    }
    const rowWarnings = rows.flatMap((row) =>
      bulkImportRowWarnings(row).map(
        (warning) => `${row.username || row.url || "A row"}: ${warning}`
      )
    );
    setWarnings((prev) => {
      const merged = [...prev.filter((item) => !item.includes("will be saved empty")), ...rowWarnings];
      return [...new Set(merged)];
    });
    setRowErrors({});

    startTransition(async () => {
      const result = await importBulkEmployeeAccounts({
        holderId: selectedHolder.id,
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
        `Imported ${result.imported ?? rows.length} accounts for ${selectedHolder.full_name}.`
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
        aria-labelledby="bulk-import-title"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        className="relative z-10 my-4 w-full max-w-6xl rounded-[20px] bg-[var(--color-surface)] p-5 shadow-xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2
              id="bulk-import-title"
              className="text-[22px] font-extrabold text-[var(--color-ink)] sm:text-[26px]"
            >
              Bulk import accounts
            </h2>
            <p className="mt-1 text-[14px] text-[var(--color-muted)]">
              {step === "holder"
                ? "Choose the account holder and country first."
                : step === "upload"
                  ? "Upload the Excel template."
                  : "Review the extracted accounts, then accept to import. Invalid cells are warnings only and import empty so the manager can finish them. This replaces any accounts already saved for this person."}
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

        {formError ? (
          <p className="mt-4 rounded-lg bg-[var(--color-coral-tint)] px-4 py-3 text-[14px] text-[var(--color-coral)]">
            {formError}
          </p>
        ) : null}

        {warnings.length > 0 && step === "review" ? (
          <ul className="mt-4 list-disc space-y-1 rounded-lg bg-[#E08A2C]/15 px-5 py-3 text-[13px] text-[#E08A2C]">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        ) : null}

        <div className="mt-5">
          {step === "holder" ? (
            <BulkImportHolderStep
              holders={holders}
              holderId={holderId}
              country={country}
              onHolderIdChange={(next) => {
                setHolderId(next);
                const holder = holders.find((item) => String(item.id) === next);
                setCountry(holder?.country ?? "");
                setLanguage(holder?.language ?? "");
              }}
              onCountryChange={setCountry}
            />
          ) : null}
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
              holderName={selectedHolder?.full_name ?? "this holder"}
              language={language}
              rows={rows}
              rowErrors={rowErrors}
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
                    accountHolder: selectedHolder?.full_name ?? "",
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
          {step !== "holder" ? (
            <motion.button
              type="button"
              layout
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={pending}
              onClick={() => {
                setFormError(null);
                setStep(step === "review" ? "upload" : "holder");
              }}
              aria-label="Go back to the previous import step"
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
          {step === "holder" ? (
            <motion.button
              type="button"
              layout
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={goToUpload}
              aria-label="Continue to spreadsheet upload"
              className="cursor-pointer rounded-lg bg-[var(--color-emerald)] px-4 py-2 text-[13px] font-semibold text-white outline-none hover:bg-[var(--color-emerald-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
            >
              Continue
            </motion.button>
          ) : null}
          {step === "review" ? (
            <motion.button
              type="button"
              layout
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={pending}
              onClick={acceptImport}
              aria-label="Accept reviewed accounts and import"
              className="cursor-pointer rounded-lg bg-[var(--color-emerald)] px-4 py-2 text-[13px] font-semibold text-white outline-none hover:bg-[var(--color-emerald-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:opacity-50"
            >
              {pending ? "Importing…" : "Accept and import"}
            </motion.button>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}
