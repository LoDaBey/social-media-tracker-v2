"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { saveStrategyCountryAction } from "@/actions/admin-strategy";
import { useImportStrategyExcel } from "@/hooks/useImportStrategyExcel";
import { StrategyBookTabs } from "./StrategyBookTabs";
import { StrategyProjectTable } from "./StrategyProjectTable";
import { StrategyUploadButton } from "./StrategyUploadButton";
import type { StrategySaveCountryInput, StrategyToolProps } from "@/types/strategy";

export function StrategyTool({ book, rows, gapsByCountry }: StrategyToolProps) {
  const router = useRouter();
  const { importExcel, pending: importing } = useImportStrategyExcel();
  const [expandedCountry, setExpandedCountry] = useState<string | null>(
    rows[0]?.country ?? null
  );
  const [savingCountry, setSavingCountry] = useState<string | null>(null);

  async function handleUpload(file: File) {
    const result = await importExcel(file);
    if (!result.success) {
      toast.error(result.message);
      return;
    }
    toast.success(result.message);
    router.refresh();
  }

  async function handleSave(input: StrategySaveCountryInput) {
    setSavingCountry(input.country);
    const result = await saveStrategyCountryAction(input);
    setSavingCountry(null);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success(`${input.country} saved.`);
    router.refresh();
  }

  const total = rows.reduce((sum, row) => sum + row.totalAccounts, 0);

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <StrategyBookTabs book={book} />
        <StrategyUploadButton pending={importing} onFile={handleUpload} />
      </div>

      <p className="max-w-2xl text-[14px] text-[var(--color-muted)]">
        Current plan for this book: <span className="font-semibold text-[var(--color-ink)]">{total}</span>{" "}
        accounts. Upload the client Excel to replace project totals (handler templates stay).
        Open a country to edit numbers and see missing accounts per project and per handler.
      </p>

      <StrategyProjectTable
        book={book}
        rows={rows}
        expandedCountry={expandedCountry}
        onToggle={(country) =>
          setExpandedCountry((current) => (current === country ? null : country))
        }
        savingCountry={savingCountry}
        onSave={handleSave}
        gapsByCountry={gapsByCountry}
      />
    </div>
  );
}
