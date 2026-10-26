"use client";

import { useEffect, useState } from "react";
import type {
  EmployeeReporting,
  EmployeeReportingResponse,
  UseEmployeeReportingResult,
} from "@/types/admin";

export function useEmployeeReporting(
  source: "temp" | "alphaa" | null,
  id: number | null
): UseEmployeeReportingResult {
  const [reporting, setReporting] = useState<EmployeeReporting | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!source || id == null) {
      setReporting(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setReporting(null);

    void fetch(
      `/api/admin/employees/reporting?source=${source}&id=${id}`,
      { cache: "no-store" }
    )
      .then(async (response) => {
        const data = (await response.json()) as EmployeeReportingResponse;
        if (cancelled) return;
        if (!response.ok || !data.ok) {
          setReporting(null);
          return;
        }
        setReporting(data.reporting);
      })
      .catch(() => {
        if (!cancelled) setReporting(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [source, id]);

  return { reporting, loading };
}
