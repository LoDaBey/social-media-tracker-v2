"use client";

import { useState, useTransition } from "react";
import { runAdminExtract } from "@/actions/admin-extract";
import { emptyAdminExtractFilters } from "@/lib/admin-extract-filters";
import type {
  AdminExtractFilters,
  AdminExtractResult,
  ExtractToolProps,
} from "@/types/admin";
import { ExtractExportButton } from "./ExtractExportButton";
import { ExtractFilters } from "./ExtractFilters";
import { ExtractPreviewTable } from "./ExtractPreviewTable";
import { ExtractSummary } from "./ExtractSummary";

export function ExtractTool({ countries }: ExtractToolProps) {
  const [filters, setFilters] = useState<AdminExtractFilters>(
    emptyAdminExtractFilters()
  );
  const [result, setResult] = useState<AdminExtractResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run() {
    setError(null);
    startTransition(async () => {
      const response = await runAdminExtract(filters);
      if ("error" in response) {
        setResult(null);
        setError(response.error);
        return;
      }
      setResult(response);
    });
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <p className="max-w-2xl text-[14px] text-[var(--color-muted)]">
        Pick region, country, platform, and account type (UMB / PER). Review the
        totals and preview, then export an Excel sheet of exactly what you
        filtered.
      </p>

      <ExtractFilters
        value={filters}
        countries={countries}
        onChange={setFilters}
        onRun={run}
        pending={pending}
      />

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[14px] font-medium text-red-700"
        >
          {error}
        </p>
      ) : null}

      {result ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <ExtractExportButton rows={result.rows} disabled={pending} />
          </div>
          <ExtractSummary summary={result.summary} />
          <ExtractPreviewTable rows={result.rows} />
        </>
      ) : null}
    </div>
  );
}
