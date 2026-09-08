"use client";

import { useCallback, useState } from "react";
import type { SheetsSyncResult } from "@/types/admin";

export function useSyncSheets() {
  const [pending, setPending] = useState(false);

  const syncSheets = useCallback(async (): Promise<SheetsSyncResult> => {
    setPending(true);
    try {
      const response = await fetch("/api/admin/sync-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = (await response.json()) as SheetsSyncResult;

      if (!response.ok) {
        return {
          success: false,
          message: data.message ?? "Failed to sync accounts to Google Sheets.",
        };
      }

      return data;
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to sync accounts to Google Sheets.",
      };
    } finally {
      setPending(false);
    }
  }, []);

  return { syncSheets, pending };
}
