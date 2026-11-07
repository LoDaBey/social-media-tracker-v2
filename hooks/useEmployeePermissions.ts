"use client";

import { useCallback, useState } from "react";
import {
  getEmployeePermissionsBundleAction,
  resetEmployeePermissionsAction,
  saveEmployeePermissionsAction,
} from "@/actions/admin-permissions";
import type {
  EmployeePermissionsBundle,
  SaveEmployeePermissionsInput,
  SaveEmployeePermissionsResult,
} from "@/types/permissions";

export function useEmployeePermissions() {
  const [bundle, setBundle] = useState<EmployeePermissionsBundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (userId: number) => {
    setLoading(true);
    setError(null);
    try {
      const next = await getEmployeePermissionsBundleAction(userId);
      if ("error" in next) {
        setBundle(null);
        setError(next.error);
        return null;
      }
      setBundle(next);
      return next;
    } catch (err) {
      setBundle(null);
      setError(err instanceof Error ? err.message : "Could not load permissions.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const save = useCallback(
    async (
      input: SaveEmployeePermissionsInput
    ): Promise<SaveEmployeePermissionsResult> => {
      setSaving(true);
      setError(null);
      try {
        const result = await saveEmployeePermissionsAction(input);
        if (!result.ok) {
          setError(result.error);
          return result;
        }
        await load(input.userId);
        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Could not save permissions.";
        setError(message);
        return { ok: false, error: message };
      } finally {
        setSaving(false);
      }
    },
    [load]
  );

  const reset = useCallback(
    async (userId: number): Promise<SaveEmployeePermissionsResult> => {
      setSaving(true);
      setError(null);
      try {
        const result = await resetEmployeePermissionsAction(userId);
        if (!result.ok) {
          setError(result.error);
          return result;
        }
        await load(userId);
        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Could not reset permissions.";
        setError(message);
        return { ok: false, error: message };
      } finally {
        setSaving(false);
      }
    },
    [load]
  );

  const clear = useCallback(() => {
    setBundle(null);
    setError(null);
  }, []);

  return { bundle, loading, saving, error, load, save, reset, clear };
}
