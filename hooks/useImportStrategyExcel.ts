"use client";

import { useCallback, useState } from "react";
import type { StrategyImportResult } from "@/types/strategy";

export function useImportStrategyExcel() {
  const [pending, setPending] = useState(false);

  const importExcel = useCallback(async (file: File): Promise<StrategyImportResult> => {
    setPending(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/admin/strategy/import", {
        method: "POST",
        body,
      });
      const data = (await response.json()) as StrategyImportResult;
      if (!response.ok) {
        return {
          success: false,
          message: data.message ?? "Failed to import the strategy file.",
        };
      }
      return data;
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to import the strategy file.",
      };
    } finally {
      setPending(false);
    }
  }, []);

  return { importExcel, pending };
}
