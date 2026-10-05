"use client";

import { useEffect, useRef, useState, useTransition } from "react";
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
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    setError(null);

    startTransition(async () => {
      const response = await runAdminExtract(filters);
      if (requestId !== requestIdRef.current) return;

      if ("error" in response) {
        setResult(null);
        setError(response.error);
        return;
      }
      setResult(response);
    });
  }, [filters]);

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <p className="max-w-2xl text-[14px] text-[var(--color-muted)]">
        Pick region, country, platform, and account type (UMB / PER). Totals and
        preview update as you change filters — then export an Excel sheet of
        exactly what you filtered.
      </p>

      <ExtractFilters
        value={filters}
        countries={countries}
        onChange={setFilters}
      />

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[14px] font-medium text-red-700"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <ExtractExportButton
          rows={result?.rows ?? []}
          disabled={pending || !result || result.rows.length === 0}
        />
        {pending ? (
          <span className="text-[13px] font-medium text-[var(--color-muted)]">
            Updating…
          </span>
        ) : null}
      </div>

      <ExtractSummary summary={result?.summary ?? null} />
      <ExtractPreviewTable rows={result?.rows ?? []} />
    </div>
  );
}
