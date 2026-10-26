"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  AdminEmployeeSource,
  EmployeeAccountsFetch,
  EmployeeAccountsResponse,
  UseEmployeeAccountsResult,
} from "@/types/admin";

export function useEmployeeAccounts(
  source: AdminEmployeeSource | null,
  id: number | null
): UseEmployeeAccountsResult {
  const [data, setData] = useState<EmployeeAccountsFetch | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  const requestKey =
    source && id != null ? `${source}:${id}:${reloadToken}` : null;

  useEffect(() => {
    if (!source || id == null || !requestKey) return;

    let cancelled = false;
    void fetch(
      `/api/admin/employees/accounts?source=${source}&id=${id}`,
      { cache: "no-store" }
    )
      .then(async (response) => {
        const payload = (await response.json()) as EmployeeAccountsResponse;
        if (cancelled) return;
        if (!response.ok || !payload.ok) {
          setData({
            key: requestKey,
            accounts: [],
            error: !payload.ok ? payload.error : "Could not load accounts.",
          });
          return;
        }
        setData({
          key: requestKey,
          accounts: payload.accounts,
          error: null,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setData({
            key: requestKey,
            accounts: [],
            error: "Could not load accounts.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [source, id, requestKey]);

  const ready = data?.key === requestKey;
  return {
    accounts: ready ? data.accounts : [],
    loading: requestKey != null && !ready,
    error: ready ? data.error : null,
    reload,
  };
}
