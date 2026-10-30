"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { saveStrategyCountryAction } from "@/actions/admin-strategy";
import { useImportStrategyExcel } from "@/hooks/useImportStrategyExcel";
import { strategyTabLabel } from "@/lib/strategy-tabs";
import { StrategyBookTabs } from "./StrategyBookTabs";
import { StrategyCountryNav } from "./StrategyCountryNav";
import { StrategyCountryPanel } from "./StrategyCountryPanel";
import { StrategyUploadButton } from "./StrategyUploadButton";
import type {
  StrategyCountryOption,
  StrategySaveCountryInput,
  StrategyToolProps,
} from "@/types/strategy";

export function StrategyTool({ tab, rows, gapsByCountry }: StrategyToolProps) {
  const router = useRouter();
  const { importExcel, pending: importing } = useImportStrategyExcel();
  const [selectedCountry, setSelectedCountry] = useState(rows[0]?.country ?? "");
  const [savingCountry, setSavingCountry] = useState<string | null>(null);

  const countries: StrategyCountryOption[] = useMemo(
    () =>
      rows.map((item) => ({
        country: item.country,
        totalAccounts: item.totalAccounts,
        missing: Math.max(
          0,
          item.totalAccounts -
            (gapsByCountry[item.country]?.project.totalActual ?? 0)
        ),
      })),
    [rows, gapsByCountry]
  );

  const row = rows.find((item) => item.country === selectedCountry) ?? rows[0];
  const total = rows.reduce((sum, item) => sum + item.totalAccounts, 0);
  const tabLabel = strategyTabLabel(tab);

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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <StrategyBookTabs tab={tab} />
          <p className="text-[13px] text-[var(--color-muted)]">
            <span className="font-semibold tabular-nums text-[var(--color-ink)]">{total}</span>
            {" "}
            accounts · {rows.length} {rows.length === 1 ? "country" : "countries"}
          </p>
        </div>
        <StrategyUploadButton pending={importing} onFile={handleUpload} />
      </div>

      {row ? (
        <div className="overflow-hidden rounded-[20px] border border-[var(--color-hairline)] bg-[var(--color-surface)] lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
          <div className="border-b border-[var(--color-hairline)] bg-[var(--color-cream-tint)] lg:border-b-0 lg:border-r">
            <p className="hidden px-4 pt-3 text-[11px] font-semibold text-[var(--color-muted)] lg:block">
              {tabLabel}
            </p>
            <StrategyCountryNav
              countries={countries}
              selectedCountry={row.country}
              onSelect={setSelectedCountry}
            />
          </div>
          <div className="min-w-0 p-4 sm:p-5">
            <StrategyCountryPanel
              key={row.country}
              row={row}
              gaps={gapsByCountry[row.country]}
              saving={savingCountry === row.country}
              onSave={handleSave}
            />
          </div>
        </div>
      ) : (
        <p className="rounded-[20px] border border-[var(--color-hairline)] bg-[var(--color-surface)] px-5 py-12 text-center text-[14px] text-[var(--color-muted)]">
          No strategy rows yet. Upload the client Excel to load {tabLabel} countries.
        </p>
      )}
    </div>
  );
}
