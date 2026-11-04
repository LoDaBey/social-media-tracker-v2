"use client";

import { useCallback, useState } from "react";
import type {
  AdminCountryCoverage,
  AdminCountryCoverageResponse,
} from "@/types/admin";

export type UseCountryCoverageResult = {
  coverage: AdminCountryCoverage | null;
  showAlphaaPlatforms: boolean;
  loading: boolean;
  error: string | null;
  load: (country: string) => Promise<void>;
  reset: () => void;
};

export function useCountryCoverage(): UseCountryCoverageResult {
  const [coverage, setCoverage] = useState<AdminCountryCoverage | null>(null);
  const [showAlphaaPlatforms, setShowAlphaaPlatforms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setCoverage(null);
    setShowAlphaaPlatforms(false);
    setLoading(false);
    setError(null);
  }, []);

  const load = useCallback(async (country: string) => {
    const trimmed = country.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/coverage?country=${encodeURIComponent(trimmed)}`
      );
      const data = (await response.json()) as AdminCountryCoverageResponse;
      if (!response.ok || !data.ok) {
        setCoverage(null);
        setShowAlphaaPlatforms(false);
        setError(!data.ok ? data.error : "Could not load planned coverage.");
        return;
      }
      setCoverage(data.coverage);
      setShowAlphaaPlatforms(data.showAlphaaPlatforms);
    } catch {
      setCoverage(null);
      setShowAlphaaPlatforms(false);
      setError("Could not load planned coverage.");
    } finally {
      setLoading(false);
    }
  }, []);

  return { coverage, showAlphaaPlatforms, loading, error, load, reset };
}
